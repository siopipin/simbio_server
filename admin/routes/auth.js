const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth')
const checkAuth = require('../middleware/check-auth')

router.post('/login', authCtrl.do_login)
router.get('/profil', checkAuth, authCtrl.get_profil)

module.exports = router;