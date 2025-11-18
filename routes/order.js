// routes/cart.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import controllers
const orderController = require('../controllers/orderController');

// Apply auth middleware to all routes
router.use(auth);

// Routes

router.post('/create-order', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);

router.get('/admin/orders', orderController.getAllOrders);
router.patch('/admin/orders/:id'  , orderController.updateOrderAdmin);


module.exports = router;
