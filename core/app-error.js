class AppError {
  constructor(code = 403, content = '', type = 'text/html; charset=utf-8') {
    this.code = code
    if (typeof content === 'function') {
      this.content = content()
    } else if (typeof content === 'object') {
      this.content = JSON.stringify(content)
      type = 'application/json; charset=utf-8'
    } else {
      this.content = content
    }
    this.type = type
  }

  send(res) {
    res.writeHead(this.code, { 'Content-Type': this.type })   
    res.end(this.content)
  }
}

module.exports = AppError