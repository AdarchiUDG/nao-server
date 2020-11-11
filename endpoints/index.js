module.exports = {
  prefix: '',
  routes: [
    {
      route: '/',
      method: 'get',
      action: client => {
        client.send(client.render('index.html', {
          title: 'Hello world',
          content: 'Testing templates using Handlebars'
        }))
      }
    }
  ]
}