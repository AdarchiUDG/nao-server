const App = require('./core/app.js')

const port = process.env.PORT || 8080

const app = new App()

app.autoload('endpoints').listen(port)

console.log(`Server ready and listening on port ${port}`)