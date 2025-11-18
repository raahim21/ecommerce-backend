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
  let orders = await Order.find({user:req.user.id, isDeleted:false}).populate('items.variantId')
  return res.status(200).json({orders})
}



// controllers/orderController.js
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      paymentMethod,
      paymentStatus,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build match stage
    const match = { };

    if (status) match.status = status;
    if (paymentMethod) match.paymentMethod = paymentMethod;
    if (paymentStatus) match.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: match },

      // Lookup user
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },

      // Lookup product names/images
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },

      // Add user name/email to root
      {
        $addFields: {
          'user.name': { $ifNull: ['$userInfo.name', 'Guest'] },
          'user.email': { $ifNull: ['$userInfo.email', 'N/A'] },
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    productId: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$productDetails',
                            cond: { $eq: ['$$this._id', '$$item.productId'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },

      // Search filter (after user fields are added)
      ...(search?.trim()
        ? [{
            $match: {
              $or: [
                { _id: { $regex: new RegExp(search.trim(), 'i') } },
                { 'user.name': { $regex: new RegExp(search.trim(), 'i') } },
                { 'user.email': { $regex: new RegExp(search.trim(), 'i') } },
              ]
            }
          }]
        : []),

      // Sort
      { $sort: { createdAt: -1 } },

      // Facet for pagination
      {
        $facet: {
          orders: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: 'total' }]
        }
      }
    ];

    const result = await Order.aggregate(pipeline);

    const orders = result[0].orders || [];
    const total = result[0].totalCount[0]?.total || 0;
    const pages = Math.ceil(total / limit);

    res.json({
      orders,
      pagination: {
        total,
        pages,
        page: parseInt(page),
        limit: parseInt(limit),
        hasNext: parseInt(page) < pages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (err) {
    console.error('getAllOrdersAdmin error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};










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



// controllers/orderController.js or wherever updateOrderAdmin is
export const updateOrderAdmin = async (req, res) => {
  const { status, paymentStatus } = req.body;
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.isDeleted) return res.status(410).json({ message: 'Order already deleted' });

    // Detect if status is changing TO "cancelled"
    const isCancelling = status === 'cancelled' && order.status !== 'cancelled';

    if (isCancelling) {
      // Restore stock for each item
      for (const item of order.items) {
        const product = item.productId;
        if (!product) continue;

        const variant = product.variants.id(item.variantId);
        if (variant) {
          variant.stock += item.quantity;
          await product.save();
        }
      }

      // Soft delete the order
      order.isDeleted = true;
      order.deletedAt = new Date();
      order.status = 'cancelled'; // still set status
    }

    // Apply regular updates
    if (status && !isCancelling) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    // Return updated order (with populated data if needed)
    const updatedOrder = await Order.findById(orderId).populate({
      path: 'items.productId',
      select: 'name image variants'
    });

    res.json({ 
      message: isCancelling ? 'Order cancelled and stock restored' : 'Order updated', 
      order: updatedOrder 
    });

  } catch (err) {
    console.error('Error updating order:', err);
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
