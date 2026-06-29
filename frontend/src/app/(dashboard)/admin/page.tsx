"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, Shield, Loader2, X, Power } from "lucide-react";

import { RoleGuard } from "@/components/role-guard";

export default function AdminPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ email: "", username: "", full_name: "", password: "", role: "employee", department: "General" });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ["admin-users"],
        queryFn: () => adminService.listUsers().then((r) => r.data),
    });

    const createMutation = useMutation({
        mutationFn: () => adminService.createUser(form),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setShowCreate(false);
            setForm({ email: "", username: "", full_name: "", password: "", role: "employee", department: "General" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => adminService.toggleUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const roleColor = (role: string) => {
        switch (role) {
            case "admin": return "destructive";
            case "manager": return "warning";
            default: return "secondary";
        }
    };

    return (
        <RoleGuard allowedRoles={["admin"]}>
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground mt-1">Manage enterprise user accounts and roles</p>
                    </div>
                    <Button variant="gradient" onClick={() => setShowCreate(!showCreate)}>
                        {showCreate ? <X className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        {showCreate ? "Cancel" : "Create User"}
                    </Button>
                </div>

                {showCreate && (
                    <Card className="border-primary/30">
                        <CardHeader><CardTitle>Create New User</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                                </div>
                            </div>
                            <Button className="mt-4" variant="gradient" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                Create User
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            All Users
                            <Badge variant="secondary">{users.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                                            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Login</th>
                                            <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u: any) => (
                                            <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">{u.full_name?.charAt(0)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{u.full_name}</p>
                                                            <p className="text-xs text-muted-foreground">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4"><Badge variant={roleColor(u.role) as any} className="capitalize">{u.role}</Badge></td>
                                                <td className="py-3 px-4 text-muted-foreground">{u.department}</td>
                                                <td className="py-3 px-4">
                                                    {u.is_locked ? <Badge variant="destructive">Locked</Badge> :
                                                        u.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground text-xs">{u.last_login ? new Date(u.last_login).toLocaleString() : "Never"}</td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleMutation.mutate(u.id)}>
                                                            <Power className={`w-4 h-4 ${u.is_active ? "text-emerald-500" : "text-muted-foreground"}`} />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => deleteMutation.mutate(u.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
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
