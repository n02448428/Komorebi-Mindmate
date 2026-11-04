import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { NatureScene } from '../types';
import { natureScenes, getSceneGradient } from '../utils/sceneUtils';

export interface NatureVideoBackgroundRef {
  captureFrame: () => string | null;
}

interface NatureVideoBackgroundProps {
  scene: NatureScene;
  timeOfDay: 'morning' | 'evening';
  className?: string;
}

const NatureVideoBackground = forwardRef<NatureVideoBackgroundRef, NatureVideoBackgroundProps>(({
  scene,
  timeOfDay,
  className = ''
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const sceneData = natureScenes[scene];
  const gradientClass = getSceneGradient(scene, timeOfDay);


  // Optimized: Memoize the capture frame function
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    
    if (!video || error) {
      console.warn('Video not available for frame capture:', { 
        hasVideo: !!video, 
        hasError: error 
      });
      return null;
    }
    
    if (!isLoaded || video.readyState < 2) {
      console.warn('Video not ready for frame capture:', { 
        isLoaded, 
        readyState: video?.readyState,
        currentTime: video.currentTime 
      });
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: alpha false is faster
      
      if (!ctx) {
        console.error('Failed to get canvas context');
        return null;
      }

      // Set canvas dimensions to match video
      const width = video.videoWidth || 800;
      const height = video.videoHeight || 600;
      
      canvas.width = width;
      canvas.height = height;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Optimization: Skip this check in production for better performance
      if (import.meta.env.DEV) {
        const imageData = ctx.getImageData(0, 0, Math.min(10, width), Math.min(10, height));
        const hasContent = imageData.data.some(pixel => pixel !== 0);
          
        if (!hasContent) {
          console.warn('Captured frame appears to be empty');
        }
      }
      
      // Convert to data URL (JPEG for smaller file size)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Successfully captured video frame:', { 
        width, 
        height, 
        dataUrlLength: dataUrl.length,
        hasContent: true 
      });
      
      return dataUrl;
    } catch (error) {
      console.error('Error capturing video frame:', error);
      return null;
    }
  }, [isLoaded, error, videoRef]);
  
  // Expose captureFrame method through ref
  useImperativeHandle(ref, () => ({
    captureFrame
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset states and retry count when scene changes
    setIsLoaded(false);
    setError(false);
    setRetryCount(0);
    
    // Preload the source - this helps with smoother transitions
    video.preload = "auto";

    const handleLoadedData = () => {
      console.log(`Video loaded successfully: ${scene}`);
      setIsLoaded(true);
    };

    const handleCanPlay = () => {
      console.log(`Video can play: ${scene}`);
      if (!isLoaded) {
        setIsLoaded(true);
      }
      // Attempt to play the video
      video.play().catch((playError) => {
        console.error('Error playing video:', playError);
        // Try to play again after a short delay
        setTimeout(() => {
          video.play().catch(console.error);
        }, 500);
      });
    };

    const handleError = (e: Event) => {
      console.error(`Video loading error (attempt ${retryCount + 1}) for scene ${scene}:`, {
        error: e,
        videoUrl: sceneData?.videoUrl,
        videoElement: video,
        networkState: video?.networkState,
        readyState: video?.readyState
      });
      
      // Try to reload up to 2 times before giving up
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => video.load(), 1000);
      } else {
        setError(true);
      }
    };

    const handlePlay = () => {
    };

    const handlePause = () => {
      console.log(`Video paused: ${scene}`);
      // Try to resume playing if it was paused unexpectedly
      if (!video.ended && !error) {
        setTimeout(() => {
          video.play().catch(console.error);
        }, 100);
      }
    };

    // Add event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Set the source and load the video
    if (sceneData?.videoUrl) {
      video.src = sceneData.videoUrl;
      video.load();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [scene, sceneData.videoUrl]); // Removed isLoaded from dependencies to prevent infinite loop

  if (error) {
    // Fallback gradient background
    console.log(`Using fallback gradient for scene: ${scene}`);
    return (
      <div className={`fixed inset-0 bg-gradient-to-br ${gradientClass} ${className}`} aria-hidden="true">
        <div className="absolute inset-0 bg-black/10" />
        {/* Subtle pattern for the fallback */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 rounded-full translate-y-24 -translate-x-24" />
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 ${className}`} aria-hidden="true">
      {/* Video Background */}
      <video
        ref={videoRef}
        key={sceneData.videoUrl} // Force re-mount when URL changes
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
      >
        <source src={sceneData?.videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} transition-all duration-1000`} style={{ willChange: 'opacity' }} />

      {/* Additional overlay for text readability */}
      <div className={`absolute inset-0 transition-all duration-1000 ${
        timeOfDay === 'evening' 
          ? 'bg-black/20' 
          : 'bg-white/10'
      }`} />

      {/* Loading state */}
      {!isLoaded && !error && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} animate-pulse`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-sm font-medium ${
              timeOfDay === 'morning' ? 'text-gray-600' : 'text-gray-300'
            } opacity-70`}>
              Loading {sceneData.name}...
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

NatureVideoBackground.displayName = 'NatureVideoBackground';

export default NatureVideoBackground;