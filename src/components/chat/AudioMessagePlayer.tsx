import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface AudioMessagePlayerProps {
  src: string;
  duration?: number;
  isOutgoing?: boolean;
  senderName?: string;
  timestamp?: string;
  isRead?: boolean;
}

/**
 * AudioMessagePlayer - Lecteur de notes vocales style WhatsApp aux couleurs CORESI.
 * Palette CORESI : Vert Industriel #3B7A2C, #2D6020, #4FA33B, Ardoise/Slate.
 */
export const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({
  src,
  duration = 0,
  isOutgoing = false,
  senderName = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(duration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Barres d'onde réalistes et esthétiques
  const waveformHeights = [
    25, 45, 75, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85, 65, 40, 90, 60, 30,
    70, 85, 40, 65, 95, 50, 80, 40, 60, 30, 75, 90, 55, 35, 70, 45, 80, 60, 40, 25,
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
      });
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = clickRatio * totalDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const togglePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || !isFinite(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const progressRatio = totalDuration > 0 ? currentTime / totalDuration : 0;
  const activeBarIndex = Math.floor(progressRatio * waveformHeights.length);

  return (
    <div
      className={`p-3 rounded-2xl w-[260px] sm:w-[290px] select-none shadow-sm transition-all ${
        isOutgoing
          ? 'bg-[#2D6020] text-white rounded-tr-none'
          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/90 dark:border-slate-700'
      }`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Nom expéditeur si non sortant */}
      {senderName && !isOutgoing && (
        <p className="text-[11px] font-bold mb-1.5 truncate text-[#3B7A2C] dark:text-[#4FA33B]">
          {senderName}
        </p>
      )}

      {/* Conteneur Audio Principal (Avatar/Mic + Play Button + Waveform) */}
      <div className="flex items-center space-x-2.5">
        {/* Avatar avec badge Micro */}
        <div className="relative shrink-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
              isOutgoing
                ? 'bg-white/20 text-white'
                : 'bg-[#3B7A2C]/10 text-[#3B7A2C] dark:text-[#4FA33B] border border-[#3B7A2C]/20'
            }`}
          >
            {senderName ? senderName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#3B7A2C] text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs">
            <Mic className="w-2 h-2" />
          </div>
        </div>

        {/* Bouton Play/Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm ${
            isOutgoing
              ? 'bg-white text-[#2D6020] hover:bg-slate-100'
              : 'bg-[#3B7A2C] text-white hover:bg-[#2D6020]'
          }`}
          title={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Barres d'onde interactives */}
        <div
          onClick={handleWaveformClick}
          className="flex-1 flex items-center h-8 cursor-pointer relative py-1"
          title="Cliquer pour naviguer"
        >
          <div className="flex items-center justify-between w-full h-full gap-[2px]">
            {waveformHeights.map((h, index) => {
              const isPast = index <= activeBarIndex;
              return (
                <div
                  key={index}
                  style={{ height: `${Math.max(15, h)}%` }}
                  className={`w-[2.5px] rounded-full transition-colors duration-100 ${
                    isOutgoing
                      ? isPast
                        ? 'bg-white'
                        : 'bg-white/35'
                      : isPast
                      ? 'bg-[#3B7A2C] dark:bg-[#4FA33B]'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Barre inférieure : Durée + Vitesse */}
      <div
        className={`flex items-center justify-between mt-2 pt-1 border-t text-[10.5px] font-medium ${
          isOutgoing
            ? 'border-white/15 text-white/80'
            : 'border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'
        }`}
      >
        <span className="tabular-nums">
          {isPlaying ? formatTime(currentTime) : formatTime(totalDuration || 0)}
        </span>

        <button
          type="button"
          onClick={togglePlaybackRate}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase transition-colors ${
            isOutgoing
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
          }`}
          title="Modifier la vitesse de lecture"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};

export default AudioMessagePlayer;
