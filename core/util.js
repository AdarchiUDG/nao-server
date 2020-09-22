const AppRequest = require('./app-request.js')

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

      req.on('end', () => {
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
					const appRequest = new AppRequest(app.public, req, res, body)
					appRequest.loadView = (filename) => {
						return app.loadFile('views', filename)
					}

					for (const call of callsBeforeEndpoint) {
						appRequest.params = call.params
						call.action(appRequest, ...call.arguments)
					}

					appRequest.params = endpoint.params
					endpoint.action(appRequest, ...endpoint.arguments)
					if (!res.finished) {
						res.end()
					}
				} catch (e) {
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