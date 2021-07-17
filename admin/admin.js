const express = require('express');
const router = express.Router();
const ordersRoutes = require('./routes/orders')
const pegawaiRoutes = require('./routes/pegawai')
const progressRoutes = require('./routes/progress')
const customerRoutes = require('./routes/customer')
const settingsRoutes = require('./routes/settings')
const authRoutes = require('./routes/auth')
const dashboardRoutes = require('./routes/dashboard')
const reportRoutes = require('./routes/reports')
const chatRoutes = require('./routes/chats')
const cashbackRoutes = require('./routes/cashback')
const slideRoutes = require('./routes/slides')

router.use('/orders', ordersRoutes)
router.use('/pegawai', pegawaiRoutes)
router.use('/progress', progressRoutes)
router.use('/customer', customerRoutes)
router.use('/settings', settingsRoutes)
router.use('/auth', authRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/reports', reportRoutes)
router.use('/chats', chatRoutes)
router.use('/cashback', cashbackRoutes)
router.use('/slides', slideRoutes)

module.exports = router;