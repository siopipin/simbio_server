const express = require('express');
const router = express.Router();
const chatCtrl = require('../controllers/chats')
const authCheck = require('../middleware/check-auth')

router.get('/recents', authCheck, chatCtrl.get_recent)
router.post('/chats', authCheck, chatCtrl.get_chats)
router.post('/move', authCheck, chatCtrl.move_chat)

router.delete('/:id', authCheck, chatCtrl.hapus_chat)

router.post('/get-order-chat', authCheck, chatCtrl.get_order_move_chat)

router.post('/galleries', authCheck, chatCtrl.get_galleries)

module.exports = router;