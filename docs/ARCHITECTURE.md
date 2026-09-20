# TurfMate System Architecture 🏟️📐

> **Engineering Architecture, Technical Specification & Design Patterns**  
> Version: 1.0 • Target: Production Monorepo • Timezone: Bangladesh Standard Time (`UTC+06:00`)

---

## 1. Executive Summary & System Overview

**TurfMate** is a specialized sports facility management platform engineered specifically for the operational challenges of football and cricket turfs across Bangladesh. Turf operations present distinct domain requirements that generic booking systems fail to handle:

1. **High Contention During Prime Hours**: Late-afternoon (5:00 PM – 8:00 PM) and floodlight night hours (8:00 PM – 2:00 AM) experience simultaneous booking requests from hundreds of players within seconds.
2. **Continuous 24/7 Operations**: Prominent arenas operate around the clock without artificial daily closing hours.
3. **Cross-Midnight Match Windows**: Many evening bookings span across midnight (e.g., 11:00 PM to 1:00 AM).
4. **Local Payment Ecosystem**: High reliance on domestic mobile financial services (bKash, Nagad, Rocket) and local debit cards processed via SSLCOMMERZ.

TurfMate solves these problems through an asynchronous **FastAPI** backend, transactional **PostgreSQL** row-level locking, a **10-minute hold expiration state machine**, and a **Next.js 16** responsive client interface.

---

## 2. High-Level System Topology

```mermaid
flowchart TD
    subgraph Clients [Clients Layer]
        Player[Player / Customer]
        StaffUser[Desk Staff / Admin]
    end

    subgraph Frontend [Frontend: Next.js 16 & React 19]
        NextApp[Next.js App Server & UI<br/>Vercel / Node.js 20]
        SlotGrid[2-Day Slot Micro-Grid]
        HoldModal[10-Min Hold & Payment Modal]
        AdminHub[Operations Hub & Bookings Desk]
    end

    subgraph API_Tier [Backend: FastAPI & Python 3.11+]
        APIRouter[FastAPI REST API Gateway /api/v1]
        AuthEngine[Auth & RBAC Module<br/>Argon2 / PyJWT]
        BookingEngine[Booking & Concurrency Engine<br/>SELECT FOR UPDATE]
        PricingEngine[Dynamic Pricing Resolver<br/>Peak & Floodlight Rules]
        PaymentEngine[SSLCOMMERZ Service Engine]
    end

    subgraph Data_Tier [Persistence Layer]
        Postgres[(PostgreSQL 16 Relational DB<br/>ACID Transactions)]
    end

    subgraph External_Gateways [Third-Party Integrations]
        SSLCommerz[SSLCOMMERZ Payment Gateway<br/>bKash / Nagad / Cards / Bank]
    end

    %% Client to Frontend UI
    Player -->|Browse & Reserve| SlotGrid
    Player -->|Payment Hold| HoldModal
    StaffUser -->|Manage Turfs & Walk-ins| AdminHub
    NextApp -.->|Renders| SlotGrid
    NextApp -.->|Renders| HoldModal
    NextApp -.->|Renders| AdminHub

    %% Frontend to API Gateway
    SlotGrid -->|GET /courts/availability| APIRouter
    HoldModal -->|POST /bookings & /payments| APIRouter
    AdminHub -->|POST /bookings/staff & /venues| APIRouter

    %% API Gateway to Modules
    APIRouter --> AuthEngine
    APIRouter --> BookingEngine
    APIRouter --> PricingEngine
    APIRouter --> PaymentEngine

    %% Modules to Database
    AuthEngine -->|User & Session Verification| Postgres
    BookingEngine -->|Row-Level Locking & Records| Postgres
    PricingEngine -->|Fetch Rate Rules| Postgres
    PaymentEngine -->|Persist Transactions| Postgres

    %% Payment Integration
    PaymentEngine -->|POST /gwprocess/v4/api.php| SSLCommerz
    SSLCommerz -->|Instant Payment Notification / IPN Webhook| APIRouter
```

### Component Breakdown

