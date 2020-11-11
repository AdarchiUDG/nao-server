class AppRequest {
  constructor(app, req, res, body, params = null) {
		for (let i in app.handlerFunctions) {
			this[i] = app.handlerFunctions[i]
		}

		this.req = req
		this.res = res
		this.body = body
		this.params = params
		this.stopped = false
		this.autoclose = true

		this.code = 200
		this.data = { }
		this.headers = { }
	}

	send(content, mime = 'text/html; charset=utf-8') {
		if (!this.res.finished) {
			if (!this.res.headersSent) {
				this.res.writeHead(this.code, { 'Content-type': mime, ...this.headers })
			}
			this.res.write(content)
		}

		return this
	}

	end(content = '', mime = 'text/html; charset=utf-8') {
		this.send(content, mime)
		this.res.end()

		return this
	}

	json(content) {
		content = JSON.stringify(content)

		this.send(content, 'application/json; charset=utf-8')
	}

	status(code, headers = { }) {
		this.headers = { 'Content-Type': 'text/html; charset=utf-8', ...headers }
		this.code = code

		return this
	}

	get(key) {
		return this.data[key] || false
	}

	has(key) {
		return this.data[key] !== undefined
	}

	set(mixed, data = '') {
		if (typeof mixed === 'object') {
			for (let key in mixed) {
				this.data[key] = mixed[key]
			}
		} else if (typeof mixed === 'string') {
			this.data[mixed] = data
		}
	}

	stop() {
		this.stopped = true
	}
}

module.exports = AppRequest