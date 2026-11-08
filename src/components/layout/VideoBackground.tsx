import React, { useEffect, useRef } from 'react';

export const VideoBackground: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Background video autoplay note:', err);
        });
      }
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden select-none"
    >
      {/* Autoplaying Looping Muted Gold Metallic Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source src="/assets/gold_metallic_scroll_background.mp4" type="video/mp4" />
      </video>

      {/* Warm Luxury Orange/Amber Tint Overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 60% 40%, rgba(217, 119, 6, 0.12) 0%, rgba(66, 26, 8, 0.25) 60%, rgba(42, 14, 4, 0.55) 100%)'
        }}
      />
    </div>
  );
};
