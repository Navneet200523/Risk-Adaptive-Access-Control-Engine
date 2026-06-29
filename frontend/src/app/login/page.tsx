"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { authService } from "@/services";
import { Shield, Mail, Lock, User, ArrowRight, Loader2, AlertTriangle, CheckCircle, KeyRound, RotateCcw } from "lucide-react";

type Mode = "login" | "register" | "mfa" | "forgot" | "forgot_verify" | "forgot_reset";

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const searchParams = useSearchParams();
    const reason = searchParams.get("reason");
    const [mode, setMode] = useState<Mode>("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [riskInfo, setRiskInfo] = useState<{ score: number; message: string } | null>(null);

    // Form fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetOtp, setResetOtp] = useState("");
    const [resetEmail, setResetEmail] = useState("");

    useEffect(() => {
        if (reason === "high_risk") {
            setError("Your session was terminated due to high risk detected during a sensitive operation. Please login again or contact security.");
        } else if (reason === "unauthorized_severe") {
            setError("Your session was terminated due to an unauthorized attempt to access administrative logs. This incident has been recorded.");
        }
    }, [reason]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setRiskInfo(null);
        setLoading(true);
        try {
            const res = await authService.login({ email, password });
            const data = res.data;

            if (data.status === "ALLOW" && data.access_token && data.user) {
                setAuth(data.user, data.access_token, data.refresh_token!);
                router.push("/dashboard");
            } else if (data.status === "MFA_REQUIRED") {
                setRiskInfo({ score: data.risk_score, message: data.message });
                setMode("mfa");
            } else if (data.status === "DENY") {
                setRiskInfo({ score: data.risk_score, message: data.message });
                setError("Access denied due to high risk. Contact your administrator.");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authService.register({ email, username, full_name: fullName, password });
            setSuccess("Account created! Please login.");
            setMode("login");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const handleMFA = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await authService.verifyMFA({ email, otp_code: otp });
            const data = res.data;
            if (data.access_token && data.user) {
                setAuth(data.user, data.access_token, data.refresh_token!);
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await authService.forgotPassword(resetEmail);
            setSuccess(res.data.message);
            setMode("forgot_verify");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to send reset code");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await authService.forgotPasswordVerify(resetEmail, resetOtp);
            setSuccess("Code verified! Set your new password.");
            setMode("forgot_reset");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Invalid verification code");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            const res = await authService.forgotPasswordReset(resetEmail, resetOtp, newPassword);
            setSuccess(res.data.message);
            setMode("login");
            setResetEmail("");
            setResetOtp("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -right-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute -bottom-1/2 -left-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-3xl" />
            </div>

            <div className="w-full max-w-md relative animate-fade-in">
                {/* Logo */}
                <div className="flex items-center gap-3 justify-center mb-8">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl gradient-primary shadow-lg shadow-primary/25">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">RAAC Engine</h1>
                        <p className="text-xs text-muted-foreground">Risk-Adaptive Access Control</p>
                    </div>
                </div>

                <Card className="glass-strong shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl">
                            {mode === "login" && "Welcome Back"}
                            {mode === "register" && "Create Account"}
                            {mode === "mfa" && "Verify Identity"}
                            {mode === "forgot" && "Forgot Password"}
                            {mode === "forgot_verify" && "Verify Code"}
                            {mode === "forgot_reset" && "Reset Password"}
                        </CardTitle>
                        <CardDescription>
                            {mode === "login" && "Sign in to your enterprise workspace"}
                            {mode === "register" && "Set up your new account"}
                            {mode === "mfa" && "Enter the verification code sent to your email"}
                            {mode === "forgot" && "Enter your email to receive a reset code"}
                            {mode === "forgot_verify" && "Enter the verification code sent to your email"}
                            {mode === "forgot_reset" && "Choose a new password for your account"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {error && (
                            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}
                        {riskInfo && mode === "mfa" && (
                            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
                                <Shield className="w-4 h-4 flex-shrink-0" />
                                <span>Risk Score: {riskInfo.score} — {riskInfo.message}</span>
                            </div>
                        )}

                        {mode === "login" && (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="email" type="email" placeholder="you@company.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                    Sign In
                                </Button>
                                <div className="text-right mt-2">
                                    <button
                                        type="button"
                                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                        onClick={() => { setMode("forgot"); setError(""); setSuccess(""); setResetEmail(email); }}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </form>
                        )}

                        {mode === "register" && (
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input placeholder="John Doe" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input placeholder="johndoe" className="pl-10" value={username} onChange={(e) => setUsername(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input type="email" placeholder="you@company.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                    Create Account
                                </Button>
                            </form>
                        )}

                        {mode === "mfa" && (
                            <form onSubmit={handleMFA} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Verification Code</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="000000"
                                            className="pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Check your email for the 6-digit code</p>
                                </div>
                                <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Verify
                                </Button>
                                <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("login"); setOtp(""); setRiskInfo(null); }}>
                                    Back to Login
                                </Button>
                            </form>
                        )}

                        {mode === "forgot" && (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="reset-email"
                                            type="email"
                                            placeholder="you@company.com"
                                            className="pl-10"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">We&apos;ll send a verification code to this email</p>
                                </div>
                                <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                                    Send Reset Code
                                </Button>
                                <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("login"); setError(""); setSuccess(""); }}>
                                    Back to Login
                                </Button>
                            </form>
                        )}

                        {mode === "forgot_verify" && (
                            <form onSubmit={handleForgotVerify} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Verification Code</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="000000"
                                            className="pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                                            maxLength={6}
                                            value={resetOtp}
                                            onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Check your email for the 6-digit code</p>
                                </div>
                                <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                    Verify Code
                                </Button>
                                <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("forgot"); setResetOtp(""); setError(""); setSuccess(""); }}>
                                    Back
                                </Button>
                            </form>
                        )}

                        {mode === "forgot_reset" && (
                            <form onSubmit={handleForgotReset} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="new-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" variant="gradient" size="lg" disabled={loading}>
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                                    Reset Password
                                </Button>
                                <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode("forgot_verify"); setNewPassword(""); setConfirmPassword(""); setError(""); setSuccess(""); }}>
                                    Back
                                </Button>
                            </form>
                        )}

                        {(mode === "login" || mode === "register") && (
                            <div className="mt-6 text-center">
                                <button
                                    type="button"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => {
                                        setMode(mode === "login" ? "register" : "login");
                                        setError("");
                                        setSuccess("");
                                    }}
                                >
                                    {mode === "login" ? "Don't have an account? Register" : "Already have an account? Sign in"}
                                </button>
                            </div>
                        )}

                        {mode === "login" && (
                            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
                                <p className="font-semibold">Demo Credentials:</p>
                                <p>Admin: admin@raac.io / admin123</p>
                                <p>Manager: manager@raac.io / manager123</p>
                                <p>Employee: employee@raac.io / employee123</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
