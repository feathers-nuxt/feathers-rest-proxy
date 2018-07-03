const Proto = require('uberproto');
// const Debug = require('debug');
const querystring = require('querystring');

const axios = require('axios');
const FormData = require('form-data');
const errors = require('@feathersjs/errors')

// const debug = Debug('feathers-rest-proxy');

class Service {

	constructor (options) {

		// See https://github.com/axios/axios#request-config
		// debug('constructor', options);
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

    // returns url
    this.prepareRequest = ({params, data, id}) => {

      // to be disabled for endpoints that do not require authentication
      console.log('@@@@@@@@@@::::::::::::::::first interceptor url', this.options.withToken);
      if(this.options.withToken) {
        if (params.user.token) {
          // if a token is provided, send it in Authorization header
          // console.log('@@@@@@@@@@::::::::::::::::first interceptor params ', params.user.token)
          this.client.defaults.headers.common['Authorization'] = `Bearer ${params.user.token}`;
        }
      } else {
        if(this.client.defaults.headers.common['Authorization']) {
          delete this.client.defaults.headers.common['Authorization']
        }
        console.log('@@@@@@@@@@::::::::::::::::first interceptor url', this.client.defaults.headers.common['Authorization'])
      }

      let url = this.options.baseURL // baseURL
      
      // if a prefix is provided, concatinate to the url
      if(params.query && params.query.urlPrefix) {
        // baseURL with urlPrefix
        url = params.query.urlPrefix.trim() == '' ? url : `${url}/${params.query.urlPrefix.trim()}`
      }

      // if an id is provided send request to resourceURL
      if(id) url = `${url}/${id}` // resourceURL

      // if a suffix is provided, concatinate to the url
      if(data && data.urlSuffix) {
        url = data.urlSuffix.trim() == '' ? url : `${url}/${data.urlSuffix.trim()}`
      }

      url = url.replace(/([^:]\/)\/+/g, "$1") // remove repeated forward slashes from url
      console.log('@@@@@@@@@@::::::::::::::::first interceptor url', url)

      return url;
      
    }

		const noop = (op) => () => console.log(`${op} not implemented`);

		// Add a request interceptor
		// this.client.interceptors.request.use( (config) => {

    //   // console.log('@@@@@@@@@@::::::::::::::::first interceptor', config)

		// 	// if (config.data) {
    //   //   console.log('@@@@@@@@@@::::::::::::::::first interceptor', config)

		// 	// 	if (config.data.urlSuffix) {
		// 	// 		const suffix = config.data.urlSuffix.trim()
		// 	// 		config.url = suffix == '' ? `${config.url}` :`${config.url}/${suffix}`
		// 	// 		console.log('@@@@@@@@@@::::::::::::::::first interceptor', config.url)
		// 	// 		delete config.data.urlSuffix
    //   //   }
        
		// 	// }

		// 	// cast config.data to preferred format
		// 	// if (config.data) {
		// 	// 	if (this.options.format) {
		// 	// 		switch(this.options.format.toLowerCase()) {
		// 	// 		    case 'form-data':
		// 	// 		        console.log('::::::::::::::::::cast config.data to form-data', config.data)
							
		// 	// 				config.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
		// 	// 		        break;
		// 	// 		    case 'x-www-form-urlencoded':
		// 	// 		        code block
		// 	// 		        break;
		// 	// 		    default:
		// 	// 		        code block
		// 	// 		}
		// 	// 	}
		// 	// }


		
		// 	// this.client.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

		// 	// if (config.data) {
	  // //     		let form = new FormData();
		// 	// 	Object.keys(config.data).map(function(key) {
		// 	// 		form.append(key, config.data[key])
		// 	// 	})
		// 	// 	config.data = form
		// 	// }
		// 	// console.log('::::::::::::::::::first interceptor', config)

		// 	return config
		// }, function (error) {
		//     // Do something with request error
		//     return Promise.reject(error);
    // })


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
			// console.log('::::::::::::::::::last response interceptor', config)

			return response
		}, (error) => {
		    // Do something with response error
        // return Promise.reject(error);
        let message = error.code
        if(error.response && error.response.status) {
          if(error.response.data) message = error.response.data.message
          const httpError = errors[ this.httpErrors [ error.response.status ] ]
          console.log('responseErrorInterceptor error', httpError)
          return Promise.reject(new httpError(message))
        }

		})

	}

	extend (obj) {
		return Proto.extend(obj, this);
	}

	// HTTP POST - Creates resource
	create(data, params) { 
    const url = this.prepareRequest({params, data})
		console.log(`create :: data params`, data, params)
		return this.client.post(`${url}`, `${querystring.stringify(data)}`)
	}

	// HTTP GET - fetch SINGLE resource
	get(id, params) { 
    const url = this.prepareRequest({params, id})
		console.log(`get :: id params`, id, params)
		return this.client.get(url);
  }
  
	// HTTP GET - fetch SET of resource(s)
	find(params) {
    const url = this.prepareRequest({params})
		console.log(`find :: params`, url, params.query)
		return this.client.get(`${url}?${querystring.stringify(params.query)}`)
	}

	// HTTP PATCH - merge in changes
	patch(id, data, params) {
    console.log(`patch :: `, id, data, params)
		// substitute patch to baseURL with post to resourceURL
		if (this.options.preferPOST) { 
      const url = this.prepareRequest({params, data, id})
      // For endpoints that don't support HTTP PATCH requests.
      return this.client.post(url, `${querystring.stringify(data)}`)
        // .then(() => this.client.get(url).then(response => response.data))
		} else {
      const url = this.prepareRequest({params, data})
			return this.client.patch(url, `${querystring.stringify(data)}`);
			// return this.client.patch(`${this.options.baseURL}`, `${querystring.stringify(data)}`);
		}
	}

	// HTTP PUT - Replace (overwrite) resource
	update(id, data, params) {
		console.log(':::::::::: update', id, data)
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
	    // Retrieve the original Resource first so we can return it
	    // Necessary in cases when the remote server returns an empty body after delete
		console.log(`create :: remove: ${params} id: ${id} data: ${data}`)
		// const url = data.urlSuffix ?
		// 	(`${this.options.baseURL}/${data.urlSuffix}`) : this.options.baseURL;
		const url = this.options.baseURL;
		return this.get(id, params)
			.then(resource => this.client.delete(`${url}/${id}`, params && resource))
			.then(() => resource)
	}


}


function init(options){
	return new Service(options);
}

init.Service = Service;

module.exports = init;



