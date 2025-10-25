import React, { useState, useEffect, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import styles from './MuxVideoPlayer.module.css';

const MuxVideoPlayer = ({ videoId, autoPlay = false, onEnded, onTimeUpdate }) => {
  const [playbackData, setPlaybackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);

  // Fetch playback URL từ backend
  useEffect(() => {
    if (!videoId) {
      setError('Video ID is required');
      setLoading(false);
      return;
    }

    const fetchPlayback = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/video/playback/${videoId}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load video');
        }

        setPlaybackData(result.data);
      } catch (err) {
        console.error('Error fetching video playback:', err);
        setError(err.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayback();
  }, [videoId]);

  // Handle player events
  const handleTimeUpdate = (e) => {
    if (onTimeUpdate && e.target) {
      onTimeUpdate({
        currentTime: e.target.currentTime,
        duration: e.target.duration,
        progress: (e.target.currentTime / e.target.duration) * 100
      });
    }
  };

  const handleEnded = () => {
    if (onEnded) {
      onEnded();
    }
  };

  if (loading) {
    return (
      <div className={styles.playerContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Đang tải video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.playerContainer}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Không thể tải video</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!playbackData) {
    return (
      <div className={styles.playerContainer}>
        <div className={styles.errorState}>
          <p>Video không tồn tại</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.playerContainer}>
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackData.playbackId}
        tokens={{
          playback: playbackData.token
        }}
        streamType="on-demand"
        autoPlay={autoPlay}
        metadata={{
          video_id: videoId,
          video_title: playbackData.title,
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className={styles.muxPlayer}
      />
      
      {/* Video Info */}
      <div className={styles.videoInfo}>
        <h2 className={styles.videoTitle}>{playbackData.title}</h2>
        {playbackData.description && (
          <p className={styles.videoDescription}>{playbackData.description}</p>
        )}
      </div>
    </div>
  );
};

export default MuxVideoPlayer;