| Layer | Technology | Primary Function |
| :--- | :--- | :--- |
| **Client Frontend** | Next.js 16, React 19, Tailwind CSS v4, Zustand | Reactive booking interface, continuous 2-day availability micro-grid, 10-minute hold countdown timer, responsive operations dashboard. |
| **API Backend** | FastAPI, Uvicorn, Python 3.11+, Pydantic v2 | High-throughput async REST endpoints, request validation, business rules, RBAC enforcement. |
| **ORM & Migrations** | SQLModel (SQLAlchemy 2.0 Core) + Alembic | Declarative schema definitions, relationship queries, migration tracking, database schema versioning. |
| **Relational Database** | PostgreSQL 15/16 | ACID transactional guarantees, row-level pessimistic locking (`SELECT ... FOR UPDATE`), temporal range queries. |
| **Payment Gateway** | SSLCOMMERZ Sandbox / Live API | Multi-channel local payment processing, automated return URL redirection, asynchronous IPN webhooks. |

---

## 3. Database Schema & Entity Relationship Diagram

The database architecture is structured around facilities (`venues`), individual playing surfaces (`courts`), rate structures (`pricing_rules`), reservations (`bookings`), financial settlements (`payments`), and user identity (`users` & `user_sessions`).

```mermaid
erDiagram
    User ||--o{ UserSession : "authenticates"
    User ||--o{ Booking : "books"
    User ||--o{ Payment : "transacts"
    Venue ||--o{ Court : "contains"
    Court ||--o{ PricingRule : "defines"
    Court ||--o{ Booking : "hosts"
    Booking ||--o{ Payment : "settles"

    User {
        uuid id PK
        string full_name
        string phone_number UK
        string email
        string hashed_password
        enum role "CUSTOMER | STAFF | ADMIN"
        boolean is_active
        boolean is_superuser
        timestamp created_at
        timestamp updated_at
    }

    UserSession {
        uuid id PK
        uuid user_id FK
        string refresh_token UK
        timestamp expires_at
        boolean is_revoked
        timestamp created_at
    }

    Venue {
        uuid id PK
        string name
        string slug UK
        string address
        string city
        time opening_time
        time closing_time
        enum status "ACTIVE | MAINTENANCE | CLOSED"
        string status_note
        boolean is_active
        timestamp created_at
    }

    Court {
        uuid id PK
        uuid venue_id FK
        string name
        enum sport_type "FOOTBALL | CRICKET | BADMINTON"
        string court_size
        string surface_type
        decimal base_price_per_hour
        enum status "ACTIVE | MAINTENANCE | CLOSED"
        string status_note
        boolean is_active
        timestamp created_at
    }

    PricingRule {
        uuid id PK
        uuid court_id FK
        string rule_name
        int day_of_week "0=Mon ... 6=Sun or NULL"
        time start_time
        time end_time
        decimal price_per_hour
        boolean is_active
        timestamp created_at
    }

    Booking {
        uuid id PK
        string booking_reference UK
        uuid court_id FK
        uuid customer_id FK
        timestamptz start_datetime
        timestamptz end_datetime
        enum status "PENDING | CONFIRMED | COMPLETED | CANCELLED | BLOCKED"
        decimal total_amount
        decimal deposit_paid
        string customer_notes
        string internal_notes
        string cancellation_reason
        timestamptz cancelled_at
        uuid created_by_user_id FK
        timestamp created_at
        timestamp updated_at
    }

    Payment {
        uuid id PK
        uuid booking_id FK
        string transaction_reference UK
        decimal amount
        string currency
        enum payment_method "SSLCOMMERZ | BKASH | NAGAD | CASH | CARD"
        enum payment_status "PENDING | SUCCESS | FAILED | CANCELLED | REFUNDED"
        string gateway_transaction_id
        string gateway_sessionkey
        json bank_response_payload
        timestamptz completed_at
        timestamp created_at
    }
```

### Key Database Design Principles

1. **UUID Primary Keys (`BaseUUIDModel`)**: All entities use RFC 4122 v4 UUIDs generated via Python's `uuid.uuid4()`. This prevents enumeration attacks and facilitates distributed microservice extraction if needed.
2. **Universal UTC Timestamps**: All temporal fields (`start_datetime`, `end_datetime`, `created_at`, `updated_at`, `cancelled_at`) are persisted in PostgreSQL with timezone information (`TIMESTAMPTZ` / `DateTime(timezone=True)`).
3. **Soft Lifecycle & Audit Trails**: Bookings retain state changes, recorded cancellation reasons, and `created_by_user_id` to audit whether a booking was placed directly by the customer or by an on-duty staff member at the desk.

