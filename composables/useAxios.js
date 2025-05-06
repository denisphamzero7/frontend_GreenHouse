import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
};

export default function useAxios() {
  const api = axios.create({
    baseURL: "http://localhost:8080/",
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("token");
      if (token) config.headers["Authorization"] = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
            .then((token) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch(Promise.reject);
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await axios.post("http://localhost:8080/api/user/refreshtoken", {}, { withCredentials: true });
          localStorage.setItem("token", data.newAccessToken);
          processQueue(null, data.newAccessToken);
          originalRequest.headers["Authorization"] = `Bearer ${data.newAccessToken}`;
          return api(originalRequest);
        } catch (err) {
          processQueue(err);
          window.location.href = "/login";
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    }
  );

  return { api };
}