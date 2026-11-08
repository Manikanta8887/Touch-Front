import { useEffect, useState } from "react";
import { Layout, Button, Avatar, Drawer, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { setFirebaseUser, logoutUser } from "../Redux/userSlice";
import {
  MenuOutlined,
  CompassFilled,
  PlaySquareFilled,
  VideoCameraFilled,
  UserOutlined,
  SettingFilled,
  LogoutOutlined,
  LoginOutlined,
  PlayCircleFilled,
  BellOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";

const { Header, Content } = Layout;

const LiveStreamingPlatform = () => {
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const auth = getAuth();
  const dispatch = useDispatch();
  const firebaseUser = useSelector((state) => state.user.firebaseUser);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(
          setFirebaseUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split("@")[0] || "Streamer",
            photoURL: user.photoURL || null,
          })
        );
      } else {
        dispatch(setFirebaseUser(null));
      }
    });
    return () => unsubscribe();
  }, [auth, dispatch]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logoutUser());
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const streamerPath = firebaseUser
    ? `/livestreamingplatform/stream/${firebaseUser.uid}`
    : "/login";

  const navMenuItems = [
    {
      key: "/livestreamingplatform",
      label: "Browse Streams",
      icon: <CompassFilled />,
      path: "/livestreamingplatform",
      exact: true,
    },
    {
      key: "/livestreamingplatform/videos",
      label: "Uploaded Videos",
      icon: <PlaySquareFilled />,
      path: "/livestreamingplatform/videos",
    },
    {
      key: "stream",
      label: "Go Live",
      icon: <VideoCameraFilled />,
      path: streamerPath,
    },
    {
      key: "/livestreamingplatform/profile",
      label: "My Profile",
      icon: <UserOutlined />,
      path: "/livestreamingplatform/profile",
    },
    {
      key: "/livestreamingplatform/settings",
      label: "Settings",
      icon: <SettingFilled />,
      path: "/livestreamingplatform/settings",
    },
  ];

  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-darkPurple text-white">
      {/* Brand Header */}
      <div
        className="p-5 flex items-center gap-3 cursor-pointer border-b border-white/10"
        onClick={() => {
          navigate("/");
          if (isMobile) setMobileDrawerOpen(false);
        }}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/40 flex-shrink-0">
          <PlayCircleFilled className="text-white text-xl" />
        </div>
        {(!collapsed || isMobile) && (
          <span className="text-xl font-black text-white tracking-tight">
            Touch<span className="text-secondary ml-1 font-semibold">Live</span>
          </span>
        )}
      </div>

      {/* Nav Menu Items */}
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {navMenuItems.map((item) => {
          const active = isItemActive(item);
          return (
            <button
              key={item.key}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileDrawerOpen(false);
              }}
              title={item.label}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 text-left ${
                active
                  ? "bg-primary text-white shadow-lg shadow-primary/35"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className={`text-lg ${active ? "text-white" : "text-slate-300"}`}>
                {item.icon}
              </span>
              {(!collapsed || isMobile) && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile & Logout Section */}
      <div className="p-4 border-t border-white/10 bg-navy">
        {(!collapsed || isMobile) && firebaseUser && (
          <div className="flex items-center gap-3 p-3 mb-3 bg-white/5 rounded-2xl border border-white/10">
            <Avatar
              size={42}
              src={firebaseUser.photoURL}
              icon={<UserOutlined />}
              className="bg-primary flex-shrink-0 border-2 border-white/20"
            />
            <div className="overflow-hidden min-w-0">
              <div className="font-extrabold text-white text-sm truncate">
                {firebaseUser.displayName}
              </div>
              <div className="text-slate-400 text-xs truncate">
                {firebaseUser.email}
              </div>
            </div>
          </div>
        )}

        {firebaseUser ? (
          <Button
            type="primary"
            danger
            block
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="bg-[#EF4444] hover:bg-[#DC2626] border-none font-bold rounded-xl h-11 text-sm shadow-md"
          >
            {(!collapsed || isMobile) && "Logout"}
          </Button>
        ) : (
          <Button
            type="primary"
            block
            icon={<LoginOutlined />}
            onClick={() => navigate("/login")}
            className="bg-primary hover:bg-secondary border-none font-bold rounded-xl h-11 text-sm shadow-md"
          >
            {(!collapsed || isMobile) && "Sign In"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Layout className="min-h-screen bg-background font-sans flex flex-row">
      {/* Desktop Sider */}
      <div
        className={`hidden md:block sticky top-0 h-screen transition-all duration-300 z-30 shadow-xl flex-shrink-0 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {renderSidebarContent(false)}
      </div>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        styles={{ body: { padding: 0 } }}
        width={260}
      >
        {renderSidebarContent(true)}
      </Drawer>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <Header
          className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm h-16 leading-normal"
          style={{ background: "#FFFFFF", borderBottom: "1px solid #D9D9D9" }}
        >
          {/* Left: Mobile Toggle & Desktop Sider Toggle */}
          <div className="flex items-center gap-3">
            <Button
              type="text"
              icon={<MenuOutlined className="text-lg text-darkPurple" />}
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileDrawerOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="text-darkPurple hover:text-primary hover:bg-slate-100 rounded-lg p-2 flex items-center justify-center"
            />

            {/* Quick Search Bar */}
            <div className="hidden sm:flex items-center relative w-64 md:w-80">
              <Input
                placeholder="Search streams or videos..."
                prefix={<SearchOutlined className="text-text mr-1" />}
                onPressEnter={(e) => {
                  navigate(`/livestreamingplatform?q=${encodeURIComponent(e.target.value)}`);
                }}
                className="rounded-full bg-background border-border h-9 text-xs focus:border-primary"
              />
            </div>
          </div>

          {/* Right: Notification Bell & Profile Avatar */}
          <div className="flex items-center gap-3">
            <button
              className="w-9 h-9 rounded-full bg-background hover:bg-slate-100 border border-border flex items-center justify-center text-text hover:text-primary transition-colors"
              title="Notifications"
            >
              <BellOutlined className="text-base" />
            </button>

            {firebaseUser ? (
              <Link
                to="/livestreamingplatform/profile"
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Avatar
                  src={firebaseUser.photoURL}
                  icon={<UserOutlined />}
                  className="bg-primary border border-primary cursor-pointer"
                  size={36}
                />
              </Link>
            ) : (
              <Link to="/login">
                <Button
                  type="primary"
                  size="small"
                  className="bg-primary hover:bg-secondary text-white border-none rounded-xl font-bold px-4 h-9 shadow-sm"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </Header>

        {/* Dynamic Route Content */}
        <Content className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </Content>

        {/* Footer */}
        <footer className="text-center py-4 bg-card border-t border-border text-xs text-text">
          © {new Date().getFullYear()} Touch Live. Powered by WebRTC sub-second live streaming.
        </footer>
      </div>
    </Layout>
  );
};

export default LiveStreamingPlatform;
