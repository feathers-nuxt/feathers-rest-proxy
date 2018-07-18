# feathers-rest-proxy service
> Feathers service for storing and retrieving data from remote REST API endpoints.
This service allows the use of `feathers` as a proxy to access existing API endpoinds or other external systems. 

## Usage 
> Code snippets below are in `livescript` but its just fancy `javascript`. 

In your service declaration file
```livescript
endpoint = 
proxyService = require 'feathers-rest-proxy'
options =
  baseURL: 'https://jsonplaceholder.typicode.com'
  resourceURL: 'users'
  timeout: 5000  
  requestOkInterceptor: (config) ->
    console.log 'requestOkInterceptor request'
    # Do something with response data and resolve promise
    return config
  requestErrorInterceptor: (error) ->
    console.log 'requestErrorInterceptor error', error
    # Do something with response error and reject promise
    return Promise.reject error
  responseOkInterceptor: (response) ->
    # For response schema See https://github.com/axios/axios#response-schema
    {data, config} = response
    # Format remote API server response to match feathers service response
    console.log 'responseOkInterceptor response', response
  responseErrorInterceptor: (error) ->
    console.log 'responseErrorInterceptor error', error
    return Promise.reject error
app.use '/proxymessages', proxyService options
```
Note that `options` above is an object and `baseURL` is the only mandatory key. See below for other configuration options.

## Configuration options
The configuration object provided to the service is passed directly to `axios`  which is used under the hood to make HTTP requests to the remote API server from Node. `baseURL` is the only required parameter. 
> See [axios configuration options](https://github.com/axios/axios#request-config) for a comprehensive list of available parameters.

## Creating Resources
Invoking `service.create` sends a HTTP POST Request to `baseURL`. Either JSON or FormData Object MUST be provided as the first parameter to `service.create`. An optional object with extra `axios config` options MAY be provided as the second parameter to `service.create`. 
Pass in a JSON Object to service.create will send a `POST` request to `baseURL` with the Object in the request body.
```livescript
notification = 
  message: 'This is a notification message'
  sendTime: '2018-06-19 13:00:00'
  expiryTime: '2018-06-20 13:00:00' 
proxymessage = await @app.services.proxymessages.create notification
```
> On the browser, `service.create` works best with JSON paylods.

### Content-Type
JSON payloads will automatically be formated to a `url-encoded` string using [querystring](https://nodejs.org/api/querystring.html) and sent with the request header content type set to `application/x-www-form-urlencoded`. While this will suffice for most cases, your API may require a different `Content-Type`. Simply set `params.query.contentType` to `"multipart/form-data"` and pass `params` as second argument to `service.create`. This will set the request header as specified and envelop the JSON payload in a FormData Object to send to the endpoint.

### File Uploads
To send files as part of the payload, you may either send [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)s within a JSON payload or pass a `FormData` Object as the payload to `service.create`. Ensure you set the contentType to `"multipart/form-data"`, otherwise the default content type will be used and the files will NOT be uploaded to the remote API.
> On the browser, only JSON payloads will work, therefore, [File](https://developer.mozilla.org/en-US/docs/Web/API/File)s should be included in the JSON payload. Below, we are reading a HTML file input for the File using JQuery, but you may use the [FileReader]() API of whatever else you prefer that retrieves an instance of File.
```livescript
json = 
  fileName: $("#fileInput")[0].files[0]
proxyupload = await @app.services.proxyuploads.create json
```
On the server, you have the option of passing in an instance of FormData. Since FormData Object is not availabe on node, you have to require [form-data](https://github.com/form-data/form-data). The same module is used under the hood when payload is JSON and `params.query.contentType` is set to `"multipart/form-data"`.
```livescript
# Using `form-data` npm package
FormData = require 'form-data'

# See https://github.com/form-data/form-data#alternative-submission-methods
meta =
  filename: 'unicycle.jpg'
  contentType: 'image/jpeg'
  knownLength: 19806

form = new FormData
form.append 'fileName', (require 'fs').createReadStream('file.ext'), meta
proxyupload = await @app.services.proxyuploads.create form, params # Ensure you pass along params
```
> While converting JSON to FormData, `form.append` is called with two parameters unlike above. You may include file metadata in the JSON payload under the key `meta` as an object whose keys are filenames and values are similar to fileMeta above. This will call `form.append` with three parameters as above.




> See https://gist.github.com/joyrexus/524c7e811e4abf9afe56