import React from 'react';
import styles from './QuestionNav.module.css';

const QuestionNav = ({ questions, answers, currentQuestionIndex, goToQuestion, handleSubmit }) => (
  <div className={styles.questionNav}>
    <h3 className={styles.navTitle}>Câu hỏi</h3>
    <div className={styles.questionNavGrid}>
      {questions.map((_, index) => {
        const isAnswered = answers[questions[index].id]?.length > 0;
        return (
          <button
            key={index}
            className={`${styles.questionNavButton} ${
              index === currentQuestionIndex ? styles.active : ''
            } ${isAnswered ? styles.answered : ''}`}
            onClick={() => goToQuestion(index)}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
    <button
      className={styles.navSubmitButton}
      onClick={handleSubmit}
    >
      Nộp bài
    </button>
  </div>
);

export default QuestionNav;
