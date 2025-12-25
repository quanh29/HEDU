import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    wallet_id: {
        type: String,
        required: true
    },
    operation: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // For disbursement tracking
    disbursement_status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: null
    },
    disbursement_order_id: {
        type: String,
        default: null
    },
    disbursement_trans_id: {
        type: String,
        default: null
    },
    disbursement_error: {
        type: String,
        default: null
    }
},
{ timestamps: true });

const Transaction = mongoose.model("Transaction", TransactionSchema);

export default Transaction;