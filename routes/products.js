// routes/products.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  byIds,
} = require('../controllers/productController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');  // Your admin middleware


// Public: Get all products (with search/pagination)
router.get('/byIds', byIds)
router.get('/',getProducts);
router.get('/:id', getProductById);

// Protected: Admin only

router.post('/', auth, admin, createProduct);
router.put('/:id', auth, admin, updateProduct);
router.delete('/:id', auth, admin, deleteProduct);

module.exports = router;





