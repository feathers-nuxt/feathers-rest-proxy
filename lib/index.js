const Proto = require('uberproto');
// const debug = require('debug');
const querystring = require('querystring');

const axios = require('axios');

const FormData = require('form-data');

// const console.log = console.log('feathers-rest-proxy');

class Service {

	constructor (options) {

		// See https://github.com/axios/axios#request-config
		console.log('constructor', options);

		this.options = options

		// axios instance to send requests to the API endpoint
		this.client = axios.create(options);

		const noop = (op) => () => console.log(`${op} not implemented`);

		this.client.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

		// Add a request interceptor
		// this.client.interceptors.request.use( (config) => {
		// 	// console.log('::::::::::::::::::first interceptor', config.url)
		// 	// if (config.data && config.data.urlSuffix) {
		// 	// 	const suffixedURL = `${config.url}/${config.data.urlSuffix}`
		// 	// 	config.url = suffixedURL
		// 	// 	delete config.data.urlSuffix
		// 	// }
		// 	// config.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
		// 	console.log('::::::::::::::::::first interceptor', config)

		// 	if (config.data) {
	 //      		let form = new FormData();
		// 		Object.keys(config.data).map(function(key) {
		// 			form.append(key, config.data[key])
		// 		})
		// 		config.data = form
		// 	}
		// 	console.log('::::::::::::::::::first interceptor', config)

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

	}

	extend (obj) {
		return Proto.extend(obj, this);
	}


	// Equivalent of HTTP GET. Fetches MULTIPLE resources
	find(params) {
		console.log(`:::::::::::::: find :: params`, this.options, params)
		// const endpoint = data.urlSuffix ?
		// 	(`${this.options.baseURL}/${data.urlSuffix}`) : this.options.baseURL;
		const endpoint = this.options.baseURL;
		return this.client.get(`${endpoint}?${querystring.stringify(params.query)}`);
	}

	// Equivalent of HTTP GET. Fetches SINGLE resource
	get(id, params) { 
		console.log(`get :: id params`, id, params)
		// const endpoint = data.urlSuffix ?
		// 	(`${this.options.baseURL}/${data.urlSuffix}`) : this.options.baseURL;
		const endpoint = this.options.baseURL;
		return this.client.get(`${endpoint}/${id}`);
	}

	// Equivalent of HTTP POST. Creates resource
	create(data, params) { 
		console.log(`create :: params: ${params} data: ${data}`)
		const endpoint = data.urlSuffix ?
			(`${this.options.baseURL}/${data.urlSuffix}`) : this.options.baseURL;
		return this.client.post(`${endpoint}`, data)
	}

	// Equivalent of HTTP PUT. Replaces (overwrite) resource
	update(id, data, params) {
		console.log(':::::::::: update', id, data)
		const endpoint = data.urlSuffix ?
			`${this.options.baseURL}/${id}/${data.urlSuffix}` : this.options.baseURL;
		// To always merge changes instead of overwriting resource
		if (this.options.preferPATCH) {
			// For endpoints that do not support HTTP UPDATE requests
			return this.patch(id, data, params);
		} else {
	    	return this.client.put(endpoint, data);
		}
	}

	// merge in changes
	patch(id, data, params) {
		console.log(`patch :: `, id, data)
		const endpoint = data.urlSuffix ?
			`${this.options.baseURL}/${id}/${data.urlSuffix}` : this.options.baseURL;
		// To always send POST request to resourceURL instead of PATCH to baseURL
		if (this.options.preferPOST) { 
			// For endpoints that don't support HTTP PATCH requests. I'm looking at you PHP!
			return this.client.post(endpoint, `${querystring.stringify(data)}`)
		} else {
			return this.client.patch(endpoint, `${querystring.stringify(data)}`);
		}
	}

	// HTTP DELETE
	remove(id, params) {
	    // Retrieve the original Resource first so we can return it
	    // Necessary in cases when the remote server returns an empty body after delete
		console.log(`create :: remove: ${params} id: ${id} data: ${data}`)
		// const endpoint = data.urlSuffix ?
		// 	(`${this.options.baseURL}/${data.urlSuffix}`) : this.options.baseURL;
		const endpoint = this.options.baseURL;
		return this.get(id, params)
			.then(resource => this.client.delete(`${endpoint}/${id}`, params))
			.then(() => resource)
	}


}


function init(options){
	return new Service(options);
}

init.Service = Service;

module.exports = init;



