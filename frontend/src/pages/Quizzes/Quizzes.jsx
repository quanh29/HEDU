import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import styles from './Quizzes.module.css';
import QuestionNav from '../../components/QuestionNav/QuestionNav.jsx';
import QuestionContainer from '../../components/QuestionContainer/QuestionContainer.jsx';
import ReviewQuestion from '../../components/ReviewQuestion/ReviewQuestion.jsx';

const Quizzes = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  // Quiz states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Sample quiz data
  const quizData = {
    id: 1,
    title: "Kiểm tra JavaScript Cơ bản",
    description: "Bài kiểm tra về các khái niệm cơ bản trong JavaScript",
    totalQuestions: 5,
    questions: [
      {
        id: 1,
        type: "single", // single choice
        question: "JavaScript được phát triển bởi ai?",
        options: [
          "Microsoft",
          "Netscape",
          "Google",
          "Apple"
        ],
        correctAnswer: [1], // index 1 (Netscape)
        explanation: "JavaScript được phát triển bởi Brendan Eich tại Netscape vào năm 1995."
      },
      {
        id: 2,
        type: "multiple", // multiple choice
        question: "Những cách nào sau đây có thể khai báo biến trong JavaScript? (Chọn tất cả đáp án đúng)",
        options: [
          "var myVar = 5;",
          "let myVar = 5;",
          "const myVar = 5;",
          "variable myVar = 5;"
        ],
        correctAnswer: [0, 1, 2], // var, let, const
        explanation: "Trong JavaScript, có thể khai báo biến bằng var, let, và const. 'variable' không phải là từ khóa hợp lệ."
      },
      {
        id: 3,
        type: "single",
        question: "Kết quả của biểu thức '5' + 3 trong JavaScript là gì?",
        options: [
          "8",
          "53",
          "Error",
          "undefined"
        ],
        correctAnswer: [1], // "53"
        explanation: "Khi cộng string với number, JavaScript sẽ chuyển number thành string và nối chuỗi, kết quả là '53'."
      },
      {
        id: 4,
        type: "multiple",
        question: "Những kiểu dữ liệu nào sau đây là primitive types trong JavaScript?",
        options: [
          "string",
          "number",
          "object",
          "boolean",
          "null"
        ],
        correctAnswer: [0, 1, 3, 4], // string, number, boolean, null
        explanation: "Primitive types trong JavaScript bao gồm: string, number, boolean, null, undefined, symbol, và bigint. Object là reference type."
      },
      {
        id: 5,
        type: "single",
        question: "Hàm nào được sử dụng để in ra console trong JavaScript?",
        options: [
          "print()",
          "console.log()",
          "System.out.println()",
          "echo()"
        ],
        correctAnswer: [1], // console.log()
        explanation: "console.log() là phương thức được sử dụng để in thông tin ra console trong JavaScript."
      },
      {
        id: 6,
        type: "single",
        question: "Hàm nào được sử dụng để in ra console trong JavaScript?",
        options: [
          "print()",
          "console.log()",
          "System.out.println()",
          "echo()"
        ],
        correctAnswer: [1], // console.log()
        explanation: "console.log() là phương thức được sử dụng để in thông tin ra console trong JavaScript."
      },
      {
        id: 7,
        type: "single",
        question: "Hàm nào được sử dụng để in ra console trong JavaScript?",
        options: [
          "print()",
          "console.log()",
          "System.out.println()",
          "echo()"
        ],
        correctAnswer: [1], // console.log()
        explanation: "console.log() là phương thức được sử dụng để in thông tin ra console trong JavaScript."
      }
    ]
  };

  // Format time - removed timer functionality

  // Handle answer selection
  const handleAnswerSelect = (questionId, optionIndex) => {
    const question = quizData.questions.find(q => q.id === questionId);
    
    if (question.type === 'single') {
      setAnswers(prev => ({
        ...prev,
        [questionId]: [optionIndex]
      }));
    } else {
      setAnswers(prev => {
        const currentAnswers = prev[questionId] || [];
        const newAnswers = currentAnswers.includes(optionIndex)
          ? currentAnswers.filter(index => index !== optionIndex)
          : [...currentAnswers, optionIndex];
        
        return {
          ...prev,
          [questionId]: newAnswers
        };
      });
    }
  };

  // Check if answer is correct
  const isAnswerCorrect = (question, userAnswer) => {
    if (!userAnswer || userAnswer.length === 0) return false;
    
    const sortedUserAnswer = [...userAnswer].sort();
    const sortedCorrectAnswer = [...question.correctAnswer].sort();
    
    return JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
  };

  // Calculate score
  const calculateScore = () => {
    let correct = 0;
    quizData.questions.forEach(question => {
      if (isAnswerCorrect(question, answers[question.id])) {
        correct++;
      }
    });
    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100)
    };
  };

  // Handle submit
  const handleSubmit = () => {
    const result = calculateScore();
    setCorrectAnswers(result.correct);
    setScore(result.percentage);
    setIsSubmitted(true);
    setShowResults(true);
  };

  // Navigation functions
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const currentQuestion = quizData.questions[currentQuestionIndex];

  // Results view
  if (showResults && !showReview) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={20} />
            Quay lại danh sách bài học
          </button>
          <h1>{quizData.title}</h1>
        </div>

        <div className={styles.resultsContainer}>
          <div className={styles.resultsCard}>
            <div className={styles.resultsHeader}>
              <h1>Kết quả bài kiểm tra</h1>
              <h2>{quizData.title}</h2>
            </div>

            <div className={styles.scoreSection}>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreNumber}>{score}%</span>
              </div>
              <div className={styles.scoreDetails}>
                <p>Số câu đúng: <strong>{correctAnswers}/{quizData.questions.length}</strong></p>
                <p className={score >= 70 ? styles.passed : styles.failed}>
                  {score >= 70 ? 'Đạt' : 'Không đạt'}
                </p>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button 
                className={styles.reviewButton}
                onClick={() => setShowReview(true)}
              >
                Xem lại bài làm
              </button>
              <button 
                className={styles.retakeButton}
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setIsSubmitted(false);
                  setShowResults(false);
                  setShowReview(false);
                }}
              >
                <RotateCcw size={16} />
                Làm lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Review view
  if (showReview) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={20} />
            Quay lại danh sách bài học
          </button>
          <h1>{quizData.title}</h1>
        </div>

        <div className={styles.quizContent}>
          <div className={styles.quizLayout}>
            {/* Question Navigation - Left Side */}
            <QuestionNav
              questions={quizData.questions}
              answers={answers}
              currentQuestionIndex={currentQuestionIndex}
              goToQuestion={goToQuestion}
              handleSubmit={() => setShowReview(false)}
              isReviewMode={true}
            />

            {/* Review Content - Right Side */}
            <div className={styles.rightContent}>
              <div className={styles.reviewContainer}>
                {quizData.questions.map((question, index) => {
                  const userAnswer = answers[question.id] || [];
                  const isCorrect = isAnswerCorrect(question, userAnswer);
                  return (
                    <ReviewQuestion
                      key={question.id}
                      question={{ ...question, index }}
                      userAnswer={userAnswer}
                      isCorrect={isCorrect}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking view
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={20} />
          Quay lại danh sách bài học
        </button>
        <h1>{quizData.title}</h1>
      </div>

      <div className={styles.quizContent}>
        {/* Question Navigation and Current Question */}
        <div className={styles.quizLayout}>
          {/* Question Navigation - Left Side */}
          <QuestionNav
            questions={quizData.questions}
            answers={answers}
            currentQuestionIndex={currentQuestionIndex}
            goToQuestion={goToQuestion}
            handleSubmit={handleSubmit}
          />

          {/* Right Side Content */}
          <div className={styles.rightContent}>
            {/* Current Question */}
            <QuestionContainer
              question={{
                ...currentQuestion,
                index: currentQuestionIndex,
                total: quizData.questions.length
              }}
              answers={answers}
              handleAnswerSelect={handleAnswerSelect}
            />

            {/* Navigation Controls */}
            <div className={styles.navigationControls}>
              <button
                className={styles.navButton}
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Câu trước
              </button>

              <button
                className={styles.navButton}
                onClick={nextQuestion}
                disabled={currentQuestionIndex === quizData.questions.length - 1}
              >
                Câu tiếp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
