const router = require('express').Router()
const cashbackCtrl = require('../controllers/cashback')
const checkAuth = require('../middleware/check-auth')

router.post('/list', cashbackCtrl.request_cashback)
router.get('/detail/:id', cashbackCtrl.detail_cashback)
router.post('/change', checkAuth, cashbackCtrl.proses)
router.post('/reset', checkAuth, cashbackCtrl.reset_cashback)

module.exports = router