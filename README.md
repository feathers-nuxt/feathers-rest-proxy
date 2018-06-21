# feathers-rest-proxy service
> Feathers service for storing and retrieving data from remote REST API endpoints.
This service allows the use of `feathers` as a proxy to access existing API endpoinds or other external systems. 

## Usage 
> Code snippets below are in `livescript` but its just `javascript` minus unnecessary noise. 
<!-- Leave out the semicolons, const, var, let, braces, brackets will be added by the transpiler. -->

In your service declaration file
```livescript
options =
  baseURL: 'http://178.62.75.46:4000/api/bulksms/sms'
  timeout: 1000
proxyService = require 'feathers-rest-proxy'
app.use '/proxymessages', proxyService options
```

## Configurations
The configuration object provided to the service is passed directly to `axios`  which is used under the hood to make HTTP requests to the remote API server from Node. `baseURL` is the only required parameter. 
> See [axios configuration options](https://github.com/axios/axios#request-config) for a comprehensive list of available parameters.

## Storing Data
Invoking `service.create` sends a HTTP POST Request to `baseURL`. Either JSON or FormData Object MUST be provided as the first parameter to `service.create`. An optional object with extra `axios config` options MAY be provided as the second parameter to `service.create`. While JSON payloads will suffice for most cases, FormData payload MUST be used if you wish to send a file as part of the payload.

### Creating Resources
Pass in a JSON Object to service.create will send a `POST` request to `baseURL` with the Object in the request body.
```livescript
notification = 
  message: 'This is a notification message'
  sendTime: '2018-06-19 13:00:00'
  expiryTime: '2018-06-20 13:00:00' 
proxymessage = await @app.services.proxymessages.create sms
```

### Uploading Files
Uploading files requires you use FormData.

```livescript
# Using `form-data` npm package
FormData = require 'form-data'

form = new FormData
form.append 'fileName', fs.createReadStream('file.ext'), filename: "file.csv", contentType: 'mime/type'

proxyupload = await @app.services.proxyuploads.create form, headers: form.getHeaders!
```

