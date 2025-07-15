import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import styles from './VideoPlayer.module.css';

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('720p');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // Sample video URL - bạn có thể thay đổi URL này
  const videoSrc = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

  // Cập nhật showControls khi trạng thái play/pause thay đổi
  useEffect(() => {
    if (!isPlaying) {
      // Khi pause, luôn hiển thị controls và clear timeout
      setShowControls(true);
      if (hideControlsTimeout) {
        clearTimeout(hideControlsTimeout);
        setHideControlsTimeout(null);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    
    // Loading events
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadedData = () => setIsLoading(false);
    
    // Buffering events
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlayThrough = () => setIsBuffering(false);
    const handlePlaying = () => setIsBuffering(false);
    
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('playing', handlePlaying);
    
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e) => {
    const video = videoRef.current;
    const newTime = (e.target.value / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = e.target.value / 100;
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const handlePlaybackRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    videoRef.current.playbackRate = newRate;
  };

  const handleQualityChange = (e) => {
    setQuality(e.target.value);
    // Trong thực tế, bạn sẽ cần có nhiều nguồn video với chất lượng khác nhau
    // và thay đổi src của video element
  };

  const toggleFullscreen = () => {
    const container = videoRef.current.parentElement;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = (e) => {
    // Ngăn toggle play/pause khi click vào controls
    if (e.target.closest('.controls-overlay')) {
      return;
    }
    togglePlay();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
    // Chỉ ẩn controls khi video đang play, khi pause thì luôn hiển thị
    if (isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setHideControlsTimeout(timeout);
    }
  };

  const handleMouseLeave = () => {
    // Chỉ ẩn controls khi video đang play, khi pause thì luôn hiển thị
    if (isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 1000);
      setHideControlsTimeout(timeout);
    }
  };

  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden shadow-2xl w-full mx-auto"
      style={{ aspectRatio: '16/9', maxWidth: '60vw' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleVideoClick}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={videoSrc}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 controls-overlay ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: 10 }}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleProgressChange}
              className={`w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer progress-slider ${styles.progressSlider}`}
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${duration ? (currentTime / duration) * 100 : 0}%, #4b5563 ${duration ? (currentTime / duration) * 100 : 0}%, #4b5563 100%)`
              }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-white/20"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <div className="relative w-20">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume * 100}
                  onChange={handleVolumeChange}
                  className={`w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer volume-slider ${styles.volumeSlider}`}
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${isMuted ? 0 : volume * 100}%, #4b5563 ${isMuted ? 0 : volume * 100}%, #4b5563 100%)`
                  }}
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-4">
            {/* Playback Speed */}
            <div className="flex items-center space-x-2">
              <label className="text-white text-sm">Tốc độ:</label>
              <select
                value={playbackRate}
                onChange={handlePlaybackRateChange}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border-none outline-none"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>

            {/* Quality */}
            <div className="flex items-center space-x-2">
              <label className="text-white text-sm">Chất lượng:</label>
              <select
                value={quality}
                onChange={handleQualityChange}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border-none outline-none"
              >
                <option value="360p">360p</option>
                <option value="480p">480p</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-white/20"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Loading/Play Overlay - chỉ hiển thị khi chưa bắt đầu phát hoặc loading */}
      {!isPlaying && currentTime === 0 && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30" style={{ zIndex: 5 }}>
          <button
            onClick={togglePlay}
            className="text-white hover:text-blue-400 transition-colors p-4 rounded-full bg-black/50 hover:bg-black/70"
          >
            <Play size={48} />
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {(isLoading || isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50" style={{ zIndex: 15 }}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;