const querystring = require('querystring');

const Debug = require('debug');
const axios = require('axios');
const Proto = require('uberproto');
const FormData = require('form-data');
const toStream = require('into-stream');
const errors = require('@feathersjs/errors')

const debug = Debug('feathers-rest-proxy::service');

class Service {

  constructor (options) {

    // See https://github.com/axios/axios#request-config
    debug('Service constructor options', options);
    this.options = options

    // return appropriate feathers error if reponse status is any of the following 
    this.httpErrors = {
      400: 'BadRequest',
      401: 'NotAuthenticated',
      402: 'PaymentError',
      403: 'Forbidden',
      404: 'NotFound',
      405: 'MethodNotAllowed',
      406: 'NotAcceptable',
      408: 'Timeout',
      409: 'Conflict',
      411: 'LengthRequired',
      422: 'Unprocessable',
      429: 'TooManyRequests',
      500: 'GeneralError',
      501: 'NotImplemented',
      502: 'BadGateway',
      503: 'Unavailable'
    }    

    // axios instance to send requests to the API endpoint
    // an endpoint is a set of urls and methods for managing a single resource
    this.client = axios.create(options);

    // returns {url, payload}
    this.prepareRequest = ({params, data, id}) => {

      // to be disabled for endpoints that do not require authentication
      if(this.options.withToken) {
        if(params.user) {
          if (params.user.token) {
            // if a token is provided, send it in Authorization header
            debug('authentication token provided ', params.user.token)
            this.client.defaults.headers.common['Authorization'] = `Bearer ${params.user.token}`;
          } else {
            debug('authentication token missing ')
            throw (new errors.NotAuthenticated('authentication token missing'))
          }
        } else {
          debug('Session user object missing ', params)
          throw (new errors.NotAuthenticated('User object missing'))
        }

      } else { 
        if(this.client.defaults.headers.common['Authorization']) {
          delete this.client.defaults.headers.common['Authorization']
        }
      }

      let url = this.options.baseURL // baseURL
      
      // if a prefix is provided, concatinate to the url
      if(params.query && params.query.urlPrefix) {
        // baseURL with urlPrefix
        url = params.query.urlPrefix.trim() == '' ? url : `${url}/${params.query.urlPrefix.trim()}`
        delete params.query.urlPrefix
      }

      url = `${url}/${this.options.resourceURL}` // resourceURL - multiple

      // if an id is provided send request to resourceURL
      if(id) url = `${url}/${id}` // resourceURL - single

      if(params.query && params.query.urlSuffix) {
        url = params.query.urlSuffix.trim() == '' ? url : `${url}/${params.query.urlSuffix.trim()}`
        delete params.query.urlSuffix;
      }

      url = url.replace(/([^:]\/)\/+/g, "$1") // remove repeated forward slashes from url

      let payload 

      if(data) {
        // default contentType is application/x-www-form-urlencoded
        let contentType = 'application/x-www-form-urlencoded'

        // overide headers set in previous request
        this.client.defaults.headers.post = {}

        // override contentType if provided in request
        if(params.query && params.query.contentType) {
          contentType = params.query.contentType
          delete params.query.contentType
        }
        // set Content-Type header
        this.client.defaults.headers.post['Content-Type'] = contentType

        // application/x-www-form-urlencoded. expects data to JSON object
        if(contentType == 'application/x-www-form-urlencoded') {
          payload = `${querystring.stringify(data)}` // encode as querystring 
        } 

        // multipart/form-data. expects data to be instance of FormData
        if(contentType == 'multipart/form-data') {
          if(data.getHeaders) {
            // data is instance of FormData send as is
            payload = data 
          } else {
            // data is JSON cast to FormData instance
            const form = new FormData()
            const metadata = data.meta || {}
            delete data.meta

            Object.keys(data).map((field) => {
              if(data[field] instanceof Buffer) {
                let metafield = { }
                // See https://github.com/form-data/form-data#alternative-submission-methods
                if(metadata && metadata[field]) {
                  metafield = metadata[field]
                }
                form.append(field, toStream(data[field]), metafield)
              } else {
                form.append(field, data[field])
              } 
            })
            payload = form
          }
          Object.assign(this.client.defaults.headers.post, payload.getHeaders())
        } 

      }


      if(params.query && Object.keys(params.query).length) {
        url = `${url}?${querystring.stringify(params.query)}`
      }      

      debug('prepareRequest url, payload ', url, payload);
      return {url, payload}
      
    }

    const noop = (op) => () => debug(`${op} not implemented`);


    this.client.interceptors.request.use(
      options.requestOkInterceptor || noop('requestOkInterceptor'), 
      options.requestErrorInterceptor || noop('requestErrorInterceptor')
    );

    // Add a response interceptor
    this.client.interceptors.response.use(
      options.responseOkInterceptor || noop('responseOkInterceptor'), 
      options.responseErrorInterceptor || noop('responseErrorInterceptor')
    );
    
    // catch axios error and rethrow feathers error
    this.client.interceptors.response.use( (response) => {
      debug('last response success interceptor' , response);
      return response;
    }, (error) => {
        debug('last response error interceptor', error)

        if(!error.response || !error.response.status) return Promise.reject(error);

        let message = error.code;
        if(error.response.data) message = error.response.data.message;

        const httpError = errors[ this.httpErrors [ error.response.status ] ];
        debug('responseErrorInterceptor error', httpError)
        return httpError ? Promise.reject(new httpError(message)) : Promise.reject(error);

    });

  }

