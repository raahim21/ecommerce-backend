import Product from "../models/Product.js";
import mongoose from "mongoose";
import Order from '../models/Order.js'
import User from '../models/User.js'

async function deductStock(order) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of order.items) {
      const result = await Product.updateOne(
        { _id: item.productId, "variants._id": item.variantId, "variants.stock": { $gte: item.quantity } },
        { $inc: { "variants.$.stock": -item.quantity } },
        { session } // include session to make it transactional
      );

      if (result.modifiedCount === 0) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    // If everything succeeds, commit the transaction
    await session.commitTransaction();
  } catch (err) {
    // Rollback all changes if any error occurs
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}








export const getOrders = async(req, res) => {
  let orders = await Order.find({user:req.user.id}).populate('items.variantId')
  return res.status(200).json({orders})
}



// controllers/orderController.js (add these)

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.productId', 'name image')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderAdmin = async (req, res) => {
  const { status, paymentStatus } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.json({ message: 'Order updated', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createOrder = async (req, res) => {
  const {
    paymentIntentId,        // only for card (optional for cash)
    paymentMethod,          // "card" or "cash"
    shippingAddress,        // required
  } = req.body;

  try {
    // 1. Validate required fields
    if (!paymentMethod || !["card", "cash"].includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    if (!shippingAddress || shippingAddress.trim().length < 10) {
      return res.status(400).json({ error: "Valid shipping address is required" });
    }

    // 2. Get user with populated cart
    const user = await User.findById(req.user.id).populate("cart.productId");
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Your cart is empty" });
    }

    // 3. Build order items with variant validation
    const items = user.cart.map((cartItem) => {
      const product = cartItem.productId;
      if (!product) throw new Error(`Product not found for cart item`);

      const variant = product.variants.id(cartItem.variantId);
      if (!variant) throw new Error(`Variant not found: ${cartItem.variantId}`);

      return {
        productId: product._id,
        variantId: variant._id,
        quantity: cartItem.quantity,
        price: variant.price, // price at time of order
      };
    });

    // 4. Calculate total in cents
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (totalAmount <= 0) {
      return res.status(400).json({ error: "Invalid order total" });
    }

    // 5. Determine payment status
    let paymentStatus = "pending";
    if (paymentMethod === "card") {
      if (!paymentIntentId) {
        return res.status(400).json({ error: "paymentIntentId is required for card payments" });
      }
      paymentStatus = "succeeded"; // Stripe already confirmed
    } else {
      paymentStatus = "pending"; // COD
    }

    // 6. Create order
    const order = await Order.create({
      user: user._id,
      items,
      totalAmount, // in cents
      currency: "usd",
      paymentIntentId: paymentIntentId || null,
      paymentMethod,
      shippingAddress: shippingAddress.trim(),
      paymentStatus,
      status: "processing",
    });

    
    await deductStock(order)
    
    // 7. Clear user's cart

    user.cart = [];
    await user.save();

    // 8. Success response
    res.json({
      success: true,
      order,
      message:
        paymentMethod === "cash"
          ? "Order placed! Pay on delivery."
          : "Payment successful! Order confirmed.",
    });
  } catch (err) {
    console.error("Create Order Error:", err.message);
    res.status(500).json({ error: "Failed to create order", details: err.message });
  }
};


export const getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
      .populate('items.productId')
      .lean();

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Map items and add size
    order.items = order.items.map(item => {
      const product = item.productId;
      const variant = product?.variants?.find(
        v => v._id.toString() === item.variantId.toString()
      );

      return {
        ...item,
        size: variant ? variant.size : null
      };
    });
    res.json(order);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred" });
  }
};
