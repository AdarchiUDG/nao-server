const ServerApp = require('./core/server-app.js')
const { ViewRenderer } = require('./core/plugins.js')

const port = process.env.PORT || 3002

const app = new ServerApp()

app.autoload('endpoints')
  .onError(403, { status: false, message: '403 Forbidden' })
  .listen(port)
  .use('/*', new ViewRenderer('views'))

console.log(`Server ready and listening on port ${port}`)