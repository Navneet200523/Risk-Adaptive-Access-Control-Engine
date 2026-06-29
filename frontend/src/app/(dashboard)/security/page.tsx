"use client";

import { useQuery } from "@tanstack/react-query";
import { securityService } from "@/services";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Shield, AlertTriangle, Lock, Activity, Eye, TrendingUp, Loader2 } from "lucide-react";
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

import { RoleGuard } from "@/components/role-guard";

export default function SecurityPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["risk-stats"],
        queryFn: () => securityService.getRiskStats().then((r) => r.data),
        refetchInterval: 15000,
    });

    return (
        <RoleGuard allowedRoles={["admin"]}>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Monitoring</h1>
                    <p className="text-muted-foreground mt-1">Real-time threat detection and risk analytics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Events" value={stats?.total_requests || 0} icon={Activity} variant="primary" />
                    <StatCard title="High Risk" value={stats?.high_risk_count || 0} icon={AlertTriangle} variant="danger" />
                    <StatCard title="MFA Triggered" value={stats?.mfa_triggered_count || 0} icon={Shield} variant="warning" />
                    <StatCard title="Denied" value={stats?.denied_count || 0} icon={Lock} variant="danger" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-red-500" />
                                Risk Score Trend
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                {stats && (
                                    <Line data={{
                                        labels: stats.daily_stats?.map((d: any) => d.date.slice(5)) || [],
                                        datasets: [{
                                            label: "Average Risk Score",
                                            data: stats.daily_stats?.map((d: any) => d.avg_risk) || [],
                                            borderColor: "rgb(239, 68, 68)",
                                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                                            fill: true,
                                            tension: 0.4,
                                            pointRadius: 3,
                                        }],
                                    }} options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: {
                                            x: { grid: { display: false } },
                                            y: { beginAtZero: true, max: 100, grid: { color: "rgba(148, 163, 184, 0.1)" } },
                                        },
                                    }} />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-amber-500" />
                                Threat Events
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                                ) : stats?.recent_suspicious?.length ? stats.recent_suspicious.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-8 rounded-full ${item.decision === "DENY" ? "bg-red-500" : "bg-amber-500"}`} />
                                            <div>
                                                <p className="text-sm font-medium">{item.action} · {item.resource}</p>
                                                <p className="text-xs text-muted-foreground">{item.ip_address} · {item.country} · {new Date(item.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={item.decision === "DENY" ? "destructive" : "warning"}>{item.decision}</Badge>
                                            <p className="text-xs text-muted-foreground mt-1">Risk: {item.risk_score}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-center text-muted-foreground py-8">No threats detected</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RoleGuard>
    );
}
