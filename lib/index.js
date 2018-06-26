const Proto = require('uberproto');
// const debug = require('debug');
const querystring = require('querystring');

const axios = require('axios');

// const console.log = console.log('feathers-rest-proxy');

class Service {

	constructor (options) {

		// See https://github.com/axios/axios#request-config
		console.log('constructor', options);

		this.options = options

		// axios instance to send requests to the API endpoint
		this.client = axios.create(options);

		const noop = (op) => () => console.log(`${op} not implemented`);

		// Add a request interceptor
		this.client.interceptors.request.use(
			options.requestOkInterceptor || noop('requestOkInterceptor'), 
			options.requestErrorInterceptor || noop('requestErrorInterceptor')
		);

		// Add a response interceptor
		this.client.interceptors.response.use(
			options.responseOkInterceptor || noop('responseOkInterceptor'), 
			options.responseErrorInterceptor || noop('responseErrorInterceptor')
		);

	}

	extend (obj) {
		return Proto.extend(obj, this);
	}


	find(params) {
		// Equivalent of HTTP GET. Fetches MULTIPLE resources
		console.log(`find :: params`, params.query)
		return this.client.get(`${this.options.baseURL}?${querystring.stringify(params.query)}`);
	}

	get(id, params) { 
		console.log(`get :: params: ${params} id: ${id}`)
		// Equivalent of HTTP GET. Fetches SINGLE resource
		return this.client.get(`${this.options.baseURL}/${id}`);
	}

	create(data, params) { 
		console.log(`create :: params: ${params} data: ${data}`)
		// Equivalent of HTTP POST. Creates resource
		return this.client.post(`${this.options.baseURL}`, data)
	}

	update(id, data, params) {
		console.log(`update :: params: ${params} id: ${id} data: ${data}`)
		// Equivalent of HTTP PUT. Replaces resource
	    return this.put(id, data, params);
	}

	patch(id, data, params) {
		console.log(`patch :: params: ${params} id: ${id} data: ${data}`)
		// Some endpoints don't support patch
		return this.client.patch(`${this.options.baseURL}/${id}`, data, params);
	}

	remove(id, params) {
	    // Retrieve the original Resource first so we can return it
	    // Necessary in cases when the remote server returns an empty body after delete
		console.log(`create :: remove: ${params} id: ${id} data: ${data}`)
		return this.client.get(`/${id}`)
			.then(resource => this.client.delete(`/${id}`, params))
			.then(() => resource)
	}


}


function init(options){
	return new Service(options);
}

init.Service = Service;

module.exports = init;



