import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import Earning from '../models/Earning.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

// Chạy cronjob: npm run cronjob:earnings

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

        // Group earnings theo instructor_id
        const earningsByInstructor = {};
        pendingEarnings.forEach(earning => {
            const instructorId = earning.instructor_id;
            if (!earningsByInstructor[instructorId]) {
                earningsByInstructor[instructorId] = [];
            }
            earningsByInstructor[instructorId].push(earning);
        });

        console.log(`👥 Found ${Object.keys(earningsByInstructor).length} instructors with pending earnings`);

        let successCount = 0;
        let errorCount = 0;
        let processedEarnings = 0;

        // Xử lý từng instructor
        for (const [instructorId, earnings] of Object.entries(earningsByInstructor)) {
            try {
                // Tính tổng net_amount cho instructor này
                const totalAmount = earnings.reduce((sum, earning) => sum + earning.net_amount, 0);
                
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
                const newBalance = oldBalance + totalAmount;
                wallet.balance = newBalance;
                await wallet.save({ session });

                // Tạo MỘT transaction duy nhất cho tất cả earnings của instructor
                const earningIds = earnings.map(e => e._id).join(', ');
                const transaction = new Transaction({
                    wallet_id: wallet._id.toString(),
                    operation: 'credit',
                    amount: totalAmount,
                    balance: newBalance,
                    description: `Cleared ${earnings.length} earnings - Total: ${totalAmount.toFixed(2)} VND`
                });
                await transaction.save({ session });

                // Cập nhật tất cả earnings của instructor này
                for (const earning of earnings) {
                    earning.status = 'cleared';
                    earning.clearance_date = new Date();
                    await earning.save({ session });
                    processedEarnings++;
                }

                successCount++;
                console.log(`✅ Processed instructor ${instructorId}:`);
                console.log(`   - Earnings count: ${earnings.length}`);
                console.log(`   - Total amount: ${totalAmount.toFixed(2)} VND`);
                console.log(`   - New balance: ${newBalance.toFixed(2)} VND`);

            } catch (error) {
                errorCount++;
                console.error(`❌ Error processing instructor ${instructorId}:`, error.message);
                // Continue với instructor tiếp theo
            }
        }

        // Commit transaction
        await session.commitTransaction();
        
        console.log('\n📈 Summary:');
        console.log(`   ✅ Successfully processed instructors: ${successCount}`);
        console.log(`   ❌ Failed instructors: ${errorCount}`);
        console.log(`   📊 Total earnings cleared: ${processedEarnings}`);
        console.log(`   💰 Total transactions created: ${successCount}`);

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
        
        // Chạy ngay lần đầu
        console.log('🚀 Running initial clearance...');
        await clearPendingEarnings();
        console.log('\n✅ Initial clearance completed\n');

        // Setup cronjob chạy lúc 0h mỗi ngày (00:00:00)
        // Cron format: second minute hour day month weekday
        // '0 0 0 * * *' = 0 giây, 0 phút, 0 giờ, mỗi ngày
        cron.schedule('0 0 0 * * *', async () => {
            console.log(`\n⏰ [${new Date().toISOString()}] Cronjob triggered - Clearing pending earnings...`);
            try {
                await clearPendingEarnings();
                console.log('✅ Cronjob completed successfully\n');
            } catch (error) {
                console.error('❌ Cronjob failed:', error);
            }
        }, {
            timezone: "Asia/Ho_Chi_Minh" // Timezone Việt Nam
        });

        console.log('⏰ Cronjob scheduled: Runs daily at 00:00:00 (Asia/Ho_Chi_Minh timezone)');
        console.log('🔄 Service is running... Press Ctrl+C to stop\n');

    } catch (error) {
        console.error('\n❌ Service failed to start:', error);
        process.exit(1);
    }
};

// Chạy script
main();
