# feathers-rest-proxy service
> Feathers service for storing and retrieving data from remote REST API endpoints.

## Usage 
In your service declaration file
```livescript
options =
  baseURL: 'http://178.62.75.46:4000/api/bulksms/sms'
  timeout: 1000
proxyService = require 'feathers-rest-proxy'
app.use '/proxymessages', proxyService options
```

## Configurations
The configuration object provided to the service is passed directly to `axios`  which is used under the hood to make HTTP requests to the remote API server from Node. `baseURL` is the only required parameter. See [axios configuration options](https://github.com/axios/axios#request-config) for a comprehensive list of available parameters.

## HTTP POST to External API
To sends a HTTP POST Request to `baseURL`. Accepts either JSON or FormData Object and `axios config` options

### Creating Resources
Pass in a JSON Object to service.create will send a request with the Object in the body.
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

