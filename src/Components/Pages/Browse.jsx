import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Input,
  Row,
  Col,
  Skeleton,
  Empty,
  Avatar,
  Alert,
  Button,
  Dropdown,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  PlayCircleFilled,
  ReloadOutlined,
  MoreOutlined,
  ShareAltOutlined,
  LinkOutlined,
  UsergroupAddOutlined,
  ExportOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import socket from "../../socket";
import { getAllVideos } from "../../api/videos";
import { getSubscribedChannels } from "../../api/profile";
import ReelsModal from "../Common/ReelsModal";

const Browse = ({ defaultTab }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.firebaseUser);

  const queryParams = new URLSearchParams(location.search);
  const initialTab =
    queryParams.get("tab") ||
    (location.pathname.includes("/videos") || defaultTab === "videos" ? "videos" : "all");

  const [streams, setStreams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);

  // Reels Modal State
  const [reelsOpen, setReelsOpen] = useState(false);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || params.get("search");
    if (q) setSearchQuery(q);

    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [location.search]);

  useEffect(() => {
    if (location.pathname.includes("/videos") || defaultTab === "videos") {
      setActiveTab("videos");
    }
  }, [location.pathname, defaultTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      socket.emit("get-streams");

      const videoRes = await getAllVideos();
      if (videoRes?.data?.videos) {
        setVideos(videoRes.data.videos);
      } else if (Array.isArray(videoRes?.videos)) {
        setVideos(videoRes.videos);
      } else if (Array.isArray(videoRes)) {
        setVideos(videoRes);
      }
    } catch (err) {
      console.error("Error fetching browse data:", err);
      setError("Failed to load content. Please check backend server connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    if (!currentUser?.uid) return;
    setLoadingSubscriptions(true);
    try {
      const res = await getSubscribedChannels(currentUser.uid);
      if (res?.channels) {
        setSubscribedChannels(res.channels);
      }
    } catch (err) {
      console.warn("Error fetching subscriptions:", err);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleStreamList = (data) => {
      if (data?.liveStreams) {
        setStreams(data.liveStreams);
      }
    };

    const handleUpdateStreams = (updatedList) => {
      if (Array.isArray(updatedList)) {
        setStreams(updatedList);
      }
    };

    socket.on("stream-list", handleStreamList);
    socket.on("update-streams", handleUpdateStreams);

    return () => {
      socket.off("stream-list", handleStreamList);
      socket.off("update-streams", handleUpdateStreams);
    };
  }, []);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchSubscriptions();
    } else {
      setSubscribedChannels([]);
    }
  }, [currentUser]);

  const filteredStreams = streams.filter(
    (s) =>
      s.streamTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.streamerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = videos.filter(
    (v) =>
      v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.uploaderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Subscribed content filtering
  const subscribedUids = new Set(subscribedChannels.map((c) => c.uid));
  const subscribedStreams = filteredStreams.filter((s) =>
    subscribedUids.has(s.id || s.streamerId)
  );
  const subscribedVideos = filteredVideos.filter((v) =>
    subscribedUids.has(v.uploaderUid)
  );

  const totalContentCount = filteredStreams.length + filteredVideos.length;

  const openReelAt = (idx) => {
    setSelectedReelIndex(idx);
    setReelsOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-darkPurple tracking-tight mb-1">
            Explore Streams
          </h1>
          <p className="text-xs sm:text-sm text-text">
            Watch live broadcasts and uploaded videos from creators.
          </p>
        </div>

        {/* Search & Refresh Actions */}
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search streams or videos..."
            prefix={<SearchOutlined className="text-text mr-1" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-full border-border h-10 text-xs focus:border-primary"
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchData();
              if (currentUser?.uid) fetchSubscriptions();
            }}
            className="rounded-full border-border text-darkPurple hover:text-primary hover:border-primary h-10 px-4 font-semibold text-xs flex items-center gap-1.5"
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          message="Connection Notice"
          description={error}
          type="warning"
          showIcon
          className="rounded-xl border border-amber-200"
        />
      )}

      {/* Filter Tabs / Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "all"
              ? "bg-primary text-white shadow-md shadow-primary/25"
              : "bg-card text-text hover:text-darkPurple border border-border"
          }`}
        >
          All Content ({totalContentCount})
        </button>

        <button
          onClick={() => setActiveTab("live")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "live"
              ? "bg-primary text-white shadow-md shadow-primary/25"
              : "bg-card text-text hover:text-darkPurple border border-border"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Live ({filteredStreams.length})
        </button>

        <button
          onClick={() => setActiveTab("videos")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "videos"
              ? "bg-primary text-white shadow-md shadow-primary/25"
              : "bg-card text-text hover:text-darkPurple border border-border"
          }`}
        >
          Videos ({filteredVideos.length})
        </button>

        {/* Subscriptions Tab */}
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "subscriptions"
              ? "bg-primary text-white shadow-md shadow-primary/25"
              : "bg-card text-text hover:text-darkPurple border border-border"
          }`}
        >
          <UsergroupAddOutlined />
          Subscriptions {currentUser ? `(${subscribedChannels.length})` : ""}
        </button>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <Row gutter={[20, 20]}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Col xs={24} sm={12} md={8} lg={6} key={n}>
              <div className="bg-card rounded-2xl border border-border p-3 space-y-3">
                <Skeleton.Node active style={{ width: "100%", height: 160, borderRadius: 12 }} />
                <Skeleton active paragraph={{ rows: 1 }} />
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Main Grid View */}
      {!loading && (
        <div>
          {/* ========================================================================= */}
          {/* TAB: SUBSCRIPTIONS VIEW                                                  */}
          {/* ========================================================================= */}
          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              {!currentUser ? (
                <div className="bg-card rounded-2xl border border-border text-center py-16 px-4">
                  <Empty
                    description={
                      <div className="space-y-3">
                        <span className="text-darkPurple font-bold text-base block">
                          Login to see your subscriptions
                        </span>
                        <span className="text-xs text-text block max-w-md mx-auto">
                          Follow your favorite creators to see their latest live streams and video uploads all in one place.
                        </span>
                        <Button
                          type="primary"
                          onClick={() => navigate("/login")}
                          className="bg-primary hover:bg-secondary border-none rounded-xl font-bold px-6 h-10 mt-2"
                        >
                          Login Now
                        </Button>
                      </div>
                    }
                  />
                </div>
              ) : subscribedChannels.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border text-center py-16 px-4">
                  <Empty
                    description={
                      <div className="space-y-3">
                        <span className="text-darkPurple font-bold text-base block">
                          No Subscribed Channels Yet
                        </span>
                        <span className="text-xs text-text block max-w-md mx-auto">
                          You haven't subscribed to any creators yet. Explore live streams or videos and click "Subscribe" to follow them!
                        </span>
                        <Button
                          type="primary"
                          onClick={() => setActiveTab("all")}
                          className="bg-primary hover:bg-secondary border-none rounded-xl font-bold px-6 h-10 mt-2"
                        >
                          Explore Creators
                        </Button>
                      </div>
                    }
                  />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Subscribed Creators Carousel Row */}
                  <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                    <h3 className="text-sm font-bold text-darkPurple mb-3 flex items-center gap-2">
                      <UsergroupAddOutlined className="text-primary" />
                      <span>Subscribed Creators ({subscribedChannels.length})</span>
                    </h3>
                    <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                      {subscribedChannels.map((channel) => {
                        const isLive = streams.some((s) => (s.id || s.streamerId) === channel.uid);
                        return (
                          <div
                            key={channel.uid}
                            onClick={() => navigate(`/livestreamingplatform/profile/${channel.uid}`)}
                            className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group w-20 text-center"
                          >
                            <div className="relative">
                              <Avatar
                                size={54}
                                src={channel.profilePic}
                                className={`border-2 transition-transform group-hover:scale-105 ${
                                  isLive
                                    ? "border-red-500 ring-2 ring-red-400 ring-offset-2 animate-pulse"
                                    : "border-primary/40 group-hover:border-primary"
                                }`}
                              >
                                {channel.name?.charAt(0).toUpperCase() || "C"}
                              </Avatar>
                              {isLive && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter shadow">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-darkPurple group-hover:text-primary transition-colors truncate max-w-full">
                              {channel.name}
                            </span>
                            <span className="text-[10px] text-text">
                              {channel.subscribersCount || channel.subscribers?.length || 0} subs
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subscribed Channels Live Streams */}
                  {subscribedStreams.length > 0 && (
                    <div>
                      <h3 className="text-base font-bold text-darkPurple mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                        Live Now From Subscriptions ({subscribedStreams.length})
                      </h3>
                      <Row gutter={[20, 20]}>
                        {subscribedStreams.map((stream) => {
                          const streamId = stream.id || stream.streamerId;
                          return (
                            <Col xs={24} sm={12} md={8} lg={6} key={streamId}>
                              <div
                                onClick={() => navigate(`/livestreamingplatform/watch/${streamId}`)}
                                className="bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col"
                              >
                                <div className="relative w-full aspect-video bg-navy overflow-hidden flex items-center justify-center">
                                  {stream.profilePic ? (
                                    <img
                                      src={stream.profilePic}
                                      alt={stream.streamTitle}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <PlayCircleFilled className="text-4xl text-primary" />
                                  )}
                                  <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                    LIVE
                                  </div>
                                </div>
                                <div className="p-3.5 flex items-start gap-2.5">
                                  <Avatar size={34} src={stream.profilePic} className="bg-primary flex-shrink-0">
                                    {stream.streamerName?.charAt(0).toUpperCase() || "S"}
                                  </Avatar>
                                  <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-darkPurple truncate group-hover:text-primary">
                                      {stream.streamTitle || "Live Stream"}
                                    </h4>
                                    <p className="text-xs text-text truncate">{stream.streamerName}</p>
                                  </div>
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}

                  {/* Subscribed Channels Videos */}
                  <div>
                    <h3 className="text-base font-bold text-darkPurple mb-3">
                      Videos From Your Subscriptions ({subscribedVideos.length})
                    </h3>
                    {subscribedVideos.length === 0 ? (
                      <div className="bg-card rounded-2xl border border-border text-center py-8 text-xs text-text">
                        No videos uploaded yet by your subscribed channels.
                      </div>
                    ) : (
                      <Row gutter={[20, 20]}>
                        {subscribedVideos.map((vid, idx) => {
                          const videoId = vid._id || encodeURIComponent(vid.public_id || idx);
                          return (
                            <Col xs={24} sm={12} md={8} lg={6} key={vid._id || vid.public_id || idx}>
                              <div className="bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col">
                                {/* Thumbnail: Opens Reels View */}
                                <div
                                  onClick={() => openReelAt(idx)}
                                  className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center cursor-pointer"
                                  title="Click video to watch as Reel"
                                >
                                  <img
                                    src={vid.coverImage || vid.url}
                                    alt={vid.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/90 text-white flex items-center justify-center text-xl shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                      <PlayCircleFilled />
                                    </div>
                                  </div>
                                </div>

                                {/* Details Area: Opens Full Watch Page */}
                                <div
                                  onClick={() => navigate(`/livestreamingplatform/video/${videoId}`)}
                                  className="p-3.5 flex items-start justify-between gap-2 cursor-pointer hover:bg-white/5 transition-colors"
                                  title="Click details for full watch page"
                                >
                                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                    <Avatar size={34} src={vid.uploaderPic} className="bg-primary text-white font-bold flex-shrink-0 mt-0.5">
                                      {vid.uploaderName?.charAt(0).toUpperCase() || "U"}
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-sm font-bold text-darkPurple truncate hover:text-primary transition-colors leading-snug">
                                        {vid.title || "Untitled Video"}
                                      </h4>
                                      <p className="text-xs text-text truncate mt-0.5">{vid.uploaderName}</p>
                                    </div>
                                  </div>
                                  <Tooltip title="Watch on standard page">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/livestreamingplatform/video/${videoId}`);
                                      }}
                                      className="text-text hover:text-primary p-1.5 rounded-lg border-none bg-transparent cursor-pointer"
                                    >
                                      <ExportOutlined />
                                    </button>
                                  </Tooltip>
                                </div>
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ALL CONTENT OR LIVE (SECTION 1: LIVE BROADCASTS)                      */}
          {/* ========================================================================= */}
          {activeTab !== "subscriptions" && (activeTab === "all" || activeTab === "live") && filteredStreams.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-darkPurple mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                Live Now ({filteredStreams.length})
              </h3>
              <Row gutter={[20, 20]}>
                {filteredStreams.map((stream) => {
                  const streamId = stream.id || stream.streamerId;
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={streamId}>
                      <div
                        onClick={() => navigate(`/livestreamingplatform/watch/${streamId}`)}
                        className="bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col"
                      >
                        {/* Thumbnail Container */}
                        <div className="relative w-full aspect-video bg-navy overflow-hidden flex items-center justify-center">
                          {stream.profilePic ? (
                            <img
                              src={stream.profilePic}
                              alt={stream.streamTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-white text-center">
                              <PlayCircleFilled className="text-4xl text-primary" />
                            </div>
                          )}

                          {/* LIVE badge top-left */}
                          <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            LIVE
                          </div>

                          {/* Viewers badge bottom-right */}
                          <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <EyeOutlined className="text-secondary" />
                            <span>{stream.viewers || 0}</span>
                          </div>
                        </div>

                        {/* Stream Info Body */}
                        <div className="p-3.5 flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <Avatar
                              src={stream.profilePic}
                              size={34}
                              className="bg-primary flex-shrink-0 mt-0.5"
                            >
                              {stream.streamerName?.charAt(0).toUpperCase() || "S"}
                            </Avatar>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-darkPurple truncate group-hover:text-primary transition-colors leading-snug">
                                {stream.streamTitle || "Live Stream Session"}
                              </h4>
                              <p className="text-xs text-text truncate mt-0.5">
                                {stream.streamerName || "Live Streamer"}
                              </p>
                              <span className="text-[11px] text-text/80">
                                {stream.viewers || 0} watching now
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="text-text hover:text-darkPurple p-1 rounded-md"
                          >
                            <MoreOutlined />
                          </button>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ALL CONTENT OR VIDEOS (SECTION 2: UPLOADED VIDEOS)                   */}
          {/* ========================================================================= */}
          {activeTab !== "subscriptions" && (activeTab === "all" || activeTab === "videos") && (
            <div>
              {activeTab === "all" && filteredStreams.length > 0 && (
                <h3 className="text-lg font-bold text-darkPurple mb-4">
                  Videos & Replays ({filteredVideos.length})
                </h3>
              )}

              {filteredVideos.length === 0 && filteredStreams.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border text-center py-16 px-4">
                  <Empty
                    description={
                      <div className="space-y-2">
                        <span className="text-darkPurple font-bold text-base block">
                          No content found
                        </span>
                        <span className="text-xs text-text block">
                          Upload videos from your profile or start a broadcast to share content.
                        </span>
                      </div>
                    }
                  />
                </div>
              ) : (
                <Row gutter={[20, 20]}>
                  {filteredVideos.map((vid, idx) => {
                    const videoId = vid._id || encodeURIComponent(vid.public_id || idx);
                    const viewsText = `${vid.views || 0} views`;
                    const dateText = vid.createdAt
                      ? new Date(vid.createdAt).toLocaleDateString()
                      : "";

                    return (
                      <Col xs={24} sm={12} md={8} lg={6} key={vid._id || vid.public_id || idx}>
                        <div className="bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col">
                          {/* Video Thumbnail: Clicking opens Instagram Reels Viewer */}
                          <div
                            onClick={() => openReelAt(idx)}
                            className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center cursor-pointer"
                            title="Click video to watch as Reel"
                          >
                            <img
                              src={vid.coverImage || vid.url}
                              alt={vid.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />

                            {/* Reels Play Indicator Overlay on Hover */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-primary/95 text-white flex items-center justify-center text-xl shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                <PlayCircleFilled />
                              </div>
                            </div>

                            {/* Duration Badge bottom-right */}
                            {vid.duration && vid.duration !== "0:00" && (
                              <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                                {vid.duration}
                              </div>
                            )}
                          </div>

                          {/* Video Info Details: Clicking opens Standard Full Watch Page */}
                          <div
                            onClick={() => navigate(`/livestreamingplatform/video/${videoId}`)}
                            className="p-3.5 flex items-start justify-between gap-2 cursor-pointer hover:bg-black/[0.02] transition-colors"
                            title="Click details to view full watch page"
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <Avatar
                                size={34}
                                src={vid.uploaderPic}
                                className="bg-primary text-white font-bold flex-shrink-0 mt-0.5"
                              >
                                {vid.uploaderName?.charAt(0).toUpperCase() || "U"}
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-darkPurple truncate group-hover:text-primary transition-colors leading-snug">
                                  {vid.title || "Untitled Video"}
                                </h4>
                                <p className="text-xs text-text truncate mt-0.5">
                                  {vid.uploaderName || "Touch Live Streamer"}
                                </p>
                                <span className="text-[11px] text-text/80">
                                  {viewsText} {dateText ? `• ${dateText}` : ""}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {/* Dedicated Icon to open standard YouTube-style full watch page */}
                              <Tooltip title="Watch on standard page">
                                <button
                                  onClick={() => navigate(`/livestreamingplatform/video/${videoId}`)}
                                  className="text-text hover:text-primary p-1.5 rounded-lg border-none bg-transparent cursor-pointer transition-colors"
                                  title="Watch on standard page"
                                >
                                  <ExportOutlined className="text-sm" />
                                </button>
                              </Tooltip>

                              <Dropdown
                                menu={{
                                  items: [
                                    {
                                      key: "watch-reel",
                                      label: "Watch as Reel",
                                      icon: <ThunderboltFilled className="text-primary" />,
                                      onClick: () => openReelAt(idx),
                                    },
                                    {
                                      key: "watch-full",
                                      label: "Open Full Watch Page",
                                      icon: <ExportOutlined />,
                                      onClick: () => navigate(`/livestreamingplatform/video/${videoId}`),
                                    },
                                    {
                                      key: "share",
                                      label: "Share Video",
                                      icon: <ShareAltOutlined />,
                                      onClick: () => {
                                        navigator.clipboard.writeText(
                                          `${window.location.origin}/livestreamingplatform/video/${videoId}`
                                        );
                                      },
                                    },
                                    {
                                      key: "copy",
                                      label: "Copy Raw URL",
                                      icon: <LinkOutlined />,
                                      onClick: () => {
                                        navigator.clipboard.writeText(vid.url);
                                      },
                                    },
                                  ],
                                }}
                                trigger={["click"]}
                              >
                                <button
                                  className="text-text hover:text-darkPurple p-1 rounded-md border-none bg-transparent cursor-pointer"
                                >
                                  <MoreOutlined />
                                </button>
                              </Dropdown>
                            </div>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instagram Reels Fullscreen Modal */}
      <ReelsModal
        isOpen={reelsOpen}
        onClose={() => setReelsOpen(false)}
        videos={filteredVideos}
        initialIndex={selectedReelIndex}
      />
    </div>
  );
};

Browse.propTypes = {
  defaultTab: PropTypes.string,
};

export default Browse;