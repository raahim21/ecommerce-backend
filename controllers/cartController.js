import Product from '../models/Product.js';
import User from '../models/User.js';

// Helper: Populate + format cart with product details
const getFullCart = async (userId) => {
  const user = await User.findById(userId).populate({
    path: 'cart.productId',
    select: 'name image subCategory variants',
  });
  if (!user) return [];

  return user.cart.map((item) => {
    // Gracefully handle if a product was deleted but still in cart
    if (!item.productId) return null;

    const product = item.productId;
    const variant = product.variants.id(item.variantId);

    // Gracefully handle if a variant was deleted but still in cart
    if (!variant) return null;

    return {
      productId: product._id,
      variantId: item.variantId,
      name: product.name,
      image: product.image,
      subCategory: product.subCategory,
      size: variant.size,
      price: variant.price,
      quantity: item.quantity,
    };
  }).filter(Boolean); // Filter out any null items
};

// GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await getFullCart(req.user.id);
    res.json({ cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// POST /api/cart
export const addToCart = async (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ msg: 'Product not found' });

    const variant = product.variants.id(variantId);
    if (!variant) return res.status(404).json({ msg: 'Variant not found' });
    if (variant.stock < quantity) return res.status(400).json({ msg: 'Not enough stock' });

    const user = await User.findById(req.user.id);

    const existing = user.cart.find(
      (c) =>
        c.productId.toString() === productId && c.variantId.toString() === variantId
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      user.cart.push({ productId, variantId, quantity });
    }

    await user.save();

    const cart = await getFullCart(req.user.id);
    res.json({ cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// PATCH /api/cart/:variantId
export const updateCartItem = async (req, res) => {
  const { variantId } = req.params;
  const { quantity } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // try to find variant index
    const itemIndex = user.cart.findIndex(
      (c) => c.variantId.toString() === variantId
    );

    // check if variant exists or not
    if (itemIndex === -1) {
      return res.status(404).json({ msg: 'Item not in cart' });
    }

    if (quantity <= 0) {
      user.cart.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(user.cart[itemIndex].productId);
      const variant = product.variants.id(variantId);
      if (!variant || variant.stock < quantity) {
        
        return res.status(400).json({ msg: 'Not enough stock' });
      }
      user.cart[itemIndex].quantity = quantity;
    }

    await user.save();

    const cart = await getFullCart(req.user.id);
    res.json({ cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// DELETE /api/cart/:variantId
export const removeFromCart = async (req, res) => {
  const { variantId } = req.params;

  try {
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter((c) => c.variantId.toString() !== variantId);
    await user.save();

    const cart = await getFullCart(req.user.id);
    res.json({ cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Middleware: must have req.user.id available (from session/JWT)
export const swap = async (req, res) => {
  try {
    const userId = req.user.id; // assumes user is authenticated
    const { oldVariantId, newVariantId, quantity, productId } = req.body;

    if (!oldVariantId || !newVariantId || !productId)
      return res.status(400).json({ message: 'Missing fields' });

    // Fetch the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if old variant exists in their cart
    const oldItemIndex = user.cart.findIndex(
      item => item.variantId.toString() === oldVariantId
    );
    if (oldItemIndex === -1)
      return res.status(404).json({ message: 'Old variant not found in cart' });

    // Remove old variant
    user.cart.splice(oldItemIndex, 1);

    // Add new variant (or update quantity if already exists)
    const existingIndex = user.cart.findIndex(
      item => item.variantId.toString() === newVariantId
    );
    if (existingIndex !== -1) {
      user.cart[existingIndex].quantity += quantity;
    } else {
      user.cart.push({ productId, variantId: newVariantId, quantity });
    }

    await user.save();
    
    // FIX: Use the getFullCart helper to ensure the response shape is consistent
    const cart = await getFullCart(userId);
    res.json({ cart });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Swap failed', error: err.message });
  }
};

// DELETE /api/cart (clear all)
// controllers/cartController.js
export const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.cart = [];                 // <-- one write
    await user.save();              // <-- one version bump
    const cart = await getFullCart(req.user.id);
    res.json({ cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};