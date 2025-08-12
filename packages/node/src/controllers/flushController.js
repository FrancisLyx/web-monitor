class FlushController {
	static flush(req, res) {
		res.ok(req.body, 'flush success')
	}
}

module.exports = FlushController
