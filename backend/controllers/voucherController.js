import pool from '../config/mysql.js';

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
    const [voucherResult] = await pool.query(
      `SELECT voucher_code, voucher_type, amount, expire_at, created_at
       FROM Vouchers
       WHERE voucher_code = ?`,
      [voucherCode]
    );

    if (voucherResult.length === 0) {
      return res.status(404).json({ 
        valid: false, 
        message: 'Mã giảm giá không hợp lệ' 
      });
    }

    const voucher = voucherResult[0];

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
    const [vouchers] = await pool.query(
      `SELECT voucher_code, voucher_type, amount, expire_at, created_at
       FROM Vouchers
       WHERE expire_at IS NULL OR expire_at > NOW()
       ORDER BY created_at DESC`
    );

    res.json({ vouchers });

  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách mã giảm giá' });
  }
};
