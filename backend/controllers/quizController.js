import Quiz from "../models/Quiz.js";

// Tạo quiz mới
export const addQuiz = async (req, res) => {
    const { section, title, description, questions, order } = req.body;

    if (!section || !title || !questions || questions.length === 0) {
        return res.status(400).json({ message: 'section, title, and questions are required' });
    }

    try {
        const newQuiz = new Quiz({
            section,
            title,
            description,
            questions,
            order: order || 1
        });

        const savedQuiz = await newQuiz.save();
        res.status(201).json(savedQuiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating quiz', error: error.message });
    }
};

// Lấy quiz theo ID (protected - có đầy đủ thông tin bao gồm câu trả lời đúng)
export const getQuizById = async (req, res) => {
    const { quizId } = req.params;

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json(quiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Lấy quiz để làm bài (student - không có correctAnswers và explanation)
export const getQuizForStudent = async (req, res) => {
    const { quizId } = req.params;

    try {
        const quiz = await Quiz.findById(quizId).lean();
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        // Loại bỏ correctAnswers và explanation
        const studentQuiz = {
            _id: quiz._id,
            section: quiz.section,
            title: quiz.title,
            description: quiz.description,
            order: quiz.order,
            questions: quiz.questions.map(q => ({
                questionText: q.questionText,
                options: q.options
            }))
        };

        res.status(200).json(studentQuiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Lấy quiz cho enrolled user (protected - không có correctAnswers nhưng có explanation sau khi submit)
export const getQuizForEnrolledUser = async (req, res) => {
    const { quizId } = req.params;
    // userId được lấy từ middleware protectEnrolledUser trong req.userId

    try {
        const quiz = await Quiz.findById(quizId).lean();
        if (!quiz) {
            return res.status(404).json({ 
                success: false,
                message: 'Quiz not found' 
            });
        }

        // Trả về quiz không có correctAnswers (sẽ gửi lên khi submit)
        const enrolledUserQuiz = {
            _id: quiz._id,
            section: quiz.section,
            title: quiz.title,
            description: quiz.description,
            order: quiz.order,
            totalQuestions: quiz.questions.length,
            questions: quiz.questions.map((q, index) => ({
                id: index + 1,
                questionText: q.questionText,
                options: q.options,
                type: q.correctAnswers.length > 1 ? 'multiple' : 'single'
            }))
        };

        res.status(200).json({
            success: true,
            data: enrolledUserQuiz
        });
    } catch (error) {
        console.error('Error fetching quiz for enrolled user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Lấy tất cả quizzes theo section ID (public - chỉ có thông tin cơ bản)
export const getQuizzesBySectionId = async (req, res) => {
    const { sectionId } = req.params;

    try {
        const quizzes = await Quiz.find({ section: sectionId }).sort({ order: 1 }).lean();
        
        if (!quizzes || quizzes.length === 0) {
            return res.status(404).json({ message: 'No quizzes found for this section' });
        }

        // Chỉ trả về thông tin cơ bản
        const publicQuizzes = quizzes.map(quiz => ({
            _id: quiz._id,
            section: quiz.section,
            title: quiz.title,
            description: quiz.description,
            order: quiz.order,
            questionCount: quiz.questions.length
        }));

        res.status(200).json(publicQuizzes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Nộp bài quiz và nhận kết quả
export const submitQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { answers } = req.body; // answers: [{ questionIndex: 0, selectedAnswers: [0, 1] }]

    if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ message: 'Answers array is required' });
    }

    try {
        const quiz = await Quiz.findById(quizId).lean();
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const results = [];
        let correctCount = 0;

        answers.forEach((answer, index) => {
            const question = quiz.questions[answer.questionIndex];
            if (!question) return;

            // Debug log
            console.log(`Question ${answer.questionIndex}:`, {
                questionText: question.questionText,
                userSelectedAnswers: answer.selectedAnswers,
                correctAnswersInDB: question.correctAnswers,
                correctAnswersType: typeof question.correctAnswers[0],
                options: question.options
            });

            // Check if correctAnswers are text or indices
            let isCorrect;
            if (typeof question.correctAnswers[0] === 'string') {
                // correctAnswers are text, convert user indices to text
                const userAnswerTexts = answer.selectedAnswers.map(idx => question.options[idx]);
                console.log('Comparing texts:', {
                    userAnswerTexts: userAnswerTexts.sort(),
                    correctAnswerTexts: question.correctAnswers.sort()
                });
                isCorrect = JSON.stringify(userAnswerTexts.sort()) === 
                           JSON.stringify(question.correctAnswers.sort());
            } else {
                // correctAnswers are indices
                console.log('Comparing indices:', {
                    userIndices: answer.selectedAnswers.sort(),
                    correctIndices: question.correctAnswers.sort()
                });
                isCorrect = JSON.stringify(answer.selectedAnswers.sort()) === 
                           JSON.stringify(question.correctAnswers.sort());
            }
            
            if (isCorrect) correctCount++;

            results.push({
                questionIndex: answer.questionIndex,
                questionText: question.questionText,
                selectedAnswers: answer.selectedAnswers,
                correctAnswers: question.correctAnswers,
                isCorrect,
                explanation: question.explanation
            });
        });

        const score = (correctCount / quiz.questions.length) * 100;

        res.status(200).json({
            quizId: quiz._id,
            title: quiz.title,
            totalQuestions: quiz.questions.length,
            correctCount,
            score: Math.round(score),
            results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
};

// Cập nhật quiz
export const updateQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { title, description, questions, order } = req.body;

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        if (title) quiz.title = title;
        if (description !== undefined) quiz.description = description;
        if (questions) quiz.questions = questions;
        if (order) quiz.order = order;

        const updatedQuiz = await quiz.save();
        res.status(200).json(updatedQuiz);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating quiz', error: error.message });
    }
};

// Xóa quiz
export const deleteQuiz = async (req, res) => {
    const { quizId } = req.params;

    try {
        const quiz = await Quiz.findByIdAndDelete(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }
        res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting quiz', error: error.message });
    }
};
