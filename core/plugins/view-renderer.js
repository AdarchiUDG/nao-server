const Handlerbars = require('handlebars')
const path = require('path')
const fs = require('fs')

function render(fileName, params = null) { 
  const dir = path.join(require.main.path, this.prefix, fileName)
  let content = null
  if (fs.existsSync(dir)) {
    const stats = fs.statSync(dir)
    const template = this.templates[stats.ino]
    if (template === undefined || template.date < stats.mtimeMs) {
      content = Handlerbars.compile(fs.readFileSync(dir, { encoding: 'utf-8' }))
      this.templates[stats.ino] = {
        date: stats.mtimeMs,
        content
      }
    } else {
      content = template.content
    }
    content = content(params || { })
  }
  return content
}

function ViewRenderer (prefix) {
  this.templates = { }
  this.render = render
  this.prefix = prefix || ''

  return client => {
    client.render = (fileName, params = null) => this.render(fileName, params)
  }
}

module.exports = ViewRenderer
