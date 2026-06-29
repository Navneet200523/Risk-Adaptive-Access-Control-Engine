"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { riskPolicyService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sliders, Save, Loader2, Shield, Globe, Clock, AlertTriangle } from "lucide-react";

import { RoleGuard } from "@/components/role-guard";

export default function RiskPolicyPage() {
    const queryClient = useQueryClient();
    const [edited, setEdited] = useState<Record<string, any>>({});

    const { data: policy, isLoading } = useQuery({
        queryKey: ["risk-policy"],
        queryFn: () => riskPolicyService.get().then((r) => r.data),
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => riskPolicyService.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["risk-policy"] });
            setEdited({});
        },
    });

    const getValue = (key: string) => edited[key] ?? policy?.[key] ?? 0;
    const setField = (key: string, val: any) => setEdited({ ...edited, [key]: val });

    const weights = [
        { key: "weight_device_mismatch", label: "Device Mismatch", icon: Shield, desc: "Unknown or new device detected" },
        { key: "weight_location_anomaly", label: "Location Anomaly", icon: Globe, desc: "Login from unusual location" },
        { key: "weight_vpn_network", label: "VPN / Proxy", icon: AlertTriangle, desc: "Connection via VPN or proxy" },
        { key: "weight_off_hours", label: "Off-Hours Access", icon: Clock, desc: "Access between midnight and 5 AM" },
        { key: "weight_sensitive_resource", label: "Sensitive Resource", icon: Shield, desc: "Accessing admin or security endpoints" },
        { key: "weight_high_request_rate", label: "High Request Rate", icon: AlertTriangle, desc: "Excessive API requests" },
    ];

    return (
        <RoleGuard allowedRoles={["admin"]}>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Risk Policy</h1>
                        <p className="text-muted-foreground mt-1">Configure risk weights, thresholds, and allowed countries</p>
                    </div>
                    <Button
                        variant="gradient"
                        onClick={() => updateMutation.mutate(edited)}
                        disabled={Object.keys(edited).length === 0 || updateMutation.isPending}
                    >
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>
                ) : (
                    <>
                        {/* Weights */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Sliders className="w-5 h-5 text-primary" />Context Weights</CardTitle>
                                <CardDescription>Adjust how much each context factor impacts the risk score (0–100)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {weights.map(({ key, label, icon: Icon, desc }) => (
                                        <div key={key} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-muted-foreground" />
                                                <Label className="font-medium">{label}</Label>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{desc}</p>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={getValue(key)}
                                                    onChange={(e) => setField(key, Number(e.target.value))}
                                                    className="flex-1 accent-primary"
                                                />
                                                <span className="text-sm font-mono w-10 text-right">{getValue(key)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Thresholds */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Risk Thresholds</CardTitle>
                                <CardDescription>Define score boundaries for Low → Medium → High risk levels</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Low → Medium Threshold</Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="number" min="0" max="100" value={getValue("low_threshold")} onChange={(e) => setField("low_threshold", Number(e.target.value))} />
                                            <span className="text-sm text-muted-foreground">score</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Scores below this = Low Risk (full access)</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Medium → High Threshold</Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="number" min="0" max="100" value={getValue("high_threshold")} onChange={(e) => setField("high_threshold", Number(e.target.value))} />
                                            <span className="text-sm text-muted-foreground">score</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Scores above this = High Risk (access denied)</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Other Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Allowed Countries (comma-separated)</Label>
                                    <Input
                                        value={getValue("allowed_countries")}
                                        onChange={(e) => setField("allowed_countries", e.target.value)}
                                        placeholder="e.g. United States, India, United Kingdom"
                                    />
                                    <p className="text-xs text-muted-foreground">Leave empty to allow all countries</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Device Trust Duration (hours)</Label>
                                    <Input type="number" value={getValue("device_trust_duration")} onChange={(e) => setField("device_trust_duration", Number(e.target.value))} />
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </RoleGuard>
    );
}
