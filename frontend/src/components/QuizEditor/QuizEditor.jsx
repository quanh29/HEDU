import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import styles from './QuizEditor.module.css';

const QuizEditor = ({ 
    lessonTitle,
    sectionId,
    onSaveComplete,
    onSaveError 
}) => {
    const [quizData, setQuizData] = useState({
        title: lessonTitle || '',
        description: '',
        questions: [
            {
                questionText: '',
                options: ['', '', '', ''],
                correctAnswers: [],
                explanation: ''
            }
        ]
    });
    const [saving, setSaving] = useState(false);

    const addQuestion = () => {
        setQuizData(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    questionText: '',
                    options: ['', '', '', ''],
                    correctAnswers: [],
                    explanation: ''
                }
            ]
        }));
    };

    const removeQuestion = (questionIndex) => {
        if (quizData.questions.length > 1) {
            setQuizData(prev => ({
                ...prev,
                questions: prev.questions.filter((_, i) => i !== questionIndex)
            }));
        }
    };

    const updateQuestion = (questionIndex, field, value) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => 
                i === questionIndex ? { ...q, [field]: value } : q
            )
        }));
    };

    const updateOption = (questionIndex, optionIndex, value) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => {
                if (i === questionIndex) {
                    const newOptions = [...q.options];
                    newOptions[optionIndex] = value;
                    return { ...q, options: newOptions };
                }
                return q;
            })
        }));
    };

    const toggleCorrectAnswer = (questionIndex, optionIndex) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => {
                if (i === questionIndex) {
                    const isSelected = q.correctAnswers.includes(optionIndex);
                    const newCorrectAnswers = isSelected
                        ? q.correctAnswers.filter(idx => idx !== optionIndex)
                        : [...q.correctAnswers, optionIndex];
                    
                    return { ...q, correctAnswers: newCorrectAnswers };
                }
                return q;
            })
        }));
    };

    const validateQuiz = () => {
        if (!quizData.title.trim()) {
            alert('Vui lòng nhập tiêu đề quiz');
            return false;
        }

        for (let i = 0; i < quizData.questions.length; i++) {
            const question = quizData.questions[i];
            
            if (!question.questionText.trim()) {
                alert(`Câu hỏi ${i + 1}: Vui lòng nhập nội dung câu hỏi`);
                return false;
            }

            if (question.options.some(opt => !opt.trim())) {
                alert(`Câu hỏi ${i + 1}: Vui lòng điền đầy đủ các lựa chọn`);
                return false;
            }

            if (question.correctAnswers.length === 0) {
                alert(`Câu hỏi ${i + 1}: Vui lòng chọn ít nhất một đáp án đúng`);
                return false;
            }
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateQuiz()) return;

        setSaving(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/api/quiz`,
                {
                    section: sectionId,
                    title: quizData.title,
                    description: quizData.description,
                    questions: quizData.questions,
                    order: 0 // Sẽ được cập nhật sau
                }
            );

            if (onSaveComplete) {
                onSaveComplete({
                    quizId: response.data.quiz._id,
                    title: quizData.title
                });
            }

        } catch (error) {
            console.error('Error saving quiz:', error);
            if (onSaveError) {
                onSaveError(error);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.quizEditor}>
            <div className={styles.header}>
                <h3>Tạo Quiz</h3>
            </div>

            <div className={styles.basicInfo}>
                <div className={styles.formGroup}>
                    <label>Tiêu đề Quiz</label>
                    <input
                        type="text"
                        value={quizData.title}
                        onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Nhập tiêu đề quiz"
                        className={styles.input}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Mô tả (tùy chọn)</label>
                    <textarea
                        value={quizData.description}
                        onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Nhập mô tả quiz"
                        className={styles.textarea}
                        rows={3}
                    />
                </div>
            </div>

            <div className={styles.questions}>
                {quizData.questions.map((question, qIndex) => (
                    <div key={qIndex} className={styles.questionCard}>
                        <div className={styles.questionHeader}>
                            <h4>Câu hỏi {qIndex + 1}</h4>
                            {quizData.questions.length > 1 && (
                                <button
                                    onClick={() => removeQuestion(qIndex)}
                                    className={styles.removeButton}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Nội dung câu hỏi</label>
                            <textarea
                                value={question.questionText}
                                onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                                placeholder="Nhập câu hỏi"
                                className={styles.textarea}
                                rows={2}
                            />
                        </div>

                        <div className={styles.options}>
                            <label>Các lựa chọn (Chọn đáp án đúng)</label>
                            {question.options.map((option, oIndex) => (
                                <div key={oIndex} className={styles.optionRow}>
                                    <button
                                        type="button"
                                        onClick={() => toggleCorrectAnswer(qIndex, oIndex)}
                                        className={`${styles.checkButton} ${
                                            question.correctAnswers.includes(oIndex) ? styles.checked : ''
                                        }`}
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                        placeholder={`Lựa chọn ${oIndex + 1}`}
                                        className={styles.input}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className={styles.formGroup}>
                            <label>Giải thích (tùy chọn)</label>
                            <textarea
                                value={question.explanation}
                                onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                placeholder="Giải thích đáp án đúng"
                                className={styles.textarea}
                                rows={2}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.actions}>
                <button
                    onClick={addQuestion}
                    className={styles.addButton}
                >
                    <Plus size={16} />
                    Thêm câu hỏi
                </button>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={styles.saveButton}
                >
                    {saving ? 'Đang lưu...' : 'Lưu Quiz'}
                </button>
            </div>
        </div>
    );
};

export default QuizEditor;
