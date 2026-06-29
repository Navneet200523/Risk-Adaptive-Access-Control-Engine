import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && typeof window !== "undefined") {
            const detail = error.response.data?.detail;
            
            // IF high risk or unauthorized severe access, DO NOT retry with refresh token
            if (detail === "SESSION_TERMINATED_HIGH_RISK" || detail === "SESSION_TERMINATED_UNAUTHORIZED") {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("user");
                const reason = detail === "SESSION_TERMINATED_HIGH_RISK" ? "high_risk" : "unauthorized_severe";
                window.location.href = `/login?reason=${reason}`;
                return Promise.reject(error);
            }

            const refreshToken = localStorage.getItem("refresh_token");
            if (refreshToken && !error.config._retry) {
                error.config._retry = true;
                try {
                    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refresh_token: refreshToken,
                    });
                    localStorage.setItem("access_token", res.data.access_token);
                    error.config.headers.Authorization = `Bearer ${res.data.access_token}`;
                    return api(error.config);
                } catch {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
