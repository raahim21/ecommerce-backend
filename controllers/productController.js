



// controllers/productController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
let mongoose = require('mongoose')
/* -------------------------------------------------------------
   Helper – map the UI sort value → MongoDB sort object
   ------------------------------------------------------------- */
const sortMap = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'price-low': { 'variants.price': 1 },
  'price-high': { 'variants.price': -1 },
  name: { name: 1 },
};

/* -------------------------------------------------------------
   GET /api/products   (public)
   Query params (all optional):
     page, limit, search, category, subCategory,
     minPrice, maxPrice, sort
   ------------------------------------------------------------- */
exports.getProducts = async (req, res) => {
  try {
    // ----- 1. Pagination & basic params -----
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      subCategory = '',
      minPrice = 0,
      maxPrice = 500,
      sort = 'newest',               // default
    } = req.query;

    // let orders = await Order.find({}).populate('items.productId')
    // console.log(orders[0].items)

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const limitNum = parseInt(limit);

    // ----- 2. Build the filter object -----
    const filter = {};

    // Text search on product name
    if (search) filter.name = { $regex: search, $options: 'i' };

    // Exact match on category / subCategory
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;

    // Price filter – we need to match *any* variant in the array
    if (minPrice || maxPrice) {
      filter['variants.price'] = {};
      if (minPrice) filter['variants.price'].$gte = Number(minPrice);
      if (maxPrice) filter['variants.price'].$lte = Number(maxPrice);
    }

    // ----- 3. Determine sort order -----
    const sortObj = sortMap[sort] || sortMap.newest; // fallback

    // ----- 4. Execute the query -----
    const products = await Product.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .select('-__v')                 // hide Mongo version field
      .lean();                        // faster, plain JS objects

    // ----- 5. Total count for pagination -----
    const total = await Product.countDocuments(filter);

    // ----- 6. Response -----
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};


exports.byIds = async (req, res) =>{
    const { ids } = req.query;
    if (!ids) return res.status(400).json({ msg: 'IDs required' });
  

    // ids is assumed to be a string which are seperated by ",", .split(',') makes an array and then we filter and get only valid ids
    const idArray = ids.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));

    // send the products that includes the id in the ids array
    const products = await Product.find({ _id: { $in: idArray } });
    res.json({ products });
}
/* -------------------------------------------------------------
   GET /api/products/:id   (public)
   ------------------------------------------------------------- */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

/* -------------------------------------------------------------
   POST /api/products   (admin only)
   ------------------------------------------------------------- */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subCategory,
      image,
      images,
      variants, // [{ size, price, stock, sku? }]
    } = req.body;

    // ---- Basic validation ----
    if (
      !name ||
      !description ||
      !category ||
      !subCategory ||
      !variants ||
      !Array.isArray(variants) ||
      variants.length === 0
    ) {
      return res
        .status(400)
        .json({ msg: 'All fields + at least one variant required' });
    }

    // ---- Variant validation ----
    const cleanVariants = variants.map((v) => {
      if (!v.size || v.price == null || v.stock == null) {
        throw new Error('Each variant needs size, price, stock');
      }
      const price = Number(v.price);
      const stock = Number(v.stock);
      if (isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
        throw new Error('Invalid price/stock');
      }
      return {
        size: v.size.trim(),
        price,
        stock,
        sku: v.sku ? v.sku.trim() : undefined,
      };
    });

    const product = new Product({
      name: name.trim(),
      description,
      category,
      subCategory,
      image: image || '',
      images: images || [],
      variants: cleanVariants,
      createdBy: req.user.id, // from auth middleware
    });

    await product.save();
    res.status(201).json({ msg: 'Product created', product });
  } catch (err) {
    console.error('Create product error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'SKU must be unique' });
    }
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/* -------------------------------------------------------------
   PUT /api/products/:id   (admin only)
   ------------------------------------------------------------- */
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subCategory,
      image,
      images,
      variants,
    } = req.body;

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(description && { description }),
      ...(category && { category }),
      ...(subCategory && { subCategory }),
      ...(image !== undefined && { image: image || '' }),
      ...(images && { images }),
      ...(variants && { variants }),
    };

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ msg: 'Product not found' });

    res.json({ msg: 'Product updated', product });
  } catch (err) {
    console.error('Update product error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'SKU already exists' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
};

/* -------------------------------------------------------------
   DELETE /api/products/:id   (admin only)
   ------------------------------------------------------------- */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json({ msg: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};