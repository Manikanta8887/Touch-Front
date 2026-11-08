import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Input,
  Button,
  Avatar,
  message,
  Progress,
  Modal,
  Row,
  Col,
  Tabs,
  Empty,
  Skeleton,
  Dropdown,
  List,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
  VideoCameraFilled,
  PlaySquareFilled,
  CameraFilled,
  InboxOutlined,
  MoreOutlined,
  PlayCircleFilled,
  MessageFilled,
  UsergroupAddOutlined,
  ExportOutlined,
  ThunderboltFilled,
  CheckOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../Redux/userSlice.js";
import { useParams, useNavigate } from "react-router-dom";
import { Auth } from "../Firebase/Firebaseconfig";
import { getUserProfile, updateUserProfile, getSubscribedChannels, toggleSubscribeUser } from "../../api/profile";
import { getUserVideos, getAllVideos, uploadVideo, deleteVideo } from "../../api/videos";
import { getPastStreams, getStreamChat } from "../../api/streams";
import ReelsModal from "../Common/ReelsModal";

const MAX_STORAGE = 1024 * 1024 * 1024; // 1 GB allocation

export default function ProfilePage() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loggedInUser = useSelector((s) => s.user.firebaseUser);
  const reduxBio = useSelector((s) => s.user.bio);
  
  const authUser = Auth?.currentUser;
  const currentUser = loggedInUser || authUser;
  const isPublic = Boolean(uid && uid !== currentUser?.uid);
  const targetUid = isPublic ? uid : currentUser?.uid;

  const [profileData, setProfileData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [pastStreams, setPastStreams] = useState([]);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Reels Modal State
  const [reelsOpen, setReelsOpen] = useState(false);
  const [selectedReelIndex, setSelectedReelIndex] = useState(0);

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [profilePicInput, setProfilePicInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Upload Video Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");

  // Stream Session Modal State
  const [selectedStreamModal, setSelectedStreamModal] = useState(null);
  const [streamChatMessages, setStreamChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      if (isPublic && targetUid) {
        try {
          const profRes = await getUserProfile(targetUid);
          if (profRes?.data?.user) {
            setProfileData(profRes.data.user);
          } else {
            setProfileData({ uid: targetUid, name: "Streamer", bio: "", subscribersCount: 0 });
          }
        } catch (e) {
          console.warn("Could not fetch public profile:", e);
          setProfileData({ uid: targetUid, name: "Streamer", bio: "", subscribersCount: 0 });
        }
      } else if (currentUser) {
        setProfileData(currentUser);
        setNameInput(currentUser.displayName || "");
        setBioInput(reduxBio || "");
        setProfilePicInput(currentUser.photoURL || "");

        try {
          const res = await getUserProfile(currentUser.uid);
          if (res?.data?.user) {
            const u = res.data.user;
            setNameInput(u.name || currentUser.displayName || "");
            if (u.bio) setBioInput(u.bio);
            if (u.profilePic) setProfilePicInput(u.profilePic);
            setProfileData((prev) => ({ ...prev, ...u }));
          }
        } catch (e) {
          console.warn("Backend profile lookup:", e);
        }
      }

      // Fetch user videos
      try {
        let vRes;
        if (targetUid) {
          vRes = await getUserVideos(targetUid);
        } else {
          vRes = await getAllVideos();
        }

        if (Array.isArray(vRes?.data?.videos)) {
          setVideos(vRes.data.videos);
        } else if (Array.isArray(vRes?.videos)) {
          setVideos(vRes.videos);
        } else if (Array.isArray(vRes)) {
          setVideos(vRes);
        } else {
          setVideos([]);
        }
      } catch (e) {
        console.warn("Could not fetch user videos:", e);
        setVideos([]);
      }

      // Fetch past streams
      if (targetUid) {
        try {
          const streamRes = await getPastStreams(targetUid);
          if (Array.isArray(streamRes?.data?.streams)) {
            setPastStreams(streamRes.data.streams);
          } else if (Array.isArray(streamRes)) {
            setPastStreams(streamRes);
          } else {
            setPastStreams([]);
          }
        } catch (e) {
          console.warn("Could not fetch past streams:", e);
          setPastStreams([]);
        }

        // Fetch subscriptions
        try {
          const subRes = await getSubscribedChannels(targetUid);
          if (Array.isArray(subRes?.channels)) {
            setSubscribedChannels(subRes.channels);
          } else {
            setSubscribedChannels([]);
          }
        } catch (e) {
          console.warn("Could not fetch subscriptions for profile:", e);
          setSubscribedChannels([]);
        }
      }
    } catch (err) {
      console.error("Error loading profile details:", err);
    } finally {
      setLoading(false);
    }
  }, [isPublic, targetUid, currentUser, reduxBio]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const safeVideos = Array.isArray(videos) ? videos : [];
  const safePastStreams = Array.isArray(pastStreams) ? pastStreams : [];
  const safeSubscribedChannels = Array.isArray(subscribedChannels) ? subscribedChannels : [];

  const usedBytes = useMemo(() => {
    if (profileData?.storageUsed !== undefined && profileData?.storageUsed !== null) {
      return Number(profileData.storageUsed) || 0;
    }
    return safeVideos.reduce((sum, v) => sum + (Number(v?.sizeInBytes) || 0), 0);
  }, [profileData?.storageUsed, safeVideos]);

  const limitBytes = Number(profileData?.storageLimit) || MAX_STORAGE;
  const limitGB = Math.max(1, Math.round(limitBytes / (1024 * 1024 * 1024)));
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const storagePercent = Number.isFinite(usedBytes)
    ? Math.min(100, Math.max(0, parseFloat(((usedBytes / limitBytes) * 100).toFixed(1))))
    : 0;

  // Save Edited Profile
  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    setSavingProfile(true);
    try {
      const updatePayload = {
        name: nameInput.trim() || undefined,
        bio: bioInput.trim(),
        profilePic: profilePicInput.trim() || undefined,
      };
      const res = await updateUserProfile(currentUser.uid, updatePayload);
      if (res.success) {
        dispatch(updateUser(updatePayload));
        setProfileData((prev) => ({
          ...prev,
          bio: updatePayload.bio,
          name: updatePayload.name || prev?.name,
          displayName: updatePayload.name || prev?.displayName,
          profilePic: updatePayload.profilePic || prev?.profilePic,
          photoURL: updatePayload.profilePic || prev?.photoURL,
        }));
        message.success("Profile updated successfully!");
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error("Update profile error:", err);
      message.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Upload Video Submit
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      return message.warning("Please select a video file to upload.");
    }
    setUploading(true);
    try {
      const title = videoTitle.trim() || "Uploaded Video";
      const desc = videoDescription.trim();
      const userUid = currentUser?.uid || "guest";
      const res = await uploadVideo(userUid, selectedFile, title, desc);
      if (res.success && res.data && res.data.video) {
        setVideos((prev) => [res.data.video, ...(Array.isArray(prev) ? prev : [])]);
        message.success("Video uploaded successfully to Cloudinary!");
        setUploadModalOpen(false);
        setSelectedFile(null);
        setVideoTitle("");
        setVideoDescription("");
      }
    } catch (err) {
      console.error("Upload error:", err);
      message.error("Video upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Delete Video
  const handleDeleteVideo = async (publicId) => {
    try {
      const res = await deleteVideo(publicId);
      if (res.success) {
        setVideos((prev) => prev.filter((v) => v.public_id !== publicId));
        message.success("Video deleted successfully");
      }
    } catch (err) {
      console.error("Delete video error:", err);
      message.error("Failed to delete video.");
    }
  };

  // View Stream Session
  const handleViewStreamSession = async (st) => {
    setSelectedStreamModal(st);
    if (st.chatMessages && st.chatMessages.length > 0) {
      setStreamChatMessages(st.chatMessages);
      return;
    }
    if (st._id) {
      setLoadingChat(true);
      try {
        const chatRes = await getStreamChat(st._id);
        if (chatRes?.data?.chatMessages) {
          setStreamChatMessages(chatRes.data.chatMessages);
        } else {
          setStreamChatMessages([]);
        }
      } catch (err) {
        console.warn("Could not fetch chat for session:", err);
        setStreamChatMessages([]);
      } finally {
        setLoadingChat(false);
      }
    } else {
      setStreamChatMessages([]);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="bg-card rounded-2xl border border-border p-8">
          <Skeleton avatar active paragraph={{ rows: 4 }} />
        </div>
      </div>
    );
  }

  const displayName = profileData?.name || profileData?.displayName || currentUser?.displayName || "Streamer";
  const displayEmail = profileData?.email || currentUser?.email || "";
  const displayBio = profileData?.bio || (isPublic ? "No bio provided." : "Click 'Edit Profile' to add a custom bio.");
  const displayAvatar = profileData?.profilePic || profileData?.photoURL || currentUser?.photoURL || null;
  const subscribersCount = profileData?.subscribersCount || profileData?.subscribers?.length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg sm:text-xl flex-shrink-0">
            <UserOutlined />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-darkPurple tracking-tight">
            My Profile
          </h1>
        </div>

        {!isPublic && (
          <div className="flex items-center gap-3">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setNameInput(displayName);
                setBioInput(profileData?.bio || "");
                setProfilePicInput(displayAvatar || "");
                setEditModalOpen(true);
              }}
              className="rounded-xl border-border text-darkPurple font-semibold h-10 px-4 hover:border-primary hover:text-primary"
            >
              Edit Profile
            </Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalOpen(true)}
              className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl h-10 px-5 shadow-md shadow-primary/25"
            >
              Upload Video
            </Button>
          </div>
        )}
      </div>

      {/* Profile Hero Card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with status/camera */}
          <div className="relative">
            <Avatar
              size={96}
              src={displayAvatar}
              icon={<UserOutlined />}
              className="bg-primary border-4 border-card shadow-lg"
            />
            {!isPublic && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-card shadow-md hover:scale-105 transition-transform"
                title="Change Photo"
              >
                <CameraFilled className="text-xs" />
              </button>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-darkPurple tracking-tight">
              {displayName}
            </h2>
            {displayEmail && <p className="text-xs sm:text-sm text-text mt-0.5">{displayEmail}</p>}
            <p className="text-xs sm:text-sm text-text mt-3 leading-relaxed max-w-2xl">
              {displayBio}
            </p>
          </div>
        </div>
      </div>

      {/* 5 Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl flex-shrink-0">
              <PlaySquareFilled />
            </div>
            <div>
              <div className="text-xl font-black text-darkPurple">
                {safeVideos.length}
              </div>
              <div className="text-xs text-text font-semibold">Videos</div>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={8} lg={4}>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center text-xl flex-shrink-0">
              <VideoCameraFilled />
            </div>
            <div>
              <div className="text-xl font-black text-darkPurple">
                {safePastStreams.length}
              </div>
              <div className="text-xs text-text font-semibold">Streams</div>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
              <UsergroupAddOutlined />
            </div>
            <div>
              <div className="text-xl font-black text-darkPurple">
                {subscribersCount}
              </div>
              <div className="text-xs text-text font-semibold">Subscribers</div>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-primary flex items-center justify-center text-lg flex-shrink-0">
              <CheckOutlined />
            </div>
            <div>
              <div className="text-xl font-black text-darkPurple">
                {safeSubscribedChannels.length}
              </div>
              <div className="text-xs text-text font-semibold">Subscribed</div>
            </div>
          </div>
        </Col>

        <Col xs={24} sm={16} lg={6}>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col justify-center h-full">
            <div className="flex justify-between items-center text-xs sm:text-sm mb-2 font-bold">
              <span className="text-[#64748B] font-semibold">Storage Used</span>
              <span className="text-darkPurple font-black">{usedMB} MB / {limitGB} GB</span>
            </div>
            <Progress
              percent={storagePercent}
              strokeColor="#A34BD0"
              trailColor="#F1F5F9"
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="videos"
        className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm"
        items={[
          {
            key: "videos",
            label: (
              <span className="font-bold text-sm">
                Channel Videos ({safeVideos.length})
              </span>
            ),
            children: (
              <div className="mt-4">
                {safeVideos.length === 0 ? (
                  <div className="text-center py-12 text-text">
                    <Empty
                      description="No videos uploaded yet. Click 'Upload Video' above to upload your first clip!"
                    />
                  </div>
                ) : (
                  <Row gutter={[20, 20]}>
                    {safeVideos.map((vid, idx) => {
                      const videoId = vid._id || encodeURIComponent(vid.public_id || idx);
                      const dateText = vid.createdAt ? new Date(vid.createdAt).toLocaleDateString() : "";
                      const sizeMB = vid.sizeInBytes ? `${(vid.sizeInBytes / (1024 * 1024)).toFixed(1)} MB` : "0 MB";

                      return (
                        <Col xs={24} sm={12} md={8} lg={6} key={vid._id || vid.public_id || idx}>
                          <div className="bg-card rounded-2xl border border-border hover:border-primary hover:shadow-md transition-all overflow-hidden group flex flex-col">
                            {/* Video Thumbnail: Click to watch as Instagram Reel */}
                            <div
                              onClick={() => {
                                setSelectedReelIndex(idx);
                                setReelsOpen(true);
                              }}
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
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayCircleFilled className="text-3xl text-white group-hover:scale-110 transition-transform drop-shadow" />
                              </div>
                              {vid.duration && vid.duration !== "0:00" && (
                                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {vid.duration}
                                </span>
                              )}
                            </div>

                            {/* Details: Click to open full watch page */}
                            <div
                              onClick={() => navigate(`/livestreamingplatform/video/${videoId}`)}
                              className="p-3.5 flex items-start justify-between gap-2 cursor-pointer hover:bg-black/[0.02] transition-colors"
                              title="Click details for full watch page"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-darkPurple truncate group-hover:text-primary transition-colors mb-1">
                                  {vid.title || "Untitled Video"}
                                </h4>
                                <div className="text-[11px] text-text flex items-center gap-2">
                                  {dateText && <span>{dateText}</span>}
                                  {dateText && <span>•</span>}
                                  <span>{sizeMB}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <Tooltip title="Watch on standard page">
                                  <button
                                    onClick={() => navigate(`/livestreamingplatform/video/${videoId}`)}
                                    className="text-text hover:text-primary p-1.5 rounded-lg border-none bg-transparent cursor-pointer"
                                  >
                                    <ExportOutlined />
                                  </button>
                                </Tooltip>

                                {!isPublic && (
                                  <Dropdown
                                    menu={{
                                      items: [
                                        {
                                          key: "watch-reel",
                                          label: "Watch as Reel",
                                          icon: <ThunderboltFilled className="text-primary" />,
                                          onClick: () => {
                                            setSelectedReelIndex(idx);
                                            setReelsOpen(true);
                                          },
                                        },
                                        {
                                          key: "delete",
                                          danger: true,
                                          icon: <DeleteOutlined />,
                                          label: "Delete Video",
                                          onClick: () => handleDeleteVideo(vid.public_id),
                                        },
                                      ],
                                    }}
                                    trigger={["click"]}
                                  >
                                    <button className="text-text hover:text-darkPurple p-1 rounded-md border-none bg-transparent cursor-pointer">
                                      <MoreOutlined />
                                    </button>
                                  </Dropdown>
                                )}
                              </div>
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                )}
              </div>
            ),
          },
          {
            key: "streams",
            label: (
              <span className="font-bold text-sm">
                Stream History ({safePastStreams.length})
              </span>
            ),
            children: (
              <div className="mt-4">
                {safePastStreams.length === 0 ? (
                  <div className="text-center py-12 text-text">
                    <Empty description="No recorded stream sessions found." />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {safePastStreams.map((st, i) => {
                      const durationStr = st.duration
                        ? `${Math.floor(st.duration / 60)}:${(st.duration % 60).toString().padStart(2, "0")}`
                        : "0:00";
                      const dateStr = st.startTime ? new Date(st.startTime).toLocaleDateString() : "";

                      return (
                        <div
                          key={st._id || i}
                          onClick={() => handleViewStreamSession(st)}
                          className="bg-card rounded-xl border border-border hover:border-primary hover:shadow-sm p-4 transition-all flex items-center justify-between gap-4 cursor-pointer"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-24 h-16 rounded-lg bg-navy flex items-center justify-center text-white relative overflow-hidden flex-shrink-0">
                              <VideoCameraFilled className="text-xl text-primary" />
                              <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1 rounded">
                                {durationStr}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-darkPurple truncate">
                                {st.streamTitle || "Live Stream Session"}
                              </h4>
                              <div className="text-xs text-text flex items-center gap-2 mt-1">
                                {dateStr && <span>{dateStr}</span>}
                                {dateStr && <span>•</span>}
                                <span>{st.viewers || 0} peak viewers</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            size="small"
                            icon={<MessageFilled />}
                            className="rounded-lg border-border text-primary font-semibold"
                          >
                            Details
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "subscriptions",
            label: (
              <span className="font-bold text-sm">
                Subscribed Channels ({safeSubscribedChannels.length})
              </span>
            ),
            children: (
              <div className="mt-4">
                {safeSubscribedChannels.length === 0 ? (
                  <div className="text-center py-12 text-text">
                    <Empty
                      description="You haven't subscribed to any creators yet. Explore streams to follow channels!"
                    />
                  </div>
                ) : (
                  <Row gutter={[20, 20]}>
                    {safeSubscribedChannels.map((channel) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={channel.uid}>
                        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col justify-between hover:border-primary transition-all group">
                          <div>
                            <div className="flex items-start gap-3 mb-3">
                              <Avatar size={48} src={channel.profilePic} className="bg-primary flex-shrink-0">
                                {channel.name?.charAt(0).toUpperCase() || "C"}
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <h4
                                  onClick={() => navigate(`/livestreamingplatform/profile/${channel.uid}`)}
                                  className="text-sm font-bold text-darkPurple truncate group-hover:text-primary transition-colors cursor-pointer"
                                >
                                  {channel.name}
                                </h4>
                                <p className="text-xs text-text truncate mt-0.5">
                                  {channel.subscribersCount || channel.subscribers?.length || 0} subscribers
                                </p>
                              </div>
                            </div>
                            {channel.bio && (
                              <p className="text-xs text-text line-clamp-2 mb-3">
                                {channel.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-border mt-2">
                            <Button
                              type="default"
                              size="small"
                              block
                              onClick={() => navigate(`/livestreamingplatform/profile/${channel.uid}`)}
                              className="rounded-xl text-xs font-semibold"
                            >
                              Visit Channel
                            </Button>
                            {!isPublic && (
                              <Button
                                type="text"
                                danger
                                size="small"
                                onClick={async () => {
                                  try {
                                    await toggleSubscribeUser(channel.uid, currentUser?.uid);
                                    setSubscribedChannels((prev) => (Array.isArray(prev) ? prev.filter((c) => c.uid !== channel.uid) : []));
                                    message.success("Unsubscribed successfully");
                                  } catch (e) {
                                    console.warn("Unsubscribe error:", e);
                                  }
                                }}
                                className="rounded-xl text-xs"
                              >
                                Unsubscribe
                              </Button>
                            )}
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Screen 8: Edit Profile Modal */}
      <Modal
        title={<span className="text-darkPurple font-bold text-lg">Edit Profile</span>}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setEditModalOpen(false)}
            className="rounded-xl border-border text-darkPurple font-semibold h-10 px-5"
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={savingProfile}
            onClick={handleUpdateProfile}
            className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl h-10 px-6 shadow-md shadow-primary/25"
          >
            Save Changes
          </Button>,
        ]}
      >
        <div className="space-y-5 pt-3">
          {/* Avatar with options */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <Avatar
                size={84}
                src={profilePicInput || displayAvatar}
                icon={<UserOutlined />}
                className="bg-primary border-2 border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="small"
                onClick={() => {
                  const url = prompt("Enter profile picture image URL:", profilePicInput);
                  if (url !== null) setProfilePicInput(url);
                }}
                className="rounded-lg text-xs font-semibold"
              >
                Upload Photo
              </Button>
              <Button
                size="small"
                danger
                onClick={() => setProfilePicInput("")}
                className="rounded-lg text-xs font-semibold"
              >
                Remove Photo
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              className="rounded-xl border-border h-11 text-sm focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
              Bio
            </label>
            <Input.TextArea
              rows={4}
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Tell viewers about your channel and streaming schedule..."
              className="rounded-xl border-border text-sm focus:border-primary"
            />
          </div>
        </div>
      </Modal>

      {/* Screen 9: Upload Video Modal */}
      <Modal
        title={<span className="text-darkPurple font-bold text-lg">Upload Video</span>}
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setUploadModalOpen(false)}
            className="rounded-xl border-border text-darkPurple font-semibold h-10 px-5"
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            loading={uploading}
            onClick={handleUploadSubmit}
            className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl h-10 px-6 shadow-md shadow-primary/25"
          >
            Upload
          </Button>,
        ]}
      >
        <div className="space-y-4 pt-3">
          {/* Drag & Drop Zone */}
          <div
            onClick={() => document.getElementById("video-file-input").click()}
            className="border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-6 text-center cursor-pointer transition-all"
          >
            <input
              id="video-file-input"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setSelectedFile(e.target.files[0]);
                  if (!videoTitle) {
                    setVideoTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                  }
                }
              }}
            />
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary text-2xl flex items-center justify-center mx-auto mb-3">
              <InboxOutlined />
            </div>
            <p className="text-sm font-bold text-darkPurple mb-1">
              {selectedFile ? selectedFile.name : "Drag & drop your video here or click to browse"}
            </p>
            <p className="text-xs text-text">MP4, MOV, WEBM (Max 1 GB)</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
              Video Title *
            </label>
            <Input
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter video title..."
              className="rounded-xl border-border h-11 text-sm focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
              Description
            </label>
            <Input.TextArea
              rows={3}
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              placeholder="Write a short description..."
              className="rounded-xl border-border text-sm focus:border-primary"
            />
          </div>
        </div>
      </Modal>

      {/* Stream Session Chat Modal */}
      <Modal
        title={<span className="text-darkPurple font-bold">Stream Session Details</span>}
        open={Boolean(selectedStreamModal)}
        onCancel={() => setSelectedStreamModal(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedStreamModal(null)} className="rounded-xl">
            Close
          </Button>,
        ]}
      >
        {selectedStreamModal && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-darkPurple">{selectedStreamModal.streamTitle}</h3>
            <div className="flex justify-between text-xs text-text bg-background p-3 rounded-xl border border-border">
              <span><strong>Started:</strong> {selectedStreamModal.startTime ? new Date(selectedStreamModal.startTime).toLocaleString() : "N/A"}</span>
              <span><strong>Peak Viewers:</strong> {selectedStreamModal.viewers || 0}</span>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-darkPurple mb-2 flex items-center gap-1.5">
                <MessageFilled className="text-primary" /> Recorded Chat Messages ({streamChatMessages.length})
              </h4>
              <div className="max-h-48 overflow-y-auto bg-background p-3 rounded-xl border border-border">
                {loadingChat ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : streamChatMessages.length === 0 ? (
                  <p className="text-xs text-text/60 italic">No chat messages were recorded during this session.</p>
                ) : (
                  <List
                    size="small"
                    dataSource={streamChatMessages}
                    renderItem={(item) => (
                      <List.Item className="!py-1 !px-0 border-b border-border/40">
                        <span className="text-xs text-darkPurple">
                          <strong className="text-primary">{item.sender}:</strong> {item.message}
                        </span>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Instagram Reels Modal */}
      <ReelsModal
        isOpen={reelsOpen}
        onClose={() => setReelsOpen(false)}
        videos={safeVideos}
        initialIndex={selectedReelIndex}
      />
    </div>
  );
}
