const router = require('express').Router()
const notifikasi = require('../controllers/notifikasi')

router.post('/send-topic', notifikasi.send_notifikasi_topic)

module.exports = router