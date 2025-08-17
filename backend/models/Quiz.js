import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String
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
                required: true
            }
        }
    ]

});

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
