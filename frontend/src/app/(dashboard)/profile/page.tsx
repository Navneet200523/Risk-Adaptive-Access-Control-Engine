"use client";

import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building, Shield, Calendar, Clock } from "lucide-react";

export default function ProfilePage() {
    const { user } = useAuthStore();

    const fields = [
        { icon: User, label: "Full Name", value: user?.full_name },
        { icon: Mail, label: "Email", value: user?.email },
        { icon: User, label: "Username", value: user?.username },
        { icon: Shield, label: "Role", value: user?.role, badge: true },
        { icon: Building, label: "Department", value: user?.department },
        { icon: Calendar, label: "Member Since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A" },
        { icon: Clock, label: "Last Login", value: user?.last_login ? new Date(user.last_login).toLocaleString() : "Current session" },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground mt-1">Your account information</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
                            <span className="text-white text-2xl font-bold">{user?.full_name?.charAt(0) || "U"}</span>
                        </div>
                        <div>
                            <CardTitle className="text-xl">{user?.full_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 divide-y divide-border">
                        {fields.map(({ icon: Icon, label, value, badge }) => (
                            <div key={label} className="flex items-center justify-between pt-4 first:pt-0">
                                <div className="flex items-center gap-3">
                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">{label}</span>
                                </div>
                                {badge ? (
                                    <Badge variant="success" className="capitalize">{value}</Badge>
                                ) : (
                                    <span className="text-sm font-medium">{value}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
