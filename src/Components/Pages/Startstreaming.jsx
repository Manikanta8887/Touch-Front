import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { useSelector, useDispatch } from "react-redux";
import { setIsStreaming, setStreamTitle } from "../Redux/streamSlice.js";
import {
  Button,
  Card,
  Input,
  Row,
  Col,
  List,
  Modal,
  Select,
  Tag,
  Avatar,
  Tooltip,
  message,
} from "antd";
import {
  VideoCameraFilled,
  StopOutlined,
  SendOutlined,
  AudioOutlined,
  AudioMutedOutlined,
  DesktopOutlined,
  SettingOutlined,
  CrownFilled,
  CopyOutlined,
  MessageFilled,
} from "@ant-design/icons";
import socket from "../../socket";
import { getIceServers } from "../../utils/iceServers";

const { Option } = Select;

const StartStreaming = () => {
  const dispatch = useDispatch();
  const firebaseUser = useSelector((s) => s.user.firebaseUser);
  const isStreaming = useSelector((s) => s.stream.isStreaming);
  const streamTitle = useSelector((s) => s.stream.streamTitle);

  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const peerConnections = useRef(new Map());
  const localStreamRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [origVideoTrack, setOrigVideoTrack] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [inputTitle, setInputTitle] = useState(streamTitle || "");
  const [category, setCategory] = useState("Gaming");
  const [visibility, setVisibility] = useState("Public");
  const [streamDuration, setStreamDuration] = useState(0);

  // Pre-stream Device Selection state
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [deviceCheckStream, setDeviceCheckStream] = useState(null);
  const previewVideoRef = useRef(null);

  // Auto-initialize camera preview on mount if not already started
  useEffect(() => {
    let unmounted = false;
    const startPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!unmounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          setLocalStream(stream);
          localStreamRef.current = stream;
          setOrigVideoTrack(stream.getVideoTracks()[0]);
        }
      } catch (err) {
        console.warn("Camera preview initialization:", err);
      }
    };

    if (!isStreaming) {
      startPreview();
    }

    return () => {
      unmounted = true;
    };
  }, [isStreaming]);

  // Timer effect for live stream duration
  useEffect(() => {
    let timer;
    if (isStreaming) {
      timer = setInterval(() => setStreamDuration((prev) => prev + 1), 1000);
    } else {
      setStreamDuration(0);
    }
    return () => clearInterval(timer);
  }, [isStreaming]);

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}:` : ""}${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const vDevs = devices.filter((d) => d.kind === "videoinput");
      const aDevs = devices.filter((d) => d.kind === "audioinput");
      setVideoDevices(vDevs);
      setAudioDevices(aDevs);
      if (vDevs.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(vDevs[0].deviceId);
      if (aDevs.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(aDevs[0].deviceId);
    } catch (err) {
      console.warn("Error enumerating devices:", err);
    }
  };

  const openDeviceCheck = async () => {
    setIsDeviceModalOpen(true);
    try {
      const initStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setDeviceCheckStream(initStream);
      if (previewVideoRef.current) previewVideoRef.current.srcObject = initStream;
      await getDevices();
    } catch (err) {
      console.warn("Permission error on getUserMedia:", err);
      message.error("Camera and microphone permissions are required for streaming.");
    }
  };

  const closeDeviceCheck = () => {
    if (deviceCheckStream) {
      deviceCheckStream.getTracks().forEach((t) => t.stop());
      setDeviceCheckStream(null);
    }
    setIsDeviceModalOpen(false);
  };

  const handleDeviceChange = async (videoDevId, audioDevId) => {
    if (deviceCheckStream) {
      deviceCheckStream.getTracks().forEach((t) => t.stop());
    }
    try {
      const constraints = {
        video: videoDevId ? { deviceId: { exact: videoDevId } } : true,
        audio: audioDevId ? { deviceId: { exact: audioDevId } } : true,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setDeviceCheckStream(newStream);
      if (previewVideoRef.current) previewVideoRef.current.srcObject = newStream;
    } catch (err) {
      console.warn("Error switching media device:", err);
      message.error("Failed to switch media device.");
    }
  };

  // WebRTC Peer Connection Helper
  const createPeerConnection = useCallback(
    async (viewerSocketId, activeStream) => {
      if (peerConnections.current.has(viewerSocketId)) {
        return peerConnections.current.get(viewerSocketId);
      }

      const iceConfig = await getIceServers();
      const pc = new RTCPeerConnection(iceConfig);
      peerConnections.current.set(viewerSocketId, pc);

      if (activeStream) {
        activeStream.getTracks().forEach((track) => pc.addTrack(track, activeStream));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            streamId: firebaseUser?.uid,
            candidate: e.candidate,
            target: viewerSocketId,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          pc.close();
          peerConnections.current.delete(viewerSocketId);
        }
      };

      return pc;
    },
    [firebaseUser?.uid]
  );

  // Start Streaming Execution
  const handleStartStream = async () => {
    if (!inputTitle.trim()) {
      return message.warning("Please enter a stream title before going live!");
    }

    try {
      closeDeviceCheck();
      let mediaStream = localStream;
      if (!mediaStream || !mediaStream.active) {
        const constraints = {
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(mediaStream);
        localStreamRef.current = mediaStream;
        setOrigVideoTrack(mediaStream.getVideoTracks()[0]);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      dispatch(setIsStreaming(true));
      dispatch(setStreamTitle(inputTitle));

      const streamerId = firebaseUser?.uid || socket.id;
      const streamerName = firebaseUser?.displayName || firebaseUser?.email || "Anonymous Streamer";
      const profilePic = firebaseUser?.photoURL || "";

      socket.emit("start-stream", {
        streamTitle: inputTitle,
        category,
        visibility,
        streamerId,
        streamerName,
        profilePic,
      });

      message.success("🔴 You are now live!");
    } catch (err) {
      console.error("Media error starting stream:", err);
      message.error("Failed to access media devices. Please grant camera/microphone permissions.");
    }
  };

  // Stop Stream Execution
  const handleStopStream = () => {
    socket.emit("stop-stream");

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }

    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();

    dispatch(setIsStreaming(false));
    dispatch(setStreamTitle(""));
    setIsScreenSharing(false);
    setIsCameraOn(true);
    setIsMuted(false);

    message.info("Stream ended successfully");
  };

  // WebRTC Signaling Handlers
  useEffect(() => {
    const handleViewerJoined = async ({ viewerId }) => {
      const currentStream = localStreamRef.current;
      if (!currentStream) return;
      try {
        const pc = await createPeerConnection(viewerId, currentStream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { streamId: firebaseUser?.uid, offer, target: viewerId });
      } catch (err) {
        console.error("Error connecting viewer:", err);
      }
    };

    const handleAnswer = async ({ answer, from }) => {
      const pc = peerConnections.current.get(from);
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ candidate, from }) => {
      const pc = peerConnections.current.get(from);
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const handleViewerCount = ({ count }) => {
      if (count !== undefined) setViewerCount(count);
    };

    socket.on("viewer-joined", handleViewerJoined);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("viewer-count", handleViewerCount);

    return () => {
      socket.off("viewer-joined", handleViewerJoined);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("viewer-count", handleViewerCount);
    };
  }, [localStream, createPeerConnection, firebaseUser?.uid]);

  // Chat message listener
  useEffect(() => {
    const handleChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on("chat-message", handleChatMessage);
    return () => socket.off("chat-message", handleChatMessage);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!messageInput.trim()) return;
    const username = firebaseUser ? firebaseUser.displayName || firebaseUser.email : "Streamer";
    socket.emit("chat-message", {
      streamId: firebaseUser?.uid,
      username,
      message: messageInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setMessageInput("");
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isStreaming || !localStream) return;
    if (isScreenSharing) {
      const screenTrack = localStream.getVideoTracks()[0];
      if (origVideoTrack) {
        localStream.removeTrack(screenTrack);
        localStream.addTrack(origVideoTrack);
        if (videoRef.current) videoRef.current.srcObject = localStream;
        peerConnections.current.forEach((pc) => {
          const senders = pc.getSenders();
          const s = senders.find((sns) => sns.track?.kind === "video");
          if (s) s.replaceTrack(origVideoTrack);
        });
        screenTrack.stop();
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const currentVideo = localStream.getVideoTracks()[0];

        localStream.removeTrack(currentVideo);
        localStream.addTrack(screenTrack);
        if (videoRef.current) videoRef.current.srcObject = localStream;

        peerConnections.current.forEach((pc) => {
          const senders = pc.getSenders();
          const s = senders.find((sns) => sns.track?.kind === "video");
          if (s) s.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => {
          toggleScreenShare();
        };
        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share error:", err);
        message.error("Screen sharing canceled or failed.");
      }
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/livestreamingplatform/watch/${firebaseUser?.uid}`;
    navigator.clipboard.writeText(link).then(() => message.success("Stream watch link copied!"));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-darkPurple tracking-tight flex items-center gap-2">
            <span>🎥 Stream Studio</span>
          </h1>
          {/* Status Badge */}
          {isStreaming ? (
            <span className="bg-[#EF4444] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              LIVE ({formatDuration(streamDuration)})
            </span>
          ) : (
            <span className="bg-[#DCFCE7] text-[#16A34A] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#BBF7D0]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
              Ready
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            icon={<SettingOutlined />}
            onClick={openDeviceCheck}
            className="rounded-xl border-border text-darkPurple font-semibold h-10 px-4 hover:border-primary hover:text-primary"
          >
            Device Setup
          </Button>

          {isStreaming ? (
            <>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyLink}
                className="rounded-xl border-border text-darkPurple font-semibold h-10 px-3.5 hover:border-primary hover:text-primary"
              >
                Share
              </Button>
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                onClick={handleStopStream}
                className="bg-[#EF4444] hover:bg-[#DC2626] border-none font-bold rounded-xl h-10 px-5 shadow-md"
              >
                End Stream
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              icon={<VideoCameraFilled />}
              onClick={handleStartStream}
              className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl h-10 px-6 shadow-md shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
            >
              Go Live
            </Button>
          )}
        </div>
      </div>

      <Row gutter={[20, 20]}>
        {/* Left Column: Video Viewport & Stream Details Form */}
        <Col xs={24} lg={16} className="space-y-4">
          {/* Main Video Preview Box */}
          <div className="relative w-full aspect-video bg-navy rounded-2xl overflow-hidden shadow-md border border-border flex items-center justify-center group">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Bottom Floating Control Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-darkPurple/85 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 flex items-center gap-3 shadow-2xl z-10">
              <Tooltip title={isMuted ? "Unmute Mic" : "Mute Mic"}>
                <button
                  onClick={toggleMute}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isMuted
                      ? "bg-red-500 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {isMuted ? <AudioMutedOutlined className="text-base" /> : <AudioOutlined className="text-base" />}
                </button>
              </Tooltip>

              <Tooltip title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}>
                <button
                  onClick={toggleCamera}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    !isCameraOn
                      ? "bg-red-500 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  <VideoCameraFilled className="text-base" />
                </button>
              </Tooltip>

              <Tooltip title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}>
                <button
                  onClick={toggleScreenShare}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isScreenSharing
                      ? "bg-primary text-white"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  <DesktopOutlined className="text-base" />
                </button>
              </Tooltip>

              <Tooltip title="Device Setup">
                <button
                  onClick={openDeviceCheck}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                >
                  <SettingOutlined className="text-base" />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Stream Details Card */}
          <Card className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5" variant="borderless">
            <h3 className="text-base font-bold text-darkPurple mb-3">
              Stream Details
            </h3>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
                  Title
                </label>
                <Input
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  placeholder="Enter stream title..."
                  className="rounded-xl border-border h-10 text-sm focus:border-primary"
                  disabled={isStreaming}
                />
              </Col>

              <Col xs={12} md={6}>
                <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <Select
                  value={category}
                  onChange={setCategory}
                  className="w-full h-10"
                  disabled={isStreaming}
                >
                  <Option value="Gaming">Gaming</Option>
                  <Option value="Technology">Technology</Option>
                  <Option value="Entertainment">Entertainment</Option>
                  <Option value="Music">Music</Option>
                  <Option value="Nature">Nature</Option>
                  <Option value="Education">Education</Option>
                </Select>
              </Col>

              <Col xs={12} md={6}>
                <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
                  Visibility
                </label>
                <Select
                  value={visibility}
                  onChange={setVisibility}
                  className="w-full h-10"
                  disabled={isStreaming}
                >
                  <Option value="Public">Public</Option>
                  <Option value="Unlisted">Unlisted</Option>
                  <Option value="Private">Private</Option>
                </Select>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Column: Stream Chat */}
        <Col xs={24} lg={8}>
          <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col h-[520px] overflow-hidden">
            {/* Chat Header */}
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-background">
              <span className="font-extrabold text-darkPurple text-sm">
                Stream Chat
              </span>
              <span className="text-xs text-text font-semibold">
                {viewerCount} {viewerCount === 1 ? "viewer" : "viewers"}
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl mb-3">
                    <MessageFilled />
                  </div>
                  <h4 className="text-sm font-bold text-darkPurple mb-1">
                    No messages yet
                  </h4>
                  <p className="text-xs text-text max-w-xs leading-relaxed">
                    Messages will appear here once viewers join and start chatting.
                  </p>
                </div>
              ) : (
                <List
                  dataSource={messages}
                  renderItem={(msg, idx) => {
                    const isHost =
                      firebaseUser &&
                      (msg.username === firebaseUser.displayName || msg.username === firebaseUser.email);
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs ${
                          isHost ? "bg-primary/10 border-primary/30" : "bg-background border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Avatar
                              size={22}
                              className={isHost ? "bg-primary" : "bg-slate-400"}
                            >
                              {msg.username ? msg.username.charAt(0).toUpperCase() : "V"}
                            </Avatar>
                            <span className="font-bold text-darkPurple">{msg.username}</span>
                            {isHost && (
                              <Tag color="purple" icon={<CrownFilled />} className="text-[10px] m-0 px-1 py-0 border-none">
                                Host
                              </Tag>
                            )}
                          </div>
                          <span className="text-[10px] text-text">{msg.time}</span>
                        </div>
                        <div className="text-darkPurple">{msg.message}</div>
                      </div>
                    );
                  }}
                />
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border bg-card">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Send a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onPressEnter={sendMessage}
                  className="rounded-xl border-border h-10 text-xs focus:border-primary"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  className="bg-primary hover:bg-secondary border-none rounded-xl h-10 w-10 flex items-center justify-center p-0 shadow-sm"
                />
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Pre-stream Setup & Device Check Modal */}
      <Modal
        title={<span className="text-darkPurple font-bold">Device Setup</span>}
        open={isDeviceModalOpen}
        onCancel={closeDeviceCheck}
        footer={[
          <Button key="cancel" onClick={closeDeviceCheck} className="border-border text-darkPurple rounded-xl">
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={closeDeviceCheck}
            className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl"
          >
            Done
          </Button>,
        ]}
      >
        <div className="space-y-4 pt-2">
          <Row gutter={12}>
            <Col span={12}>
              <label className="block text-xs font-semibold text-text mb-1">
                Camera Source
              </label>
              <Select
                style={{ width: "100%" }}
                value={selectedVideoDevice}
                onChange={(val) => {
                  setSelectedVideoDevice(val);
                  handleDeviceChange(val, selectedAudioDevice);
                }}
              >
                {videoDevices.map((d) => (
                  <Option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                  </Option>
                ))}
              </Select>
            </Col>

            <Col span={12}>
              <label className="block text-xs font-semibold text-text mb-1">
                Microphone Source
              </label>
              <Select
                style={{ width: "100%" }}
                value={selectedAudioDevice}
                onChange={(val) => {
                  setSelectedAudioDevice(val);
                  handleDeviceChange(selectedVideoDevice, val);
                }}
              >
                {audioDevices.map((d) => (
                  <Option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                  </Option>
                ))}
              </Select>
            </Col>
          </Row>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Device Video Preview
            </label>
            <div className="w-full h-44 bg-navy rounded-xl overflow-hidden flex items-center justify-center">
              <video ref={previewVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

StartStreaming.propTypes = {
  streamId: PropTypes.string,
};

export default StartStreaming;
