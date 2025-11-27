import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import styles from './Modal.module.css';

const QuizQuestionModal = ({ 
  isOpen, 
  mode = 'add', // 'add' or 'edit'
  initialQuestion = '',
  initialAnswers = [{ text: '', isCorrect: false }],
  initialExplanation = '',
  onSubmit, 
  onClose 
}) => {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState([{ text: '', isCorrect: false }]);
  const [explanation, setExplanation] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit') {
        setQuestion(initialQuestion || '');
        setAnswers(initialAnswers.length > 0 ? initialAnswers : [{ text: '', isCorrect: false }]);
        setExplanation(initialExplanation || '');
      } else {
        setQuestion('');
        setAnswers([{ text: '', isCorrect: false }]);
        setExplanation('');
      }
      setErrors({});
    }
  }, [isOpen, mode, initialQuestion, initialAnswers, initialExplanation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    // Validate question
    if (!question.trim()) {
      newErrors.question = 'Vui lòng nhập câu hỏi';
    }
    
    // Validate answers
    const filledAnswers = answers.filter(a => a.text.trim());
    if (filledAnswers.length < 2) {
      newErrors.answers = 'Cần ít nhất 2 câu trả lời';
    }
    
    // Check if at least one answer is correct
    const hasCorrectAnswer = answers.some(a => a.isCorrect && a.text.trim());
    if (!hasCorrectAnswer) {
      newErrors.correctAnswer = 'Phải có ít nhất 1 đáp án đúng';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Only submit non-empty answers
    const validAnswers = answers.filter(a => a.text.trim());
    
    onSubmit(question.trim(), validAnswers, explanation.trim());
    onClose();
  };

  const handleAddAnswer = () => {
    setAnswers([...answers, { text: '', isCorrect: false }]);
  };

  const handleRemoveAnswer = (index) => {
    if (answers.length > 1) {
      const newAnswers = answers.filter((_, i) => i !== index);
      setAnswers(newAnswers);
    }
  };

  const handleAnswerChange = (index, field, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = { ...newAnswers[index], [field]: value };
    setAnswers(newAnswers);
    
    // Clear errors when user types
    if (errors.answers || errors.correctAnswer) {
      setErrors({ ...errors, answers: '', correctAnswer: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === 'edit' ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Question */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Câu hỏi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (errors.question) setErrors({ ...errors, question: '' });
                }}
                placeholder="Nhập câu hỏi..."
                className={styles.input}
                autoFocus
              />
              {errors.question && (
                <span className={styles.errorText}>{errors.question}</span>
              )}
            </div>

            {/* Answers */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Câu trả lời <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                Đánh dấu ô checkbox để chọn đáp án đúng
              </div>
              
              {answers.map((answer, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={answer.isCorrect}
                    onChange={(e) => handleAnswerChange(index, 'isCorrect', e.target.checked)}
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                    title="Đánh dấu là đáp án đúng"
                  />
                  <input
                    type="text"
                    value={answer.text}
                    onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                    placeholder={`Đáp án ${index + 1}`}
                    className={styles.input}
                    style={{ flex: 1, margin: 0 }}
                  />
                  {answers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAnswer(index)}
                      style={{
                        padding: '6px',
                        border: '1px solid #ef4444',
                        background: 'white',
                        color: '#ef4444',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        height: '32px'
                      }}
                      title="Xóa đáp án"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddAnswer}
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  border: '1px dashed #3b82f6',
                  background: 'white',
                  color: '#3b82f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} />
                Thêm đáp án
              </button>
              
              {errors.answers && (
                <span className={styles.errorText}>{errors.answers}</span>
              )}
              {errors.correctAnswer && (
                <span className={styles.errorText}>{errors.correctAnswer}</span>
              )}
            </div>

            {/* Explanation */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Giải thích (tùy chọn)</label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Nhập giải thích cho câu trả lời đúng..."
                className={styles.textarea}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.submitButton}
            >
              {mode === 'edit' ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizQuestionModal;
