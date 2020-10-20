const express = require('express');
const router = express.Router();
const settingsCtrl = require('../controllers/settings')

router.get('/products', settingsCtrl.get_products)
router.get('/bahan', settingsCtrl.get_bahan)
router.post('/bahan', settingsCtrl.simpan_bahan)
router.delete('/bahan/:id', settingsCtrl.hapus_bahan)

router.post('/product', settingsCtrl.simpan_product)
router.delete('/product/:id', settingsCtrl.hapus_product)
router.get('/product/:id', settingsCtrl.get_product_single)
router.get('/products/aktivitas/:id', settingsCtrl.get_product_aktivitas)
router.post('/product/aktivitas', settingsCtrl.simpan_product_aktivitas)
router.put('/product/aktivitas/:id', settingsCtrl.update_product_aktivitas)
router.delete('/products/aktivitas/:id', settingsCtrl.hapus_product_aktivitas)
router.get('/vouchers', settingsCtrl.get_list_voucher)
router.post('/voucher', settingsCtrl.simpan_voucher)
router.delete('/voucher/:id', settingsCtrl.hapus_voucher)

router.get('/bahan-estimasi', settingsCtrl.get_bahan_estimasi)
router.put('/bahan-estimasi/:id', settingsCtrl.update_bahan_estimasi)
router.delete('/bahan-estimasi/:id', settingsCtrl.hapus_bahan_estimasi)
router.post('/bahan-estimasi', settingsCtrl.simpan_bahan_estimasi)

router.get('/hari-libur', settingsCtrl.get_hari_libur)
router.delete('/hari-libur/:id', settingsCtrl.hapus_hari_libur)
router.post('/hari-libur', settingsCtrl.simpan_hari_libur)

module.exports = router;