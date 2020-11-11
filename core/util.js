const AppRequest = require('./app-request.js')
const fs = require('fs')
const path = require('path')
const AsyncFunction = (async () => { }).constructor
const mime = require('mime')

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

const staticEndpoint = {
	action: client => {
		const filePath = path.join(
			require.main.path, 
			decodeURIComponent(client.req.url)
				.replace(client.req.staticUrl, client.req.staticPath)
				.replace(/[.]{2}/g, '')
			)
		
		const exists = fs.existsSync(filePath)
		const stats = exists ? fs.lstatSync(filePath) : null
		if (exists && stats.isFile()) {
			const mimeType = mime.getType(filePath)
			if (mimeType.startsWith('video')) {
				const total = stats.size
				client.autoclose = false

				if (client.req.headers.range) {
					const range = client.req.headers.range.match(/(\d+)\-(\d+)?/)
					
					const start = parseInt(range[1], 10)
					const end = range[2] ? parseInt(range[2], 10) : total - 1
					if (end < total && end > start) {
						const chunkSize = end - start + 1

						const stream = fs.createReadStream(filePath, { start, end })
						client.res.writeHead(206, { 
							'Content-Range': `bytes ${start}-${end}/${total}`, 
							'Accept-Ranges': 'bytes', 
							'Content-Length': chunkSize, 
							'Content-Type': mimeType 
						})
						stream.pipe(client.res)
					} else {
						client.status(416)
						client.end()
					}
				} else {
					client.res.writeHead(200, {
						'Accept-Ranges': 'bytes', 
						'Content-Length': total,
						'Content-Type': mimeType
					})
					fs.createReadStream(filePath).pipe(client.res)
				}
			} else {
				const content = fs.readFileSync(filePath)
				client.end(content, mimeType)
			}
		} else {
			client.sendError(404)
		}
	},
  params: null,
  arguments: [ ]
}

module.exports = {
  handler: (app, req, res) => {
		let endpoint
		let callsBeforeEndpoint = []
		let callsAfterEndpoint = []
		let isStatic = false
		const method = req.method.toLowerCase()

		if (app.public[method] === undefined) {
			app.getError(403).send(res)
			return
		}

		for (let url in app.staticPaths) {
			if (req.url.toLowerCase().startsWith(url)) {
				req.staticPath = app.staticPaths[url]
				req.staticUrl = url

				isStatic = true
				break
			}
		}

		if (isStatic) {
			endpoint = staticEndpoint
		} else {
			endpoint = app.endpoints.find(req)
			callsBeforeEndpoint = app.beforeEndpoint.find(req, true)
			callsAfterEndpoint = app.afterEndpoint.find(req, true)
		}

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

					if (!res.finished && appRequest.autoclose) {
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