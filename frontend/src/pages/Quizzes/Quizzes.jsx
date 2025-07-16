import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import styles from './Quizzes.module.css';
import QuestionNav from '../../components/QuestionNav/QuestionNav.jsx';
import QuestionContainer from '../../components/QuestionContainer/QuestionContainer.jsx';
import ReviewQuestion from '../../components/ReviewQuestion/ReviewQuestion.jsx';

const Quizzes = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current view based on URL
  const isAttemptView = location.pathname.includes('/attempt');
  const isResultView = location.pathname.includes('/result') && !location.pathname.includes('/review');
  const isReviewView = location.pathname.includes('/result/review');

  // Quiz states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Initialize state based on URL
  useEffect(() => {
    if (isResultView || isReviewView) {
      setIsSubmitted(true);
      // You could load saved results from localStorage or API here
      const savedResults = localStorage.getItem(`quiz_results`);
      if (savedResults) {
        const { answers: savedAnswers, score: savedScore, correctAnswers: savedCorrect } = JSON.parse(savedResults);
        setAnswers(savedAnswers || {});
        setScore(savedScore || 0);
        setCorrectAnswers(savedCorrect || 0);
      }
    } else if (!isAttemptView && !isResultView && !isReviewView) {
      // If user directly accesses quiz without specific path, redirect to attempt
      navigate(`/quizzes/attempt`, { replace: true });
    }
  }, [isResultView, isReviewView, isAttemptView, navigate]);

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
    
    // Save results to localStorage
    const resultsData = {
      answers,
      score: result.percentage,
      correctAnswers: result.correct,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`quiz_results`, JSON.stringify(resultsData));
    
    // Navigate to results page
    navigate(`/quizzes/result`);
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

  // Handle retake
  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    localStorage.removeItem(`quiz_results`);
    navigate(`/quizzes/attempt`);
  };

  // Handle review
  const handleReview = () => {
    navigate(`/quizzes/result/review`);
  };

  // Handle back to results
  const handleBackToResults = () => {
    navigate(`/quizzes/result`);
  };

  // Results view
  if (isResultView) {
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
                onClick={handleReview}
              >
                Xem lại bài làm
              </button>
              <button 
                className={styles.retakeButton}
                onClick={handleRetake}
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
  if (isReviewView) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={handleBackToResults}
          >
            <ChevronLeft size={20} />
            Quay lại danh sách bài học
          </button>
          <h1>{quizData.title} - Xem lại bài làm</h1>
        </div>

        <div className={styles.quizContent}>
          <div className={styles.quizLayout}>
            {/* Question Navigation - Left Side */}
            <QuestionNav
              questions={quizData.questions}
              answers={answers}
              currentQuestionIndex={currentQuestionIndex}
              goToQuestion={goToQuestion}
              handleSubmit={handleBackToResults}
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
  if (isAttemptView) {
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
  }

  // Loading or redirect state
  return <div>Đang tải...</div>;
};

export default Quizzes;
