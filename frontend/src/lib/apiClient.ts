import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
});

// 🔐 Request interceptor — auto attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("agrichain_token");
  console.log("Attaching token to request:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;