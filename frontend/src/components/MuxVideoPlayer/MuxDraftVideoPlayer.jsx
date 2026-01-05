import React, { useState, useEffect, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { useAuth } from '@clerk/clerk-react';
import styles from './MuxVideoPlayer.module.css';

const MuxDraftVideoPlayer = ({ videoId, autoPlay = false, onEnded, onTimeUpdate, onReady }) => {
  const [playbackData, setPlaybackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const { getToken } = useAuth();

  // Update ref when onReady changes
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Fetch playback URL từ backend cho draft video
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

        const token = await getToken();
        const url = `${import.meta.env.VITE_BASE_URL}/api/video/playback-draft/${videoId}`;
        
        console.log('🎬 Fetching draft video playback:', { videoId, url });
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();

        console.log('📹 Draft video playback response:', result);

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to load draft video');
        }

        setPlaybackData(result.data);
        
        // Call onReady callback with playback data using ref
        if (onReadyRef.current) {
          onReadyRef.current(result.data);
        }
      } catch (err) {
        console.error('❌ Error fetching draft video playback:', err);
        setError(err.message || 'Failed to load draft video');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayback();
  }, [videoId, getToken]);

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
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!playbackData) {
    return (
      <div className={styles.playerContainer}>
        <div className={styles.errorState}>
          <p>Không có dữ liệu video</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.playerContainer}>
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackData.playbackId}
        tokens={{ playback: playbackData.token }}
        streamType="on-demand"
        autoPlay={autoPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        metadata={{
          video_id: playbackData.videoId,
          video_title: playbackData.title || 'Draft Video',
        }}
      />
    </div>
  );
};

export default MuxDraftVideoPlayer;
