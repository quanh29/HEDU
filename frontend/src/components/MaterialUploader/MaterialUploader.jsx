import React, { useState, useRef } from 'react';
import { Upload, CheckCircle, XCircle, FileText } from 'lucide-react';
import axios from 'axios';
import styles from './MaterialUploader.module.css';

const MaterialUploader = ({ 
    lessonTitle,
    sectionId,
    onUploadComplete,
    onUploadError 
}) => {
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [materialId, setMaterialId] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type (PDF, DOC, DOCX, PPT, PPTX)
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];

        if (!allowedTypes.includes(file.type)) {
            setErrorMessage('Chỉ hỗ trợ file PDF, DOC, DOCX, PPT, PPTX');
            setUploadStatus('error');
            return;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            setErrorMessage('File không được vượt quá 50MB');
            setUploadStatus('error');
            return;
        }

        try {
            setUploadStatus('uploading');
            setProgress(0);
            setErrorMessage('');

            // Upload file to backend
            const formData = new FormData();
            formData.append('file', file);
            formData.append('lessonTitle', lessonTitle);
            formData.append('sectionId', sectionId);

            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/api/material/upload`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    }
                }
            );

            setMaterialId(response.data.materialId);
            setUploadStatus('success');

            if (onUploadComplete) {
                onUploadComplete({
                    materialId: response.data.materialId,
                    fileUrl: response.data.fileUrl,
                    fileName: file.name
                });
            }

        } catch (error) {
            console.error('Error uploading material:', error);
            setUploadStatus('error');
            setErrorMessage(error.response?.data?.message || 'Upload failed');
            
            if (onUploadError) {
                onUploadError(error);
            }
        }
    };

    const handleCancel = () => {
        setUploadStatus('idle');
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={styles.uploader}>
            {uploadStatus === 'idle' && (
                <div className={styles.uploadArea}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={handleFileSelect}
                        className={styles.fileInput}
                        id="material-upload"
                    />
                    <label htmlFor="material-upload" className={styles.uploadLabel}>
                        <FileText size={32} className={styles.uploadIcon} />
                        <span className={styles.uploadText}>
                            Chọn tài liệu để upload
                        </span>
                        <span className={styles.uploadSubtext}>
                            Hỗ trợ: PDF, DOC, DOCX, PPT, PPTX (tối đa 50MB)
                        </span>
                    </label>
                </div>
            )}

            {uploadStatus === 'uploading' && (
                <div className={styles.uploadProgress}>
                    <div className={styles.progressHeader}>
                        <span>Đang upload... {progress}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div 
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <button onClick={handleCancel} className={styles.cancelButton}>
                        Hủy
                    </button>
                </div>
            )}

            {uploadStatus === 'success' && (
                <div className={styles.uploadSuccess}>
                    <CheckCircle className={styles.successIcon} />
                    <span>Upload thành công!</span>
                </div>
            )}

            {uploadStatus === 'error' && (
                <div className={styles.uploadError}>
                    <XCircle className={styles.errorIcon} />
                    <span>Lỗi: {errorMessage}</span>
                    <button 
                        onClick={() => {
                            setUploadStatus('idle');
                            setErrorMessage('');
                        }}
                        className={styles.retryButton}
                    >
                        Thử lại
                    </button>
                </div>
            )}
        </div>
    );
};

export default MaterialUploader;
