import React, { useState, useRef } from 'react';
import * as UpChunk from '@mux/upchunk';
import { Upload, CheckCircle, XCircle, Loader } from 'lucide-react';
import styles from './MuxUploader.module.css';

const MuxUploader = ({ 
    lessonTitle, 
    sectionId, 
    onUploadComplete,
    onUploadError 
}) => {
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, success, error
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [videoId, setVideoId] = useState(null);
    const fileInputRef = useRef(null);
    const uploadRef = useRef(null);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            setErrorMessage('Vui lòng chọn file video');
            setUploadStatus('error');
            return;
        }

        try {
            setUploadStatus('uploading');
            setProgress(0);
            setErrorMessage('');

            // Bước 1: Lấy upload URL từ backend
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/mux/create-upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    lessonTitle,
                    sectionId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create upload URL');
            }

            const { uploadUrl, uploadId, videoId: createdVideoId } = await response.json();
            setVideoId(createdVideoId);

            // Bước 2: Upload file lên MUX sử dụng UpChunk
            const upload = UpChunk.createUpload({
                endpoint: uploadUrl,
                file: file,
                chunkSize: 30720, // 30MB chunks
            });

            uploadRef.current = upload;

            // Track upload progress
            upload.on('progress', (progressEvent) => {
                setProgress(Math.round(progressEvent.detail));
            });

            // Upload success
            upload.on('success', () => {
                console.log('Upload complete!');
                setUploadStatus('processing');
                
                // Poll for video status
                pollVideoStatus(createdVideoId);
            });

            // Upload error
            upload.on('error', (error) => {
                console.error('Upload error:', error);
                setUploadStatus('error');
                setErrorMessage(error.detail || 'Upload failed');
                
                if (onUploadError) {
                    onUploadError(error);
                }
            });

        } catch (error) {
            console.error('Error starting upload:', error);
            setUploadStatus('error');
            setErrorMessage(error.message);
            
            if (onUploadError) {
                onUploadError(error);
            }
        }
    };

    // Poll video status để biết khi nào video đã encode xong
    const pollVideoStatus = async (videoId) => {
        const maxAttempts = 60; // Poll trong 5 phút
        let attempts = 0;

        const poll = setInterval(async () => {
            attempts++;

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_BASE_URL}/api/mux/status/${videoId}`
                );
                
                if (!response.ok) {
                    throw new Error('Failed to check status');
                }

                const { status, assetId, playbackId } = await response.json();

                if (status === 'ready') {
                    clearInterval(poll);
                    setUploadStatus('success');
                    
                    if (onUploadComplete) {
                        onUploadComplete({
                            videoId,
                            assetId,
                            playbackId
                        });
                    }
                } else if (status === 'error') {
                    clearInterval(poll);
                    setUploadStatus('error');
                    setErrorMessage('Video processing failed');
                    
                    if (onUploadError) {
                        onUploadError(new Error('Processing failed'));
                    }
                }

                // Timeout sau 5 phút
                if (attempts >= maxAttempts) {
                    clearInterval(poll);
                    setUploadStatus('error');
                    setErrorMessage('Processing timeout');
                }
            } catch (error) {
                console.error('Error polling status:', error);
            }
        }, 5000); // Poll mỗi 5 giây
    };

    const handleCancel = () => {
        if (uploadRef.current) {
            uploadRef.current.abort();
        }
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
                        accept="video/*"
                        onChange={handleFileSelect}
                        className={styles.fileInput}
                        id="video-upload"
                    />
                    <label htmlFor="video-upload" className={styles.uploadLabel}>
                        <Upload size={32} className={styles.uploadIcon} />
                        <span className={styles.uploadText}>
                            Chọn video để upload
                        </span>
                        <span className={styles.uploadSubtext}>
                            Hỗ trợ: MP4, MOV, AVI (tối đa 5GB)
                        </span>
                    </label>
                </div>
            )}

            {uploadStatus === 'uploading' && (
                <div className={styles.uploadProgress}>
                    <div className={styles.progressHeader}>
                        <Loader className={styles.spinner} />
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

            {uploadStatus === 'processing' && (
                <div className={styles.uploadProgress}>
                    <div className={styles.progressHeader}>
                        <Loader className={styles.spinner} />
                        <span>Đang xử lý video...</span>
                    </div>
                    <div className={styles.processingInfo}>
                        Video đang được mã hóa. Quá trình này có thể mất vài phút.
                    </div>
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

export default MuxUploader;
