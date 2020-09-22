module.exports = {
	prefix: '',
	routes: [
		{
			route: '/',
			method: 'all',
			action: client => {
				client.send('<h1>Hello World!</h1>')
			}
		},
		{
			route: '/post',
			method: 'post',
			action: client => {
				client.json(client.body)
			}
		}
	]
}