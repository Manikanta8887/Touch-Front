import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Form, Input, Button, Progress, Divider } from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PlayCircleFilled,
  GoogleOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  signInAnonymously,
} from "firebase/auth";
import { Auth, GoogleProvider } from "../Firebase/Firebaseconfig";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveUser } from "../../api/users";
import { exchangeForTokens } from "../../api/auth";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState({ google: false, guest: false });
  const [password, setPassword] = useState("");

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, status: "exception", label: "Enter Password" };
    if (pass.length >= 8) score += 30;
    if (/[A-Z]/.test(pass)) score += 20;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score < 40) return { score, status: "exception", label: "Weak" };
    if (score < 75) return { score, status: "active", label: "Medium" };
    return { score: 100, status: "success", label: "Strong" };
  };

  const strength = calculatePasswordStrength(password);

  const syncUserWithBackend = async (user, nameOverride) => {
    try {
      const token = await user.getIdToken(true);
      const userData = {
        uid: user.uid,
        name: nameOverride || user.displayName || user.email?.split("@")[0] || "Streamer",
        email: user.email || `${user.uid}@guest.touchlive.com`,
        profilePic: user.photoURL || "",
      };
      await saveUser(userData, token);
      try {
        await exchangeForTokens(userData, token);
      } catch (tokenErr) {
        console.warn("Token exchange warning:", tokenErr);
      }
      toast.success("Account created successfully! Redirecting...");
      setTimeout(() => navigate("/livestreamingplatform", { replace: true }), 1000);
    } catch (error) {
      console.error("Backend Sync Error:", error);
      toast.error("Account created in Firebase, but failed to sync profile data.");
    }
  };

  const handleSubmit = async (values) => {
    const { username, email, password } = values;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(Auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: username });
      await syncUserWithBackend(user, username);
    } catch (error) {
      const errorMsg =
        error.code === "auth/email-already-in-use"
          ? "Email is already registered."
          : error.message;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setSocialLoading((prev) => ({ ...prev, google: true }));
    try {
      const result = await signInWithPopup(Auth, GoogleProvider);
      await syncUserWithBackend(result.user);
    } catch (error) {
      console.warn("Google sign-in error:", error);
      toast.error("Google sign-in canceled or failed");
    } finally {
      setSocialLoading((prev) => ({ ...prev, google: false }));
    }
  };

  const handleGuestSignup = async () => {
    setSocialLoading((prev) => ({ ...prev, guest: true }));
    try {
      const result = await signInAnonymously(Auth);
      await syncUserWithBackend(result.user, "Guest Streamer");
    } catch (error) {
      console.warn("Guest sign-in error:", error);
      toast.error("Guest login failed");
    } finally {
      setSocialLoading((prev) => ({ ...prev, guest: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 selection:bg-primary selection:text-white relative">
      {/* Background Soft Glow */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split-Screen Card */}
      <div className="w-full max-w-4xl bg-card rounded-3xl shadow-2xl border border-border/80 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px]">
        {/* Left Side: Dark Purple Brand Showcase */}
        <div className="w-full md:w-5/12 bg-darkPurple p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-primary/30 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute top-1/4 -left-16 w-48 h-48 bg-secondary/20 rounded-full blur-2xl pointer-events-none"></div>

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
            {/* Monitor / Camera Graphic Icon */}
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-primary/30 to-secondary/30 border border-white/15 flex items-center justify-center mb-6 shadow-xl backdrop-blur-md relative group">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg transform rotate-3 transition-transform group-hover:rotate-0">
                <DesktopOutlined className="text-white text-4xl" />
              </div>
            </div>

            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
              Broadcast • Connect • Grow
            </h3>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed font-normal">
              Create an account to host streams, build your channel, and engage in real-time.
            </p>
          </div>

          {/* 3 Carousel Indicator Dots */}
          <div className="flex justify-center items-center gap-2 z-10">
            <span className="w-2 h-2 rounded-full bg-white/30"></span>
            <span className="w-6 h-2 rounded-full bg-primary"></span>
            <span className="w-2 h-2 rounded-full bg-white/30"></span>
          </div>
        </div>

        {/* Right Side: Clean White Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-darkPurple tracking-tight mb-1">
                Create Your Account
              </h2>
              <p className="text-sm text-text font-normal">
                Join Touch Live and start streaming today
              </p>
            </div>

            <Form layout="vertical" onFinish={handleSubmit} requiredMark={false}>
              <Form.Item
                name="username"
                label={<span className="text-xs font-bold text-darkPurple tracking-wider">Full Name</span>}
                rules={[{ required: true, message: "Full name is required" }]}
              >
                <Input
                  prefix={<UserOutlined className="text-primary mr-1" />}
                  placeholder="Enter your full name"
                  className="rounded-xl border-border h-11 text-sm focus:border-primary"
                />
              </Form.Item>

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
                label={<span className="text-xs font-bold text-darkPurple tracking-wider">Password</span>}
                rules={[
                  { required: true, message: "Password is required" },
                  { min: 8, message: "Password must be at least 8 characters" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-primary mr-1" />}
                  placeholder="••••••••"
                  className="rounded-xl border-border h-11 text-sm focus:border-primary"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Item>

              {password && (
                <div className="mb-4 bg-background p-2.5 rounded-xl border border-border">
                  <div className="flex justify-between items-center text-xs mb-1 font-bold text-darkPurple">
                    <span>Password Strength:</span>
                    <span className="text-primary">{strength.label}</span>
                  </div>
                  <Progress
                    percent={strength.score}
                    status={strength.status}
                    showInfo={false}
                    strokeColor={strength.score >= 75 ? "#10B981" : strength.score >= 40 ? "#A34BD0" : "#EF4444"}
                    size="small"
                  />
                </div>
              )}

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="bg-primary hover:bg-secondary text-white border-none rounded-xl font-bold h-12 shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm mt-1"
              >
                Sign Up
              </Button>
            </Form>

            <Divider className="my-5 border-border text-xs text-text font-medium">
              Or continue with
            </Divider>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                block
                icon={<GoogleOutlined style={{ color: "#ea4335" }} />}
                loading={socialLoading.google}
                onClick={handleGoogleSignup}
                className="border border-border text-darkPurple font-bold rounded-xl h-11 hover:border-primary hover:text-primary shadow-sm hover:shadow transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5"
              >
                Google
              </Button>
              <Button
                block
                icon={<UserOutlined className="text-primary" />}
                loading={socialLoading.guest}
                onClick={handleGuestSignup}
                className="border border-border text-darkPurple font-bold rounded-xl h-11 hover:border-primary hover:text-primary shadow-sm hover:shadow transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5"
              >
                Guest Login
              </Button>
            </div>

            <p className="text-center text-xs sm:text-sm text-text font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-bold hover:text-secondary transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
