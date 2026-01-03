import mongoose from 'mongoose';


const voucherSchema = new mongoose.Schema({
  voucher_code: {
    type: String,
    required: true,
    unique: true
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
}, { 
  timestamps: true
});

voucherSchema.index({ voucher_code: 1 }, { unique: true });


const Voucher = mongoose.model('Voucher', voucherSchema);

export default Voucher;