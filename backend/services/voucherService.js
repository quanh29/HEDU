import Voucher from '../models/Voucher.js';

export const getVoucherByCode = async (voucherCode) => {
  const voucher = await Voucher.findOne({ voucher_code: voucherCode }).lean();
  return voucher;
};

export const getActiveVouchers = async () => {
  const vouchers = await Voucher.find({
    $or: [
      { expire_at: { $exists: false } },
      { expire_at: null },
      { expire_at: { $gt: new Date() } }
    ]
  })
  .sort({ createdAt: -1 })
  .lean();

  return vouchers;
};
