const express = require('express');
const router = express.Router();
const ordersCtrl = require('../controllers/orders')

router.get('/customers', ordersCtrl.get_customers)
router.get('/gen-id-order', ordersCtrl.generate_no_order)
router.get('/products', ordersCtrl.get_products)

router.get('/vouchers', ordersCtrl.get_vouchers)

router.post('/new', ordersCtrl.simpan_order)
router.get('/list', ordersCtrl.list_order)
router.get('/view/:id', ordersCtrl.get_view_order)
router.post('/edit', ordersCtrl.edit_order)
router.delete('/hapus/:id', ordersCtrl.hapus_order)

router.get('/pre-order', ordersCtrl.list_pre_order)
router.get('/pre-order/:id', ordersCtrl.get_view_preorder)
router.post('/pre-order', ordersCtrl.simpan_preorder)
router.post('/decline-preorder', ordersCtrl.decline_preorder)

router.post('/spk', ordersCtrl.simpan_spk)
router.post('/list-invoice', ordersCtrl.list_order_invoice)

router.post('/update-invoice', ordersCtrl.update_invoice)

router.post('/team', ordersCtrl.simpan_team)
router.delete('/team/:id', ordersCtrl.hapus_team)

router.post('/jadwal', ordersCtrl.show_jadwal)
router.post('/update-jadwal', ordersCtrl.update_jadwal)
router.post('/update-jadwal-new', ordersCtrl.update_jadwal_new)

router.get('/reset-jadwal', ordersCtrl.reset_jadwal_order)
router.post('/block-jadwal', ordersCtrl.block_jadwal)
router.post('/data-block-jadwal', ordersCtrl.get_blocked)

router.get('/draft-jadwal', ordersCtrl.get_draft_all)
router.get('/draft-jadwal/:id_order', ordersCtrl.get_draft_single)

router.post('/set-jadwal', ordersCtrl.set_jadwal_draft)

router.get('/teams', ordersCtrl.get_teams)

router.get('/create-jobdesk', ordersCtrl.create_jobdesk)
module.exports = router;