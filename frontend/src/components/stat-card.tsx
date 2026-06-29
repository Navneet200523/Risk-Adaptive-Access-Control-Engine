import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: { value: number; label: string };
    variant?: "default" | "primary" | "success" | "warning" | "danger";
    className?: string;
}

const variantStyles: Record<string, { bg: string; icon: string; text: string }> = {
    default: { bg: "bg-card", icon: "bg-primary/10 text-primary", text: "text-foreground" },
    primary: { bg: "bg-card", icon: "bg-blue-500/10 text-blue-500", text: "text-blue-500" },
    success: { bg: "bg-card", icon: "bg-emerald-500/10 text-emerald-500", text: "text-emerald-500" },
    warning: { bg: "bg-card", icon: "bg-amber-500/10 text-amber-500", text: "text-amber-500" },
    danger: { bg: "bg-card", icon: "bg-red-500/10 text-red-500", text: "text-red-500" },
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: StatCardProps) {
    const styles = variantStyles[variant];
    return (
        <div className={cn("rounded-xl border border-border p-5 transition-all duration-200 hover:shadow-lg", styles.bg, className)}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className={cn("text-3xl font-bold mt-1 tracking-tight", styles.text)}>{value}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
                    {trend && (
                        <p className={cn("text-xs font-medium mt-2", trend.value >= 0 ? "text-emerald-500" : "text-red-500")}>
                            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
                        </p>
                    )}
                </div>
                <div className={cn("p-3 rounded-xl", styles.icon)}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
