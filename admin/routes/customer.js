const express = require('express');
const router = express.Router();
const customerCtrl = require('../controllers/customer')

router.get('/all', customerCtrl.get_customer)
router.get('/kota', customerCtrl.get_kota)
router.post('/tambah', customerCtrl.simpan_customer)
router.post('/update', customerCtrl.update_customer)

router.get('/single/:id', customerCtrl.get_customer_single)
router.delete('/:id', customerCtrl.hapus_customer)

router.post('/kode-reset', customerCtrl.create_kode_reset)

router.get('/summary-data/:id', customerCtrl.get_summary_data)
router.get('/pie-chart-product/:id', customerCtrl.get_pie_chart_product)
router.get('/chart-orders/:id', customerCtrl.get_chart_orders)
router.get('/history-poin/:id', customerCtrl.history_poin)

module.exports = router;