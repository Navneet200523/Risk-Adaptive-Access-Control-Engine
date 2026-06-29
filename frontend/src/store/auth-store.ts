import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,

    setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("access_token", accessToken);
            localStorage.setItem("refresh_token", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
    },

    logout: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user");
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    },

    loadFromStorage: () => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("access_token");
            const refresh = localStorage.getItem("refresh_token");
            const userData = localStorage.getItem("user");
            if (token && userData) {
                try {
                    const user = JSON.parse(userData);
                    set({ user, accessToken: token, refreshToken: refresh, isAuthenticated: true, isLoading: false });
                    return;
                } catch { }
            }
        }
        set({ isLoading: false });
    },
}));
