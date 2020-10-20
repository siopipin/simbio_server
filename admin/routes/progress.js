const express = require('express');
const router = express.Router();
const progressCtrl = require('../controllers/progress')

router.get('/master-proses-order/:id', progressCtrl.get_master_proses_order)
router.get('/list', progressCtrl.list_order)
router.get('/detail/:id', progressCtrl.detail_progress)

module.exports = router;