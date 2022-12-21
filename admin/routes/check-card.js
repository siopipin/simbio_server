const express = require('express');
const router = express.Router();
const checkCardCtrl = require('../controllers/check-card')
const variables = require('../../variables')

const multer = require('multer')

var storageFileImage = multer.diskStorage({
    destination : (req, file, cb)=>{
        cb(null, variables.PATH + '/assets/images')
    },
    filename : (req, file, cb)=>{
        cb(null, Date.now() + file.originalname)
    }
})

var upload = multer({storage : storageFileImage})

router.get('/data', checkCardCtrl.get_data)
router.post('/create', upload.fields([
    {name : 'foto_oklusi', maxCount : 10},
    {name : 'foto_warna', maxCount : 10},
    {name : 'foto_profile', maxCount : 10}
]), checkCardCtrl.create_check)

router.delete('/hapus/:id', checkCardCtrl.hapus_)
router.get('/single-data/:id', checkCardCtrl.single_data)
router.post('/update', checkCardCtrl.update_check)
router.post('/upload-images', upload.array('images'), checkCardCtrl.upload_images)
router.delete('/hapus-image/:id', checkCardCtrl.hapus_images)
router.post('/set-lanjut', checkCardCtrl.set_lanjut)

router.get('/quality-control', checkCardCtrl.get_quality_control)
router.get('/quality-control/:id', checkCardCtrl.get_quality_control_single)
router.post('/quality-control', checkCardCtrl.simpan_qc)

module.exports = router