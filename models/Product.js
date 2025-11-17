// models/Product.js
const mongoose = require('mongoose');

const sizeVariantSchema = new mongoose.Schema({
  size: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 },
  sku: { type: String, unique: true, sparse: true },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true }, // e.g., "T-Shirts", "Sneakers"
  image: { type: String }, // Main image
  images: [{ type: String }], // Optional extra images
  variants: [sizeVariantSchema], // Required: at least one variant
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Indexes
productSchema.index({ category: 1, subCategory: 1 });
productSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Product', productSchema);