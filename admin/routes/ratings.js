const express = require('express');
const router = express.Router();
const ratingsCtrl = require('../controllers/ratings')

router.get('/all/:page/:urutkan', ratingsCtrl.all_ratings)

module.exports = router;