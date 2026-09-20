# TurfMate ⚽🏟️

> **Next-Generation Sports Turf & Pitch Management Platform**  
> Tailored for real-time slot locking, continuous 24/7 scheduling, cross-midnight booking, dynamic floodlight pricing, and instant SSLCOMMERZ payments.

---

## 🌟 Overview

**TurfMate** is a full-stack booking engine and sports facility management system engineered to modernize turf operations across Bangladesh (Chattogram, Dhaka, Cumilla, and beyond). It solves real-world booking conflicts with concurrency-safe database row locking, provides players with a continuous 2-day playing horizon, supports round-the-clock (24/7) venues, and automates digital payments via SSLCOMMERZ (bKash, Nagad, cards).

### Key Highlights
- ⏱️ **Real-Time Slot Engine**: Micro-grid availability view with concurrency-safe slot holds (`SELECT FOR UPDATE` prevents double-booking).
- 🌙 **24/7 Continuous Operation & Local Timezone**: Local Bangladesh Standard Time (`UTC+06:00` / `Asia/Dhaka`) alignment with seamless cross-midnight reservations.
- 💳 **SSLCOMMERZ Integration**: Direct online checkout with Instant Payment Notification (IPN) webhooks and automated 10-minute hold expiration.
- ⚡ **Dynamic Pricing Engine**: Automated hourly rate rules (e.g., Friday peak hours, late-night floodlight rates).
- 🛠️ **Operations Hub & Admin Desk**: Role-based access control (Admin, Staff, Customer) with manual phone booking, facility maintenance toggles, and revenue tracking.
- 🌓 **Modern Aesthetics**: Built with Next.js 16 (Turbopack), Tailwind CSS v4, Lucide icons, responsive light/dark mode, and mobile-first layouts.

---

## 🏗️ System Architecture

