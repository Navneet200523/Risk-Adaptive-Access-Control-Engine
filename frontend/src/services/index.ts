import api from "./api";
import { LoginRequest, RegisterRequest, MFARequest, AuthResponse } from "@/types";

export const authService = {
    login: (data: LoginRequest) =>
        api.post<AuthResponse>("/auth/login", {
            ...data,
            device_fingerprint: getFingerprint(),
            browser: getBrowser(),
            os: getOS(),
        }),

    register: (data: RegisterRequest) =>
        api.post("/auth/register", data),

    verifyMFA: (data: MFARequest) =>
        api.post<AuthResponse>("/auth/mfa", { ...data, device_fingerprint: getFingerprint() }),

    refresh: (refreshToken: string) =>
        api.post("/auth/refresh", { refresh_token: refreshToken }),

    logout: () => api.post("/auth/logout"),

    getMe: () => api.get("/auth/me"),

    forgotPassword: (email: string) =>
        api.post("/auth/forgot-password", { email }),

    forgotPasswordVerify: (email: string, otp_code: string) =>
        api.post("/auth/forgot-password/verify", { email, otp_code }),

    forgotPasswordReset: (email: string, otp_code: string, new_password: string) =>
        api.post("/auth/forgot-password/reset", { email, otp_code, new_password }),
};

export const filesService = {
    list: () => api.get("/files/"),
    shared: () => api.get("/files/shared"),
    upload: (file: File) => {
        const form = new FormData();
        form.append("file", file);
        return api.post("/files/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
    },
    download: (id: string) => api.get(`/files/download/${id}`, { responseType: "blob" }),
    rename: (id: string, newName: string) => api.put(`/files/${id}/rename`, { new_name: newName }),
    delete: (id: string) => api.delete(`/files/${id}`),
    share: (id: string, emails: string[]) => api.post(`/files/${id}/share`, { emails }),
};

export const reportsService = {
    list: () => api.get("/reports/"),
    generate: (type: string) => api.get(`/reports/generate?report_type=${type}`),
    exportCSV: () => api.get("/reports/export", { responseType: "blob" }),
};

export const adminService = {
    listUsers: () => api.get("/admin/users"),
    createUser: (data: any) => api.post("/admin/create-user", data),
    deleteUser: (id: string) => api.delete(`/admin/delete-user/${id}`),
    toggleUser: (id: string) => api.put(`/admin/toggle-user/${id}`),
};

export const securityService = {
    getLogs: (page: number = 1, limit: number = 50) => api.get(`/security/logs?page=${page}&limit=${limit}`),
    getRiskStats: () => api.get("/security/risk-stats"),
    getActivity: (limit: number = 50) => api.get(`/security/activity?limit=${limit}`),
};

export const riskPolicyService = {
    get: () => api.get("/risk-policy/"),
    update: (data: any) => api.put("/risk-policy/", data),
};

export const simulationService = {
    listScenarios: () => api.get("/simulation/scenarios"),
    run: (scenario: string) => api.post(`/simulation/${scenario}`),
};

// Device fingerprint (simple)
function getFingerprint(): string {
    if (typeof window === "undefined") return "ssr";
    const nav = window.navigator;
    const screen = window.screen;
    const raw = [nav.userAgent, nav.language, screen.width, screen.height, screen.colorDepth, new Date().getTimezoneOffset()].join("|");
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

function getBrowser(): string {
    if (typeof window === "undefined") return "SSR";
    const ua = navigator.userAgent;
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    return "Unknown";
}

function getOS(): string {
    if (typeof window === "undefined") return "SSR";
    const ua = navigator.userAgent;
    if (ua.includes("Win")) return "Windows";
    if (ua.includes("Mac")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    return "Unknown";
}
