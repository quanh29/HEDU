import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import styles from './ReviewQuestion.module.css';

const ReviewQuestion = ({ question, userAnswer, isCorrect }) => (
  <div className={styles.reviewQuestion}>
    <div className={styles.questionHeader}>
      <span className={styles.questionNumber}>Câu {question.index + 1}</span>
      {isCorrect ? (
        <CheckCircle className={styles.correctIcon} size={20} />
      ) : (
        <XCircle className={styles.incorrectIcon} size={20} />
      )}
    </div>
    <h3 className={styles.questionText}>{question.question}</h3>
    <div className={styles.optionsReview}>
      {question.options.map((option, optionIndex) => {
        const isSelected = userAnswer.includes(optionIndex);
        const isCorrectOption = question.correctAnswer.includes(optionIndex);
        let optionClass = styles.reviewOption;
        if (isSelected && isCorrectOption) {
          optionClass += ` ${styles.correctSelected}`;
        } else if (isSelected && !isCorrectOption) {
          optionClass += ` ${styles.incorrectSelected}`;
        } else if (!isSelected && isCorrectOption) {
          optionClass += ` ${styles.correctNotSelected}`;
        }
        return (
          <div key={optionIndex} className={optionClass}>
            <span>{option}</span>
            {isSelected && isCorrectOption && <CheckCircle size={16} />}
            {isSelected && !isCorrectOption && <XCircle size={16} />}
            {!isSelected && isCorrectOption && <CheckCircle size={16} />}
          </div>
        );
      })}
    </div>
    <div className={styles.explanation}>
      <strong>Giải thích:</strong> {question.explanation}
    </div>
  </div>
);

export default ReviewQuestion;
