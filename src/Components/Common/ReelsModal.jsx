import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Avatar, Tooltip, message } from "antd";
import {
  HeartFilled,
  HeartOutlined,
  ShareAltOutlined,
  CloseOutlined,
  UpOutlined,
  DownOutlined,
  ExportOutlined,
  PlayCircleFilled,
  CheckOutlined,
  UserAddOutlined,
  SoundOutlined,
  MutedOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { likeVideo as apiLikeVideo, recordVideoView } from "../../api/videos";
import { toggleSubscribeUser, getUserProfile } from "../../api/profile";

const ReelsModal = ({ isOpen, onClose, videos = [], initialIndex = 0 }) => {
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.user.firebaseUser);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [fitMode, setFitMode] = useState("contain"); // "contain" or "cover"
  const [likesMap, setLikesMap] = useState({});
  const [likedMap, setLikedMap] = useState({});
  const [subscribedMap, setSubscribedMap] = useState({});
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const lastTapRef = useRef(0);
  const lastWheelTime = useRef(0);
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(true);
    }
  }, [isOpen, initialIndex]);

  // Lock document body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
    };
  }, [isOpen]);

  const currentVideo = videos[currentIndex] || null;

  // View recording and profile lookup on current video change
  useEffect(() => {
    if (!currentVideo || !isOpen) return;

    const targetId = currentVideo.public_id || currentVideo._id;
    if (targetId) {
      recordVideoView(targetId).catch(() => {});
    }

    if (likesMap[targetId] === undefined) {
      setLikesMap((prev) => ({
        ...prev,
        [targetId]: currentVideo.likes || 0,
      }));
    }

    if (currentVideo.uploaderUid && currentUser) {
      getUserProfile(currentVideo.uploaderUid)
        .then((res) => {
          if (res?.data?.user?.subscribers?.includes(currentUser.uid)) {
            setSubscribedMap((prev) => ({
              ...prev,
              [currentVideo.uploaderUid]: true,
            }));
          }
        })
        .catch(() => {});
    }

    setProgress(0);
    setIsPlaying(true);
  }, [currentVideo, isOpen, currentUser]);

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      message.info("You've reached the last video!");
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  // Keyboard navigation listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (
        e.key === "ArrowDown" ||
        e.key === "PageDown" ||
        e.key.toLowerCase() === "j" ||
        e.key.toLowerCase() === "s"
      ) {
        e.preventDefault();
        goToNext();
      } else if (
        e.key === "ArrowUp" ||
        e.key === "PageUp" ||
        e.key.toLowerCase() === "k" ||
        e.key.toLowerCase() === "w"
      ) {
        e.preventDefault();
        goToPrev();
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "m") {
        setIsMuted((m) => !m);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, videos.length]);

  // Touch Swipe Navigation Handlers
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const endY = e.changedTouches[0]?.clientY;
    const endX = e.changedTouches[0]?.clientX;
    if (endY === undefined || endX === undefined) return;

    const deltaY = touchStartY.current - endY;
    const deltaX = touchStartX.current - endX;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 40) {
      if (deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    touchStartY.current = null;
    touchStartX.current = null;
  };

  // Mouse Wheel Gesture Navigation
  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 380) return;
    if (e.deltaY > 35) {
      goToNext();
      lastWheelTime.current = now;
    } else if (e.deltaY < -35) {
      goToPrev();
      lastWheelTime.current = now;
    }
  };

  if (!isOpen || !currentVideo) return null;

  const targetId = currentVideo.public_id || currentVideo._id;
  const videoIdForRoute = currentVideo._id || encodeURIComponent(currentVideo.public_id || currentIndex);
  const currentLikes = likesMap[targetId] ?? (currentVideo.likes || 0);
  const isLiked = !!likedMap[targetId];
  const isSubscribed = !!subscribedMap[currentVideo.uploaderUid];

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      handleLike();
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    } else {
      togglePlay();
    }
    lastTapRef.current = now;
  };

  const handleLike = async () => {
    if (!currentVideo) return;
    if (isLiked) {
      setLikedMap((prev) => ({ ...prev, [targetId]: false }));
      setLikesMap((prev) => ({ ...prev, [targetId]: Math.max(0, (prev[targetId] || 1) - 1) }));
    } else {
      setLikedMap((prev) => ({ ...prev, [targetId]: true }));
      setLikesMap((prev) => ({ ...prev, [targetId]: (prev[targetId] || 0) + 1 }));
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 800);
      try {
        await apiLikeVideo(targetId);
      } catch (e) {
        console.warn("Reels like error:", e);
      }
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/livestreamingplatform/video/${videoIdForRoute}`;
    navigator.clipboard.writeText(url);
    message.success("Video link copied to clipboard!");
  };

  const handleSubscribe = async () => {
    if (!currentVideo.uploaderUid) return;
    try {
      const res = await toggleSubscribeUser(currentVideo.uploaderUid, currentUser?.uid);
      if (res?.success) {
        setSubscribedMap((prev) => ({ ...prev, [currentVideo.uploaderUid]: res.subscribed }));
        message.success(res.subscribed ? "Subscribed to creator!" : "Unsubscribed.");
      }
    } catch (e) {
      console.warn("Subscribe error:", e);
      setSubscribedMap((prev) => ({ ...prev, [currentVideo.uploaderUid]: !isSubscribed }));
    }
  };

  const openFullWatchPage = () => {
    onClose();
    navigate(`/livestreamingplatform/video/${videoIdForRoute}`);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(pct);
    }
  };

  const modalNode = (
    <div
      className="fixed inset-0 w-screen h-screen z-[99999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 select-none animate-fadeIn overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={handleWheel}
    >
      {/* Top Right Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center text-lg cursor-pointer transition-all border border-white/20 shadow-2xl hover:scale-105 active:scale-95"
        title="Close (Esc)"
      >
        <CloseOutlined />
      </button>

      {/* Floating Navigation Controls (Up / Down) */}
      <div className="flex flex-col gap-3 absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 z-40">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-base border border-white/20 shadow-2xl transition-all ${
            currentIndex === 0
              ? "bg-white/5 text-white/30 cursor-not-allowed"
              : "bg-white/15 hover:bg-white/30 text-white cursor-pointer hover:scale-105 active:scale-95"
          }`}
          title="Previous Video (Up Arrow / Swipe Down)"
        >
          <UpOutlined />
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex >= videos.length - 1}
          className={`w-11 h-11 rounded-full flex items-center justify-center text-base border border-white/20 shadow-2xl transition-all ${
            currentIndex >= videos.length - 1
              ? "bg-white/5 text-white/30 cursor-not-allowed"
              : "bg-white/15 hover:bg-white/30 text-white cursor-pointer hover:scale-105 active:scale-95"
          }`}
          title="Next Video (Down Arrow / Swipe Up)"
        >
          <DownOutlined />
        </button>
      </div>

      {/* Main Reels Phone Frame */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-[440px] h-[92vh] max-h-[860px] bg-[#0c0514] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between border border-white/15"
      >
        {/* Ambient Blurred Video Poster Backdrop (Fills vertical canvas for landscape videos) */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-2xl scale-125 opacity-35 pointer-events-none"
          style={{
            backgroundImage: `url(${currentVideo.coverImage || currentVideo.url})`,
          }}
        />

        {/* Top Header inside frame */}
        <div className="absolute top-0 inset-x-0 z-30 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between text-white pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-[11px] font-extrabold bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white border border-white/10 shadow">
              {currentIndex + 1} / {videos.length}
            </span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Aspect Ratio Toggle (Fit / Fill) */}
            <Tooltip title={fitMode === "contain" ? "Switch to Fill Screen" : "Switch to Fit Screen"}>
              <button
                onClick={() => setFitMode(fitMode === "contain" ? "cover" : "contain")}
                className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20 cursor-pointer text-[10px] font-bold transition-colors"
              >
                {fitMode === "contain" ? "Fit" : "Fill"}
              </button>
            </Tooltip>

            {/* Mute Toggle Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2 rounded-full border border-white/20 cursor-pointer text-sm transition-colors flex items-center justify-center w-8 h-8"
              title={isMuted ? "Unmute (M)" : "Mute (M)"}
            >
              {isMuted ? <MutedOutlined /> : <SoundOutlined />}
            </button>
          </div>
        </div>

        {/* Video Player Core */}
        <div
          className="relative w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
          onClick={handleTap}
        >
          <video
            ref={videoRef}
            key={currentVideo.url}
            src={currentVideo.url}
            poster={currentVideo.coverImage}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className={`w-full h-full relative z-10 ${
              fitMode === "cover" ? "object-cover" : "object-contain"
            }`}
          />

          {/* Pause / Play central indicator overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white text-3xl shadow-2xl">
                <PlayCircleFilled />
              </div>
            </div>
          )}

          {/* Double Tap Big Heart Animation */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-ping">
              <HeartFilled className="text-red-500 text-7xl drop-shadow-[0_0_25px_rgba(239,68,68,0.95)]" />
            </div>
          )}
        </div>

        {/* Right Floating Actions Column (Like, Full View, Share) */}
        <div className="absolute right-3.5 bottom-24 z-30 flex flex-col items-center gap-4 text-white">
          {/* Like Action */}
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-xl cursor-pointer border border-white/25 transition-transform active:scale-125 shadow-lg"
            >
              {isLiked ? (
                <HeartFilled className="text-red-500 drop-shadow" />
              ) : (
                <HeartOutlined className="text-white hover:text-red-400" />
              )}
            </button>
            <span className="text-xs font-bold text-white mt-1 drop-shadow">
              {currentLikes}
            </span>
          </div>

          {/* View Details / Full Watch Page Action */}
          <div className="flex flex-col items-center">
            <Tooltip title="Watch on standard page" placement="left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFullWatchPage();
                }}
                className="w-11 h-11 rounded-full bg-black/60 hover:bg-primary backdrop-blur-md flex items-center justify-center text-lg cursor-pointer border border-white/25 transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <ExportOutlined className="text-white" />
              </button>
            </Tooltip>
            <span className="text-[10px] font-semibold text-white mt-1 drop-shadow">
              Full View
            </span>
          </div>

          {/* Share Action */}
          <div className="flex flex-col items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-lg cursor-pointer border border-white/25 transition-transform active:scale-125 shadow-lg"
            >
              <ShareAltOutlined className="text-white" />
            </button>
            <span className="text-xs font-bold text-white mt-1 drop-shadow">Share</span>
          </div>
        </div>

        {/* Bottom Overlay: Creator, Title, Audio & Progress */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 pt-12 bg-gradient-to-t from-black/95 via-black/80 to-transparent text-white flex flex-col gap-2">
          {/* Creator Profile Row */}
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (currentVideo.uploaderUid) {
                  onClose();
                  navigate(`/livestreamingplatform/profile/${currentVideo.uploaderUid}`);
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer group/user"
            >
              <Avatar
                size={38}
                src={currentVideo.uploaderPic}
                className="bg-primary border-2 border-white/30 flex-shrink-0 shadow"
              >
                {currentVideo.uploaderName?.charAt(0).toUpperCase() || "U"}
              </Avatar>
              <div className="min-w-0">
                <span className="font-extrabold text-sm text-white group-hover/user:text-secondary transition-colors block truncate drop-shadow">
                  {currentVideo.uploaderName || "Touch Creator"}
                </span>
                <span className="text-[11px] text-white/80 block drop-shadow">
                  {currentVideo.views || 0} views
                </span>
              </div>
            </div>

            {/* Subscribe Pill Button */}
            {currentVideo.uploaderUid && currentVideo.uploaderUid !== currentUser?.uid && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubscribe();
                }}
                className={`px-3.5 py-1 rounded-full text-xs font-extrabold transition-all border cursor-pointer flex items-center gap-1 shadow-md ${
                  isSubscribed
                    ? "bg-white/20 border-white/30 text-white hover:bg-white/30"
                    : "bg-primary hover:bg-secondary text-white border-transparent shadow-primary/40"
                }`}
              >
                {isSubscribed ? (
                  <>
                    <CheckOutlined className="text-[10px]" /> Subscribed
                  </>
                ) : (
                  <>
                    <UserAddOutlined className="text-[10px]" /> Subscribe
                  </>
                )}
              </button>
            )}
          </div>

          {/* Video Title & Description */}
          <div className="mt-1">
            <h3
              onClick={(e) => {
                e.stopPropagation();
                openFullWatchPage();
              }}
              className="text-sm font-bold text-white line-clamp-2 leading-snug cursor-pointer hover:text-secondary transition-colors drop-shadow"
            >
              {currentVideo.title || "Untitled Video"}
            </h3>
            {currentVideo.description && (
              <p className="text-xs text-white/85 line-clamp-1 mt-0.5 font-normal drop-shadow">
                {currentVideo.description}
              </p>
            )}
          </div>

          {/* Audio Tag Ticker */}
          <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium pt-1 drop-shadow">
            <SoundOutlined />
            <span className="truncate">Touch Live Original Sound • Real-time WebRTC</span>
          </div>

          {/* Bottom Progress Bar */}
          <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};

ReelsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  videos: PropTypes.arrayOf(PropTypes.object),
  initialIndex: PropTypes.number,
};

export default ReelsModal;