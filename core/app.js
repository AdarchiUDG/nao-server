const http = require('http')
const fs = require('fs')
const path = require('path')

const EndpointCollection = require('./endpoint-collection.js')
const AppError = require('./app-error.js')
const util = require('./util.js')
const handler = require('./util.js')

const ASSETS = {
  NONE: 0,
	JS: 1,
	CSS: 2,
	IMG: 4,
	ALL: 7
}

function App(settings = { }) {
  this.settings = { 
    errorHandlers: {
      '403': new AppError(403, http.STATUS_CODES[403]),
      '404': new AppError(404, http.STATUS_CODES[404]),
      '500': new AppError(500, http.STATUS_CODES[500])
    },
    sessionPrefix: 'NSRV-',
    assets: ASSETS.ALL,
    ...settings
  }

  this.beforeEndpoint = new EndpointCollection()
  this.endpoints = new EndpointCollection()
  this.assetEndpoints = new EndpointCollection()

  this.server = http.createServer((req, res) => util.handler(this, req, res))
  
  this.loadFile = (type, fileName) => {
    const dir = path.join(require.main.path, type, fileName)
		let content = false
		if (fs.existsSync(dir)) {
			content = fs.readFileSync(dir, { encoding: 'utf-8' })
		}
		return content;
  } 

  if (this.settings.assets & ASSETS.JS) {
    this.assetEndpoints.add('/assets/js/*', 'get', (client, args) => {
      const content = this.loadFile('assets/js', args.join('/'));
      client.status(content ? 200 : 404, { 'Content-Type': 'text/javascript; charset=utf-8' }).end(content)
    })
  }

  if (this.settings.assets & ASSETS.CSS) {
    this.assetEndpoints.add('/assets/css/*', 'get', (client, args) => {
      const content = this.loadFile('assets/css', args.join('/'));
	  	client.status(content ? 200 : 404, { 'Content-Type': 'text/css; charset=utf-8' }).end(content)
    })
  }

  if (this.settings.assets & ASSETS.IMG) {
    this.assetEndpoints.add('/assets/images/*', 'get', (client, args) => {
      const file = args.join('/')
	  	const content = this.loadFile('assets/images', file);
	  	const mime = util.getImageMime(args.pop())
	  	client.status(200, { 'Content-Type': mime || 'text/plain' }).end(content)
    })
  }

  this.getError = (code) => {
    return this.settings.errorHandlers[code] || new AppError()
  }

  this.all = (route, callback) => {
    this.endpoints.add(route, 'get', callback, false)
    this.endpoints.add(route, 'post', callback, false)
    this.endpoints.add(route, 'put', callback, false)
    this.endpoints.add(route, 'delete', callback, false)
    return this.public
  }

  this.public = {
    listen: (port) => {
      this.server.listen(port)
      return this.public
    },
    all: this.all,
    get: (route, callback) => {
      this.endpoints.add(route, 'get', callback)	
      return this.public
    },
    post: (route, callback) => {
      this.endpoints.add(route, 'post', callback)
      return this.public
    },
    put: (route, callback) => {
      this.endpoints.add(route, 'put', callback)
      return this.public
    },
    delete: (route, callback) => {
      this.endpoints.add(route, 'delete', callback)
      return this.public
    },
    beforeEndpointCall: (route, callback) => {
      this.beforeEndpoint.add(route, 'get', callback, false)
      this.beforeEndpoint.add(route, 'post', callback, false)
      this.beforeEndpoint.add(route, 'put', callback, false)
      this.beforeEndpoint.add(route, 'delete', callback, false)
    },
    autoload: (path) => {
      if (!path.endsWith('/')) {
        path += '/'
      }

      if (fs.existsSync(path)) {
        const files = fs.readdirSync(path)
        for (let file of files) {
          if (!file.endsWith('.js')) { continue } 
          
          let { prefix = '', routes } = require('../' + path + file)
          if (!Array.isArray(routes)) {
            routes = [ routes ]
          }
          
          for (let { route, method, action } of routes) {
            if (route && method && action) {
              if (method === 'all') {
                this.all(prefix + route, action);
              } else {
                this.endpoints.add(prefix + route, method.toLowerCase(), action)
              }
            }
          }
        }
      }

      return this.public
    }
  }

  return this.public
} 

App.prototype.ASSETS = ASSETS
module.exports = App