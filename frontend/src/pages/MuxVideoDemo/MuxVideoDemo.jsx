import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import MuxVideoPlayer from '../../components/MuxVideoPlayer/MuxVideoPlayer';
import styles from './MuxVideoDemo.module.css';

const MuxVideoDemo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get('videoId'); // Lấy videoId từ query params
  
  const [playbackProgress, setPlaybackProgress] = useState({
    currentTime: 0,
    duration: 0,
    progress: 0
  });

  // Handle time update từ video player
  const handleTimeUpdate = (data) => {
    setPlaybackProgress(data);
  };

  // Handle khi video kết thúc
  const handleVideoEnded = () => {
    console.log('Video đã kết thúc!');
    // Có thể thêm logic như hiển thị video tiếp theo, đánh dấu hoàn thành, etc.
  };

  // Format time sang MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.demoContainer}>
      <div className={styles.header}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          ← Quay lại
        </button>
        <h1 className={styles.title}>MUX Video Player Demo</h1>
      </div>

      <div className={styles.content}>
        {/* Video Player Section */}
        <div className={styles.playerSection}>
          {videoId ? (
            <MuxVideoPlayer
              videoId={videoId}
              autoPlay={false}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
            />
          ) : (
            <div className={styles.noVideoState}>
              <div className={styles.noVideoIcon}>🎥</div>
              <h2>Không có video được chọn</h2>
              <p>Vui lòng thêm <code>?videoId=YOUR_VIDEO_ID</code> vào URL</p>
              <p className={styles.exampleText}>
                Ví dụ: <code>/mux-demo?videoId=507f1f77bcf86cd799439011</code>
              </p>
            </div>
          )}
        </div>

        {/* Playback Info Section */}
        {videoId && (
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <h3>Thông tin phát</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Thời gian hiện tại:</span>
                  <span className={styles.infoValue}>
                    {formatTime(playbackProgress.currentTime)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tổng thời lượng:</span>
                  <span className={styles.infoValue}>
                    {formatTime(playbackProgress.duration)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Tiến độ:</span>
                  <span className={styles.infoValue}>
                    {playbackProgress.progress.toFixed(1)}%
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Video ID:</span>
                  <span className={styles.infoValue} style={{fontSize: '12px', fontFamily: 'monospace'}}>
                    {videoId}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${playbackProgress.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className={styles.featureCard}>
              <h3>✨ Tính năng</h3>
              <ul className={styles.featureList}>
                <li>✅ MUX signed playback tokens cho private videos</li>
                <li>✅ Adaptive bitrate streaming (HLS)</li>
                <li>✅ Tự động giải mã private key từ base64</li>
                <li>✅ Token tự động hết hạn sau 1 giờ</li>
                <li>✅ Responsive player với đầy đủ controls</li>
                <li>✅ Hỗ trợ fullscreen và picture-in-picture</li>
                <li>✅ Tracking playback progress</li>
                <li>✅ Error handling và loading states</li>
              </ul>
            </div>

            {/* API Info */}
            <div className={styles.apiCard}>
              <h3>🔧 API Endpoint</h3>
              <div className={styles.codeBlock}>
                <code>GET /api/videos/playback/{videoId}</code>
              </div>
              <p className={styles.apiDescription}>
                Component tự động fetch signed playback URL từ backend API
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className={styles.instructions}>
        <h2>📖 Hướng dẫn sử dụng</h2>
        <ol>
          <li>Thêm video vào database với <code>contentUrl</code> là MUX playback ID</li>
          <li>Lấy <code>_id</code> của video từ MongoDB</li>
          <li>Truy cập URL: <code>/mux-demo?videoId=VIDEO_ID</code></li>
          <li>Video player sẽ tự động fetch signed URL và phát video</li>
        </ol>

        <h3>Environment Variables Required:</h3>
        <div className={styles.codeBlock}>
          <code>MUX_SIGNING_KEY_ID=your-key-id</code><br/>
          <code>MUX_SIGNING_PRIVATE_KEY=base64-encoded-private-key</code>
        </div>
      </div>
    </div>
  );
};

export default MuxVideoDemo;
