import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { Auth } from "../Firebase/Firebaseconfig";
import { getAccessToken, isTokenExpired, getRefreshToken } from "../../api/auth";

const ProtectedRoute = ({ children }) => {
  const reduxUser = useSelector((state) => state.user.firebaseUser);
  const authUser = Auth.currentUser;
  const token = getAccessToken();
  const hasValidToken = Boolean(token && (!isTokenExpired(token) || getRefreshToken()));
  const location = useLocation();

  if (!reduxUser && !authUser && !hasValidToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;

