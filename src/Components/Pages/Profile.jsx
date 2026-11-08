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
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../Redux/userSlice.js";
import { useParams, useNavigate } from "react-router-dom";
import { getUserProfile, updateUserProfile } from "../../api/profile";
import { getUserVideos, getAllVideos, uploadVideo, deleteVideo } from "../../api/videos";
import { getPastStreams, getStreamChat } from "../../api/streams";

const MAX_STORAGE = 1024 * 1024 * 1024; // 1 GB allocation

export default function ProfilePage() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const loggedInUser = useSelector((s) => s.user.firebaseUser);
  const reduxBio = useSelector((s) => s.user.bio);
  const isPublic = uid && uid !== loggedInUser?.uid;

  const [profileData, setProfileData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [pastStreams, setPastStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  const targetUid = isPublic ? uid : loggedInUser?.uid;

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      if (isPublic && targetUid) {
        const profRes = await getUserProfile(targetUid);
        if (profRes?.data?.user) {
          setProfileData(profRes.data.user);
        }
      } else if (loggedInUser) {
        setProfileData(loggedInUser);
        setNameInput(loggedInUser.displayName || "");
        setBioInput(reduxBio || "");
        setProfilePicInput(loggedInUser.photoURL || "");

        try {
          const res = await getUserProfile(loggedInUser.uid);
          if (res?.data?.user) {
            const u = res.data.user;
            setNameInput(u.name || loggedInUser.displayName || "");
            if (u.bio) setBioInput(u.bio);
            if (u.profilePic) setProfilePicInput(u.profilePic);
            setProfileData((prev) => ({ ...prev, ...u }));
          }
        } catch (e) {
          console.warn("Backend profile lookup:", e);
        }
      }

      // Fetch user videos
      let vRes;
      if (targetUid) {
        vRes = await getUserVideos(targetUid);
      } else {
        vRes = await getAllVideos();
      }

      if (vRes?.data?.videos) {
        setVideos(vRes.data.videos);
      } else if (Array.isArray(vRes?.videos)) {
        setVideos(vRes.videos);
      } else if (Array.isArray(vRes)) {
        setVideos(vRes);
      }

      // Fetch past streams
      if (targetUid) {
        const streamRes = await getPastStreams(targetUid);
        if (streamRes?.data?.streams) {
          setPastStreams(streamRes.data.streams);
        } else if (Array.isArray(streamRes)) {
          setPastStreams(streamRes);
        }
      }
    } catch (err) {
      console.error("Error loading profile details:", err);
    } finally {
      setLoading(false);
    }
  }, [isPublic, targetUid, loggedInUser, reduxBio]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const usedBytes = useMemo(
    () => videos.reduce((sum, v) => sum + (v.sizeInBytes || 0), 0),
    [videos]
  );
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const storagePercent = Math.min(100, parseFloat(((usedBytes / MAX_STORAGE) * 100).toFixed(1)));

  // Save Edited Profile
  const handleUpdateProfile = async () => {
    if (!loggedInUser) return;
    setSavingProfile(true);
    try {
      const updatePayload = {
        name: nameInput.trim() || undefined,
        bio: bioInput.trim(),
        profilePic: profilePicInput.trim() || undefined,
      };
      const res = await updateUserProfile(loggedInUser.uid, updatePayload);
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
      const userUid = loggedInUser?.uid || "guest";
      const res = await uploadVideo(userUid, selectedFile, title, desc);
      if (res.success && res.data && res.data.video) {
        setVideos((prev) => [res.data.video, ...prev]);
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

  const displayName = profileData?.name || profileData?.displayName || "Streamer";
  const displayEmail = profileData?.email || "";
  const displayBio = profileData?.bio || (isPublic ? "No bio provided." : "Click 'Edit Profile' to add a custom bio.");
  const displayAvatar = profileData?.profilePic || profileData?.photoURL || null;
  const subscribersCount = profileData?.subscribersCount || profileData?.subscribers?.length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Action Buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-extrabold text-darkPurple tracking-tight flex items-center gap-2">
          <span>👤 My Profile</span>
        </h1>

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

      {/* 4 Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl flex-shrink-0">
              <PlaySquareFilled />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-darkPurple">
                {videos.length}
              </div>
              <div className="text-xs text-text font-semibold">Videos</div>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center text-xl flex-shrink-0">
              <VideoCameraFilled />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-darkPurple">
                {pastStreams.length}
              </div>
              <div className="text-xs text-text font-semibold">Streams</div>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
              <UsergroupAddOutlined />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-darkPurple">
                {subscribersCount}
              </div>
              <div className="text-xs text-text font-semibold">Subscribers</div>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
              <span className="text-text">Storage Used</span>
              <span className="text-darkPurple">{usedMB} MB / 1 GB</span>
            </div>
            <Progress
              percent={storagePercent}
              strokeColor="#A34BD0"
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
                Channel Videos ({videos.length})
              </span>
            ),
            children: (
              <div className="mt-4">
                {videos.length === 0 ? (
                  <div className="text-center py-12 text-text">
                    <Empty
                      description="No videos uploaded yet. Click 'Upload Video' above to upload your first clip!"
                    />
                  </div>
                ) : (
                  <Row gutter={[20, 20]}>
                    {videos.map((vid, idx) => {
                      const videoId = vid._id || encodeURIComponent(vid.public_id || idx);
                      const dateText = vid.createdAt ? new Date(vid.createdAt).toLocaleDateString() : "";
                      const sizeMB = vid.sizeInBytes ? `${(vid.sizeInBytes / (1024 * 1024)).toFixed(1)} MB` : "0 MB";

                      return (
                        <Col xs={24} sm={12} md={8} lg={6} key={vid._id || vid.public_id || idx}>
                          <div
                            onClick={() => navigate(`/livestreamingplatform/video/${videoId}`)}
                            className="bg-card rounded-2xl border border-border hover:border-primary hover:shadow-md transition-all overflow-hidden cursor-pointer group flex flex-col"
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
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <PlayCircleFilled className="text-3xl text-white group-hover:scale-110 transition-transform drop-shadow" />
                              </div>
                              {vid.duration && vid.duration !== "0:00" && (
                                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  {vid.duration}
                                </span>
                              )}
                            </div>

                            {/* Details */}
                            <div className="p-3.5 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-darkPurple truncate group-hover:text-primary transition-colors mb-1">
                                  {vid.title || "Untitled Video"}
                                </h4>
                                <div className="text-[11px] text-text flex items-center gap-2">
                                  {dateText && <span>{dateText}</span>}
                                  {dateText && <span>•</span>}
                                  <span>{sizeMB}</span>
                                </div>
                              </div>

                              {!isPublic && (
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: "delete",
                                        danger: true,
                                        icon: <DeleteOutlined />,
                                        label: "Delete Video",
                                        onClick: (e) => {
                                          e.domEvent.stopPropagation();
                                          handleDeleteVideo(vid.public_id);
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
                              )}
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
                Stream History ({pastStreams.length})
              </span>
            ),
            children: (
              <div className="mt-4">
                {pastStreams.length === 0 ? (
                  <div className="text-center py-12 text-text">
                    <Empty description="No recorded stream sessions found." />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastStreams.map((st, i) => {
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
    </div>
  );
}
