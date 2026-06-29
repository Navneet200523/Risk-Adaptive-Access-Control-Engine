"use client";

import { useQuery } from "@tanstack/react-query";
import { securityService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Globe, Monitor, Clock, Loader2 } from "lucide-react";

export default function ActivityPage() {
    const { data: activities = [], isLoading } = useQuery({
        queryKey: ["activity"],
        queryFn: () => securityService.getActivity(100).then((r) => r.data),
    });

    const getDecisionVariant = (decision: string) => {
        switch (decision) {
            case "DENY": return "destructive";
            case "MFA_REQUIRED": return "warning";
            default: return "success";
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Activity History</h1>
                <p className="text-muted-foreground mt-1">Your recent access activity and risk assessments</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Recent Activity
                        <Badge variant="secondary" className="ml-2">{activities.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No activity recorded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                    <div className="flex-shrink-0">
                                        <div className={`w-2 h-2 rounded-full ${item.risk_score > 60 ? "bg-red-500" : item.risk_score > 30 ? "bg-amber-500" : "bg-emerald-500"}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{item.action}</span>
                                            <span className="text-xs text-muted-foreground truncate">{item.resource}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            {item.ip_address && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{item.ip_address}</span>}
                                            {item.country && item.country !== "null" && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{item.country}</span>}
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xs font-mono text-muted-foreground">Risk: {item.risk_score}</span>
                                        <Badge variant={getDecisionVariant(item.decision)}>{item.decision}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
