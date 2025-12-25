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
    }
},
{ timestamps: true });

const Wallet = mongoose.model("Wallet", WalletSchema);

export default Wallet;