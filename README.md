<p align="center">
  <h1 align="center">🛡️ RAAC Engine</h1>
  <p align="center">
    <strong>Risk-Adaptive Access Control Engine</strong>
  </p>
  <p align="center">
    An enterprise-grade Zero Trust access control system with real-time risk scoring, context-aware decision making, and adaptive multi-factor authentication.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </p>
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker Deployment](#docker-deployment)
- [Default Credentials](#-default-credentials)
- [Project Structure](#-project-structure)
- [Risk Engine](#-risk-engine)
  - [Context Collection](#context-collection)
  - [Risk Scoring](#risk-scoring)
  - [Decision Matrix](#decision-matrix)
- [Attack Simulations](#-attack-simulations)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**RAAC Engine** (Risk-Adaptive Access Control Engine) is a full-stack security platform that implements the **Zero Trust** security model. Instead of relying on static role-based access control alone, RAAC continuously evaluates the **risk context** of every access request — analyzing device fingerprints, geolocation, network characteristics, access timing, and behavioral patterns — to make real-time access decisions.

The system dynamically adjusts its response based on calculated risk:
- **Low Risk** → Access granted immediately
- **Medium Risk** → Step-up MFA verification required
- **High Risk** → Access denied, incident logged

---

## ✨ Key Features

### 🧠 Risk Engine
- **Context Collection** — Captures device fingerprints, IP geolocation, VPN detection, browser/OS metadata, and access timing
- **Context Normalization** — Standardizes raw signals into weighted risk factors (0.0–1.0)
- **Weighted Risk Scoring** — Computes a composite risk score (0–100) using configurable weights
- **Adaptive Decision Engine** — Maps scores to `ALLOW`, `MFA_REQUIRED`, or `DENY` with configurable thresholds

### 🔐 Authentication & Security
- **JWT Authentication** — Access + refresh token architecture with HS256 signing
- **MFA via Email OTP** — Gmail SMTP integration with 6-digit OTP and 5-minute expiry
- **Rate Limiting** — Per-endpoint rate limiting middleware to prevent brute-force attacks
- **Account Lockout** — Automatic lockout after 5 failed login attempts (configurable)
- **Session Management** — Track active sessions with device/location metadata

### 👥 Role-Based Access Control (RBAC)
| Role | Permissions |
|------|-------------|
| **Employee** | View dashboard, manage own files, view own activity |
| **Manager** | Employee permissions + team reports, shared file access |
| **Admin** | Full access — user management, risk policy config, attack simulations, system logs |

### 📁 File Management
- Secure file upload (up to 50 MB) and download
- File sharing between users
- Rename and delete operations
- Access-controlled with risk assessment on every operation

### 📊 Security Dashboard
- Real-time risk score visualization with Chart.js
- Suspicious activity detection and alerting
- Access log timeline with filtering
- Risk trend analytics and reporting

### 🎯 Attack Simulations
- **6 built-in threat scenarios** for testing and demonstration
- Generates realistic access logs with simulated risk scores
- Admin-only access for security testing

### ⚙️ Admin Panel
- User management (create, edit, lock/unlock, delete)
- Risk policy configuration with adjustable weights and thresholds
- System-wide access logs and audit trail

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                     Nginx Reverse Proxy                       │
│                      (Port 80)                                │
├──────────────────────────┬───────────────────────────────────┤
│     /api/*  →            │           /*  →                    │
│                          │                                    │
│  ┌───────────────────┐   │   ┌───────────────────────────┐   │
│  │   FastAPI Backend  │   │   │   Next.js 14 Frontend     │   │
│  │   (Port 8000)      │   │   │   (Port 3000)             │   │
│  │                    │   │   │                           │   │
│  │  ┌──────────────┐  │   │   │  • Dashboard              │   │
│  │  │  Risk Engine  │  │   │   │  • File Manager           │   │
│  │  │  ├─ Collector  │  │   │   │  • Security Center        │   │
│  │  │  ├─ Normalizer │  │   │   │  • Admin Panel            │   │
│  │  │  ├─ Scorer     │  │   │   │  • Attack Simulations     │   │
│  │  │  └─ Decision   │  │   │   │  • Reports & Analytics    │   │
│  │  └──────────────┘  │   │   └───────────────────────────┘   │
│  │                    │   │                                    │
│  │  ┌──────────────┐  │   │                                    │
│  │  │  Middleware   │  │   │                                    │
│  │  │  ├─ Rate Limit │  │   │                                    │
│  │  │  └─ Req Logger │  │   │                                    │
│  │  └──────────────┘  │   │                                    │
│  └────────┬───────────┘   │                                    │
│           │               │                                    │
└───────────┼───────────────┼────────────────────────────────────┘
            │               │
            ▼               │
┌─────────────────────┐     │
│   Data Layer         │     │
│  ┌───────────────┐   │     │
│  │  PostgreSQL    │   │     │
│  │  (Primary DB)  │   │     │
│  └───────────────┘   │     │
│  ┌───────────────┐   │     │
│  │  SQLite        │   │     │
│  │  (Dev Fallback)│   │     │
│  └───────────────┘   │     │
│  ┌───────────────┐   │     │
│  │  Redis         │   │     │
│  │  (Cache/Queue) │   │     │
│  └───────────────┘   │     │
└─────────────────────┘     │
            │                │
            ▼                │
┌─────────────────────┐      │
│  External Services   │      │
│  ├─ Gmail SMTP (OTP) │      │
│  └─ GeoIP API        │      │
└─────────────────────┘      │
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Radix UI, Zustand, Chart.js, TanStack Query |
| **Backend** | FastAPI, Python 3.11+, SQLAlchemy 2.0 (async), Pydantic v2 |
| **Database** | PostgreSQL 16 (production), SQLite (development) |
| **Caching** | Redis 7 |
| **Auth** | JWT (python-jose), bcrypt, SMTP OTP |
| **Proxy** | Nginx |
| **Containerization** | Docker & Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- **Docker & Docker Compose** (for containerized deployment)
- **Gmail App Password** (for OTP emails — [how to generate](https://support.google.com/accounts/answer/185833))

### Local Development

#### 1. Clone the Repository

```bash
git clone https://github.com/Navneet200523/Risk-Adaptive-Access-Control-Engine.git
cd Risk-Adaptive-Access-Control-Engine
```

#### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
DATABASE_URL=sqlite+aiosqlite:///./raac.db
REDIS_URL=redis://localhost:6379/0
REDIS_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

#### 3. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

#### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:3000`

### Docker Deployment

Run the entire stack with a single command:

```bash
# Configure environment
cp .env.example .env
# Edit .env with your production settings

# Build and start all services
docker-compose up --build
```

This starts:
| Service | Port | Description |
|---------|------|-------------|
| **Nginx** | `80` | Reverse proxy (entry point) |
| **Frontend** | `3000` | Next.js application |
| **Backend** | `8000` | FastAPI application |
| **PostgreSQL** | `5432` | Primary database |
| **Redis** | `6379` | Cache & message queue |

---

## 🔑 Default Credentials

The system automatically creates demo users on first startup:

| Role | Email | Password |
|------|-------|----------|
| 🔴 Admin | `admin@raac.io` | `admin123` |
| 🟡 Manager | `manager@raac.io` | `manager123` |
| 🟢 Employee | `employee@raac.io` | `employee123` |

> ⚠️ **Warning:** Change these credentials immediately in production environments.

---

## 📂 Project Structure

```
Risk-Adaptive-Access-Control-Engine/
├── backend/
│   ├── app/
│   │   ├── config.py              # Pydantic settings & env config
│   │   ├── database.py            # SQLAlchemy async engine setup
│   │   ├── main.py                # FastAPI app entry point
│   │   ├── middleware/
│   │   │   ├── rate_limiter.py    # Per-endpoint rate limiting
│   │   │   └── request_logger.py  # Request logging & context capture
│   │   ├── models/
│   │   │   ├── access_log.py      # Access log model
│   │   │   ├── device.py          # Device fingerprint model
│   │   │   ├── file.py            # File storage model
│   │   │   ├── otp.py             # OTP model
│   │   │   ├── report.py          # Report model
│   │   │   ├── risk_policy.py     # Risk policy configuration model
│   │   │   ├── session.py         # Session model
│   │   │   └── user.py            # User model with roles
│   │   ├── risk_engine/
│   │   │   ├── context_collector.py   # Raw signal collection
│   │   │   ├── context_normalizer.py  # Signal normalization (0.0–1.0)
│   │   │   ├── scoring.py            # Weighted risk scoring (0–100)
│   │   │   └── decision_engine.py     # Score → Decision mapping
│   │   ├── routes/
│   │   │   ├── admin.py           # User management endpoints
│   │   │   ├── auth.py            # Login, register, OTP, tokens
│   │   │   ├── files.py           # File CRUD & sharing
│   │   │   ├── reports.py         # Analytics & reporting
│   │   │   ├── risk_policy.py     # Risk policy CRUD
│   │   │   ├── security.py        # Dashboard stats & logs
│   │   │   └── simulation.py      # Attack simulation scenarios
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   ├── security/
│   │   │   ├── dependencies.py    # Auth dependencies & role guards
│   │   │   ├── jwt_handler.py     # JWT creation & verification
│   │   │   └── password.py        # bcrypt hashing utilities
│   │   ├── services/              # Business logic layer
│   │   ├── utils/                 # Shared utilities
│   │   └── workers/               # Background task workers (Celery)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/             # Authentication page
│   │   │   └── (dashboard)/       # Protected dashboard routes
│   │   │       ├── dashboard/     # Main dashboard & risk overview
│   │   │       ├── files/         # File management UI
│   │   │       ├── security/      # Security center
│   │   │       ├── admin/         # Admin user management
│   │   │       ├── risk-policy/   # Risk policy configuration
│   │   │       ├── simulations/   # Attack simulation runner
│   │   │       ├── reports/       # Analytics & reports
│   │   │       ├── activity/      # Activity timeline
│   │   │       ├── logs/          # System logs viewer
│   │   │       └── profile/       # User profile
│   │   ├── components/
│   │   │   ├── ui/                # Radix UI primitives (shadcn/ui)
│   │   │   ├── sidebar.tsx        # Navigation sidebar
│   │   │   ├── stat-card.tsx      # Dashboard stat cards
│   │   │   ├── role-guard.tsx     # Client-side role protection
│   │   │   └── providers.tsx      # App-wide providers
│   │   ├── services/              # API client layer
│   │   ├── store/                 # Zustand state management
│   │   ├── lib/                   # Utility functions
│   │   └── types/                 # TypeScript type definitions
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docker-compose.yml             # Multi-service orchestration
├── nginx.conf                     # Reverse proxy configuration
├── .env                           # Environment variables
└── README.md
```

---

## 🧠 Risk Engine

The Risk Engine is the core of RAAC. It operates as a four-stage pipeline:

### Context Collection

The **Context Collector** gathers raw signals from every access request:

| Signal | Source | Example |
|--------|--------|---------|
| Device Fingerprint | Client headers | `Mozilla/5.0 (Windows NT 10.0)...` |
| IP Address | Request metadata | `203.0.113.42` |
| Geolocation | GeoIP API (`ip-api.com`) | `Country: India, City: Mumbai` |
| VPN Detection | GeoIP response | `proxy: true` |
| Access Time | Server clock | `2025-01-15T02:30:00 IST` |
| Browser & OS | User-Agent parsing | `Chrome 120, Windows 11` |

### Risk Scoring

The **Risk Scorer** computes a weighted sum across six normalized risk factors:

```
Risk Score = Σ (weight × factor_value)
```

| Factor | Default Weight | Description |
|--------|---------------|-------------|
| `device_mismatch` | 20 | Unrecognized or changed device |
| `location_anomaly` | 20 | Login from unusual/foreign location |
| `vpn_network` | 15 | VPN or proxy detected |
| `off_hours` | 10 | Access outside business hours |
| `sensitive_resource` | 25 | Accessing high-sensitivity resources |
| `high_request_rate` | 10 | Abnormally high request frequency |

> All weights are configurable via the Admin Panel → Risk Policy.

### Decision Matrix

| Risk Score | Decision | Access Level | Action |
|------------|----------|--------------|--------|
| **0 – 30** | `ALLOW` | Full | Access granted immediately |
| **31 – 60** | `MFA_REQUIRED` | Limited | Email OTP verification required |
| **61 – 100** | `DENY` | None | Access blocked, incident logged |

> Thresholds are configurable via the Risk Policy settings.

---

## 🎯 Attack Simulations

Admins can run built-in attack simulations to test the risk engine:

| Scenario | Description | Risk Score | Decision |
|----------|-------------|------------|----------|
| `new-device` | Login from an unrecognized device | 55 | MFA_REQUIRED |
| `foreign-country` | Login from North Korea | 82 | DENY |
| `midnight-login` | Login at 2 AM (off-hours) | 45 | MFA_REQUIRED |
| `admin-access` | Non-admin accessing admin resources | 75 | DENY |
| `mass-download` | Bulk file download (data exfiltration) | 88 | DENY |
| `api-abuse` | Excessive API requests (brute force/DDoS) | 92 | DENY |

---

## 📡 API Documentation

Once the backend is running, interactive API documentation is available at:

| Tool | URL |
|------|-----|
| **Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |
| **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) |

### Key API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login & get tokens | Public |
| `POST` | `/api/auth/verify-otp` | Verify MFA OTP | Public |
| `POST` | `/api/auth/refresh` | Refresh access token | JWT |
| `GET` | `/api/files/` | List user's files | JWT |
| `POST` | `/api/files/upload` | Upload a file | JWT |
| `GET` | `/api/files/download/{id}` | Download a file | JWT |
| `GET` | `/api/security/dashboard` | Security dashboard stats | JWT |
| `GET` | `/api/security/logs` | Access log history | JWT |
| `GET` | `/api/admin/users` | List all users | Admin |
| `GET` | `/api/risk-policy/` | Get active risk policy | Admin |
| `PUT` | `/api/risk-policy/` | Update risk policy | Admin |
| `GET` | `/api/simulation/scenarios` | List attack scenarios | Admin |
| `POST` | `/api/simulation/{scenario}` | Run attack simulation | Admin |

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing | `super-secret-change-in-production` |
| `DATABASE_URL` | SQLite connection string (dev) | `sqlite+aiosqlite:///./raac.db` |
| `POSTGRES_URL` | PostgreSQL connection string (prod) | — |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `REDIS_ENABLED` | Enable Redis caching | `false` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP email address | — |
| `SMTP_PASS` | SMTP app password | — |
| `NEXT_PUBLIC_API_URL` | Frontend → Backend API URL | `http://localhost:8000/api` |

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Navneet200523">Navneet</a>
</p>
