const Endpoint = require('./endpoint.js')

class EndpointCollection {
	constructor(allowed = ['get', 'post', 'put', 'delete', 'head']) {
		this.allowed = allowed
		this.endpoints = {}
	}

	add(route, method, callback, overwrite = true) {
		route = Endpoint.cleanRoute(route)
		let endpoint = this.endpoints[route]
		if (endpoint === undefined) {
			this.endpoints[route] = endpoint = new Endpoint(route, this.allowed)
		}

		if (overwrite || !endpoint.methods[method]) {
			endpoint.setMethod(method, callback)
		}
	}

	has(route, method) {
		route = Endpoint.cleanRoute(route)
		let endpoint = this.endpoints[route]

		return endpoint && typeof endpoint.methods[method] === 'function'
	}

	find(req, all = false) {	
    let found = all ? [ ] : null
		const url = new URL(req.url.toLowerCase().replace(Endpoint.multipleSlashRegex, '$1'), 'http://' + req.headers.host)
		if (!url.pathname.endsWith('/')) {
			url.pathname += '/'
		}
    const method = req.method.toLowerCase()
    
		for (let route in this.endpoints) {
			const endpoint = this.endpoints[route]
			if (typeof endpoint.methods[method] === 'function' && endpoint.routeRegex.test(url.pathname)) {
				const matches = url.pathname.match(endpoint.routeRegex)
				if (endpoint.route.endsWith('/*')) {
					matches.push(matches.pop().split('/').slice(0, -1))
				}
        
        const endpointData = {
          action: endpoint.methods[method],
          params: url.searchParams,
          arguments: matches.slice(1)
        }

        if (all) {
          found.push(endpointData)
        } else {
          found = endpointData
          break
        }
			}
		}

		return found
	}
}

module.exports = EndpointCollection