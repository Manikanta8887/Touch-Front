import apiClient from "./client";

export const getUserProfile = async (uid) => {
  const response = await apiClient.get(`/api/profile/${uid}`);
  return response.data;
};

export const updateUserProfile = async (uid, data) => {
  const response = await apiClient.put(`/api/profile/${uid}`, data);
  return response.data;
};

export const toggleSubscribeUser = async (uid, subscriberUid) => {
  const response = await apiClient.post(`/api/profile/subscribe/${uid}`, { subscriberUid });
  return response.data;
};
