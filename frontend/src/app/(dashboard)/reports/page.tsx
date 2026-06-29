"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { reportsService } from "@/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, RefreshCw, Loader2, Calendar, BarChart3 } from "lucide-react";

import { RoleGuard } from "@/components/role-guard";

export default function ReportsPage() {
    const { data: reports = [], isLoading, refetch } = useQuery({
        queryKey: ["reports"],
        queryFn: () => reportsService.list().then((r) => r.data),
    });

    const generateMutation = useMutation({
        mutationFn: (type: string) => reportsService.generate(type),
        onSuccess: () => refetch(),
    });

    const handleExportCSV = async () => {
        try {
            const res = await reportsService.exportCSV();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `access_logs_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch { }
    };

    const reportTypes = [
        { type: "activity", label: "Activity Report", icon: BarChart3 },
        { type: "security", label: "Security Report", icon: FileText },
        { type: "risk", label: "Risk Analysis", icon: FileText },
    ];

    return (
        <RoleGuard allowedRoles={["admin", "manager", "employee"]}>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                        <p className="text-muted-foreground mt-1">Generate and export enterprise reports</p>
                    </div>
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                {/* Generate Reports */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reportTypes.map(({ type, label, icon: Icon }) => (
                        <Card key={type} className="cursor-pointer hover:shadow-lg transition-all" onClick={() => generateMutation.mutate(type)}>
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-primary/10">
                                    <Icon className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">{label}</p>
                                    <p className="text-sm text-muted-foreground">Generate report</p>
                                </div>
                                {generateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Report History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Report History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No reports generated yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {reports.map((report: any) => (
                                    <div key={report.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="text-sm font-medium">{report.title}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(report.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary">{report.report_type}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RoleGuard>
    );
}
