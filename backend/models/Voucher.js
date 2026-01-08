import mongoose from 'mongoose';


const voucherSchema = new mongoose.Schema({
  voucher_code: {
    type: String,
    required: true,
    index: true
  },
  discount_type: {
    type: String,
    required: true,
    enum: ['percentage', 'absolute']
  },
  amount: {
    type: Number,
    required: true,
  },
  expiration_date: {
    type: Date,
    required: true,
  },
  usage_limit: {
    type: Number,
    required: true,
    default: 0
  }, // 0 means unlimited
  is_active: {
    type: Boolean,
    required: true,
    default: true
  }
}, { 
  timestamps: true
});

const Voucher = mongoose.model('Voucher', voucherSchema);

export default Voucher;