  extend (obj) {
    return Proto.extend(obj, this);
  }

  // HTTP POST - Creates resource
  create(data, params) { 
    // debug(`create :: data params`, data, Object.keys(params), params)
    const {url, payload} = this.prepareRequest({params, data})
    return this.client.post(url, payload)
  }

  // HTTP GET - fetch SINGLE resource
  get(id, params) { 
    debug(`get :: id params`, id, Object.keys(params))
    const {url} = this.prepareRequest({params, id})
    return this.client.get(url);
  }
  
  // HTTP GET - fetch SET of resource(s)
  find(params) {
    debug(`find :: params`, Object.keys(params))
    const {url} = this.prepareRequest({params})
    return this.client.get(url)
  }

  // HTTP PATCH - merge in changes
  patch(id, data, params) {
    debug(`patch :: `, id, data, Object.keys(params))
    // substitute patch to baseURL with post to resourceURL
    if (this.options.preferPOST) { 
      const {url, payload} = this.prepareRequest({params, data, id})
      // For endpoints that don't support HTTP PATCH requests.
      return this.client.post(url, payload)
        // .then(() => this.client.get(url).then(response => response.data))
    } else {
      const {url, payload} = this.prepareRequest({params, data})
      return this.client.patch(url, payload);
      // return this.client.patch(`${this.options.baseURL}`, `${querystring.stringify(data)}`);
    }
  }

  // HTTP PUT - Replace (overwrite) resource
  update(id, data, params) {
    debug(':::::::::: update', id, data)
    const url = data.urlSuffix ?
      `${this.options.baseURL}/${id}/${data.urlSuffix}` : this.options.baseURL;
    // To always merge changes instead of overwriting resource
    if (this.options.preferPATCH) {
      // For endpoints that do not support HTTP UPDATE requests
      return this.patch(id, data, params);
    } else {
        return this.client.put(url, data);
    }
  }

  // HTTP DELETE - remove resource
  remove(id, params) {
    const {url} = this.prepareRequest({params, id})
    return this.get(url)
      // Retrieve the original Resource first so we can return it
      // Necessary in cases when the remote server returns an empty body after delete
    // debug(`create :: remove: ${params} id: ${id} data: ${data}`)
    // // const url = data.urlSuffix ?
    // //   (`${this.options.baseURL}/${data.urlSuffix}`) : this.options.baseURL;
    // const url = this.options.baseURL;
    // return this.get(id, params)
    //  .then(resource => this.client.delete(`${url}/${id}`, params && resource))
    //  .then(() => resource)
  }


}


function init(options){
  return new Service(options);
}

init.Service = Service;

module.exports = init;



