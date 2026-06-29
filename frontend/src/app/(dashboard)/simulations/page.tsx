"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { simulationService } from "@/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Play, Monitor, Globe, Clock, Shield, Download, Bug, Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const scenarioIcons: Record<string, any> = {
    "new-device": Monitor,
    "foreign-country": Globe,
    "midnight-login": Clock,
    "admin-access": Shield,
    "mass-download": Download,
    "api-abuse": Bug,
};

import { RoleGuard } from "@/components/role-guard";

export default function SimulationsPage() {
    const [results, setResults] = useState<any[]>([]);

    const { data: scenarios = {} } = useQuery({
        queryKey: ["scenarios"],
        queryFn: () => simulationService.listScenarios().then((r) => r.data),
    });

    const runMutation = useMutation({
        mutationFn: (scenario: string) => simulationService.run(scenario),
        onSuccess: (res) => setResults((prev) => [res.data, ...prev]),
    });

    const getDecisionIcon = (d: string) => {
        if (d === "DENY") return <XCircle className="w-5 h-5 text-red-500" />;
        if (d === "MFA_REQUIRED") return <AlertTriangle className="w-5 h-5 text-amber-500" />;
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    };

    return (
        <RoleGuard allowedRoles={["admin"]}>
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Attack Simulations</h1>
                    <p className="text-muted-foreground mt-1">Test the risk engine with predefined threat scenarios</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(scenarios).map(([key, scenario]: [string, any]) => {
                        const Icon = scenarioIcons[key] || Zap;
                        return (
                            <Card key={key} className="hover:shadow-lg transition-all group">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <Badge variant={scenario.expected_decision === "DENY" ? "destructive" : "warning"}>
                                            Risk: {scenario.expected_risk}
                                        </Badge>
                                    </div>
                                    <h3 className="font-semibold mb-1 capitalize">{key.replace(/-/g, " ")}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{scenario.description}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => runMutation.mutate(key)}
                                        disabled={runMutation.isPending}
                                    >
                                        {runMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                        Run Simulation
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {results.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-primary" />
                                Simulation Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {results.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {getDecisionIcon(r.decision)}
                                            <div>
                                                <p className="text-sm font-medium capitalize">{r.scenario?.replace(/-/g, " ")}</p>
                                                <p className="text-xs text-muted-foreground">{r.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg font-bold ${r.risk_score > 60 ? "text-red-500" : r.risk_score > 30 ? "text-amber-500" : "text-emerald-500"}`}>
                                                {r.risk_score}
                                            </span>
                                            <Badge variant={r.decision === "DENY" ? "destructive" : r.decision === "MFA_REQUIRED" ? "warning" : "success"}>
                                                {r.decision}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </RoleGuard>
    );
}
