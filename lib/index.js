const Debug = require('debug');
const Proto = require('uberproto');
const axios = require('axios');

const debug = Debug('feathers-rest-proxy');

class Service {

	constructor (options) {

		// See https://github.com/axios/axios#request-config
		console.log('constructor', options);

		// axios instance to send requests to the API endpoint
		this.client = axios.create(options);

		// You can intercept requests or responses before they are handled by then or catch.
		// Add a request interceptor
		this.client.interceptors.request.use(function (config) {
			console.log('@@@@@@@@@@@@@send request', options);
		    // Do something before request is sent
		    return config;
		  }, function (error) {
		  	console.log('@@@@@@@@@@@@@request error', error); 
		    // Do something with request error
		    return Promise.reject(error);
		  });

		// Add a response interceptor
		this.client.interceptors.response.use(function (response) {
			console.log('@@@@@@@@@@@@@receive response', response);
		    // Do something with response data
		    return response;
		  }, function (error) {
		  	console.log('@@@@@@@@@@@@@response error', error); 
		    // Do something with response error
		    return Promise.reject(error);
		  });

		// See https://github.com/axios/axios#response-schema
		// For response schema
	}

	extend (obj) {
		return Proto.extend(obj, this);
	}


	find(params) {
		debug(`find :: params: ${params}`)
		return this.client.get(`/`, params);
	}

	get(id, params) {
		debug(`get :: params: ${params} id: ${id}`)
		return this.client.get(`/${id}`, params);
	}

	create(data, params) { 
		debug(`create :: params: ${params} data: ${data}`)
		return this.client.post('/', data, params)
		 //  .then(function (response) {
			// console.log('response', response);
		 //    return Promise.resolve(response);
		 //  })
		 //  .catch(function (error) {
			// console.log('error', error);
		 //  });
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



