// User types
export interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: "employee" | "manager" | "admin";
    department: string;
    is_active: boolean;
    is_locked?: boolean;
    failed_login_attempts?: number;
    last_login: string | null;
    created_at: string;
}

// Auth types
export interface LoginRequest {
    email: string;
    password: string;
    device_fingerprint?: string;
    browser?: string;
    os?: string;
}

export interface RegisterRequest {
    email: string;
    username: string;
    full_name: string;
    password: string;
    department?: string;
}

export interface MFARequest {
    email: string;
    otp_code: string;
    device_fingerprint?: string;
}

export interface AuthResponse {
    status: "ALLOW" | "MFA_REQUIRED" | "DENY";
    risk_score: number;
    message: string;
    access_token?: string;
    refresh_token?: string;
    user?: User;
}

// File types
export interface FileItem {
    id: string;
    original_name: string;
    file_size: number;
    mime_type: string | null;
    owner_id: string;
    is_shared: boolean;
    shared_with?: string;
    created_at: string;
    updated_at: string;
}

// Access Log types
export interface AccessLog {
    id: string;
    user_id: string | null;
    action: string;
    resource: string;
    risk_score: number;
    decision: string;
    ip_address: string | null;
    device_fingerprint?: string;
    browser: string | null;
    os: string | null;
    country: string | null;
    city: string | null;
    is_vpn: string | null;
    timestamp: string;
}

// Risk Policy types
export interface RiskPolicy {
    id: string;
    name: string;
    weight_device_mismatch: number;
    weight_location_anomaly: number;
    weight_vpn_network: number;
    weight_off_hours: number;
    weight_sensitive_resource: number;
    weight_high_request_rate: number;
    low_threshold: number;
    high_threshold: number;
    allowed_countries: string;
    device_trust_duration: number;
    is_active: string;
}

// Risk Stats
export interface RiskStats {
    total_requests: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    denied_count: number;
    mfa_triggered_count: number;
    avg_risk_score: number;
    recent_suspicious: AccessLog[];
    daily_stats: { date: string; count: number; avg_risk: number }[];
}

// Simulation
export interface SimulationScenario {
    name: string;
    description: string;
    expected_risk: number;
    expected_decision: string;
}

export interface SimulationResult {
    scenario: string;
    description: string;
    risk_score: number;
    decision: string;
    message: string;
    simulated_log_id: string;
}
