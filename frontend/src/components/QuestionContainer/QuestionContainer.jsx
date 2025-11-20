import React from 'react';
import styles from './QuestionContainer.module.css';

const QuestionContainer = ({ question, answers, handleAnswerSelect }) => (
  <div className={styles.questionContainer}>
    <div className={styles.questionHeader}>
      <span className={styles.questionNumber}>
        Câu {question.index + 1}/{question.total}
      </span>
      <span className={styles.questionType}>
        {question.type === 'single' ? 'Chọn một đáp án' : 'Chọn nhiều đáp án'}
      </span>
    </div>
    <h2 className={styles.questionText}>{question.questionText || question.question}</h2>
    <div className={styles.options}>
      {question.options.map((option, index) => {
        const isSelected = answers[question.id]?.includes(index) || false;
        return (
          <label
            key={index}
            className={`${styles.option} ${isSelected ? styles.selected : ''}`}
          >
            <input
              type={question.type === 'single' ? 'radio' : 'checkbox'}
              name={`question-${question.id}`}
              checked={isSelected}
              onChange={() => handleAnswerSelect(question.id, index)}
            />
            <span className={styles.optionText}>{option}</span>
          </label>
        );
      })}
    </div>
  </div>
);

export default QuestionContainer;
