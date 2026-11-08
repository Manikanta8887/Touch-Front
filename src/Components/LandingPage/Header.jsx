import { useState } from "react";
import { Layout, Button, Drawer, Input } from "antd";
import {
  MenuOutlined,
  PlayCircleFilled,
  UserOutlined,
  UserAddOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";

const { Header } = Layout;

const AppHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      if (searchQuery.trim()) {
        navigate(`/livestreamingplatform?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        navigate("/livestreamingplatform");
      }
    }
  };

  const scrollToSection = (id) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        performScroll(id);
      }, 150);
      return;
    }
    performScroll(id);
  };

  const performScroll = (id) => {
    if (id === "hero" || id === "home" || !id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 85;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: "smooth",
      });
    }
  };

  return (
    <Header
      className="sticky top-0 z-50 px-4 sm:px-8 py-3 flex items-center justify-between shadow-lg leading-normal h-auto"
      style={{
        background: "#2D0A45",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Brand Logo */}
      <Link
        to="/"
        onClick={(e) => {
          if (location.pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        className="flex items-center gap-2.5 no-underline group shrink-0"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/40 group-hover:scale-105 transition-transform">
          <PlayCircleFilled className="text-white text-xl" />
        </div>
        <span className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center">
          Touch<span className="text-white ml-1.5 font-bold">Live</span>
        </span>
      </Link>

      {/* Center Nav Links (Desktop) */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-200">
        <div className="relative py-1 cursor-pointer" onClick={() => scrollToSection("hero")}>
          <span className="text-white hover:text-white transition-colors">Home</span>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full"></div>
        </div>

        <button
          type="button"
          onClick={() => scrollToSection("features")}
          className="text-slate-300 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold text-sm"
        >
          Features
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("how-it-works")}
          className="text-slate-300 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer font-semibold text-sm"
        >
          How it Works
        </button>

        <Link
          to="/livestreamingplatform"
          className="text-slate-300 hover:text-white transition-colors no-underline font-semibold"
        >
          Explore
        </Link>
      </nav>

      {/* Desktop Actions (Search + Login + Get Started) */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Search Input Pill */}
        <div className="relative w-48 xl:w-56">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search streams..."
            prefix={<SearchOutlined className="text-slate-400 mr-1 text-sm cursor-pointer" onClick={handleSearch} />}
            className="rounded-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border-white/15 text-white placeholder-slate-400 h-9 px-3.5 text-xs focus:border-primary transition-all [&_input]:bg-transparent [&_input]:text-white [&_input::placeholder]:text-slate-400"
          />
        </div>

        {/* Login Pill Button */}
        <Link to="/login" className="no-underline">
          <Button
            type="text"
            icon={<UserOutlined className="text-sm" />}
            className="rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-white font-medium border border-white/20 px-4 h-9 flex items-center gap-1.5 transition-all text-xs"
          >
            Login
          </Button>
        </Link>

        {/* Get Started Pill Button */}
        <Link to="/signup" className="no-underline">
          <Button
            type="primary"
            icon={<UserAddOutlined className="text-sm" />}
            className="rounded-full bg-primary hover:bg-secondary text-white font-semibold border-none px-5 h-9 flex items-center gap-1.5 shadow-md shadow-primary/40 hover:scale-105 active:scale-95 transition-all text-xs"
          >
            Get Started
          </Button>
        </Link>
      </div>

      {/* Mobile/Tablet Menu Button */}
      <div className="flex lg:hidden items-center gap-2">
        <Link to="/login" className="no-underline sm:hidden">
          <Button
            type="text"
            size="small"
            icon={<UserOutlined />}
            className="rounded-full bg-white/10 text-white font-medium px-3 h-8 text-xs border border-white/20"
          >
            Login
          </Button>
        </Link>

        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: "1.25rem", color: "#FFFFFF" }} />}
          className="flex items-center justify-center p-2 text-white hover:bg-white/10 rounded-lg"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        />
      </div>

      {/* Mobile Drawer Menu */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <PlayCircleFilled className="text-white text-sm" />
            </div>
            <span className="text-white font-extrabold text-base">Touch Live</span>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{
          body: { background: "#2D0A45", color: "#FFFFFF" },
          header: { background: "#1C062C", borderBottom: "1px solid rgba(255,255,255,0.08)" },
        }}
      >
        <div className="flex flex-col gap-4 pt-2">
          {/* Mobile Search */}
          <div className="mb-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e);
                  setMobileMenuOpen(false);
                }
              }}
              placeholder="Search streams..."
              prefix={<SearchOutlined className="text-slate-400 mr-1 text-sm" />}
              className="rounded-full bg-white/10 border-white/20 text-white placeholder-slate-400 h-10 px-4 text-sm [&_input]:bg-transparent [&_input]:text-white [&_input::placeholder]:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              scrollToSection("hero");
              setMobileMenuOpen(false);
            }}
            className="text-left text-slate-200 hover:text-white font-semibold py-2 px-3 rounded-lg hover:bg-white/5 bg-transparent border-none cursor-pointer"
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => {
              scrollToSection("features");
              setMobileMenuOpen(false);
            }}
            className="text-left text-slate-200 hover:text-white font-semibold py-2 px-3 rounded-lg hover:bg-white/5 bg-transparent border-none cursor-pointer"
          >
            Features
          </button>

          <button
            type="button"
            onClick={() => {
              scrollToSection("how-it-works");
              setMobileMenuOpen(false);
            }}
            className="text-left text-slate-200 hover:text-white font-semibold py-2 px-3 rounded-lg hover:bg-white/5 bg-transparent border-none cursor-pointer"
          >
            How it Works
          </button>

          <Link
            to="/livestreamingplatform"
            onClick={() => setMobileMenuOpen(false)}
            className="text-slate-200 hover:text-white font-semibold py-2 px-3 rounded-lg hover:bg-white/5 no-underline"
          >
            Explore Streams
          </Link>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="no-underline">
              <Button
                type="default"
                block
                icon={<UserOutlined />}
                className="rounded-full border-white/20 text-white bg-white/5 hover:bg-white/10 h-10 font-semibold"
              >
                Login
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="no-underline">
              <Button
                type="primary"
                block
                icon={<UserAddOutlined />}
                className="rounded-full bg-primary text-white hover:bg-secondary border-none h-10 font-bold shadow-md shadow-primary/30"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </Drawer>
    </Header>
  );
};

export default AppHeader;