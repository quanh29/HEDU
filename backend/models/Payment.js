import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    ref: "User", 
    required: true 
  },
  course:{
    type: String, 
    ref: "Course", 
    required: true
  },
  discountCode: {
    type: Array, 
    default: null
  },
  amount: { 
    type: Number, 
    required: true 
  },
  finallyPaid: {
    type: Number, 
    required: true 
  },
  isPaid:{
    type: Boolean, 
    default: false
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;