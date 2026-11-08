import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";
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
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  PlayCircleFilled,
  ReloadOutlined,
  MoreOutlined,
  ShareAltOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import socket from "../../socket";
import { getAllVideos } from "../../api/videos";

const Browse = ({ defaultTab }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isVideosRoute = location.pathname.includes("/videos") || defaultTab === "videos";

  const [streams, setStreams] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(isVideosRoute ? "videos" : "all");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setSearchQuery(q);
  }, [location.search]);

  useEffect(() => {
    if (isVideosRoute) {
      setActiveTab("videos");
    }
  }, [location.pathname, isVideosRoute]);

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
      setError("Failed to load videos. Please check backend server connection.");
    } finally {
      setLoading(false);
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

  const totalContentCount = filteredStreams.length + filteredVideos.length;

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
            onClick={fetchData}
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
          {/* Section 1: Live Broadcasts */}
          {(activeTab === "all" || activeTab === "live") && filteredStreams.length > 0 && (
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

          {/* Section 2: Uploaded Videos */}
          {(activeTab === "all" || activeTab === "videos") && (
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
                        <div
                          onClick={() => navigate(`/livestreamingplatform/video/${videoId}`)}
                          className="bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col"
                        >
                          {/* Video Thumbnail */}
                          <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                            <img
                              src={vid.coverImage || vid.url}
                              alt={vid.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            {/* Hover Play Button Overlay */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <PlayCircleFilled className="text-4xl text-white drop-shadow-lg transform scale-90 group-hover:scale-100 transition-transform" />
                            </div>

                            {/* Duration Badge bottom-right (only if real duration exists) */}
                            {vid.duration && vid.duration !== "0:00" && (
                              <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
                                {vid.duration}
                              </div>
                            )}
                          </div>

                          {/* Video Info Details */}
                          <div className="p-3.5 flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <Avatar
                                size={34}
                                className="bg-primary text-white font-bold flex-shrink-0 mt-0.5"
                              >
                                {vid.uploaderName?.charAt(0).toUpperCase() || "U"}
                              </Avatar>
                              <div className="min-w-0">
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

                            <Dropdown
                              menu={{
                                items: [
                                  {
                                    key: "share",
                                    label: "Share Video",
                                    icon: <ShareAltOutlined />,
                                    onClick: (e) => {
                                      e.domEvent.stopPropagation();
                                      navigator.clipboard.writeText(
                                        `${window.location.origin}/livestreamingplatform/video/${videoId}`
                                      );
                                    },
                                  },
                                  {
                                    key: "copy",
                                    label: "Copy Link",
                                    icon: <LinkOutlined />,
                                    onClick: (e) => {
                                      e.domEvent.stopPropagation();
                                      navigator.clipboard.writeText(vid.url);
                                    },
                                  },
                                ],
                              }}
                              trigger={["click"]}
                            >
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="text-text hover:text-darkPurple p-1 rounded-md"
                              >
                                <MoreOutlined />
                              </button>
                            </Dropdown>
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
    </div>
  );
};

Browse.propTypes = {
  defaultTab: PropTypes.string,
};

export default Browse;
