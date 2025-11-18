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

router.get('/admin/orders', orderController.getAllOrdersAdmin);
router.patch('/admin/orders/:id'  , orderController.updateOrderAdmin);


module.exports = router;



// // routes/order.js
// import express from 'express';
// import auth from '../middleware/auth.js';
// // import adminAuth from '../middleware/adminAuth.js'; // if you have one
// import {
//   createOrder,
//   getOrders,
//   getOrder,
//   getAllOrdersAdmin,
//   updateOrderAdmin
// } from '../controllers/orderController.js';

// const router = express.Router();

// // Protected routes (user)
// router.use(auth);

// router.post('/create-order', createOrder);
// router.get('/', getOrders);
// router.get('/:id', getOrder);

// // Admin routes
// router.get('/admin/orders', getAllOrdersAdmin);
// router.patch('/admin/orders/:id', updateOrderAdmin);

// export default router;