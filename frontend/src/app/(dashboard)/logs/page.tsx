"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { securityService } from "@/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, ChevronLeft, ChevronRight, Loader2, Globe, Monitor, Shield } from "lucide-react";

import { RoleGuard } from "@/components/role-guard";

export default function LogsPage() {
    const [page, setPage] = useState(1);
    const limit = 30;

    const { data, isLoading } = useQuery({
        queryKey: ["access-logs", page],
        queryFn: () => securityService.getLogs(page, limit).then((r) => r.data),
    });

    const logs = data?.logs || [];
    const total = data?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const getDecisionVariant = (d: string) => {
        if (d === "DENY") return "destructive";
        if (d === "MFA_REQUIRED") return "warning";
        return "success";
    };

    return (
        <RoleGuard allowedRoles={["admin"]}>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Access Logs</h1>
                    <p className="text-muted-foreground mt-1">Detailed log of all system access events ({total} total)</p>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ScrollText className="w-5 h-5 text-primary" />
                            All Logs
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">Page {page} of {totalPages || 1}</span>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Time</th>
                                            <th className="text-left py-3 px-3 font-medium text-muted-foreground">User</th>
                                            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Action</th>
                                            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Resource</th>
                                            <th className="text-left py-3 px-3 font-medium text-muted-foreground">IP</th>
                                            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Location</th>
                                            <th className="text-left py-3 px-3 font-medium text-muted-foreground">Browser</th>
                                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Risk</th>
                                            <th className="text-center py-3 px-3 font-medium text-muted-foreground">Decision</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((l: any) => (
                                            <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                                                    {l.timestamp ? new Date(l.timestamp).toLocaleString() : "—"}
                                                </td>
                                                <td className="py-2.5 px-3 text-xs font-medium truncate max-w-[150px]">
                                                    {l.user_email || "System"}
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-xs">{l.action}</td>
                                                <td className="py-2.5 px-3 text-xs truncate max-w-[200px]">{l.resource}</td>
                                                <td className="py-2.5 px-3 text-xs font-mono">{l.ip_address || "—"}</td>
                                                <td className="py-2.5 px-3 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Globe className="w-3 h-3" />
                                                        {l.country || "—"}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Monitor className="w-3 h-3" />
                                                        {l.browser || "—"}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <span className={`text-xs font-bold ${l.risk_score > 60 ? "text-red-500" : l.risk_score > 30 ? "text-amber-500" : "text-emerald-500"}`}>
                                                        {l.risk_score}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-center">
                                                    <Badge variant={getDecisionVariant(l.decision)} className="text-[10px]">{l.decision}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RoleGuard>
    );
}