---

## 4. Concurrency Control & Race Condition Prevention

### The Problem: High-Concurrency Double-Booking
When two players attempt to book the same court slot (e.g., Friday 8:00 PM – 9:00 PM) at the same second, typical "read-then-write" validation fails:

```
Player A: SELECT * WHERE court_id=... (Empty -> slot is open)
Player B: SELECT * WHERE court_id=... (Empty -> slot is open)
Player A: INSERT booking (PENDING)
Player B: INSERT booking (PENDING)  <-- DOUBLE BOOKING!
```

### The Solution: Pessimistic Row Locking (`SELECT FOR UPDATE`)

TurfMate implements a two-step concurrency protocol in [`app/services/booking_service.py`](file:///f:/Programs/Full%20Stack/turfmate/backend/app/services/booking_service.py):

```mermaid
sequenceDiagram
    autonumber
    actor PlayerA as Player A
    actor PlayerB as Player B
    participant API as FastAPI Backend
    participant DB as PostgreSQL Transaction

    PlayerA->>API: POST /api/v1/bookings (8 PM - 9 PM)
    activate API
    API->>DB: BEGIN TRANSACTION
    API->>DB: CALL expire_stale_pending_bookings(hold_minutes=10)
    API->>DB: SELECT * FROM booking WHERE court_id = :id<br/>AND status != 'CANCELLED'<br/>AND start < :end AND end > :start<br/>FOR UPDATE
    Note over DB: Locks all overlapping active booking rows
    DB-->>API: 0 matching active rows
    API->>DB: INSERT INTO booking (status='PENDING', ...)
    API->>DB: COMMIT
    API-->>PlayerA: 201 Created (Booking Hold Initiated, 10-Min Timer)
    deactivate API

    PlayerB->>API: POST /api/v1/bookings (8 PM - 9 PM)
    activate API
    API->>DB: BEGIN TRANSACTION
    API->>DB: CALL expire_stale_pending_bookings(hold_minutes=10)
    API->>DB: SELECT * FROM booking WHERE court_id = :id<br/>AND status != 'CANCELLED'<br/>AND start < :end AND end > :start<br/>FOR UPDATE
    Note over DB: Rows locked or returned with status='PENDING'
    DB-->>API: 1 conflicting active row (Player A's Pending Hold)
    API->>DB: ROLLBACK
    API-->>PlayerB: 409 Conflict: "Slot is already booked or held for payment checkout."
    deactivate API
```

### 10-Minute Hold Lifecycle & State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Player initiates booking
    
    PENDING --> CONFIRMED: SSLCOMMERZ Payment Verified (Success / IPN)
    PENDING --> CONFIRMED: Staff records manual payment / deposit
    PENDING --> CANCELLED: 10-minute timer expires (Auto-released)
    PENDING --> CANCELLED: Customer explicitly cancels
    
    CONFIRMED --> COMPLETED: Match time passes without incident
    CONFIRMED --> CANCELLED: Player / Staff cancels (Refund recorded)
    
    CANCELLED --> [*]
    COMPLETED --> [*]
```

#### Auto-Release Mechanism (`expire_stale_pending_bookings`)
To prevent abandoned checkouts from permanently locking slots:
- Prior to every availability calculation and before every new booking reservation, the system executes:
  ```python
  def expire_stale_pending_bookings(session: Session, hold_minutes: int = 10) -> int:
      cutoff = utc_now() - timedelta(minutes=hold_minutes)
      statement = select(Booking).where(
          Booking.status == BookingStatus.PENDING,
          Booking.created_at < cutoff,
      )
      stale_bookings = list(session.exec(statement).all())
      for b in stale_bookings:
          b.status = BookingStatus.CANCELLED
          b.cancellation_reason = f"Payment session timed out ({hold_minutes}-minute limit exceeded)"
          b.cancelled_at = utc_now()
          session.add(b)
      if stale_bookings:
          session.commit()
      return len(stale_bookings)
  ```
- Any hold older than 10 minutes is automatically marked `CANCELLED`, returning the slot to public availability without requiring cron infrastructure.

---

## 5. Timezone Strategy & 24/7 Scheduling Engine

### The Problem: Multi-Hour Matches & 24/7 Arenas
1. **Timezone Shifts**: Bangladesh Standard Time (`BST`) is fixed at `UTC+06:00`. If UTC timestamps are queried naively against calendar dates, a query for `2026-09-20` in UTC corresponds to `06:00 AM (Sep 20)` through `05:59 AM (Sep 21)` in Bangladesh. This creates a 6-hour offset error where users see slots starting at 6:00 AM rather than 12:00 AM midnight.
2. **Operating Hours Constraints**: Turfs operating 24 hours a day were previously rejected because typical validation expects `open_time < close_time`. When a venue had `00:00:00` to `00:00:00`, standard range checks evaluated the operational window as zero seconds, rejecting early morning bookings (e.g., 1:00 AM to 3:00 AM).

### Architectural Solution

#### 1. The Canonical 24/7 Venue Contract
A venue is designated as **24/7 continuous operation** if and only if:
```python
def is_venue_24_hours(venue: Venue) -> bool:
    return venue.opening_time == venue.closing_time
```
- In [`app/services/booking_service.py`](file:///f:/Programs/Full%20Stack/turfmate/backend/app/services/booking_service.py), when `is_venue_24_hours(venue)` evaluates to `True`, the operating hours validation is **completely bypassed**.
- Players and staff can book any hour of the day (e.g., 12:00 AM – 3:00 AM) without rejection.

#### 2. Local Calendar Day Translation
When a client requests availability for date $D$ (e.g., `2026-09-20`):
1. Construct start of day in Bangladesh local time:  
   `day_start_local = datetime.combine(D, 00:00:00).replace(tzinfo=VENUE_TIMEZONE)`
2. Construct end of day in Bangladesh local time:  
   `day_end_local = datetime.combine(D + 1 day, 00:00:00).replace(tzinfo=VENUE_TIMEZONE)`
3. Convert both to UTC before filtering PostgreSQL:
   ```python
   day_start_utc = day_start_local.astimezone(timezone.utc) # 2026-09-19 18:00:00 UTC
   day_end_utc   = day_end_local.astimezone(timezone.utc)   # 2026-09-20 18:00:00 UTC
   ```
4. Availability slots iterate starting from `00:00` (12:00 AM) to `23:00` (11:00 PM) in local time, giving a clean 24-hour visual grid.

#### 3. Cross-Midnight Booking Support
Because bookings take absolute UTC timestamps (`start_datetime` and `end_datetime`), a booking from `2026-09-20 23:00:00+06:00` to `2026-09-21 01:00:00+06:00` is stored as a single continuous reservation. The frontend availability grid renders both days concurrently, allowing the user to select contiguous slots spanning across the midnight boundary.

---

## 6. Dynamic Pricing Calculation Engine

Turf rates fluctuate significantly based on artificial lighting (floodlights) and peak weekend demand (Friday / Saturday).

### Pricing Priority Hierarchy
When calculating the price for any 30-minute interval within a match window, the pricing service [`app/services/pricing_service.py`](file:///f:/Programs/Full%20Stack/turfmate/backend/app/services/pricing_service.py) applies the following rule precedence:

```mermaid
flowchart TD
    Start([Calculate Slot Price for time T]) --> Rule1{Is there an active rule<br/>where day_of_week == T.weekday<br/>AND T is within [start_time, end_time)?}
    
    Rule1 -- YES --> ApplyDayRule[Apply Day-Specific Price<br/>e.g., Friday Afternoon Peak]
    
    Rule1 -- NO --> Rule2{Is there an active rule<br/>where day_of_week is NULL<br/>AND T is within [start_time, end_time)?}
    
    Rule2 -- YES --> ApplyGeneralRule[Apply General Time Window Price<br/>e.g., Daily Floodlight Rate]
    
    Rule2 -- NO --> FallbackCourt[Apply Court Base Price<br/>court.base_price_per_hour]

    ApplyDayRule --> End([Return Rate])
    ApplyGeneralRule --> End
    FallbackCourt --> End
```

### Time-Window Boundary Matching
Rules handle both intra-day windows (e.g. `18:00` to `23:00`) and midnight-crossing windows (e.g. `22:00` to `04:00`):
```python
def _matches_rule_time(rule: PricingRule, check_time: time) -> bool:
    if rule.end_time == time(0, 0):
        return rule.start_time <= check_time
    if rule.start_time < rule.end_time:
        return rule.start_time <= check_time < rule.end_time
    # Handles wrap-around midnight rules (e.g., 10 PM to 4 AM)
    return rule.start_time <= check_time or check_time < rule.end_time
```

---

## 7. Payment Integration & Webhook Lifecycle (SSLCOMMERZ)

TurfMate integrates with **SSLCOMMERZ**, Bangladesh's largest payment gateway aggregator.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Player Browser
    participant FE as Next.js Client
    participant BE as FastAPI API
    participant DB as PostgreSQL
    participant GW as SSLCOMMERZ Gateway

    Customer->>FE: Select Slots & Click "Proceed to Checkout"
    FE->>BE: POST /api/v1/bookings (Create Pending Hold)
    BE->>DB: Insert Booking (status='PENDING')
    BE-->>FE: Return booking_reference & 10-min countdown

    Customer->>FE: Click "Pay via SSLCOMMERZ"
    FE->>BE: POST /api/v1/payments/initiate (booking_id)
    activate BE
    BE->>BE: Generate unique tran_id: "TXN-{REF}-{RAND}"
    BE->>DB: Insert Payment (status='PENDING', transaction_reference=tran_id)
    BE->>GW: POST /gwprocess/v4/api.php (store_id, amount, tran_id, success_url, ipn_url)
    GW-->>BE: Return status='SUCCESS', GatewayPageURL
    BE-->>FE: Return { redirect_url: GatewayPageURL }
    deactivate BE

    FE->>GW: Redirect customer to GatewayPageURL
    Note over Customer,GW: Customer completes payment via bKash / Nagad / Visa

    par Async Instant Payment Notification (IPN)
        GW->>BE: POST /api/v1/payments/sslcommerz/ipn (val_id, tran_id, status='VALID')
        activate BE
        BE->>DB: SELECT Payment WHERE transaction_reference = tran_id FOR UPDATE
        BE->>DB: Update Payment (status='SUCCESS', gateway_transaction_id=val_id)
        BE->>DB: Update Booking (status='CONFIRMED', deposit_paid += amount)
        BE-->>GW: HTTP 200 OK
        deactivate BE
    and Browser Return Redirection
        GW->>BE: POST /api/v1/payments/sslcommerz/success (tran_id, val_id)
        BE->>FE: Redirect to /booking/success?ref={booking_reference}
        FE->>Customer: Display Confirmed Booking Receipt & Match Pass
    end
```

### Webhook Idempotency & Fault Tolerance
Because SSLCOMMERZ sends both a browser POST return (`success_url`) and an asynchronous server-to-server webhook (`ipn_url`), the backend is strictly idempotent:
- Checking `payment.payment_status == PaymentStatus.SUCCESS` prevents duplicate crediting of `deposit_paid`.
- If a customer closes their mobile browser after entering their bKash PIN, the IPN webhook guarantees the booking transitions to `CONFIRMED` in the background.

---

## 8. Authentication & Role-Based Access Control (RBAC)

TurfMate implements a JWT-based authentication system with dual-token architecture (short-lived access tokens, long-lived refresh tokens) and role permissions:

### User Roles

| Role | Target Audience | Permissions & Scope |
| :--- | :--- | :--- |
| `CUSTOMER` | General Players | Browse availability, reserve slots, initiate online payments, cancel own pending/confirmed bookings, view match history. |
| `STAFF` | Front-Desk Turf Operators | All Customer permissions + Bookings Desk, manual walk-in phone bookings, cash payment registration, check-in mark, maintenance toggling. |
| `ADMIN` / `SUPERUSER` | Facility Owners & Superusers | All Staff permissions + Venue settings, court creation/updates, dynamic pricing rule manager, staff account administration, revenue telemetry. |

### Security Mechanisms
1. **Password Hashing**: Passwords are hashed using the **Argon2id** algorithm (`passlib[argon2]`), resistant to GPU-based brute force attacks.
2. **Access Tokens**: Encoded as HS256 JWTs containing `sub` (User UUID), `phone`, and `role`. Lifespan: **60 minutes**.
3. **Refresh Tokens**: Persisted in the `user_sessions` table with an explicit `expires_at` timestamp (30 days) and `is_revoked` flag, enabling administrative session revocation upon logout or account compromise.

---

## 9. Frontend Architecture & Design System

The frontend application in `frontend/` is built on **Next.js 16 (Turbopack)** using the React 19 App Router.

```
frontend/
├── app/
│   ├── layout.tsx             # Root layout with responsive Navbar and Footer
│   ├── page.tsx               # High-converting Landing page with 2-day live slot grid
│   ├── login/                 # Phone/password authentication
│   ├── register/              # New player registration
│   ├── dashboard/             # Player portal (Active matches, past history)
│   ├── admin/page.tsx         # Operations Hub (Bookings Desk, Pitches, Dynamic Pricing)
│   └── booking/               # SSLCOMMERZ redirect return handlers
├── components/
│   ├── SlotAvailabilityPreview.tsx # 2-day micro-grid slot selector
│   ├── BookingHoldPaymentModal.tsx # 10-minute hold countdown timer & SSLCOMMERZ trigger
│   ├── admin/
│   │   ├── BookingsDesk.tsx   # Live reservation management table & walk-in creator
│   │   ├── VenuePitchManager.tsx # Court dimensions, surface, maintenance status
│   │   └── PricingRuleManager.tsx # Dynamic hourly rate rules manager
│   ├── Navbar.tsx             # Dynamic navigation based on auth state
│   └── Footer.tsx
├── lib/
│   ├── api.ts                 # Axios instance with auto-bearer auth & 401 refresh interceptors
│   └── auth-store.ts          # Zustand store with persistent localStorage hydration
└── types/index.ts             # TypeScript definitions aligned with backend Pydantic schemas
```

### Key UI/UX Innovations
- **Two-Day Horizon View**: Renders today and tomorrow side-by-side in a space-optimized 2-column micro-grid.
- **Micro-Grid Visual Cues**:
  - 🟢 **Emerald**: Available for booking with dynamic price tag.
  - 🟡 **Amber**: Pending payment hold (displays 10-minute hold note).
  - 🔴 **Rose**: Confirmed reservation.
  - 🔘 **Zinc**: Court maintenance or facility closure.
- **Tailwind CSS v4 Clean Palette**: Uses strict token scales (`zinc-100` through `zinc-900`) ensuring high-contrast visibility across light and dark operating modes without styling glitches.

---

## 10. Deployment Topology & Production Specification

TurfMate is configured for deployment on modern cloud platforms (Render, Railway, or AWS ECS) using the included [`render.yaml`](file:///f:/Programs/Full%20Stack/turfmate/render.yaml) specification:

```mermaid
graph LR
    subgraph Render_Cloud [Managed Render Cloud]
        ManagedPG[(PostgreSQL Database<br/>turfmate-db)]
        API_Service[Web Service: Python 3.11+<br/>turfmate-api<br/>Runs: alembic upgrade head && uvicorn]
    end

    subgraph Vercel_Or_Render [Frontend Edge]
        Next_Client[Next.js 16 Web Service<br/>turfmate-web]
    end

    Next_Client -->|NEXT_PUBLIC_API_BASE_URL| API_Service
    API_Service -->|Internal Private URL| ManagedPG
```

### Deployment Configuration Checklist
1. **Migrations First**: Backend service pre-deploy command runs `alembic upgrade head` before starting `uvicorn`.
2. **CORS Enforcement**: Set `BACKEND_CORS_ORIGINS` to the exact production frontend domains (e.g., `https://turfmate.vercel.app`).
3. **Timezone Offset**: Ensure `VENUE_TIMEZONE_OFFSET_HOURS=6` is configured in production environment variables.
4. **SSLCOMMERZ Live Credentials**: Switch `SSLCOMMERZ_IS_SANDBOX=False` and supply production `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASS`.
