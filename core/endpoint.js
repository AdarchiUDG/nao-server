class Endpoint {
  static pathRegex = /\/:([^\/]+)/g
  static multipleSlashRegex = /(\/)\/+/g
  
  static cleanRoute(route) {
    route = route.trim().toLowerCase().replace(Endpoint.multipleSlashRegex, '$1')
		if (!route.endsWith('/') && !route.endsWith('/*')) {
			route += '/'
		}
		return route
  }

  constructor(route, allowed) {
		this.route = route
		this.escapedRoute = this.route.replace(/\/\*$/, '/(.*)')
		// this.escapedRoute = escapeRegExp(this.route).replace(/\/\\\*$/, '\/(.*)')
		this.routeRegex = new RegExp('^' + this.escapedRoute.replace(Endpoint.pathRegex, '/([^/]+?)') + '$')

		this.methods = { }
		for (const method of allowed) {
			this.methods[method] = null
		}
	}

	setMethod(method, callback) {
    method = typeof method === 'string' ? method.toLowerCase() : ''
		if (this.methods[method] !== undefined && typeof callback === 'function') {
			this.methods[method] = callback
		}
	}
}

module.exports = Endpoint