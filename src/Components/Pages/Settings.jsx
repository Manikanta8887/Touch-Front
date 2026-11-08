import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Input, Button, Card, Row, Col, Progress, message } from "antd";
import {
  UserOutlined,
  BellOutlined,
  LockOutlined,
  CloudServerOutlined,
  SkinOutlined,
  SaveOutlined,
  CheckCircleFilled,
  SettingFilled,
} from "@ant-design/icons";
import { updateUser } from "../Redux/userSlice.js";
import { getUserProfile, updateUserProfile } from "../../api/profile";
import { getUserVideos } from "../../api/videos";

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector((s) => s.user.firebaseUser);
  const reduxBio = useSelector((s) => s.user.bio);

  const [activeTab, setActiveTab] = useState("account");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [userVideos, setUserVideos] = useState([]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || currentUser.name || "");
      setEmail(currentUser.email || "");
      setBio(reduxBio || "");

      getUserProfile(currentUser.uid)
        .then((res) => {
          if (res?.data?.user) {
            const u = res.data.user;
            setProfileData(u);
            setName(u.name || currentUser.displayName || "");
            if (u.bio) setBio(u.bio);
          }
        })
        .catch((err) => console.warn("Could not fetch remote profile:", err));

      getUserVideos(currentUser.uid)
        .then((vRes) => {
          if (Array.isArray(vRes?.data?.videos)) {
            setUserVideos(vRes.data.videos);
          } else if (Array.isArray(vRes?.videos)) {
            setUserVideos(vRes.videos);
          } else if (Array.isArray(vRes)) {
            setUserVideos(vRes);
          }
        })
        .catch((err) => console.warn("Could not fetch user videos in settings:", err));
    }
  }, [currentUser, reduxBio]);

  const usedBytes = useMemo(() => {
    if (profileData?.storageUsed !== undefined && profileData?.storageUsed !== null) {
      return Number(profileData.storageUsed) || 0;
    }
    return (Array.isArray(userVideos) ? userVideos : []).reduce(
      (sum, v) => sum + (Number(v?.sizeInBytes) || 0),
      0
    );
  }, [profileData?.storageUsed, userVideos]);

  const limitBytes = Number(profileData?.storageLimit) || 1024 * 1024 * 1024;
  const limitGB = Math.max(1, Math.round(limitBytes / (1024 * 1024 * 1024)));
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
  const storagePercent = Number.isFinite(usedBytes)
    ? Math.min(100, Math.max(0, parseFloat(((usedBytes / limitBytes) * 100).toFixed(1))))
    : 0;
  const remainingMB = Math.max(0, (limitBytes - usedBytes) / (1024 * 1024)).toFixed(1);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        bio: bio.trim(),
      };
      const res = await updateUserProfile(currentUser.uid, payload);
      if (res.success) {
        dispatch(updateUser(payload));
        message.success("Account settings updated successfully!");
      } else {
        message.error("Failed to update settings.");
      }
    } catch (err) {
      console.error("Settings update error:", err);
      message.error("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(currentUser?.displayName || "");
    setBio(reduxBio || "");
    message.info("Changes reverted");
  };

  const navItems = [
    { key: "account", label: "Account", icon: <UserOutlined /> },
    { key: "notifications", label: "Notifications", icon: <BellOutlined /> },
    { key: "privacy", label: "Privacy", icon: <LockOutlined /> },
    { key: "storage", label: "Storage", icon: <CloudServerOutlined /> },
    { key: "appearance", label: "Appearance", icon: <SkinOutlined /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg sm:text-xl flex-shrink-0">
          <SettingFilled />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-darkPurple tracking-tight">
          Settings
        </h2>
      </div>

      <Card className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-0" variant="borderless">
        <Row gutter={[0, 0]}>
          {/* Left Sub-nav */}
          <Col xs={24} md={7} className="border-b md:border-b-0 md:border-r border-border bg-primary/5 p-4 sm:p-6">
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                      isActive
                        ? "bg-primary text-white shadow-md shadow-primary/25"
                        : "text-text hover:text-darkPurple hover:bg-primary/10"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </Col>

          {/* Right Form Content */}
          <Col xs={24} md={17} className="p-6 sm:p-8">
            {activeTab === "account" ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-darkPurple mb-1">
                    Account Settings
                  </h3>
                  <p className="text-xs sm:text-sm text-text">
                    Manage your personal account profile and channel information.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="rounded-xl border-border h-11 text-sm focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <Input
                      value={email}
                      disabled
                      className="rounded-xl border-border h-11 text-sm bg-background cursor-not-allowed opacity-80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-darkPurple uppercase tracking-wider mb-1.5">
                      Channel Bio
                    </label>
                    <Input.TextArea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell viewers about your channel and streaming schedule..."
                      className="rounded-xl border-border text-sm focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={handleCancel}
                    className="border border-border text-darkPurple font-semibold rounded-xl h-10 px-5 hover:border-text"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSave}
                    className="bg-primary hover:bg-secondary text-white border-none font-bold rounded-xl h-10 px-6 shadow-md shadow-primary/25"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : activeTab === "storage" ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-darkPurple mb-1">
                    Storage & Cloud Allocation
                  </h3>
                  <p className="text-xs sm:text-sm text-text">
                    Monitor your video storage usage, uploaded clips, and allocated cloud capacity.
                  </p>
                </div>

                {/* Storage Used Card matching reference design */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm max-w-lg">
                  <div className="flex justify-between items-center text-sm mb-2 font-bold">
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

                {/* Storage Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg">
                  <div className="bg-background rounded-xl border border-border p-3.5">
                    <div className="text-xs text-text font-semibold">Uploaded Videos</div>
                    <div className="text-lg font-black text-darkPurple mt-0.5">
                      {userVideos.length}
                    </div>
                  </div>
                  <div className="bg-background rounded-xl border border-border p-3.5">
                    <div className="text-xs text-text font-semibold">Available Space</div>
                    <div className="text-lg font-black text-darkPurple mt-0.5">
                      {remainingMB} MB
                    </div>
                  </div>
                  <div className="bg-background rounded-xl border border-border p-3.5">
                    <div className="text-xs text-text font-semibold">Plan Limit</div>
                    <div className="text-lg font-black text-darkPurple mt-0.5">
                      {limitGB} GB
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="primary"
                    onClick={() => navigate("/livestreamingplatform/profile")}
                    className="bg-primary hover:bg-secondary text-white font-bold rounded-xl h-10 px-5 shadow-sm"
                  >
                    Manage Videos in Profile
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-text">
                <CheckCircleFilled className="text-4xl text-primary mb-3" />
                <h4 className="text-lg font-bold text-darkPurple">
                  {navItems.find((n) => n.key === activeTab)?.label}
                </h4>
                <p className="text-xs sm:text-sm mt-1 text-text max-w-sm mx-auto">
                  These settings are currently synchronized with your default Touch Live profile preferences.
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Settings;
