import mongoose from "mongoose";

const WalletSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    payment_methods: [{
        type: {
            type: String,
            enum: ['momo', 'bank_transfer'],
            required: true
        },
        phone_number: {
            type: String,
            required: false
        },
        account_name: {
            type: String,
            required: false
        },
        bank_name: {
            type: String,
            required: false
        },
        bank_code: {
            type: String,
            required: false
        },
        account_number: {
            type: String,
            required: false
        },
        is_default: {
            type: Boolean,
            default: false
        },
        created_at: {
            type: Date,
            default: Date.now
        }
    }]
},
{ timestamps: true });

const Wallet = mongoose.model("Wallet", WalletSchema);

export default Wallet;