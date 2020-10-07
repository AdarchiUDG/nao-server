module.exports = {
	prefix: '',
	routes: [
		{
			route: '/',
			method: 'all',
			action: client => {
				client.send('<p>Hello world!</p>')
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