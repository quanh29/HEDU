import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Earning from '../models/Earning.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env từ thư mục backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Kết nối MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/HEDU`);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Hàm xử lý chuyển tiền từ earnings pending vào wallet
const clearPendingEarnings = async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log('🔄 Starting to clear pending earnings...');

        // Lấy tất cả earnings có status pending
        const pendingEarnings = await Earning.find({ status: 'pending' }).session(session);

        if (pendingEarnings.length === 0) {
            console.log('ℹ️ No pending earnings found');
            await session.commitTransaction();
            return;
        }

        console.log(`📊 Found ${pendingEarnings.length} pending earnings to process`);

        let successCount = 0;
        let errorCount = 0;

        // Xử lý từng earning
        for (const earning of pendingEarnings) {
            try {
                const instructorId = earning.instructor_id;
                const netAmount = earning.net_amount;

                // Tìm hoặc tạo wallet cho instructor
                let wallet = await Wallet.findOne({ user_id: instructorId }).session(session);
                
                if (!wallet) {
                    // Tạo wallet mới nếu chưa có
                    wallet = new Wallet({
                        user_id: instructorId,
                        balance: 0,
                        payment_methods: []
                    });
                }

                // Cập nhật balance
                const oldBalance = wallet.balance;
                const newBalance = oldBalance + netAmount;
                wallet.balance = newBalance;
                await wallet.save({ session });

                // Tạo transaction record
                const transaction = new Transaction({
                    wallet_id: wallet._id.toString(),
                    operation: 'credit',
                    amount: netAmount,
                    balance: newBalance,
                    description: `Earning from course ${earning.course_id} - Order ${earning.order_id}`
                });
                await transaction.save({ session });

                // Cập nhật earning status
                earning.status = 'cleared';
                earning.clearance_date = new Date();
                await earning.save({ session });

                successCount++;
                console.log(`✅ Processed earning ${earning._id} - Instructor: ${instructorId} - Amount: ${netAmount}`);

            } catch (error) {
                errorCount++;
                console.error(`❌ Error processing earning ${earning._id}:`, error.message);
                // Continue với earning tiếp theo
            }
        }

        // Commit transaction
        await session.commitTransaction();
        
        console.log('\n📈 Summary:');
        console.log(`   ✅ Successfully processed: ${successCount}`);
        console.log(`   ❌ Failed: ${errorCount}`);
        console.log(`   📊 Total: ${pendingEarnings.length}`);

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Transaction failed:', error);
        throw error;
    } finally {
        session.endSession();
    }
};

// Main function
const main = async () => {
    try {
        await connectDB();
        await clearPendingEarnings();
        console.log('\n✅ Cronjob completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Cronjob failed:', error);
        process.exit(1);
    }
};

// Chạy script
main();
