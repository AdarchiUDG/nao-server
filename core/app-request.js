class AppRequest {
  constructor(app, req, res, body, params = null) {
    this.app = app
		this.req = req
		this.res = res
		this.body = body
		this.params = params
	}

	send(content, mime = 'text/html; charset=utf-8') {
		if (!this.res.finished) {
			if (this.res._header === null) {
				this.res.writeHead(200, { 'Content-Type': mime })
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
		headers = { 'Content-Type': 'text/html; charset=utf-8', ...headers }
		this.res.writeHead(code, headers)

		return this
	}
}

module.exports = AppRequest