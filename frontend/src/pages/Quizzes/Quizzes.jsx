import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { ChevronLeft, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import styles from './Quizzes.module.css';
import QuestionNav from '../../components/QuestionNav/QuestionNav.jsx';
import QuestionContainer from '../../components/QuestionContainer/QuestionContainer.jsx';
import ReviewQuestion from '../../components/ReviewQuestion/ReviewQuestion.jsx';

const Quizzes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams();
  const { getToken } = useAuth();
  
  // Get quizId from URL params
  const searchParams = new URLSearchParams(location.search);
  const quizId = searchParams.get('quizId');

  // Debug log
  console.log('Quizzes component - courseId:', courseId, 'quizId:', quizId);
  console.log('Location pathname:', location.pathname);
  console.log('Location search:', location.search);

  // Determine current view based on URL
  const viewParam = searchParams.get('view');
  const isIntroView = viewParam === 'intro' || (!viewParam && !searchParams.has('view'));
  const isAttemptView = viewParam === 'attempt';
  const isResultView = viewParam === 'result';
  const isReviewView = viewParam === 'review';

  // Quiz states
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizResults, setQuizResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Initialize state based on URL
  useEffect(() => {
    if (isResultView || isReviewView) {
      setIsSubmitted(true);
      setHasStarted(true);
      // Load saved results from localStorage
      const savedResults = localStorage.getItem(`quiz_results_${quizId}`);
      if (savedResults) {
        const parsed = JSON.parse(savedResults);
        setAnswers(parsed.answers || {});
        setScore(parsed.score || 0);
        setCorrectAnswers(parsed.correctAnswers || 0);
        setQuizResults(parsed.results || null);
      }
    } else if (isAttemptView) {
      setHasStarted(true);
    } else if (isIntroView) {
      setHasStarted(false);
    }
  }, [isResultView, isReviewView, isAttemptView, isIntroView, quizId]);

  // Fetch quiz data from API
  useEffect(() => {
    const fetchQuizData = async () => {
      // Wait for params to be available
      if (!courseId || !quizId) {
        console.log('Waiting for courseId and quizId...', { courseId, quizId });
        // Don't set error immediately, courseId might be loading
        if (courseId === undefined || quizId === null) {
          // Still loading, keep waiting
          return;
        }
        setError('Missing course ID or quiz ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching quiz data for:', courseId, quizId);
        const token = await getToken();
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/quiz/enrolled/${courseId}/${quizId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          console.log('Quiz data loaded successfully:', response.data.data);
          setQuizData(response.data.data);
        } else {
          setError('Failed to load quiz data');
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err.response?.data?.message || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [courseId, quizId, getToken]);

  // Hardcoded quiz data removed - now loaded from API via useEffect above

  // Handle answer selection
  const handleAnswerSelect = (questionId, optionIndex) => {
    if (!quizData || !quizData.questions) return;
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

  // Submit quiz to server for grading
  const submitQuizToServer = async () => {
    if (!quizData || !quizId) return null;
    
    try {
      setSubmitting(true);
      const token = await getToken();
      
      // Transform answers to server format
      // IMPORTANT: Backend expects 0-based questionIndex, but we store answers by question.id (1-based)
      const answersArray = quizData.questions.map((question, index) => {
        const userAnswers = answers[question.id] || [];
        console.log(`Question ${index} (id: ${question.id}):`, {
          questionText: question.questionText,
          userAnswers,
          allAnswers: answers
        });
        return {
          questionIndex: question.id - 1, // Convert 1-based ID to 0-based index
          selectedAnswers: userAnswers
        };
      });
      
      console.log('Submitting answers:', answersArray);
      
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/quiz/submit/${quizId}?courseId=${courseId}`,
        { answers: answersArray },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Server response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    try {
      const result = await submitQuizToServer();
      
      if (result) {
        setCorrectAnswers(result.correctCount);
        setScore(result.score);
        setQuizResults(result.results);
        setIsSubmitted(true);
        
        // Save results to localStorage
        const resultsData = {
          answers,
          score: result.score,
          correctAnswers: result.correctCount,
          results: result.results,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`quiz_results_${quizId}`, JSON.stringify(resultsData));
        
        // Navigate to results page
        navigate(`/course/${courseId}/content/quiz?quizId=${quizId}&view=result`);
      }
    } catch (error) {
      alert('Có lỗi khi nộp bài. Vui lòng thử lại.');
    }
  };

  // Navigation functions
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (quizData && quizData.questions && currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const currentQuestion = quizData && quizData.questions ? quizData.questions[currentQuestionIndex] : null;

  // Handle start quiz
  const handleStartQuiz = () => {
    setHasStarted(true);
    navigate(`/course/${courseId}/content/quiz?quizId=${quizId}&view=attempt`);
  };

  // Handle retake
  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setHasStarted(false);
    setQuizResults(null);
    localStorage.removeItem(`quiz_results_${quizId}`);
    navigate(`/course/${courseId}/content/quiz?quizId=${quizId}&view=intro`);
  };

  // Handle review
  const handleReview = () => {
    navigate(`/course/${courseId}/content/quiz?quizId=${quizId}&view=review`);
  };

  // Handle back to results
  const handleBackToResults = () => {
    navigate(`/course/${courseId}/content/quiz?quizId=${quizId}&view=result`);
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Đang tải quiz...</div>
      </div>
    );
  }

  // Error state
  if (error || !quizData) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Không thể tải quiz</h2>
          <p>{error || 'Quiz không tồn tại'}</p>
          <button onClick={() => navigate(`/course/${courseId}/content`)}>
            Quay lại khóa học
          </button>
        </div>
      </div>
    );
  }

  // Results view
  if (isResultView) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(`/course/${courseId}/content`)}
          >
            <ChevronLeft size={20} />
            Quay lại nội dung khóa học
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
                <p>Số câu đúng: <strong>{correctAnswers}/{quizData.totalQuestions || quizData.questions.length}</strong></p>
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
            Quay lại kết quả
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
                  // Get result from server response
                  const result = quizResults?.find(r => r.questionIndex === index);
                  const isCorrect = result?.isCorrect || false;
                  
                  // Convert correctAnswers to indices if they are text
                  let correctAnswerIndices = [];
                  if (result?.correctAnswers) {
                    if (typeof result.correctAnswers[0] === 'string') {
                      // correctAnswers are text, find their indices
                      correctAnswerIndices = result.correctAnswers
                        .map(answerText => question.options.findIndex(opt => opt === answerText))
                        .filter(idx => idx !== -1);
                    } else {
                      // correctAnswers are already indices
                      correctAnswerIndices = result.correctAnswers;
                    }
                  }
                  
                  return (
                    <ReviewQuestion
                      key={question.id}
                      question={{ ...question, index }}
                      userAnswer={userAnswer}
                      correctAnswer={correctAnswerIndices}
                      isCorrect={isCorrect}
                      explanation={result?.explanation || ''}
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

  // Intro view
  if (isIntroView) {
      return (
        <div className={styles.container}>
          <div className={styles.header}>
            <button 
              className={styles.backButton}
              onClick={() => navigate(`/course/${courseId}/content`)}
            >
              <ChevronLeft size={20} />
              Quay lại nội dung khóa học
            </button>
            <h1>{quizData.title}</h1>
          </div>

          <div className={styles.introContainer}>
            <div className={styles.introCard}>
              <h2 className={styles.introTitle}>{quizData.title}</h2>
              {quizData.description && (
                <p className={styles.introDescription}>{quizData.description}</p>
              )}
              
              <div className={styles.introInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Số câu hỏi:</span>
                  <span className={styles.infoValue}>{quizData.totalQuestions || quizData.questions.length}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Điều kiện đạt:</span>
                  <span className={styles.infoValue}>≥ 70%</span>
                </div>
              </div>

              <button 
                className={styles.startButton}
                onClick={handleStartQuiz}
              >
                Bắt đầu làm bài
              </button>
            </div>
          </div>
        </div>
      );
  }

  // Quiz taking view (attempt)
  if (isAttemptView) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(`/course/${courseId}/content`)}
          >
            <ChevronLeft size={20} />
            Quay lại nội dung khóa học
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
