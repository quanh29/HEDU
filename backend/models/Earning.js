import mongoose from "mongoose";

const EarningSchema = new mongoose.Schema({
    instructor_id: {
        type: String,
        required: true
    },
    course_id: {
        type: String,
        required: true
    },
    order_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    net_amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'cleared', 'refunded'],
        required: true
    },
    clearance_date:{
        type: Date,
        required: true
    }
},
{ timestamps: true });

const Earning = mongoose.model("Earning", EarningSchema);

export default Earning;