import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAulaVirtual } from '../context/AulaVirtualContext';

interface UnifiedVideoPlayerProps {
    videoUrl: string;
    sourceType?: 'youtube' | 'local' | string;
    title?: string;
    thumbnail?: string;
    durationStr?: string;
    autoPlay?: boolean;
    initialTime?: number; // Added for Resume
    seekTo?: number | null; // Added for Notes Jump
    onProgress?: (currentTime: number, duration: number, percentage: number) => void;
    onComplete?: () => void;
}

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

// --- ADVANCED CUSTOM PLAYER (ZOOM & CONTROLS) ---
// --- ADVANCED CUSTOM PLAYER (ZOOM & CONTROLS) ---
const AdvancedCustomPlayer: React.FC<{
    url: string;
    config: any;
    initialDurationStr?: string;
    initialTime?: number;
    seekTo?: number | null;
    onProgress?: (t: number, d: number, p: number) => void;
    onComplete?: () => void;
}> = ({ url, config, initialDurationStr, initialTime = 0, seekTo, onProgress, onComplete }) => {
    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialTime); // Initialize with prop
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isEnded, setIsEnded] = useState(false);

    // Quality State
    const [qualities, setQualities] = useState<string[]>([]);
    const [currentQuality, setCurrentQuality] = useState<string>('auto');
    const [showSettings, setShowSettings] = useState(false);

    // Refs
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressInterval = useRef<any>(null);
    const controlsTimeout = useRef<any>(null);
    const playerContainerId = useRef(`youtube-player-${Math.random().toString(36).substr(2, 9)}`);
    const initialSeekDone = useRef(false); // Track seek state
    const hasResumed = useRef(false); // verification for resume

    // Progress Reporter with Resume Guard
    useEffect(() => {
        if (!onProgress) return;

        // If we have an initialTime > 0, we shouldn't report "0" until we are sure we are past the resume point
        // or specifically playing.
        // Simple logic: If initialTime > 10, and currentTime < 5, don't report.
        if (initialTime > 5 && currentTime < 2 && !hasResumed.current) {
            // console.log("DEBUG: Ignoring progress update (resume guard)", currentTime);
            return;
        }

        if (currentTime > 0) {
            hasResumed.current = true;
        }

        const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
        onProgress(currentTime, duration, percentage);
    }, [currentTime, duration, initialTime, onProgress]);

    // Parse initial duration
    useEffect(() => {
        const parseDuration = (str?: string) => {
            if (!str) return 0;
            if (str.includes(':')) {
                const parts = str.split(':').map(Number);
                if (parts.length === 2) return parts[0] * 60 + parts[1];
                if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
            if (str.toLowerCase().includes('min')) {
                const mins = parseInt(str);
                return isNaN(mins) ? 0 : mins * 60;
            }
            // Fallback: if it's just a number, assume minutes
            const num = parseFloat(str);
            if (!isNaN(num)) return num * 60;

            return 0;
        };
        const seconds = parseDuration(initialDurationStr);
        if (seconds > 0) setDuration(seconds);
    }, [initialDurationStr]);

    // Extract Video ID
    let videoId = '';
    if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
    } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    }

    useEffect(() => {
        console.log("DEBUG: AdvancedCustomPlayer MOUNT. initialTime:", initialTime);
    }, [initialTime]);

    // --- INITIALIZE YOUTUBE API ---
    useEffect(() => {
        let isMounted = true;

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const createPlayer = () => {
            if (!isMounted || !window.YT || !window.YT.Player) return;

            if (playerRef.current && playerRef.current.destroy) {
                try {
                    playerRef.current.destroy();
                } catch (e) { console.error("Error destroying player", e); }
            }

            playerRef.current = new window.YT.Player(playerContainerId.current, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'autoplay': 0, // Disable auto-play to prevent 0:00 start race condition
                    'controls': 0,
                    'modestbranding': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'iv_load_policy': 3,
                    'disablekb': 1,
                    'fs': 0
                },
                events: {
                    'onReady': (e: any) => {
                        if (!isMounted) return;

                        // Resume Logic
                        if (initialTime > 0 && !initialSeekDone.current) {
                            console.log("DEBUG: Player Ready. Seeking to:", initialTime);
                            e.target.seekTo(initialTime);
                            initialSeekDone.current = true;
                        } else {
                            console.log("DEBUG: Player Ready. No seek. initialTime:", initialTime);
                        }

                        // Explicitly play if autoPlay is requested (after seek command)
                        if (config.autoPlay) {
                            e.target.playVideo();
                        }

                        onPlayerReady(e);
                    },
                    'onStateChange': (e: any) => {
                        if (!isMounted) return;

                        if (e.data === 0 && onComplete) {
                            onComplete(); // Video Ended
                        }

                        onPlayerStateChange(e);
                    },
                    'onPlaybackQualityChange': (e: any) => {
                        if (!isMounted) return;
                        setCurrentQuality(e.data);
                    },
                    'onApiChange': () => {
                        if (playerRef.current && playerRef.current.getAvailableQualityLevels) {
                            setQualities(playerRef.current.getAvailableQualityLevels());
                        }
                    }
                }
            });
        };

        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            const existingCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (existingCallback) existingCallback();
                createPlayer();
            };
        }

        return () => {
            isMounted = false;
            stopProgressLoop();
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
            if (playerRef.current && playerRef.current.destroy) {
                try {
                    playerRef.current.destroy();
                } catch (e) { /* ignore */ }
            }
        };
    }, [videoId, config.autoPlay]);


    // --- API EVENT HANDLERS ---
    const onPlayerReady = (event: any) => {
        const dur = event.target.getDuration();
        if (dur > 0) setDuration(dur);

        // --- FORCE BEST QUALITY LOGIC (MODIFIED: Prefer 1080p/720p for stability) ---
        if (event.target.getAvailableQualityLevels) {
            const levels = event.target.getAvailableQualityLevels();
            setQualities(levels);
            // Priority: 1080p > 720p > 1440p (2K) > 4K > 480p...
            // Priority: Absolute Max Quality (User Request)
            const priority = ['highres', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium'];
            let bestQuality = 'default';
            if (levels && levels.length > 0) {
                for (const p of priority) {
                    if (levels.includes(p)) { bestQuality = p; break; }
                }
                // If no match found in priority (e.g. only small/tiny available), default to highest available or auto
                if (bestQuality === 'default' && levels.length > 0) bestQuality = levels[0];

                if (bestQuality !== 'default') {
                    event.target.setPlaybackQuality(bestQuality);
                    setCurrentQuality(bestQuality);
                }
            }
        }
    };

    const onPlayerStateChange = (event: any) => {
        const state = event.data;
        if (state === 1 /* PLAYING */) {
            setIsPlaying(true);
            setIsBuffering(false);
            setIsEnded(false);
            startProgressLoop();
            startControlsTimer();

            // Force Max Quality AGAIN on play start (Override Auto)
            if (event.target.getAvailableQualityLevels) {
                const levels = event.target.getAvailableQualityLevels();
                // Priority: Absolute Max Quality
                const priority = ['highres', 'hd2160', 'hd1440', 'hd1080', 'hd720', 'large', 'medium'];
                for (const p of priority) {
                    if (levels.includes(p)) {
                        event.target.setPlaybackQuality(p);
                        setCurrentQuality(p);
                        break;
                    }
                }
            }
        }
        else if (state === 3 /* BUFFERING */) {
            setIsPlaying(true);
            setIsBuffering(true);
            setIsEnded(false);
            startProgressLoop();
            setShowControls(true);
        }
        else if (state === 2 /* PAUSED */) {
            setIsPlaying(false);
            setIsBuffering(false);
            stopProgressLoop();
            setShowControls(true);
        }
        else if (state === 0 /* ENDED */) {
            setIsPlaying(false);
            setIsBuffering(false);
            setIsEnded(true);
            stopProgressLoop();
            if (duration > 0) setCurrentTime(duration);
            setShowControls(true);
        }
    };

    const startProgressLoop = () => {
        stopProgressLoop();
        progressInterval.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                try {
                    const time = playerRef.current.getCurrentTime();
                    const dur = playerRef.current.getDuration();
                    if (typeof time === 'number') setCurrentTime(time);
                    if (typeof dur === 'number' && dur > 0 && Math.abs(dur - duration) > 1) setDuration(dur);
                } catch (e) { /* ignore API errors */ }
            }
        }, 500);
    };

    const stopProgressLoop = () => {
        if (progressInterval.current) clearInterval(progressInterval.current);
    };

    // --- AUTO-HIDE CONTROLS LOGIC ---
    const startControlsTimer = () => {
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying && !showSettings) {
                setShowControls(false);
            }
        }, 5000);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (isPlaying) {
            startControlsTimer();
        }
    };

    const handleMouseLeave = () => {
        if (isPlaying && !showSettings) {
            setShowControls(false);
        }
    };

    // --- CONTROLS ---
    const togglePlay = useCallback(() => {
        if (!playerRef.current) return;

        const state = typeof playerRef.current.getPlayerState === 'function' ? playerRef.current.getPlayerState() : -1;

        if (state === 0) { // ENDED
            replayVideo();
        } else if (state === 1 || state === 3) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }, []);

    const replayVideo = () => {
        if (playerRef.current) {
            setIsEnded(false);
            playerRef.current.seekTo(0);
            playerRef.current.playVideo();
        }
    };

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    }, []);


    // --- KEYBOARD SHORTCUTS ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' && target.getAttribute('type') === 'text') return;

            // Only trigger if container has focus or contains focus (simple check: if activeElement is inside container)
            // Or just global if desired. Let's keep it global if video is visible?
            // Safer to check simple focus or just allow it if video is playing.
            // For now, let's just keep strict global handling for space/f

            if (e.key === ' ' || e.code === 'Space') {
                // Check if we are interacting with this video context to avoid conflicting with other things
                if (document.activeElement === containerRef.current || containerRef.current?.contains(document.activeElement)) {
                    e.preventDefault();
                    togglePlay();
                }
            } else if (e.key === 'f' || e.key === 'F') {
                if (document.activeElement === containerRef.current || containerRef.current?.contains(document.activeElement)) {
                    e.preventDefault();
                    toggleFullscreen();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [togglePlay, toggleFullscreen]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        setIsEnded(false);
        if (playerRef.current && playerRef.current.seekTo) {
            playerRef.current.seekTo(time, true);
        }
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseInt(e.target.value);
        setVolume(vol);
        if (playerRef.current && playerRef.current.setVolume) {
            playerRef.current.setVolume(vol);
            if (vol > 0 && isMuted) {
                playerRef.current.unMute();
                setIsMuted(false);
            }
        }
    };

    const toggleMute = () => {
        if (!playerRef.current || !playerRef.current.mute) return;
        if (isMuted) {
            playerRef.current.unMute();
            playerRef.current.setVolume(volume);
        } else {
            playerRef.current.mute();
        }
        setIsMuted(!isMuted);
    };

    const changeQuality = (q: string) => {
        if (playerRef.current && playerRef.current.setPlaybackQuality) {
            playerRef.current.setPlaybackQuality(q);
            setCurrentQuality(q);
            setShowSettings(false);
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "00:00";

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) {
            return `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
        } else {
            return `${m}:${s < 10 ? '0' + s : s}`;
        }
    };

    const formatQualityLabel = (q: string) => {
        switch (q) {
            case 'highres': return 'Original (4K+)';
            case 'hd1080': return '1080p HD';
            case 'hd720': return '720p HD';
            case 'large': return '480p';
            case 'medium': return '360p';
            case 'small': return '240p';
            case 'tiny': return '144p';
            case 'auto': return 'Auto';
            default: return q;
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black group overflow-hidden cursor-default focus:outline-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            tabIndex={0}
            onClick={() => containerRef.current?.focus()}
        >
            <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
                {/* VIDEO CONTAINER */}
                <div
                    className="w-full h-full absolute inset-0 transform transition-transform duration-500"
                    style={{ pointerEvents: 'none', transform: 'scale(1)' }}
                >
                    <div id={playerContainerId.current} className="w-full h-full" />
                </div>

                {/* GRADIENT MASKS */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black via-black/60 to-transparent z-10 pointer-events-none transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0 }} />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0 }} />

                {/* Click Overlay */}
                <div className="absolute inset-0 z-20 cursor-pointer" onClick={togglePlay} />
            </div>

            {/* End Screen */}
            {isEnded && (
                <div className="absolute inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-500">
                    <button
                        onClick={replayVideo}
                        className="flex flex-col items-center gap-4 group/replay cursor-pointer"
                    >
                        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl transform transition-transform duration-300 group-hover/replay:scale-110 group-hover/replay:bg-blue-500">
                            <span className="material-symbols-outlined text-6xl">replay</span>
                        </div>
                        <span className="text-white font-bold text-lg tracking-widest uppercase opacity-80 group-hover/replay:opacity-100">Volver a ver</span>
                    </button>
                </div>
            )}

            {/* Spinner */}
            {isBuffering && !isEnded && (
                <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* CONTROL BAR */}
            <div className={`absolute bottom-0 left-0 right-0 z-30 px-4 py-4 transition-opacity duration-500 flex flex-col gap-2 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Progress Group */}
                <div className="group/progress w-full cursor-pointer relative py-1">
                    {/* Background Track */}
                    <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm group-hover/progress:h-2.5 transition-all duration-300">
                        {/* Played Bar */}
                        <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full relative" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                            {/* Glow effect */}
                            <div className="absolute right-0 top-0 bottom-0 w-2 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                        </div>
                    </div>

                    {/* Thumb (Visual only) */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full ring-2 ring-white shadow-md scale-0 group-hover/progress:scale-100 transition-transform duration-200 pointer-events-none"
                        style={{ left: `${(currentTime / (duration || 1)) * 100}%`, marginLeft: '-6px' }}
                    />

                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer"
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between text-white mt-1 relative">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-3xl">
                                {isEnded ? 'replay' : isPlaying ? 'pause' : 'play_arrow'}
                            </span>
                        </button>
                        <div className="flex items-center gap-2 group/vol">
                            <button onClick={toggleMute} className="hover:text-gray-300">
                                <span className="material-symbols-outlined">
                                    {isMuted || volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
                                </span>
                            </button>
                            <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 relative flex items-center">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolume}
                                    className="w-20 h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                        {/* TIME DISPLAY */}
                        <div className="text-xs font-medium text-gray-300 tabular-nums">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 relative">
                        {/* Settings Button */}
                        <div className="relative">
                            <button
                                className={`hover:text-gray-300 transition-transform ${showSettings ? 'rotate-45 text-white' : ''}`}
                                title="Calidad"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <span className="material-symbols-outlined">settings</span>
                            </button>

                            {/* Quality Popover */}
                            {showSettings && (
                                <div className="absolute bottom-full right-0 mb-3 w-40 bg-black/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-800 overflow-hidden z-50">
                                    <div className="px-3 py-2 text-xs font-bold text-gray-400 border-b border-gray-800">Calidad</div>
                                    <div className="max-h-48 overflow-y-auto py-1">
                                        {qualities.length > 0 ? qualities.map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => changeQuality(q)}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 flex items-center justify-between ${currentQuality === q ? 'text-primary font-bold' : 'text-gray-200'}`}
                                            >
                                                <span>{formatQualityLabel(q)}</span>
                                                {currentQuality === q && <span className="material-symbols-outlined text-sm">check</span>}
                                            </button>
                                        )) : (
                                            <div className="px-3 py-2 text-gray-500 text-sm italic">Auto (Default)</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={toggleFullscreen} className="hover:text-gray-300"><span className="material-symbols-outlined">fullscreen</span></button>
                    </div>
                </div>
            </div>

            {/* Play Button Overlay */}
            {!isPlaying && !isBuffering && !isEnded && (
                <div
                    className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
                    onClick={togglePlay}
                >
                    <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center text-white shadow-xl animate-pulse pointer-events-none">
                        <span className="material-symbols-outlined text-4xl ml-1">play_arrow</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- LOCAL CUSTOM PLAYER (HTML5 VIDEO) ---
const LocalCustomPlayer: React.FC<{
    url: string;
    config: any;
    initialDurationStr?: string;
    thumbnail?: string;
    initialTime?: number;
    onProgress?: (t: number, d: number, p: number) => void;
    onComplete?: () => void;
}> = ({ url, config, initialDurationStr, thumbnail, initialTime = 0, onProgress, onComplete }) => {
    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialTime); // Initialize state
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1); // 0 to 1 for HTML5
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isEnded, setIsEnded] = useState(false);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeout = useRef<any>(null);
    const initialSeekDone = useRef(false); // Track seek state

    // Initial Duration Parse
    useEffect(() => {
        const parseDuration = (str?: string) => {
            if (!str) return 0;
            if (str.includes(':')) {
                const parts = str.split(':').map(Number);
                if (parts.length === 2) return parts[0] * 60 + parts[1];
                if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            }
            if (str.toLowerCase().includes('min')) {
                const mins = parseInt(str);
                return isNaN(mins) ? 0 : mins * 60;
            }
            const num = parseFloat(str);
            if (!isNaN(num)) return num * 60;
            return 0;
        };
        const seconds = parseDuration(initialDurationStr);
        if (seconds > 0) setDuration(seconds);
    }, [initialDurationStr]);

    // Format Time Helper
    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
        return `${m}:${s < 10 ? '0' + s : s}`;
    };

    // --- EVENT HANDLERS ---
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const time = videoRef.current.currentTime;
            setCurrentTime(time);

            // Progress callback
            if (onProgress && videoRef.current.duration > 0) {
                onProgress(time, videoRef.current.duration, (time / videoRef.current.duration) * 100);
            }

            if (!duration || isNaN(duration) || duration === Infinity) {
                setDuration(videoRef.current.duration);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setVolume(videoRef.current.volume);
            setIsMuted(videoRef.current.muted);

            // Handle Resume
            if (initialTime > 0 && !initialSeekDone.current) {
                videoRef.current.currentTime = initialTime;
                initialSeekDone.current = true;
            }
        }
    };

    const handlePlay = () => {
        setIsPlaying(true);
        setIsEnded(false);
        startControlsTimer();
    };

    const handlePause = () => {
        setIsPlaying(false);
        setShowControls(true);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setIsEnded(true);
        setShowControls(true);
        if (onComplete) onComplete();
    };

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    // --- CONTROLS LOGIC ---
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused || videoRef.current.ended) {
            videoRef.current.play().catch(e => console.error("Play error:", e));
        } else {
            videoRef.current.pause();
        }
    }, []);

    const toggleMute = () => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = val;
            setVolume(val);
            if (val > 0 && isMuted) {
                videoRef.current.muted = false;
                setIsMuted(false);
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const toggleFullscreen = useCallback(() => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    }, []);

    const replayVideo = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
            setIsEnded(false);
        }
    };

    // Auto-hide controls
    const startControlsTimer = () => {
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 5000);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (isPlaying) startControlsTimer();
    };

    const handleMouseLeave = () => {
        if (isPlaying) setShowControls(false);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-black group overflow-hidden cursor-default focus:outline-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={() => containerRef.current?.focus()}
            tabIndex={0}
        >
            <video
                ref={videoRef}
                src={url}
                className="w-full h-full object-contain"
                poster={thumbnail}
                autoPlay={config.autoPlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onWaiting={handleWaiting}
                onPlaying={handlePlaying}
            />

            {/* Click Overlay */}
            <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay} />

            {/* GRADIENT MASKS */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black via-black/60 to-transparent z-10 pointer-events-none transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0 }} />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none transition-opacity duration-300" style={{ opacity: showControls ? 1 : 0 }} />

            {/* End Screen */}
            {isEnded && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center animate-in fade-in duration-500">
                    <button onClick={replayVideo} className="flex flex-col items-center gap-4 group/replay cursor-pointer">
                        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl transform transition-transform duration-300 group-hover/replay:scale-110">
                            <span className="material-symbols-outlined text-5xl">replay</span>
                        </div>
                        <span className="text-white font-bold tracking-widest uppercase">Volver a ver</span>
                    </button>
                </div>
            )}

            {/* Spinner */}
            {isBuffering && (
                <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* CONTROL BAR */}
            <div className={`absolute bottom-0 left-0 right-0 z-30 px-4 py-4 transition-opacity duration-500 flex flex-col gap-2 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Progress Group */}
                <div className="group/progress w-full cursor-pointer relative py-1">
                    {/* Background Track */}
                    <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm group-hover/progress:h-2.5 transition-all duration-300">
                        {/* Buffer Bar (TODO: Implement real buffer range if possible, for now just placeholder or full width if fully loaded) */}
                        {/* <div className="absolute top-0 left-0 h-full bg-white/30 w-1/2" /> */}

                        {/* Played Bar */}
                        <div className="absolute top-0 left-0 h-full bg-blue-600 rounded-full relative" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                            {/* Glow effect */}
                            <div className="absolute right-0 top-0 bottom-0 w-2 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
                        </div>
                    </div>

                    {/* Thumb (Visual only, input handles interaction) */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full ring-2 ring-white shadow-md scale-0 group-hover/progress:scale-100 transition-transform duration-200 pointer-events-none"
                        style={{ left: `${(currentTime / (duration || 1)) * 100}%`, marginLeft: '-6px' }}
                    />

                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-pointer"
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between text-white mt-1">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
                            <span className="material-symbols-outlined text-3xl">
                                {isEnded ? 'replay' : isPlaying ? 'pause' : 'play_arrow'}
                            </span>
                        </button>

                        <div className="flex items-center gap-2 group/vol">
                            <button onClick={toggleMute} className="hover:text-gray-300">
                                <span className="material-symbols-outlined">
                                    {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                                </span>
                            </button>
                            <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300 flex items-center px-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolume}
                                    className="w-20 h-1 bg-gray-500 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>
                        </div>

                        <div className="text-xs font-medium text-gray-300 tabular-nums font-mono">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors">
                            <span className="material-symbols-outlined">fullscreen</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Play Button Overlay */}
            {!isPlaying && !isBuffering && !isEnded && (
                <div className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer pointer-events-none">
                    <div className="w-20 h-20 bg-blue-600/90 rounded-full flex items-center justify-center text-white shadow-xl animate-pulse ring-4 ring-blue-600/30">
                        <span className="material-symbols-outlined text-5xl ml-2">play_arrow</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
const UnifiedVideoPlayer: React.FC<UnifiedVideoPlayerProps> = ({
    videoUrl,
    sourceType,
    title,
    thumbnail,
    durationStr,
    autoPlay,
    initialTime = 0,
    onProgress,
    onComplete
}) => {
    const { playerConfig } = useAulaVirtual();

    // Determine Source Type if not provided
    let finalSourceType = sourceType;
    if (!finalSourceType) {
        if (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')) finalSourceType = 'youtube';
        else finalSourceType = 'local';
    }

    // Logic to select player
    if (playerConfig.defaultPlayer === 'plyr') {
        if (finalSourceType === 'youtube') {
            const config = { ...playerConfig, autoPlay: autoPlay ?? playerConfig.autoPlay };
            return (
                <AdvancedCustomPlayer
                    url={videoUrl}
                    config={config}
                    initialDurationStr={durationStr}
                    initialTime={initialTime}
                    onProgress={onProgress}
                    onComplete={onComplete}
                />
            );
        }
        // Use NEW Local Custom Player for consistent UI
        const config = { ...playerConfig, autoPlay: autoPlay ?? playerConfig.autoPlay };
        return (
            <LocalCustomPlayer
                url={videoUrl}
                config={config}
                initialDurationStr={durationStr}
                thumbnail={thumbnail}
                initialTime={initialTime}
                onProgress={onProgress}
                onComplete={onComplete}
            />
        );
    }

    // NATIVE / SIMPLE PLAYER
    switch (finalSourceType) {
        case 'youtube':
            let videoId = '';
            if (videoUrl.includes('watch?v=')) videoId = videoUrl.split('watch?v=')[1].split('&')[0];
            else if (videoUrl.includes('embed/')) videoId = videoUrl.split('embed/')[1].split('?')[0];
            else if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1].split('?')[0];

            const params = new URLSearchParams();
            if (playerConfig.youtube.hideControls) params.append('controls', '0');
            if (playerConfig.youtube.modestBranding) params.append('modestbranding', '1');
            params.append('rel', '0');
            params.append('showinfo', '0');
            if (autoPlay || playerConfig.autoPlay) params.append('autoplay', '1');

            return <iframe src={`https://www.youtube.com/embed/${videoId}?${params.toString()}`} className="w-full h-full" allowFullScreen title={title || "Video Player"} />;

        default:
            return (
                <video
                    src={videoUrl}
                    controls
                    className="w-full h-full bg-black"
                    poster={thumbnail}
                    autoPlay={autoPlay || playerConfig.autoPlay}
                >
                    Tu navegador no soporta video HTML5.
                </video>
            );
    }
};

export default UnifiedVideoPlayer;
