const router = require('express').Router()

const slides = require('../controllers/slides')

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

router.get('/', slides.get_slides)
router.post('/simpan', uploadImages.single('file'), slides.simpan_slide)
router.post('/update', slides.update_slide)
router.post('/hapus', slides.hapus_slide)

module.exports = router