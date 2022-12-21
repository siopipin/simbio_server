const express = require('express');
const router = express.Router();
const inventoryCtrl = require('../controllers/inventory')

router.get('/data-barang', inventoryCtrl.data_barang)
router.post('/barang-baru', inventoryCtrl.barang_baru)
router.delete('/hapus-barang/:id', inventoryCtrl.hapus_barang)
router.post('/update-barang', inventoryCtrl.update_barang)
router.post('/history-barang', inventoryCtrl.history_barang)

router.post('/barang-masuk', inventoryCtrl.simpan_barang_masuk)
router.get('/barang-masuk-top10', inventoryCtrl.history_barang_masuk)
router.post('/hapus-barang-masuk', inventoryCtrl.hapus_barang_masuk)

router.post('/barang-keluar', inventoryCtrl.simpan_barang_keluar)
router.get('/barang-keluar-top10', inventoryCtrl.history_barang_keluar)
router.post('/hapus-barang-keluar', inventoryCtrl.hapus_barang_keluar)

router.post('/report-pembelian', inventoryCtrl.report_pembelian)

router.get('/kategori', inventoryCtrl.get_kategori_barang)
router.post('/kategori', inventoryCtrl.simpan_kategori)
router.delete('/kategori/:id', inventoryCtrl.hapus_kategori)

module.exports = router