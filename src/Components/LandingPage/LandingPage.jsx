import { useState } from "react";
import { Row, Col } from "antd";
import {
  PlayCircleFilled,
  VideoCameraFilled,
  EyeOutlined,
  ThunderboltFilled,
  WifiOutlined,
  FundProjectionScreenOutlined,
  TeamOutlined,
  UserAddOutlined,
  VideoCameraOutlined,
  ArrowRightOutlined,
  SoundOutlined,
  SettingOutlined,
  FullscreenOutlined,
  PauseOutlined,
  HeartFilled,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "./Header";
import Landimage1 from "../../assets/landimage.svg";

const CATEGORIES = [
  {
    name: "Gaming",
    icon: "🎮",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80",
    query: "Gaming",
  },
  {
    name: "Entertainment",
    icon: "🎬",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    query: "Entertainment",
  },
  {
    name: "Travel",
    icon: "⛰",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80",
    query: "Travel",
  },
  {
    name: "Music",
    icon: "🎵",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
    query: "Music",
  },
  {
    name: "Tech",
    icon: "💻",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    query: "Tech",
  },
  {
    name: "Education",
    icon: "🎓",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80",
    query: "Education",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(42);

  return (
    <div className="min-h-screen bg-[#FAF5FF] text-slate-800 font-sans selection:bg-primary selection:text-white relative flex flex-col justify-between">
      {/* Navigation Header */}
      <AppHeader />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col">
        {/* ========================================================================= */}
        {/* SECTION 1: HERO SECTION                                                   */}
        {/* ========================================================================= */}
        <section
          id="hero"
          className="relative pt-12 pb-16 md:py-20 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto w-full scroll-mt-28"
        >
          {/* Organic Purple Blob Behind Player */}
          <div
            className="absolute -right-20 top-8 w-[500px] lg:w-[650px] h-[500px] lg:h-[650px] pointer-events-none -z-10 opacity-70"
            style={{
              background: "radial-gradient(circle, #D8B4FE 0%, #C084FC 40%, rgba(243,232,255,0) 70%)",
              borderRadius: "45% 55% 63% 37% / 40% 45% 55% 60%",
              transform: "rotate(15deg)",
            }}
          />

          <Row gutter={[48, 48]} align="middle">
            {/* Left Column: Headline, Description & CTAs */}
            <Col xs={24} lg={12} className="z-10">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EDE4F7] border border-[#D8B4FE]/60 text-primary text-xs font-extrabold tracking-wider uppercase mb-6 shadow-sm">
                <ThunderboltFilled className="text-primary text-xs" />
                <span>Next-Gen WebRTC Streaming</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-[#2D0A45] tracking-tight mb-6 leading-[1.15]">
                Broadcast Live. <br />
                <span className="text-primary">Connect Instantly.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl font-normal">
                A high-performance, real-time live streaming platform powered by WebRTC. Stream,
                interact, and grow your community with sub-second latency.
              </p>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-12">
                <Link to="/login" className="no-underline">
                  <button className="rounded-full bg-primary hover:bg-secondary text-white font-bold h-12 px-7 shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base border-none cursor-pointer">
                    <VideoCameraFilled className="text-base" />
                    <span>Start Streaming</span>
                  </button>
                </Link>

                <Link to="/livestreamingplatform" className="no-underline">
                  <button className="rounded-full bg-white hover:bg-slate-50 text-[#2D0A45] font-bold h-12 px-7 border border-slate-200 shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer">
                    <PlayCircleFilled className="text-primary text-lg" />
                    <span>Browse Streams</span>
                  </button>
                </Link>
              </div>

              {/* 4 Feature Stats Row */}
              <div
                id="features"
                className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-purple-200/70 max-w-2xl scroll-mt-28"
              >
                {/* Stat 1 */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1 text-primary">
                    <ThunderboltFilled className="text-base" />
                    <span className="text-lg sm:text-xl font-black text-[#2D0A45]">Sub-sec</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">WebRTC Latency</span>
                </div>

                {/* Stat 2 */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1 text-primary">
                    <WifiOutlined className="text-base font-bold" />
                    <span className="text-lg sm:text-xl font-black text-[#2D0A45]">100%</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Real-time Signaling</span>
                </div>

                {/* Stat 3 */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1 text-primary">
                    <FundProjectionScreenOutlined className="text-base font-bold" />
                    <span className="text-lg sm:text-xl font-black text-[#2D0A45]">HD</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Adaptive Quality</span>
                </div>

                {/* Stat 4 */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1 text-primary">
                    <TeamOutlined className="text-base font-bold" />
                    <span className="text-lg sm:text-xl font-black text-[#2D0A45]">Community</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Interact & Grow</span>
                </div>
              </div>
            </Col>

            {/* Right Column: Hero Live Video Mockup */}
            <Col xs={24} lg={12} className="relative z-10">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Organic backdrop wave shape */}
                <div
                  className="absolute -inset-4 sm:-inset-6 bg-[#AD49E1]/20 -z-10"
                  style={{
                    borderRadius: "42% 58% 70% 30% / 45% 45% 55% 55%",
                    transform: "rotate(-3deg) scale(1.05)",
                  }}
                />

                {/* Video Monitor Frame */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-[#1A0B2E] min-h-[350px] sm:min-h-[420px] flex flex-col justify-between group">
                  {/* Streamer Live Camera Content using our original project illustration */}
                  <div className="relative w-full flex-1 flex items-center justify-center bg-[#150727] overflow-hidden p-4 sm:p-6">
                    {/* Background Neon Studio Decor */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#1A0630] via-[#2A0845] to-[#120422]" />

                    {/* Glowing Purple Neon Play Sign on wall */}
                    <div className="absolute top-6 right-6 z-10 w-14 h-11 rounded-xl border-2 border-[#D946EF]/70 shadow-[0_0_20px_rgba(217,70,239,0.5)] flex items-center justify-center bg-[#D946EF]/10 pointer-events-none">
                      <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[12px] border-l-[#F0ABFC] border-b-[6px] border-b-transparent ml-1 drop-shadow-[0_0_6px_rgba(240,171,252,0.8)]" />
                    </div>

                    {/* Original Broadcaster Illustration */}
                    <img
                      src={Landimage1}
                      alt="Touch Live Broadcaster"
                      className="relative z-10 max-h-60 sm:max-h-72 w-auto max-w-full object-contain filter drop-shadow-xl"
                    />

                    {/* Top Left Badges: LIVE + Viewers */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                      <div className="bg-[#EF4444] text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        LIVE
                      </div>

                      <div className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow-lg">
                        <EyeOutlined className="text-secondary text-xs" />
                        <span>1.4k Watching</span>
                      </div>
                    </div>

                    {/* Floating Reaction Hearts on the Right */}
                    <div className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-2 pointer-events-none">
                      <div className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/50 animate-bounce duration-1000">
                        <HeartFilled className="text-xs" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/50 animate-pulse">
                        <HeartFilled className="text-sm" />
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-xl shadow-red-500/60 scale-105">
                        <HeartFilled className="text-base" />
                      </div>
                    </div>
                  </div>

                  {/* Video Player Bottom Controls Bar */}
                  <div className="bg-gradient-to-t from-black/95 via-black/80 to-transparent px-4 py-3 flex flex-col gap-2 z-20">
                    <div className="flex items-center justify-between gap-3 text-white text-sm">
                      {/* Left: Play/Pause + Volume */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="bg-transparent border-none text-white hover:text-primary cursor-pointer p-0 flex items-center text-sm transition-colors"
                        >
                          {isPlaying ? <PauseOutlined /> : <PlayCircleFilled />}
                        </button>
                        <SoundOutlined className="text-white hover:text-primary cursor-pointer transition-colors" />
                      </div>

                      {/* Center: Purple Progress Seeker Bar */}
                      <div
                        className="flex-1 mx-2 relative h-1.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer flex items-center group/bar"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const newPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                          setProgress(Math.round(newPct));
                        }}
                      >
                        <div
                          className="h-full bg-primary rounded-full relative"
                          style={{ width: `${progress}%` }}
                        >
                          {/* Circular Purple Thumb Knob */}
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary shadow-md group-hover/bar:scale-125 transition-transform" />
                        </div>
                      </div>

                      {/* Right: CC, Settings, PiP, Fullscreen */}
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                        <span className="font-bold border border-white/40 px-1 py-0.2 rounded text-[10px] hover:text-white cursor-pointer">
                          CC
                        </span>
                        <SettingOutlined className="hover:text-white cursor-pointer transition-colors" />
                        <svg
                          className="w-3.5 h-3.5 hover:text-white cursor-pointer fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z" />
                        </svg>
                        <FullscreenOutlined className="hover:text-white cursor-pointer transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: EXPLORE POPULAR STREAMS                                        */}
        {/* ========================================================================= */}
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto w-full scroll-mt-28">
          {/* Header Row: Title & View All Link */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                <PlayCircleFilled className="text-lg" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#2D0A45] tracking-tight m-0">
                Explore Popular Streams
              </h2>
            </div>

            <Link
              to="/livestreamingplatform"
              className="text-primary hover:text-secondary font-bold text-sm flex items-center gap-1.5 no-underline transition-colors group"
            >
              <span>View All</span>
              <ArrowRightOutlined className="text-xs group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 6 Category Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                onClick={() =>
                  navigate(`/livestreamingplatform?category=${encodeURIComponent(cat.query)}`)
                }
                className="group relative h-32 sm:h-36 rounded-2xl overflow-hidden shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 border border-purple-200/50 hover:-translate-y-1"
              >
                {/* Background Photography */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                />

                {/* Dark Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 group-hover:from-black/90 transition-colors" />

                {/* Bottom Left Category Pill Badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-sm font-bold tracking-tight">{cat.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: HOW TOUCH LIVE WORKS?                                          */}
        {/* ========================================================================= */}
        <section
          id="how-it-works"
          className="py-8 sm:py-12 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto w-full mb-12 scroll-mt-28"
        >
          {/* Large Rounded Container Card */}
          <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm">
            <Row gutter={[32, 32]} align="middle">
              {/* Left Column: Heading and Subtitle */}
              <Col xs={24} lg={9}>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2D0A45] tracking-tight mb-3">
                  How <span className="text-primary">Touch Live</span> Works?
                </h2>
                <p className="text-slate-500 text-sm sm:text-base leading-relaxed m-0 font-normal">
                  Go live in three simple steps and reach your audience instantly.
                </p>
              </Col>

              {/* Right Column: 3 Connected Process Steps */}
              <Col xs={24} lg={15}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-3">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-primary text-xl flex-shrink-0 shadow-inner">
                      <UserAddOutlined />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[#2D0A45] m-0 mb-0.5">
                        1. Create an Account
                      </h4>
                      <p className="text-xs text-slate-500 m-0">Sign up and set up your profile</p>
                    </div>
                  </div>

                  {/* Arrow 1 */}
                  <div className="hidden sm:flex text-purple-300 text-lg px-2">
                    <ArrowRightOutlined />
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-primary text-xl flex-shrink-0 shadow-inner">
                      <VideoCameraOutlined />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[#2D0A45] m-0 mb-0.5">
                        2. Start Streaming
                      </h4>
                      <p className="text-xs text-slate-500 m-0">Set up your camera and go live</p>
                    </div>
                  </div>

                  {/* Arrow 2 */}
                  <div className="hidden sm:flex text-purple-300 text-lg px-2">
                    <ArrowRightOutlined />
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-primary text-xl flex-shrink-0 shadow-inner">
                      <TeamOutlined />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[#2D0A45] m-0 mb-0.5">
                        3. Grow Your Audience
                      </h4>
                      <p className="text-xs text-slate-500 m-0">
                        Interact, engage, and build a community
                      </p>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </section>
      </div>

      {/* Decorative Wave Accent at Bottom */}
      <div className="w-full overflow-hidden leading-none pointer-events-none opacity-40">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-12 sm:h-16 text-primary"
          preserveAspectRatio="none"
        >
          <path
            d="M0,32L80,37.3C160,43,320,53,480,48C640,43,800,21,960,16C1120,11,1280,21,1360,26.7L1440,32L1440,80L1360,80C1280,80,1120,80,960,80C800,80,640,80,480,80C320,80,160,80,80,80L0,80Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
  );
};

export default LandingPage;