import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
    },
    section: {
        type: String,
        ref: 'Section',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    questions: [
        {
            questionText: {
                type: String,
                required: true
            },
            options: [],
            correctAnswers: [],
            explanation: {
                type: String,
                required: false  // Không bắt buộc, có thể thêm sau
            }
        }
    ],
    order: {
        type: Number,
        default: 1,
    },

});

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
