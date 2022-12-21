const express = require('express');
const router = express.Router();
const jobdeskCtrl = require('../controllers/jobdesk')
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

var uploadImages= multer({storage : storageFileImage})

router.get('/data', jobdeskCtrl.get_jobdesk)
router.post('/update', jobdeskCtrl.update_jobdesk)
router.post('/keterangan', jobdeskCtrl.update_keterangan)
router.post('/hapus', jobdeskCtrl.hapus_)
router.post('/progress', jobdeskCtrl.progress)

router.get('/need-evaluasi', jobdeskCtrl.get_evaluasi)

router.post('/review', uploadImages.array('images'), jobdeskCtrl.review)
router.get('/summary-rating', jobdeskCtrl.summary_rating)

router.post('/hapus-jadwal', jobdeskCtrl.hapus_jadwal)

router.post('/hapus-draft-jadwal', jobdeskCtrl.hapus_draft_jadwal)

module.exports = router