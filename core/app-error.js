class AppError {
  constructor(code = 403, content = '', type = 'text/html; charset=utf-8') {
    this.code = code
    this.content = typeof content === 'function' ? content() : content.toString()
    this.type = type
  }

  send(res) {
    res.writeHead(this.code, { 'Content-Type': this.type })   
    res.end(this.content)
  }
}

module.exports = AppError