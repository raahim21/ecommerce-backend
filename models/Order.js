// models/Order.js
const mongoose = require("mongoose");
let mongoosePaginate = require('mongoose-paginate-v2')




const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true }, // snapshot of the variant price at time of order
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["card", "cash"],
      required: true,
    },
    

    items: [orderItemSchema],
    totalAmount: { type: Number, required: true }, // in cents
    currency: { type: String, default: "usd" },
    paymentIntentId: { type: String }, // Stripe PaymentIntent id
    paymentStatus: { type: String, enum: ["pending", "succeeded", "failed"], default: "pending" },
    shippingAddress: { type: String }, // optional
    status: { type: String, enum: ["processing", "shipped", "delivered", "cancelled"], default: "processing" },
    isDeleted: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

orderSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Order", orderSchema);
