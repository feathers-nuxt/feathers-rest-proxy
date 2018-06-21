# feathers-rest-proxy service

## Usage 
In your service declaration file
```livescript
# See https://github.com/axios/axios#request-config
options =
  baseURL: 'http://178.62.75.46:4000/api/bulksms/sms'
  timeout: 1000
proxyService = require 'feathers-rest-proxy'
app.use '/proxymessages', proxyService options
```

## Configurations


## Creatig Resources
Pass in a JSON Object to service.create will send a request with the Object in the body.
```livescript
notification = 
  message: 'This is a notification message'
  sendTime: '2018-06-19 13:00:00'
  expiryTime: '2018-06-20 13:00:00' 
proxymessage = await @app.services.proxymessages.create sms
```

## Uploading Files
Uploading files requires you use FormData.

```livescript
# Using `form-data` npm package
FormData = require 'form-data'

form = new FormData
form.append 'fileName', fs.createReadStream('file.ext'), filename: "file.csv", contentType: 'mime/type'

proxyupload = await @app.services.proxyuploads.create form, headers: form.getHeaders!
```
Sends a HTTP POST Request to `baseURL`. Accepts either JSON or FormData Object and `axios config` options

