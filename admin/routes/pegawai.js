const express = require('express');
const router = express.Router();
const pegawaiCtrl = require('../controllers/pegawai')
const multer = require('multer')
const variables = require('../../variables')

var storageFileImage = multer.diskStorage({
    destination : (req, file, cb)=>{
        cb(null, variables.PATH + '/assets/images')
    },
    filename : (req, file, cb)=>{
        cb(null, Date.now() + file.originalname)
    }
})

var uploadImages= multer({storage : storageFileImage})

router.get('/all', pegawaiCtrl.get_pegawai)

router.post('/tambah', uploadImages.single('foto'), pegawaiCtrl.tambah_pegawai)
router.delete('/:id', pegawaiCtrl.hapus_pegawai)
router.get('/single/:id', pegawaiCtrl.get_pegawai_single)
router.post('/edit', uploadImages.single('foto'), pegawaiCtrl.edit_pegawai)

router.get('/per-privilege/:privilege', pegawaiCtrl.get_pegawai_per_privilege)
router.post('/total-orders', pegawaiCtrl.total_handle)
router.post('/order-bulanan', pegawaiCtrl.get_orders_bulanan)
router.get('/ratings/:id', pegawaiCtrl.get_ratings)

module.exports = router;