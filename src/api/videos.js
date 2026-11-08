import apiClient from "./client";

export const uploadVideo = async (uid, videoFile, title, description) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  if (title) formData.append("title", title);
  if (description) formData.append("description", description);

  const response = await apiClient.post(`/api/videos/upload/${uid}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const getUserVideos = async (uid) => {
  const response = await apiClient.get(`/api/videos/${uid}`);
  return response.data;
};

export const getAllVideos = async () => {
  const response = await apiClient.get("/api/videos");
  return response.data;
};

export const deleteVideo = async (publicId) => {
  const response = await apiClient.delete("/api/videos", {
    params: { public_id: publicId },
  });
  return response.data;
};

export const likeVideo = async (videoId) => {
  const response = await apiClient.post(`/api/videos/like/${videoId}`);
  return response.data;
};

export const recordVideoView = async (videoId) => {
  const response = await apiClient.post(`/api/videos/view/${videoId}`);
  return response.data;
};
