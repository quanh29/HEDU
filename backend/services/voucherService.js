import pool from '../config/mysql.js';

export const getVoucherByCode = async (voucherCode) => {
  const [rows] = await pool.query(
    `SELECT voucher_code, voucher_type, amount, expire_at, created_at
     FROM Vouchers
     WHERE voucher_code = ?`,
    [voucherCode]
  );

  return rows.length ? rows[0] : null;
};

export const getActiveVouchers = async () => {
  const [vouchers] = await pool.query(
    `SELECT voucher_code, voucher_type, amount, expire_at, created_at
     FROM Vouchers
     WHERE expire_at IS NULL OR expire_at > NOW()
     ORDER BY created_at DESC`
  );

  return vouchers;
};
