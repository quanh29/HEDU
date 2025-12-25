import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    orderId: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
        required: true
    },
    method: {
        type: String,
        required: false
    },
    amount: {
        type: Number,
        required: true
    },
    // MoMo specific fields
    momoTransactionId: {
        type: String,
        required: false
    },
    momoRequestId: {
        type: String,
        required: false
    },
    momoResultCode: {
        type: Number,
        required: false
    },
    momoMessage: {
        type: String,
        required: false
    }
}, { 
    timestamps: true // This will create createdAt and updatedAt automatically
});

// Index for efficient queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentStatus: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;