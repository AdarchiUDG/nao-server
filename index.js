const ServerApp = require('./core/server-app.js')

const port = process.env.PORT || 8080

const app = new ServerApp()

app.autoload('endpoints')
  .onError(403, { status: false, message: '403 Forbidden' })
  .listen(port)

console.log(`Server ready and listening on port ${port}`)