> For the comprehensive engineering blueprint, concurrency models, and state diagrams, see [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

```mermaid
flowchart TD
    subgraph Users [Users & Clients]
        Customer[Customer / Player]
        Staff[Desk Staff & Admin]
    end

    subgraph Frontend [Frontend: Next.js 16 & Tailwind v4]
        Landing[Landing Page & 2-Day Slot Grid]
        CheckoutPage[10-Min Hold & Checkout Page]
        PlayerDash[Player Dashboard & History]
        AdminDesk[Operations Hub & Bookings Desk]
    end

    subgraph Backend [Backend: FastAPI & Python 3.11+]
        APIRouter[REST API Router /api/v1]
        AuthSvc[Auth & Session Service<br/>JWT & Argon2]
        BookSvc[Booking & Concurrency Engine<br/>SELECT FOR UPDATE]
        PriceSvc[Dynamic Pricing Resolver<br/>Peak & Floodlight Rules]
        PaySvc[SSLCOMMERZ Payment Service]
    end

    subgraph Storage [Persistence & Payment Gateway]
        Postgres[(PostgreSQL 16 Database)]
        SSLCommerz[SSLCOMMERZ Gateway<br/>bKash / Nagad / Cards]
    end

    %% User Interactions
    Customer -->|Browse & Select Slots| Landing
    Customer -->|Hold & Checkout| CheckoutPage
    Customer -->|View Passes| PlayerDash
    Staff -->|Walk-in & Pitch Controls| AdminDesk

    %% Frontend to Backend API Calls
    Landing -->|GET /courts/availability| APIRouter
    CheckoutPage -->|POST /bookings| APIRouter
    CheckoutPage -->|POST /payments/sslcommerz/initiate| APIRouter
    PlayerDash -->|GET /bookings/my-bookings| APIRouter
    AdminDesk -->|POST /bookings/staff & /venues| APIRouter

    %% Backend Router to Internal Services
    APIRouter --> AuthSvc
    APIRouter --> BookSvc
    APIRouter --> PriceSvc
    APIRouter --> PaySvc

    %% Services to Database
    AuthSvc --> Postgres
    BookSvc -->|Lock Rows & Store Bookings| Postgres
    PriceSvc -->|Query Rate Rules| Postgres
    PaySvc -->|Record Payments| Postgres

    %% SSLCOMMERZ Payment Gateway Flow
    PaySvc -->|Initiate Session| SSLCommerz
    SSLCommerz -->|IPN Webhook / Callback| APIRouter
```

---

## 🚀 Core Features & Business Logic

### 1. 24/7 Venue Booking & Bangladesh Timezone Engine
- **Local Day Alignment**: While all timestamps are stored in UTC in PostgreSQL, calendar boundaries are calculated using Bangladesh Standard Time (`UTC+06:00`). Daily slot grids cleanly start at **12:00 AM (00:00)** and conclude at **11:00 PM (23:00)**.
- **Canonical 24/7 Contract**: Setting `opening_time: 00:00:00` and `closing_time: 00:00:00` in the database designates continuous 24/7 operation. Operating-hour validations are bypassed so turfs can be booked at 1:00 AM, 3:00 AM, or any hour without restriction.
- **Cross-Midnight Matches**: Players can select consecutive slots spanning across midnight (e.g., 11:00 PM Today to 1:00 AM Tomorrow) in a single consolidated reservation.

### 2. Concurrency-Safe 10-Minute Hold & Expiration
- When a player selects slots and initiates checkout, the backend creates a `PENDING` booking and locks rows via `SELECT FOR UPDATE` to prevent race conditions.
- A **10-minute hold countdown timer** displays on the client. If payment is not completed within 10 minutes, the background auto-expiration routine automatically releases the slots back to the public.

### 3. Dynamic Hourly & Floodlight Pricing
- Base price per hour set at pitch level.
- Dynamic pricing rules match on:
  - **Specific Weekday**: e.g., Friday afternoon peak rates.
  - **Time-of-Day Window**: e.g., 6:00 PM to 12:00 AM prime floodlight hours.
  - **All-Days Override**: Custom seasonal or holiday pricing.

### 4. Operations Hub & Admin Portal
- **Bookings Desk**: Filterable table/calendar of all reservations, walk-in customer creation, and cancellation with refund tracking.
- **Venues & Pitches**: Multi-pitch support (7-A-Side, 5-A-Side), surface types (artificial turf, natural grass), dimensions, and maintenance toggle.
- **Pricing Rule Manager**: Create, update, toggle, or delete dynamic rate rules.
- **Player Directory**: View registered players, total matches played, and contact numbers.

---

## 💻 Tech Stack

### Backend
| Technology | Description |
| :--- | :--- |
| **Python 3.11+** | High-performance modern Python |
| **FastAPI** | Async REST API framework with automatic OpenAPI `/docs` |
| **SQLModel** | SQLAlchemy 2.0 + Pydantic v2 ORM |
| **PostgreSQL** | Relational database with transactional row-level locking |
| **Alembic** | Database schema migrations |
| **PyJWT & Argon2** | Secure JWT authentication & password hashing |
| **HTTPX** | Async HTTP client for SSLCOMMERZ gateway requests |

### Frontend
| Technology | Description |
| :--- | :--- |
| **Next.js 16** | App Router, React Server Components & Turbopack |
| **React 19** | Modern UI components and hooks |
| **Tailwind CSS v4** | Modern utility-first CSS design system |
| **Zustand** | Global client state management (Auth store with localStorage hydration) |
| **Axios** | Interceptor-driven HTTP client (automatic token injection & refresh) |
| **Lucide React** | Lightweight icons |

---

## 📁 Repository Structure

```
turfmate/
├── backend/
│   ├── app/
│   │   ├── alembic/              # Database migration revisions
│   │   ├── api/
│   │   │   ├── routes/           # FastAPI route endpoints
│   │   │   │   ├── auth.py       # Login, register, refresh, me
│   │   │   │   ├── bookings.py   # Slot availability, hold, checkout, cancel
│   │   │   │   ├── courts.py     # Pitch queries & management
│   │   │   │   ├── payments.py   # SSLCOMMERZ init, IPN, success/fail/cancel
│   │   │   │   ├── pricing_rules.py # Dynamic hourly rate rules
│   │   │   │   ├── users.py      # Customer profile & admin listing
│   │   │   │   └── venues.py     # Venue details, status, location
│   │   │   ├── deps.py           # Dependency injection (DB session, RBAC)
│   │   │   └── main.py           # API v1 router aggregator
│   │   ├── core/
│   │   │   ├── config.py         # App settings & VENUE_TIMEZONE (UTC+6)
│   │   │   └── security.py       # Password hashing & JWT creation/decoding
│   │   ├── crud/                 # Database access layer
│   │   ├── db/
│   │   │   └── session.py        # SQLAlchemy engine & session factory
│   │   ├── models/               # SQLModel entity definitions
│   │   │   ├── base.py           # UUID primary key & timestamp mixins
│   │   │   ├── booking.py        # Booking & BookingStatus enum
│   │   │   ├── court.py          # Court/Pitch specifications
│   │   │   ├── payment.py        # Payment transaction records
│   │   │   ├── pricing_rules.py  # Hourly rate override rules
│   │   │   ├── user.py           # User accounts & UserRole enum
│   │   │   └── venue.py          # Venues, operating hours, status
│   │   ├── schemas/              # Pydantic request/response DTO schemas
│   │   └── services/             # Core business logic
│   │       ├── auth_service.py
│   │       ├── booking_service.py
│   │       ├── pricing_service.py
│   │       └── sslcommerz_service.py
│   ├── scripts/
│   │   ├── seed_cumilla_data.py  # Seed script for TurfMate Arena Cumilla
│   │   └── seed_demo_venues.py   # Multi-venue seeding script
│   ├── alembic.ini
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── app/
│   │   ├── admin/                # Operations Hub / Admin portal
│   │   ├── booking/              # SSLCOMMERZ return handlers (success, failed, cancel)
│   │   ├── checkout/             # 10-minute hold payment checkout
│   │   ├── dashboard/            # Player dashboard & bookings
│   │   ├── login/                # Player / Staff login page
│   │   ├── register/             # New user registration
│   │   ├── layout.tsx            # Global layout with Navbar & Footer
│   │   └── page.tsx              # Landing page with live 2-day slot booking grid
│   ├── components/
│   │   ├── admin/                # BookingsDesk, VenuePitchManager, PricingRuleManager
│   │   ├── SlotAvailabilityPreview.tsx # 2-day interactive availability grid
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── lib/
│   │   ├── api.ts                # Axios instance with auth interceptors
│   │   └── auth-store.ts         # Zustand authentication store
│   ├── services/                 # Frontend API client services
│   ├── types/                    # Shared TypeScript interfaces
│   └── package.json
│
├── render.yaml                   # Production deployment blueprint for Render
└── README.md
```

---

## 🛠️ Local Development Quickstart

### Prerequisites
- **Python**: `3.11` or higher
- **Node.js**: `20.x` or higher
- **Package Manager**: `pnpm` (`npm install -g pnpm`)
- **Database**: PostgreSQL instance running locally or via Docker

---

### 1. Database Setup

Create a PostgreSQL database named `turfmate`:
```sql
CREATE DATABASE turfmate;
```

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env   # Or create .env using the reference below

# Apply database migrations
alembic upgrade head

# Seed demo data (Venues, Pitches, Pricing Rules, Accounts)
python scripts/seed_cumilla_data.py

# Start backend dev server with hot reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be live at `http://127.0.0.1:8000`.  
Explore interactive OpenAPI docs at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
pnpm install

# Create local environment config
# Create a .env.local file:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Start Next.js development server
pnpm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔑 Demo & Test Credentials

After running `python scripts/seed_cumilla_data.py`, the following test accounts are available:

| Role | Phone Number | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Superuser / Admin** | `01700000001` | `SuperUser2026!` | Full platform access, all venues, staff & court controls |
| **Business Admin** | `01700000002` | `AdminPassword2026!` | Venue management, pricing rules, financial reports |
| **Desk Staff** | `01700000003` | `StaffPassword2026!` | Bookings Desk, manual walk-in reservations, check-in |
| **Customer Player** | `01575085455` | `PlayerPassword2026!` | Slot booking, player dashboard, booking cancellation |

---

## 🌐 API Overview

> For full request/response schemas, parameter validations, and cURL examples, see [`docs/API.md`](./docs/API.md).

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new player or staff account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate via phone and password |
| `POST` | `/api/v1/auth/refresh` | Public | Refresh expired access token |
| `GET` | `/api/v1/auth/me` | Authenticated | Fetch current user profile |
| `GET` | `/api/v1/venues/` | Public | List active venues with operating hours |
| `GET` | `/api/v1/courts/` | Public | List pitches (filter by venue / sport) |
| `GET` | `/api/v1/courts/{id}/availability` | Public | **Get 24-hour slot availability grid for a date** |
| `POST` | `/api/v1/bookings/` | Customer | **Initiate booking & lock slots for 10 minutes** |
| `POST` | `/api/v1/bookings/staff` | Staff/Admin | Create manual walk-in booking |
| `GET` | `/api/v1/bookings/my-bookings` | Customer | List bookings for current player |
| `POST` | `/api/v1/bookings/{id}/cancel` | Customer/Staff | Cancel booking with optional reason |
| `POST` | `/api/v1/payments/initiate` | Customer | **Generate SSLCOMMERZ gateway redirect URL** |
| `POST` | `/api/v1/payments/ipn` | SSLCOMMERZ | Instant Payment Notification webhook handler |
| `GET` | `/api/v1/pricing-rules/court/{id}` | Public | List dynamic hourly pricing rules for a court |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PROJECT_NAME="TurfMate API"
API_V1_STR="/api/v1"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/turfmate"
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# JWT Secrets
SECRET_KEY="replace-this-with-a-secure-random-secret-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Venue Local Timezone (Bangladesh: UTC+6)
VENUE_TIMEZONE_OFFSET_HOURS=6

# SSLCOMMERZ Credentials (Testbox sandbox defaults)
SSLCOMMERZ_STORE_ID="testbox"
SSLCOMMERZ_STORE_PASS="qwerty"
SSLCOMMERZ_IS_SANDBOX=True
SSLCOMMERZ_SANDBOX_URL="https://sandbox-gw.sslcommerz.com"
SSLCOMMERZ_LIVE_URL="https://securepay.sslcommerz.com"

# URLs for SSLCOMMERZ Redirects
BACKEND_API_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
```

---

## 🧪 Testing & Code Quality

### Backend
```bash
cd backend
# Run test suite
python -m pytest tests/

# Validate database migrations
alembic check
```

### Frontend
```bash
cd frontend
# Run ESLint
pnpm run lint

# TypeScript Type Check
pnpm exec tsc --noEmit

# Production Build Verification
pnpm run build
```

---

## 🚢 Deployment

The repository includes a ready-to-deploy [`render.yaml`](./render.yaml) specification:
- Deploys a managed PostgreSQL database (`turfmate-db`).
- Deploys the Python FastAPI backend service (`turfmate-api`) with automated `alembic upgrade head` pre-deployment execution.
- The Next.js frontend can be deployed to Vercel or Render Web Services by pointing to the repository's `frontend/` directory with `NEXT_PUBLIC_API_BASE_URL` configured to the deployed backend URL.

---

## 📄 License

This project is licensed under the MIT License.