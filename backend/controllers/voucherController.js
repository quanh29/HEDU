import * as voucherService from '../services/voucherService.js';
import Voucher from '../models/Voucher.js';
import Order from '../models/Order.js';

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
    if (voucher.expiration_date && new Date(voucher.expiration_date) < new Date()) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Mã giảm giá đã hết hạn' 
      });
    }

    // Check status
    if (!voucher.is_active) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Mã giảm giá không còn hoạt động' 
      });
    }

    // Check usage limit
    if (voucher.usage_limit > 0) {
      const usageCount = await Order.countDocuments({
        voucherCode: voucher.voucher_code,
        orderStatus: 'success'
      });
      if (usageCount >= voucher.usage_limit) {
        return res.status(400).json({ 
          valid: false, 
          message: 'Mã giảm giá đã đạt giới hạn sử dụng' 
        });
      }
    }

    res.json({
      valid: true,
      voucher: {
        code: voucher.voucher_code,
        type: voucher.discount_type,
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

/**
 * ADMIN FUNCTIONS
 */

/**
 * Get all vouchers with usage statistics (Admin)
 * GET /api/admin/vouchers
 */
export const getAllVouchers = async (req, res) => {
  try {
    const { search, status } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.voucher_code = { $regex: search, $options: 'i' };
    }
    if (status === 'active') {
      filter.is_active = true;
    } else if (status === 'inactive') {
      filter.is_active = false;
    }

    // Get vouchers
    const vouchers = await Voucher.find(filter).sort({ createdAt: -1 });

    // Get usage count for each voucher
    const vouchersWithUsage = await Promise.all(
      vouchers.map(async (voucher) => {
        const usageCount = await Order.countDocuments({
          voucherCode: voucher.voucher_code,
          orderStatus: 'success'
        });

        return {
          ...voucher.toObject(),
          usage_count: usageCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: vouchersWithUsage
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vouchers',
      error: error.message
    });
  }
};

/**
 * Get voucher statistics (Admin)
 * GET /api/admin/vouchers/statistics
 */
export const getVoucherStatistics = async (req, res) => {
  try {
    const totalVouchers = await Voucher.countDocuments();
    const activeVouchers = await Voucher.countDocuments({ is_active: true });
    const expiredVouchers = await Voucher.countDocuments({
      expiration_date: { $lt: new Date() }
    });

    // Get total usage count
    const allVouchers = await Voucher.find({}, { voucher_code: 1 });
    const voucherCodes = allVouchers.map(v => v.voucher_code);
    const totalUsage = await Order.countDocuments({
      voucherCode: { $in: voucherCodes },
      orderStatus: 'success'
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalVouchers,
        active: activeVouchers,
        expired: expiredVouchers,
        totalUsage: totalUsage
      }
    });
  } catch (error) {
    console.error('Error fetching voucher statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Create new voucher (Admin)
 * POST /api/admin/vouchers
 */
export const createVoucher = async (req, res) => {
  try {
    const { voucher_code, discount_type, amount, expiration_date, usage_limit, is_active } = req.body;

    // Validate required fields
    if (!voucher_code || !discount_type || !amount || !expiration_date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if voucher code already exists
    const existingVoucher = await Voucher.findOne({ voucher_code: voucher_code.toUpperCase() });
    if (existingVoucher) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code already exists'
      });
    }

    // Validate discount type
    if (!['percentage', 'absolute'].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount type'
      });
    }

    // Validate amount
    if (discount_type === 'percentage' && (amount <= 0 || amount > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 1 and 100'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Create voucher
    const voucher = new Voucher({
      voucher_code: voucher_code.toUpperCase(),
      discount_type,
      amount,
      expiration_date,
      usage_limit: usage_limit || 0,
      is_active: is_active !== undefined ? is_active : true
    });

    await voucher.save();

    res.status(201).json({
      success: true,
      message: 'Voucher created successfully',
      data: voucher
    });
  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create voucher',
      error: error.message
    });
  }
};

/**
 * Update voucher (Admin)
 * PUT /api/admin/vouchers/:voucherId
 */
export const updateVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const { voucher_code, discount_type, amount, expiration_date, usage_limit, is_active } = req.body;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check if new voucher code already exists (if changing code)
    if (voucher_code && voucher_code.toUpperCase() !== voucher.voucher_code) {
      const existingVoucher = await Voucher.findOne({ voucher_code: voucher_code.toUpperCase() });
      if (existingVoucher) {
        return res.status(400).json({
          success: false,
          message: 'Voucher code already exists'
        });
      }
      voucher.voucher_code = voucher_code.toUpperCase();
    }

    // Validate and update discount type
    if (discount_type && !['percentage', 'absolute'].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount type'
      });
    }
    if (discount_type) voucher.discount_type = discount_type;

    // Validate and update amount
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }
      if ((discount_type || voucher.discount_type) === 'percentage' && (amount <= 0 || amount > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Percentage discount must be between 1 and 100'
        });
      }
      voucher.amount = amount;
    }

    if (expiration_date) voucher.expiration_date = expiration_date;
    if (usage_limit !== undefined) voucher.usage_limit = usage_limit;
    if (is_active !== undefined) voucher.is_active = is_active;

    await voucher.save();

    res.status(200).json({
      success: true,
      message: 'Voucher updated successfully',
      data: voucher
    });
  } catch (error) {
    console.error('Error updating voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update voucher',
      error: error.message
    });
  }
};

/**
 * Toggle voucher status (Admin)
 * PATCH /api/admin/vouchers/:voucherId/status
 */
export const toggleVoucherStatus = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const { is_active } = req.body;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    voucher.is_active = is_active;
    await voucher.save();

    res.status(200).json({
      success: true,
      message: `Voucher ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: voucher
    });
  } catch (error) {
    console.error('Error toggling voucher status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle voucher status',
      error: error.message
    });
  }
};

/**
 * Delete voucher (Admin)
 * DELETE /api/admin/vouchers/:voucherId
 */
export const deleteVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check if voucher has been used
    const usageCount = await Order.countDocuments({
      voucherCode: voucher.voucher_code
    });

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete voucher that has been used. Please deactivate it instead.'
      });
    }

    await Voucher.findByIdAndDelete(voucherId);

    res.status(200).json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete voucher',
      error: error.message
    });
  }
};
