import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, Avatar, Spin, message, Empty } from "antd";
import {
  ArrowLeftOutlined,
  LikeOutlined,
  LikeFilled,
  ShareAltOutlined,
  DownloadOutlined,
  CheckOutlined,
  PlayCircleFilled,
} from "@ant-design/icons";
import { getAllVideos, likeVideo as apiLikeVideo, recordVideoView } from "../../api/videos";
import { getUserProfile, toggleSubscribeUser } from "../../api/profile";

const VideoWatchPage = () => {
  const params = useParams();
  const id = params.id || params["*"];
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.user.firebaseUser);

  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [activeTab, setActiveTab] = useState("upnext");

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
        const res = await getAllVideos();
        let list = [];
        if (res?.data?.videos) {
          list = res.data.videos;
        } else if (Array.isArray(res?.videos)) {
          list = res.videos;
        } else if (Array.isArray(res)) {
          list = res;
        }

        setAllVideos(list);

        const decodedId = id ? decodeURIComponent(id) : "";
        const found = list.find((v) => 
          v._id === id || 
          v.public_id === id || 
          (decodedId && (v._id === decodedId || v.public_id === decodedId))
        ) || list[0] || null;
        setVideo(found);

        if (found) {
          setLikesCount(found.likes || 0);
          setViewsCount((found.views || 0) + 1);

          // Record view in database
          const targetId = found.public_id || found._id;
          if (targetId) {
            recordVideoView(targetId).catch((e) => console.warn("View record notice:", e));
          }

          // Fetch uploader's channel profile for real subscribers count
          if (found.uploaderUid) {
            try {
              const profRes = await getUserProfile(found.uploaderUid);
              if (profRes?.data?.user) {
                const u = profRes.data.user;
                setSubscribersCount(u.subscribersCount || u.subscribers?.length || 0);
                if (currentUser && u.subscribers?.includes(currentUser.uid)) {
                  setIsSubscribed(true);
                }
              }
            } catch (err) {
              console.warn("Could not fetch channel profile:", err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load video:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!video) return;
    const targetId = video.public_id || video._id;
    if (liked) {
      setLikesCount((prev) => Math.max(0, prev - 1));
      setLiked(false);
    } else {
      setLikesCount((prev) => prev + 1);
      setLiked(true);
      message.success("Liked video!");
      if (targetId) {
        try {
          const res = await apiLikeVideo(targetId);
          if (res?.likes !== undefined) setLikesCount(res.likes);
        } catch (e) {
          console.warn("Error liking video:", e);
        }
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success("Video link copied to clipboard!");
  };

  const handleSubscribe = async () => {
    if (!video?.uploaderUid) return;
    try {
      const res = await toggleSubscribeUser(video.uploaderUid, currentUser?.uid);
      if (res?.success) {
        setIsSubscribed(res.subscribed);
        if (res.subscribersCount !== undefined) {
          setSubscribersCount(res.subscribersCount);
        } else {
          setSubscribersCount((prev) => (res.subscribed ? prev + 1 : Math.max(0, prev - 1)));
        }
        message.success(res.subscribed ? "Subscribed to channel!" : "Unsubscribed from channel.");
      }
    } catch (e) {
      console.warn("Subscribe error:", e);
      setIsSubscribed(!isSubscribed);
      setSubscribersCount((prev) => (!isSubscribed ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spin size="large" />
      </div>
    );
  }

  const currentTitle = video?.title || "Untitled Video";
  const currentUrl = video?.url || "";
  const uploaderName = video?.uploaderName || "Streamer";
  const uploadDate = video?.createdAt ? new Date(video.createdAt).toLocaleDateString() : "";
  const description = video?.description || "No description provided.";
  const relatedVideos = allVideos.filter((v) => (v._id || v.public_id) !== (video?._id || video?.public_id));

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between pb-2">
        <Button
          type="text"
          icon={<ArrowLeftOutlined className="text-base" />}
          onClick={() => navigate("/livestreamingplatform")}
          className="text-darkPurple hover:text-primary font-bold text-base flex items-center gap-2 p-0 h-auto hover:bg-transparent"
        >
          Watch Video
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Video Player & Meta Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Video Frame */}
          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border border-navy relative flex items-center justify-center">
            {currentUrl ? (
              <video
                src={currentUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-8 text-white">
                <PlayCircleFilled className="text-6xl text-primary mb-3" />
                <p className="font-semibold text-lg">{currentTitle}</p>
                <p className="text-xs text-text">Video preview stream ready</p>
              </div>
            )}
          </div>

          {/* Title and Action Row */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-darkPurple tracking-tight leading-snug">
              {currentTitle}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 text-xs sm:text-sm text-text">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-darkPurple">{uploaderName}</span>
                <span>•</span>
                <span>{viewsCount} views</span>
                {uploadDate && (
                  <>
                    <span>•</span>
                    <span>{uploadDate}</span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleLike}
                  className={`rounded-xl border font-semibold flex items-center gap-1.5 h-9 px-3.5 ${
                    liked
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-darkPurple hover:text-primary hover:border-primary"
                  }`}
                >
                  {liked ? <LikeFilled /> : <LikeOutlined />}
                  <span>{likesCount}</span>
                </Button>

                <Button
                  onClick={handleShare}
                  className="rounded-xl border border-border text-darkPurple hover:text-primary hover:border-primary font-semibold flex items-center gap-1.5 h-9 px-3.5"
                >
                  <ShareAltOutlined />
                  <span>Share</span>
                </Button>

                {currentUrl && (
                  <a href={currentUrl} download target="_blank" rel="noopener noreferrer">
                    <Button className="rounded-xl border border-border text-darkPurple hover:text-primary hover:border-primary font-semibold flex items-center gap-1.5 h-9 px-3.5">
                      <DownloadOutlined />
                      <span>Download</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Channel Row & Subscribe */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar
                size={46}
                className="bg-gradient-to-tr from-primary to-secondary text-white font-bold text-base"
              >
                {uploaderName.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <h3 className="font-extrabold text-darkPurple text-sm sm:text-base leading-tight">
                  {uploaderName}
                </h3>
                <span className="text-xs text-text">{subscribersCount} subscribers</span>
              </div>
            </div>

            <Button
              onClick={handleSubscribe}
              className={`rounded-xl font-bold h-10 px-5 transition-all ${
                isSubscribed
                  ? "bg-background text-text border-border hover:bg-slate-200"
                  : "bg-primary hover:bg-secondary text-white border-none shadow-md shadow-primary/25"
              }`}
            >
              {isSubscribed ? (
                <span className="flex items-center gap-1.5">
                  <CheckOutlined /> Subscribed
                </span>
              ) : (
                "Subscribe"
              )}
            </Button>
          </div>

          {/* Description Box */}
          <div className="p-4 rounded-2xl bg-card border border-border text-xs sm:text-sm text-text shadow-sm">
            <p className={showFullDesc ? "" : "line-clamp-2"}>
              {description}
            </p>
            {description.length > 100 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-2 text-xs font-bold text-primary hover:underline block"
              >
                {showFullDesc ? "Show less ▴" : "Show more ▾"}
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Col: Up Next & Related Videos */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-card p-1.5 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("upnext")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "upnext"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text hover:text-darkPurple"
              }`}
            >
              Up Next
            </button>
            <button
              onClick={() => setActiveTab("related")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === "related"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text hover:text-darkPurple"
              }`}
            >
              Related
            </button>
          </div>

          {/* Video List */}
          <div className="space-y-3">
            {relatedVideos.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-6 text-center text-text text-xs">
                <Empty description="No other videos available" />
              </div>
            ) : (
              relatedVideos.slice(0, 8).map((item, index) => {
                const itemTitle = item.title || "Untitled Video";
                const itemTime = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "";
                const itemViews = `${item.views || 0} views`;

                return (
                  <div
                    key={item._id || item.public_id || index}
                    onClick={() => {
                      setVideo(item);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex gap-3 p-2.5 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md cursor-pointer transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-32 h-20 rounded-lg bg-navy overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img
                        src={item.coverImage || item.url}
                        alt={itemTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <PlayCircleFilled className="text-white text-2xl absolute opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow" />
                      {item.duration && item.duration !== "0:00" && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {item.duration}
                        </span>
                      )}
                    </div>

                    {/* Title and stats */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="text-xs sm:text-sm font-bold text-darkPurple line-clamp-2 group-hover:text-primary transition-colors mb-1 leading-tight">
                        {itemTitle}
                      </h4>
                      <span className="text-[11px] text-text truncate block">
                        {item.uploaderName || "Streamer"}
                      </span>
                      <span className="text-[11px] text-text/80">
                        {itemViews} {itemTime ? `• ${itemTime}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoWatchPage;
