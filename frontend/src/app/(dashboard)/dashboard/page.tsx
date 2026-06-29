"use client";

import { useQuery } from "@tanstack/react-query";
import { securityService } from "@/services";
import { useAuthStore } from "@/store/auth-store";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, AlertTriangle, CheckCircle, Users, TrendingUp, ShieldAlert, Lock } from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
    const { user } = useAuthStore();
    const { data: stats } = useQuery({
        queryKey: ["risk-stats"],
        queryFn: () => securityService.getRiskStats().then((r) => r.data),
        refetchInterval: 30000,
    });

    const riskDistribution = {
        labels: ["Low Risk", "Medium Risk", "High Risk"],
        datasets: [{
            data: [stats?.low_risk_count || 0, stats?.medium_risk_count || 0, stats?.high_risk_count || 0],
            backgroundColor: ["rgba(16, 185, 129, 0.8)", "rgba(245, 158, 11, 0.8)", "rgba(239, 68, 68, 0.8)"],
            borderColor: ["rgb(16, 185, 129)", "rgb(245, 158, 11)", "rgb(239, 68, 68)"],
            borderWidth: 2,
        }],
    };

    const dailyData = {
        labels: stats?.daily_stats?.map((d: any) => d.date.slice(5)) || [],
        datasets: [
            {
                label: "Avg Risk Score",
                data: stats?.daily_stats?.map((d: any) => d.avg_risk) || [],
                borderColor: "rgb(99, 102, 241)",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                fill: true,
                tension: 0.4,
            },
            {
                label: "Request Count",
                data: stats?.daily_stats?.map((d: any) => d.count) || [],
                borderColor: "rgb(14, 165, 233)",
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const decisionData = {
        labels: ["Allowed", "MFA Triggered", "Denied"],
        datasets: [{
            data: [
                (stats?.total_requests || 0) - (stats?.mfa_triggered_count || 0) - (stats?.denied_count || 0),
                stats?.mfa_triggered_count || 0,
                stats?.denied_count || 0,
            ],
            backgroundColor: ["rgba(16, 185, 129, 0.8)", "rgba(245, 158, 11, 0.8)", "rgba(239, 68, 68, 0.8)"],
            borderWidth: 0,
        }],
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.full_name?.split(" ")[0]}</h1>
                <p className="text-muted-foreground mt-1">Here&apos;s your security overview for today</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Requests" value={stats?.total_requests || 0} icon={Activity} variant="primary" subtitle="Last 30 days" />
                <StatCard title="Avg Risk Score" value={stats?.avg_risk_score?.toFixed(1) || "0"} icon={TrendingUp} variant={(stats?.avg_risk_score || 0) > 40 ? "warning" : "success"} subtitle="Lower is better" />
                <StatCard title="MFA Triggers" value={stats?.mfa_triggered_count || 0} icon={Shield} variant="warning" subtitle="Verification required" />
                <StatCard title="Blocked" value={stats?.denied_count || 0} icon={Lock} variant="danger" subtitle="Access denied" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Activity & Risk Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <Line data={dailyData} options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: "top", labels: { usePointStyle: true, padding: 20 } } },
                                scales: {
                                    x: { grid: { display: false } },
                                    y: { beginAtZero: true, grid: { color: "rgba(148, 163, 184, 0.1)" } },
                                },
                            }} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Risk Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] flex items-center justify-center">
                            <Doughnut data={riskDistribution} options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 15 } } },
                                cutout: "65%",
                            }} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Decision Distribution + Suspicious Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            Access Decisions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px]">
                            <Bar data={decisionData} options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { display: false } },
                                    y: { beginAtZero: true, grid: { color: "rgba(148, 163, 184, 0.1)" } },
                                },
                            }} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Recent Suspicious Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto">
                            {stats?.recent_suspicious?.length ? (
                                stats.recent_suspicious.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert className="w-4 h-4 text-red-500" />
                                            <div>
                                                <p className="text-sm font-medium truncate max-w-[200px]">{item.resource}</p>
                                                <p className="text-xs text-muted-foreground">{item.country} · {new Date(item.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <Badge variant={item.decision === "DENY" ? "destructive" : "warning"}>
                                            {item.risk_score}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No suspicious activity detected</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
