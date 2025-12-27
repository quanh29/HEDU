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
    }
},
{ timestamps: true });

const Transaction = mongoose.model("Transaction", TransactionSchema);

export default Transaction;