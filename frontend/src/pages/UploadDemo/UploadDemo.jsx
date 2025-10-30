import React, { useState } from 'react';
import MuxUploader from '../../components/MuxUploader/MuxUploader';
import MaterialUploader from '../../components/MaterialUploader/MaterialUploader';
import QuizEditor from '../../components/QuizEditor/QuizEditor';
import { Video, FileText, HelpCircle } from 'lucide-react';
import styles from './UploadDemo.module.css';

const UploadDemo = () => {
    const [activeTab, setActiveTab] = useState('video');
    const [uploadResults, setUploadResults] = useState([]);

    // Mock data cho demo
    const mockSectionId = '507f1f77bcf86cd799439011';
    const mockLessonTitle = 'Demo Lesson';

    const handleUploadComplete = (type, data) => {
        console.log(`${type} upload complete:`, data);
        setUploadResults(prev => [
            ...prev,
            {
                type,
                data,
                timestamp: new Date().toISOString()
            }
        ]);
    };

    const handleUploadError = (type, error) => {
        console.error(`${type} upload error:`, error);
        alert(`Lỗi upload ${type}: ${error.message}`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Demo Upload Khóa Học</h1>
                <p>Test upload Video (MUX), Material (PDF/DOC), và Quiz</p>
            </div>

            <div className={styles.tabs}>
                <button
                    onClick={() => setActiveTab('video')}
                    className={`${styles.tab} ${activeTab === 'video' ? styles.active : ''}`}
                >
                    <Video size={18} />
                    Video Upload
                </button>
                <button
                    onClick={() => setActiveTab('material')}
                    className={`${styles.tab} ${activeTab === 'material' ? styles.active : ''}`}
                >
                    <FileText size={18} />
                    Material Upload
                </button>
                <button
                    onClick={() => setActiveTab('quiz')}
                    className={`${styles.tab} ${activeTab === 'quiz' ? styles.active : ''}`}
                >
                    <HelpCircle size={18} />
                    Quiz Editor
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'video' && (
                    <div className={styles.section}>
                        <h2>Upload Video lên MUX</h2>
                        <p className={styles.description}>
                            Video sẽ được upload trực tiếp lên MUX với direct upload.
                            Webhook sẽ tự động cập nhật trạng thái khi video ready.
                        </p>
                        <MuxUploader
                            lessonTitle={mockLessonTitle}
                            sectionId={mockSectionId}
                            onUploadComplete={(data) => handleUploadComplete('Video', data)}
                            onUploadError={(error) => handleUploadError('Video', error)}
                        />
                    </div>
                )}

                {activeTab === 'material' && (
                    <div className={styles.section}>
                        <h2>Upload Material (PDF/DOC/PPT)</h2>
                        <p className={styles.description}>
                            Tài liệu sẽ được lưu trên server và phục vụ qua static files.
                        </p>
                        <MaterialUploader
                            lessonTitle={mockLessonTitle}
                            sectionId={mockSectionId}
                            onUploadComplete={(data) => handleUploadComplete('Material', data)}
                            onUploadError={(error) => handleUploadError('Material', error)}
                        />
                    </div>
                )}

                {activeTab === 'quiz' && (
                    <div className={styles.section}>
                        <h2>Tạo Quiz</h2>
                        <p className={styles.description}>
                            Tạo câu hỏi trắc nghiệm với nhiều lựa chọn và đáp án đúng.
                        </p>
                        <QuizEditor
                            lessonTitle={mockLessonTitle}
                            sectionId={mockSectionId}
                            onSaveComplete={(data) => handleUploadComplete('Quiz', data)}
                            onSaveError={(error) => handleUploadError('Quiz', error)}
                        />
                    </div>
                )}
            </div>

            {uploadResults.length > 0 && (
                <div className={styles.results}>
                    <h3>Upload Results</h3>
                    <div className={styles.resultsList}>
                        {uploadResults.map((result, index) => (
                            <div key={index} className={styles.resultItem}>
                                <div className={styles.resultHeader}>
                                    <span className={styles.resultType}>{result.type}</span>
                                    <span className={styles.resultTime}>
                                        {new Date(result.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <pre className={styles.resultData}>
                                    {JSON.stringify(result.data, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadDemo;
