"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
    LayoutDashboard,
    FolderOpen,
    FileText,
    User,
    Activity,
    Shield,
    Users,
    Sliders,
    ScrollText,
    Zap,
    ShieldAlert,
    LogOut,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

const mainNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/files", label: "Files", icon: FolderOpen },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/activity", label: "Activity", icon: Activity },
];

const adminNav = [
    { href: "/security", label: "Security", icon: ShieldAlert },
    { href: "/admin", label: "Users", icon: Users },
    { href: "/risk-policy", label: "Risk Policy", icon: Sliders },
    { href: "/logs", label: "Access Logs", icon: ScrollText },
    { href: "/simulations", label: "Simulations", icon: Zap },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);

    const isAdmin = user?.role === "admin";
    const isManager = user?.role === "manager" || isAdmin;

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-border flex flex-col transition-all duration-300",
                collapsed ? "w-[68px]" : "w-[260px]"
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg gradient-primary">
                    <Shield className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-base font-bold tracking-tight">RAAC Engine</h1>
                        <p className="text-[10px] text-muted-foreground font-medium">Zero Trust Access Control</p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto p-1.5 rounded-md hover:bg-accent transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <p className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2", collapsed ? "text-center" : "px-3")}>
                    {collapsed ? "—" : "Main"}
                </p>
                {mainNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}

                {isManager && (
                    <>
                        <div className="pt-4 pb-1">
                            <p className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2", collapsed ? "text-center" : "px-3")}>
                                {collapsed ? "—" : "Admin"}
                            </p>
                        </div>
                        {adminNav.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-sm"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                                        collapsed && "justify-center px-2"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="border-t border-border p-3 space-y-2">
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all",
                        collapsed && "justify-center px-2"
                    )}
                >
                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
                </button>

                <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "justify-center px-0")}>
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                            {user?.full_name?.charAt(0) || "U"}
                        </span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.full_name}</p>
                            <p className="text-[11px] text-muted-foreground truncate capitalize">{user?.role}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => {
                        logout();
                        window.location.href = "/login";
                    }}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all",
                        collapsed && "justify-center px-2"
                    )}
                >
                    <LogOut className="w-5 h-5" />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
