
// routes/cart.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import controllers
const cartController = require('../controllers/cartController.js');

// Apply auth middleware to all routes
router.use(auth);

// Routes
router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.delete('/clear', cartController.clearCart);   // DELETE /api/cart/clear
router.patch('/:variantId', cartController.updateCartItem);
router.delete('/:variantId', cartController.removeFromCart);
router.post('/swap', cartController.swap)
router.delete('/', cartController.clearCart);

module.exports = router;
