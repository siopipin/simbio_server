const express = require('express');
const router = express.Router();
const dashboardCtrl = require('../controllers/dashboard')

router.get('/pie-chart-product', dashboardCtrl.get_pie_chart_product)
router.get('/radar-chart', dashboardCtrl.get_chart_radar)
router.get('/stack-chart', dashboardCtrl.get_chart_stack)
router.get('/invoice-chart', dashboardCtrl.get_chart_invoice)

module.exports = router;