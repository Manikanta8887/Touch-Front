import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input, Button, Form, Divider } from "antd";
import {
  GoogleOutlined,
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PlayCircleFilled,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Auth, GoogleProvider } from "../Firebase/Firebaseconfig";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveUser } from "../../api/users";
import { exchangeForTokens } from "../../api/auth";

const Login = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState({ email: false, google: false, guest: false });
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const syncUserWithBackend = async (user, loginType) => {
    try {
      const token = await user.getIdToken(true);
      const userData = {
        uid: user.uid,
        name: user.displayName || user.email?.split("@")[0] || "Guest Streamer",
        email: user.email || `${user.uid}@guest.touchlive.com`,
        profilePic: user.photoURL || "",
      };

      await saveUser(userData, token);
      try {
        await exchangeForTokens(userData, token);
      } catch (tokenErr) {
        console.warn("Token exchange warning:", tokenErr);
      }
      toast.success(`${loginType} Login Successful!`);
      setTimeout(() => navigate("/livestreamingplatform", { replace: true }), 1000);
    } catch (error) {
      console.error("Backend Sync Error:", error);
      toast.error("Account created in Firebase, but failed to sync profile data.");
    }
  };

  const handleEmailLogin = async (values) => {
    setLoading((prev) => ({ ...prev, email: true }));
    try {
      const result = await signInWithEmailAndPassword(Auth, values.email, values.password);
      await syncUserWithBackend(result.user, "Email");
    } catch (error) {
      const msg =
        error.code === "auth/invalid-credential" || error.code === "auth/user-not-found"
          ? "Invalid email or password"
          : error.message;
      toast.error(msg);
    } finally {
      setLoading((prev) => ({ ...prev, email: false }));
    }
  };

  const handleGoogleLogin = async () => {
    setLoading((prev) => ({ ...prev, google: true }));
    try {
      const result = await signInWithPopup(Auth, GoogleProvider);
      await syncUserWithBackend(result.user, "Google");
    } catch (error) {
      console.warn("Google login failed:", error);
      toast.error("Google sign-in canceled or failed");
    } finally {
      setLoading((prev) => ({ ...prev, google: false }));
    }
  };

  const handleGuestLogin = async () => {
    setLoading((prev) => ({ ...prev, guest: true }));
    try {
      const result = await signInAnonymously(Auth);
      await syncUserWithBackend(result.user, "Guest");
    } catch (error) {
      console.warn("Guest login failed:", error);
      toast.error("Guest login failed");
    } finally {
      setLoading((prev) => ({ ...prev, guest: false }));
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      return toast.error("Please enter a valid email address.");
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(Auth, resetEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setResetMode(false);
    } catch (error) {
      toast.error("Failed to send reset email: " + error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 selection:bg-primary selection:text-white relative">
      {/* Background Soft Glow */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split-Screen Card */}
      <div className="w-full max-w-4xl bg-card rounded-3xl shadow-2xl border border-border/80 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[580px]">
        {/* Left Side: Dark Purple Brand Showcase */}
        <div className="w-full md:w-5/12 bg-darkPurple p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/30 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute top-1/3 -right-16 w-48 h-48 bg-secondary/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Logo */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/40">
              <PlayCircleFilled className="text-white text-xl" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              Touch<span className="text-secondary ml-1 font-semibold">Live</span>
            </span>
          </div>

          {/* Center Graphic & Slogan */}
          <div className="my-auto py-8 text-center flex flex-col items-center z-10">
            {/* Clapperboard Graphic Icon */}
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-primary/30 to-secondary/30 border border-white/15 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md relative group">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg transform -rotate-6 transition-transform group-hover:rotate-0">
                <PlayCircleFilled className="text-white text-4xl" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
              Stream • Watch • Connect
            </h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed font-normal">
              Join live creators and share your moments in sub-second real-time latency.
            </p>
          </div>

          {/* 3 Carousel Indicator Dots */}
          <div className="flex justify-center items-center gap-2 z-10">
            <span className="w-6 h-2 rounded-full bg-primary"></span>
            <span className="w-2 h-2 rounded-full bg-white/30"></span>
            <span className="w-2 h-2 rounded-full bg-white/30"></span>
          </div>
        </div>

        {/* Right Side: Clean White Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            {resetMode ? (
              <div>
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setResetMode(false)}
                  className="mb-4 text-text hover:text-primary font-semibold p-0 flex items-center gap-1"
                >
                  Back to login
                </Button>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-darkPurple tracking-tight mb-1">
                  Reset Password
                </h2>
                <p className="text-sm text-text mb-6 font-normal">
                  Enter your email address and we will send you a reset link.
                </p>

                <Form layout="vertical" onFinish={handlePasswordReset}>
                  <Form.Item
                    label={<span className="text-xs font-bold text-darkPurple uppercase tracking-wider">Email Address</span>}
                    required
                  >
                    <Input
                      prefix={<MailOutlined className="text-primary mr-1" />}
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="rounded-xl border-border h-12 text-sm focus:border-primary"
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    block
                    loading={resetLoading}
                    htmlType="submit"
                    className="bg-primary hover:bg-secondary text-white border-none rounded-xl font-bold h-12 shadow-lg shadow-primary/25 hover:scale-[1.01] transition-all"
                  >
                    Send Reset Link
                  </Button>
                </Form>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-darkPurple tracking-tight mb-1">
                    Welcome Back
                  </h2>
                  <p className="text-sm text-text font-normal">
                    Log in to continue to Touch Live
                  </p>
                </div>

                <Form layout="vertical" onFinish={handleEmailLogin} requiredMark={false}>
                  <Form.Item
                    name="email"
                    label={<span className="text-xs font-bold text-darkPurple tracking-wider">Email Address</span>}
                    rules={[
                      { required: true, message: "Email is required" },
                      { type: "email", message: "Please enter a valid email address" },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined className="text-primary mr-1" />}
                      placeholder="you@example.com"
                      className="rounded-xl border-border h-11 text-sm focus:border-primary"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label={
                      <div className="w-full flex justify-between items-center">
                        <span className="text-xs font-bold text-darkPurple tracking-wider">Password</span>
                        <span
                          className="text-xs font-bold text-primary hover:text-secondary cursor-pointer ml-auto transition-colors"
                          onClick={() => setResetMode(true)}
                        >
                          Forgot password?
                        </span>
                      </div>
                    }
                    rules={[{ required: true, message: "Password is required" }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-primary mr-1" />}
                      placeholder="••••••••"
                      className="rounded-xl border-border h-11 text-sm focus:border-primary"
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading.email}
                    block
                    className="bg-primary hover:bg-secondary text-white border-none rounded-xl font-bold h-12 shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm mt-1"
                  >
                    Sign In
                  </Button>
                </Form>

                <Divider className="my-5 border-border text-xs text-text font-medium">
                  Or continue with
                </Divider>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Button
                    block
                    icon={<GoogleOutlined style={{ color: "#ea4335" }} />}
                    loading={loading.google}
                    onClick={handleGoogleLogin}
                    className="border border-border text-darkPurple font-bold rounded-xl h-11 hover:border-primary hover:text-primary shadow-sm hover:shadow transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5"
                  >
                    Google
                  </Button>
                  <Button
                    block
                    icon={<UserOutlined className="text-primary" />}
                    loading={loading.guest}
                    onClick={handleGuestLogin}
                    className="border border-border text-darkPurple font-bold rounded-xl h-11 hover:border-primary hover:text-primary shadow-sm hover:shadow transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5"
                  >
                    Guest Login
                  </Button>
                </div>

                <p className="text-center text-xs sm:text-sm text-text font-medium">
                  Don&apos;t have an account?{" "}
                  <Link to="/signup" className="text-primary font-bold hover:text-secondary transition-colors">
                    Sign Up
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
