import * as voucherService from '../services/voucherService.js';

/**
 * Validate voucher code
 * @route POST /api/voucher/validate
 */
export const validateVoucher = async (req, res) => {
  const { voucherCode } = req.body;

  if (!voucherCode) {
    return res.status(400).json({ 
      valid: false, 
      message: 'Vui lòng nhập mã giảm giá' 
    });
  }

  try {
    const voucher = await voucherService.getVoucherByCode(voucherCode);

    if (!voucher) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Mã giảm giá không hợp lệ' 
      });
    }

    // Check expiration
    if (voucher.expire_at && new Date(voucher.expire_at) < new Date()) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Mã giảm giá đã hết hạn' 
      });
    }

    res.json({
      valid: true,
      voucher: {
        code: voucher.voucher_code,
        type: voucher.voucher_type,
        amount: voucher.amount,
        expireAt: voucher.expire_at
      }
    });

  } catch (error) {
    console.error('Error validating voucher:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Lỗi khi kiểm tra mã giảm giá' 
    });
  }
};

/**
 * Get all active vouchers
 * @route GET /api/voucher/list
 */
export const getActiveVouchers = async (req, res) => {
  try {
    const vouchers = await voucherService.getActiveVouchers();

    res.json({ vouchers });

  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách mã giảm giá' });
  }
};
