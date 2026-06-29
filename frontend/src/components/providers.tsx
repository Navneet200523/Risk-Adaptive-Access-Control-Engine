"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            retry: 1,
        },
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

    useEffect(() => {
        loadFromStorage();
        setMounted(true);
    }, [loadFromStorage]);

    if (!mounted) return null;

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
                {children}
                <Toaster richColors position="bottom-right" />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
