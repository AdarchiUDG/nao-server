const AppRequest = require('./app-request.js')
const AsyncFunction = (async () => { }).constructor

const executeEndpoint = (endpoint, appRequest) => {
	return new Promise((resolve, reject) => {
		appRequest.params = endpoint.params
		if (endpoint.action instanceof AsyncFunction) {
			appRequest.resolve = resolve
			appRequest.reject = reject
	
			endpoint.action(appRequest, ...endpoint.arguments)
		} else {
			resolve(endpoint.action(appRequest, ...endpoint.arguments))
		}
	})
	
}

module.exports = {
  handler: (app, req, res) => {
		const endpoint = app.endpoints.find(req)
		const callsBeforeEndpoint = app.beforeEndpoint.find(req, true)

    if (endpoint) {
      let body = ''
      if (req.method !== 'get') {
        req.on('data', data => {
          body += data
          if (body.length > 1e6) {
            req.connection.destroy()
          }
        })
      }

      req.on('end', async () => {
        try {
					if (body) {
						body = JSON.parse(body)
					} else {
						body = { }
					}
        } catch (e) {
					body = { }
				}
				
				try {
					const appRequest = new AppRequest(app, req, res, body)

					let continueCalls = true
					for (const call of callsBeforeEndpoint) {
						await executeEndpoint(call, appRequest)
						if (appRequest.stopped === true) {
							break
						}
					}
					if (appRequest.stopped !== true) {
						await executeEndpoint(endpoint, appRequest) 
					}

					if (!res.finished) {
						res.end()
					}
				} catch (e) {
					console.log(e)
					app.getError(500).send(res)
				}
      })
    } else {
			app.getError(404).send(res)
    }
  },
  getImageMime(file) {
		const extension = file.split('.').pop()
		let mime = false

		switch (extension) {
			case 'gif': 
				mime = 'image/gif'
				break
			case 'jpg':
			case 'jpeg':
				mime = 'image/jpeg'
				break
			case 'png':
				mime = 'image/png'
				break
			case 'bpm':
				mime = 'image/bpm'
				break
			case 'ico':
				mime = 'image/vnd.microsoft.icon'
				break
			case 'svg':
				mime = 'image/svg+xml'
				break
			case 'webp':
				mime = 'image/webp'
				break
			case 'tiff':
			case 'tif':
				mime = 'image/tiff'
				break
		}

		return mime
	}
}