const Proto = require('uberproto');
const Debug = require('debug');

const axios = require('axios');

const debug = Debug('feathers-rest-proxy');

class Service {

	constructor (options) {

		// See https://github.com/axios/axios#request-config
		debug('constructor', options);

		// axios instance to send requests to the API endpoint
		this.client = axios.create(options);

		const noop = (op) => debug(`${op} not implemented`);

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
		debug(`find :: params: ${params}`)
		return this.client.get('', params);
	}

	get(id, params) {
		debug(`get :: params: ${params} id: ${id}`)
		return this.client.get(`/${id}`, params);
	}

	create(data, params) { 
		debug(`create :: params: ${params} data: ${data}`)
		return this.client.post('', data, params)
	}

	update(id, data, params) {
		debug(`update :: params: ${params} id: ${id} data: ${data}`)
	    // PATCH and update work the same here
	    return this.update(id, data, params);
	}

	patch(id, data, params) {
		debug(`patch :: params: ${params} id: ${id} data: ${data}`)
		return this.client.patch(`/${id}`, data, params);
	}

	remove(id, params) {
	    // Retrieve the original Todo first so we can return it
	    // The API only sends an empty body
		debug(`create :: remove: ${params} id: ${id} data: ${data}`)
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



