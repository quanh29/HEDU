import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as UpChunk from '@mux/upchunk';
import { Upload, CheckCircle, XCircle, Loader } from 'lucide-react';
import styles from './MuxUploader.module.css';
import { useVideoSocket } from '../../context/SocketContext.jsx';
import { getClerkToken } from '../../utils/clerkAuth.js';

const MuxUploader = ({ 
    lessonTitle, 
    sectionId,
    lessonId, // Add lessonId prop
    onUploadStart,
    onUploadComplete,
    onUploadError,
    onProgress,
    onStatusChange,
    onCancel,
    onCancelRegistered, // New: callback to register cancel function
    inline = false
}) => {
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, success, error
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [videoId, setVideoId] = useState(null);
    const fileInputRef = useRef(null);
    const uploadRef = useRef(null);
    const isCancellingRef = useRef(false); // Prevent multiple cancel calls

    // Setup WebSocket listener for video status updates
    const handleVideoStatusUpdate = useCallback((data) => {
        console.log('📡 MuxUploader received video status update:', data);
        console.log('📌 Current videoId:', videoId);
        console.log('📌 Received videoId:', data.videoId);
        console.log('📌 videoId type:', typeof videoId, 'data.videoId type:', typeof data.videoId);
        console.log('📌 Comparison result:', videoId === data.videoId);
        console.log('📌 String comparison:', String(videoId) === String(data.videoId));
        
        // Only process updates for the current video (compare as strings)
        if (!videoId || String(data.videoId) !== String(videoId)) {
            console.log('⏭️ Ignoring update for different video');
            console.log('   Expected:', videoId);
            console.log('   Received:', data.videoId);
            return;
        }

        console.log(`📹 Processing update for video ${videoId}: ${data.status}`);

        switch (data.status) {
            case 'processing':
                updateStatus('processing');
                console.log('🔄 Video is processing...');
                break;

            case 'ready':
                updateStatus('success');
                console.log('✅ Video is ready!');
                
                if (onUploadComplete) {
                    onUploadComplete({
                        videoId: data.videoId,
                        assetId: data.assetId,
                        playbackId: data.playbackId,
                        contentUrl: data.contentUrl || `https://stream.mux.com/${data.playbackId}.m3u8`,
                        status: 'ready',
                        duration: data.duration,
                    });
                }
                break;

            case 'error':
                updateStatus('error');
                setErrorMessage(data.error || 'Processing failed');
                console.error('❌ Video processing error:', data.error);
                
                if (onUploadError) {
                    onUploadError(new Error(data.error || 'Processing failed'));
                }
                break;

            case 'cancelled':
                updateStatus('idle');
                console.log('🛑 Video upload cancelled');
                break;

            default:
                console.log(`ℹ️ Unhandled status: ${data.status}`);
        }
    }, [videoId, onUploadComplete, onUploadError]);

    const handleVideoError = useCallback((data) => {
        console.error('❌ Video error received:', data);
        updateStatus('error');
        setErrorMessage(data.message || 'An error occurred');
        
        if (onUploadError) {
            onUploadError(new Error(data.message));
        }
    }, [onUploadError]);

    // Use WebSocket hook for real-time updates
    const { isConnected, error: socketError } = useVideoSocket(
        handleVideoStatusUpdate,
        handleVideoError
    );

    // Log socket connection status
    useEffect(() => {
        if (isConnected) {
            console.log('✅ MuxUploader: Socket connected');
        } else {
            console.log('⚠️ MuxUploader: Socket disconnected');
        }
    }, [isConnected]);

    useEffect(() => {
        if (socketError) {
            console.error('❌ MuxUploader: Socket error:', socketError);
        }
    }, [socketError]);

    const updateStatus = (status) => {
        setUploadStatus(status);
        if (onStatusChange) {
            onStatusChange(status);
        }
    };

    const updateProgress = (prog) => {
        setProgress(prog);
        if (onProgress) {
            onProgress(prog);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            setErrorMessage('Vui lòng chọn file video');
            updateStatus('error');
            return;
        }

        try {
            if (onUploadStart) {
                onUploadStart();
            }
            
            updateStatus('uploading');
            updateProgress(0);
            setErrorMessage('');

            // Register cancel function with parent component
            if (onCancelRegistered) {
                onCancelRegistered(handleCancel);
            }

            // Bước 1: Lấy upload URL từ backend với authentication
            const token = await getClerkToken();
            
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/mux/create-upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    lessonTitle: lessonTitle || '', // Backend sẽ tự tạo title tạm thời nếu trống
                    sectionId: sectionId || 'temp-section', // Handle temporary sectionId
                    lessonId: lessonId // Add lessonId to link video with lesson
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create upload URL');
            }

            const { uploadUrl, uploadId, videoId: createdVideoId, assetId } = await response.json();
            setVideoId(createdVideoId);

            // Store uploadId for potential cancellation
            uploadRef.current = {
                uploadId,
                videoId: createdVideoId,
                upload: null
            };

            // Bước 2: Upload file lên MUX sử dụng UpChunk
            const upload = UpChunk.createUpload({
                endpoint: uploadUrl,
                file: file,
                chunkSize: 30720, // 30MB chunks
            });

            uploadRef.current.upload = upload;

            // Track upload progress
            upload.on('progress', (progressEvent) => {
                const prog = Math.round(progressEvent.detail);
                updateProgress(prog);
            });

            // Upload success - WebSocket will handle status updates
            upload.on('success', () => {
                console.log('✅ Upload complete!');
                console.log('📹 Video ID:', createdVideoId);
                console.log('🎬 Asset ID:', assetId);
                console.log('🔌 Waiting for WebSocket status updates...');
                updateStatus('processing');
                
                // Notify parent that upload is complete (NOT that video is ready)
                // WebSocket will send the 'ready' status when MUX finishes encoding
                if (onUploadComplete) {
                    onUploadComplete({
                        videoId: createdVideoId,
                        uploadId: uploadId,
                        assetId: assetId || '',
                        status: 'processing', // Still processing, not ready yet
                    });
                }
            });

            // Upload error
            upload.on('error', (error) => {
                console.error('Upload error:', error);
                updateStatus('error');
                setErrorMessage(error.detail || 'Upload failed');
                
                if (onUploadError) {
                    onUploadError(error);
                }
            });

        } catch (error) {
            console.error('Error starting upload:', error);
            updateStatus('error');
            setErrorMessage(error.message);
            
            if (onUploadError) {
                onUploadError(error);
            }
        }
    };

    const handleCancel = useCallback(async () => {
        // Prevent multiple simultaneous cancel calls
        if (isCancellingRef.current) {
            console.log('⚠️ Cancel already in progress, ignoring duplicate call');
            return;
        }
        
        isCancellingRef.current = true;
        console.log('🛑 Cancelling upload...');
        
        try {
            // Abort upload if in progress
            if (uploadRef.current?.upload) {
                try {
                    uploadRef.current.upload.abort();
                    console.log('✅ Upload aborted');
                } catch (error) {
                    console.error('Error aborting upload:', error);
                }
            }
            
            // Call backend to cancel upload and delete video
            // Use uploadId if available (during upload), otherwise use videoId
            const uploadId = uploadRef.current?.uploadId;
            const currentVideoId = videoId;
            
            if (uploadId) {
                try {
                    console.log(`🗑️ Calling API to cancel upload: ${uploadId}`);
                    const response = await fetch(
                        `${import.meta.env.VITE_BASE_URL}/api/mux/cancel-upload/${uploadId}`,
                        { method: 'DELETE' }
                    );
                    
                    if (response.ok) {
                        console.log('✅ Upload cancelled via API');
                    } else {
                        console.error('❌ Failed to cancel upload via API');
                    }
                } catch (error) {
                    console.error('Error calling cancel API:', error);
                }
            } else if (currentVideoId) {
                // Fallback: delete video by videoId
                try {
                    console.log(`🗑️ Calling API to delete video: ${currentVideoId}`);
                    const response = await fetch(
                        `${import.meta.env.VITE_BASE_URL}/api/videos/${currentVideoId}`,
                        { method: 'DELETE' }
                    );
                    
                    if (response.ok) {
                        console.log('✅ Video deleted via API');
                    } else {
                        console.error('❌ Failed to delete video via API');
                    }
                } catch (error) {
                    console.error('Error deleting video:', error);
                }
            }
            
            // Reset state
            updateStatus('idle');
            updateProgress(0);
            setVideoId(null);
            setErrorMessage('');
            uploadRef.current = null;
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // Notify parent component
            if (onCancel) {
                onCancel();
            }
            
            console.log('✅ Upload cancelled successfully');
        } finally {
            // Reset cancelling flag after a short delay to prevent rapid re-clicks
            setTimeout(() => {
                isCancellingRef.current = false;
            }, 500);
        }
    }, [videoId, onCancel]);

    // Inline mode - simple file input button
    if (inline && uploadStatus === 'idle') {
        return (
            <div style={{ width: '100%' }}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id={`video-upload-${sectionId}`}
                />
                <label 
                    htmlFor={`video-upload-${sectionId}`}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        border: '2px dashed #3b82f6',
                        borderRadius: 8,
                        padding: '12px 16px',
                        background: '#eff6ff',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                >
                    <Upload size={16} />
                    Upload video lên MUX
                </label>
            </div>
        );
    }

    // Inline mode - uploading/processing states are handled by parent
    if (inline && uploadStatus !== 'idle') {
        return null;
    }

    // Full modal mode
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
