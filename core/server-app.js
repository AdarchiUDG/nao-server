const http = require('http')
const fs = require('fs')
const path = require('path')

let redis = null
try {
  redis = require('redis')
} catch (e) {
  redis = null
}

const EndpointCollection = require('./endpoint-collection.js')
const AppError = require('./app-error.js')
const util = require('./util.js')

function ServerApp(settings = { }) {
  const me = this
  this.settings = { 
    methods: [
      'get', 'post', 'put', 'delete', 'head'
    ],
    ...settings
  }

  this.fileCache = { }

  this.errorHandlers = {
    '403': new AppError(403, http.STATUS_CODES[403]),
    '404': new AppError(404, http.STATUS_CODES[404]),
    '500': new AppError(500, http.STATUS_CODES[500])
  }

  this.beforeEndpoint = new EndpointCollection(this.settings.methods)
  this.endpoints = new EndpointCollection(this.settings.methods)
  this.afterEndpoint = new EndpointCollection(this.settings.methods)

  this.staticPaths = { }

  this.server = http.createServer((req, res) => util.handler(this, req, res))

  this.getError = (code) => {
    return this.errorHandlers[code] || new AppError()
  }

  this.all = (route, callback) => {
    for (const method of this.settings.methods) {
      this.endpoints.add(route, method, callback, false)
    }
    return this.public
  }


  this.handlerFunctions = {
    sendError(code) {
      me.getError(code).send(this.res)
    } 
  }

  this.public = {
    listen: (port) => {
      this.server.listen(port)
      return this.public
    },
    all: this.all,
    static: (route, customPath = null) => {
      route = path.posix.join('/', route).toLowerCase()
      if (customPath === null) {
        customPath = route
      }

      this.staticPaths[route] = customPath.toLowerCase()
      return this.public
    },
    use: (route, callback, method = 'all') => {
      if (method === 'all') {
        for (const method of this.settings.methods) {
          this.beforeEndpoint.add(route, method, callback, false)
        }
      } else {
        this.beforeEndpoint.add(route, method.toLowerCase(), callback)
      }
      return this.public
    },
    after: (route, callback, method = 'all') => {
      if (method === 'all') {
        for (const method of this.settings.methods) {
          this.afterEndpoint.add(route, method, callback, false)
        }
      } else {
        this.afterEndpoint.add(route, method.toLowerCase(), callback)
      }
      return this.public
    },
    autoload: (location) => {
      if (fs.existsSync(location)) {
        const files = fs.readdirSync(location)
        for (let file of files) {
          if (!file.endsWith('.js')) { continue } 
          let { prefix = '', routes } = require.main.require('./' + path.join(location, file))
          if (!Array.isArray(routes)) {
            routes = [ routes ]
          }
          
          for (let { route, method, action } of routes) {
            if (route && method && action) {
              if (method === 'all') {
                this.all(path.join('/', prefix, '/', route), action);
              } else {
                this.endpoints.add(path.join('/', prefix, '/', route), method.toLowerCase(), action)
              }
            }
          }
        }
      }
      return this.public
    },
    onError: (code, content, isFile = false, type = 'text/html; charset=utf-8') => {
      if (isFile && fs.existsSync(content)) {
        content = fs.readFileSync(content)
      }
      const appError = new AppError(code, content, type)
      this.errorHandlers[code] = appError
      return this.public
    }
  }

  for (const method of this.settings.methods) {
    this.public[method] = (route, callback) => {
      this.endpoints.add(route, method, callback)
      return this.public
    }
  }


  return this.public
} 

/* if (redis !== null) {
  ServerApp.RedisConnection = null
  ServerApp.RedisSession = ({ prefix = 'NSERV-', host = '127.0.0.1', port = '6379' }) => {
     const conn = redis.connect({ host, port })
  }
} */
module.exports = ServerApp