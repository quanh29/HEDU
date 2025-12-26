import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
    course_id: {
        type: String,
        required: true,
        ref: 'Course'
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true, 
  },
  items: {
    type: [itemSchema],
    default: []  
  }
}, { 
  timestamps: true
});


const Cart = mongoose.model('Cart', cartSchema);

export default Cart;