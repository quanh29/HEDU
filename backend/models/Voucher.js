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
  }
}, { 
  timestamps: true,
  _id: false
});

voucherSchema.index({ voucher_code: 1 }, { unique: true });


const Voucher = mongoose.model('Voucher', voucherSchema);

export default Voucher;