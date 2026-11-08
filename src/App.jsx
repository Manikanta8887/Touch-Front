import { Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LiveStreamingPlatform from "./Components/Pages/Main";
import LandingPage from "./Components/LandingPage/LandingPage";
import Loginpage from "./Components/Login/Login";
import PageNotFound from "./Components/Login/PageNotFound";
import Signup from "./Components/Login/Signup";
import StartStreaming from "./Components/Pages/Startstreaming";
import StreamingContent from "./Components/Pages/Browse";
import ProfilePage from "./Components/Pages/Profile";
import WatchStream from "./Components/Pages/WatchStream.jsx";
import VideoWatchPage from "./Components/Pages/VideoWatchPage.jsx";
import SettingsPage from "./Components/Pages/Settings.jsx";
import ProtectedRoute from "./Components/Common/ProtectedRoute.jsx";

import Spin from "./assets/spinloading.svg";
import { useEffect, useRef, useState, useMemo } from "react";

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const prevBaseRoute = useRef("");

  const currentBaseRoute = useMemo(() => {
    return location.pathname.split("/")[1] || "/";
  }, [location.pathname]);

  useEffect(() => {
    if (prevBaseRoute.current && prevBaseRoute.current !== currentBaseRoute) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    prevBaseRoute.current = currentBaseRoute;
  }, [currentBaseRoute]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-[#F8F9FD]">
          <img src={Spin} alt="Loading..." className="w-24 h-24 object-contain" />
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Loginpage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/livestreamingplatform" element={<LiveStreamingPlatform />}>
            <Route index element={<StreamingContent />} />
            <Route path="videos" element={<StreamingContent defaultTab="videos" />} />
            <Route
              path="stream/:id"
              element={
                <ProtectedRoute>
                  <StartStreaming />
                </ProtectedRoute>
              }
            />
            <Route path="watch/:id" element={<WatchStream />} />
            <Route path="video/:id" element={<VideoWatchPage />} />
            <Route path="video/*" element={<VideoWatchPage />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="profile/:uid" element={<ProfilePage />} />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/*" element={<PageNotFound />} />
        </Routes>
      )}
    </>
  );
}

export default App;
