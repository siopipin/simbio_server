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

router.post('/spk', ordersCtrl.simpan_spk)
router.post('/list-invoice', ordersCtrl.list_order_invoice)

router.post('/update-invoice', ordersCtrl.update_invoice)

router.post('/team', ordersCtrl.simpan_team)
router.delete('/team/:id', ordersCtrl.hapus_team)

router.post('/jadwal', ordersCtrl.show_jadwal)


router.get('/reset-jadwal', ordersCtrl.reset_jadwal_order)

module.exports = router;