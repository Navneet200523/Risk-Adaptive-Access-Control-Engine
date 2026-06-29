"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, isLoading, isAuthenticated, logout } = useAuthStore();
    const router = useRouter();

    const hasAccess = user && allowedRoles.includes(user.role);

    useEffect(() => {
        if (!isLoading && isAuthenticated && !hasAccess) {
            logout();
            router.replace("/login");
        }
    }, [isLoading, isAuthenticated, hasAccess, logout, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-fade-in px-4">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                    <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">403 - Forbidden</h1>
                    <p className="text-muted-foreground max-w-md mt-2">
                        Access Denied. You do not have the necessary permissions to view this page. 
                        This unauthorized access attempt has been logged for security review. You are being logged out.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
