const express = require('express');
const router = express.Router();
const customerCtrl = require('../controllers/customer')

router.get('/all', customerCtrl.get_customer)
router.get('/kota', customerCtrl.get_kota)
router.post('/tambah', customerCtrl.simpan_customer)
router.post('/update', customerCtrl.update_customer)

router.post('/kode-reset', customerCtrl.create_kode_reset)

router.get('/single/:id', customerCtrl.get_customer_single)
router.delete('/:id', customerCtrl.hapus_customer)
module.exports = router;