# TurfMate REST API Reference 📡📋

> **Comprehensive API v1 Specification, Schema Models & Endpoint Directory**  
> Base URL: `http://127.0.0.1:8000/api/v1` (Production: `/api/v1`) • OpenAPI Interactive UI: `/docs` • Redoc: `/redoc`

---

## 1. Global Conventions & Standards

### Base URL & Versioning
All REST endpoints are namespaced under the `/api/v1` prefix.
- Local Development: `http://localhost:8000/api/v1`
- Production: `https://<domain>/api/v1`

### Authentication Header
Protected endpoints require an HTTP Bearer JWT token in the `Authorization` header:
```http
Authorization: Bearer <access_token>
```

### Date & Time Handling
- All requests containing timestamps (`start_datetime`, `end_datetime`) accept **ISO 8601** strings.
- Example: `"2026-09-20T20:00:00+06:00"` (Local Bangladesh Standard Time) or `"2026-09-20T14:00:00Z"` (UTC).
- Database persists all temporal records in UTC (`TIMESTAMPTZ`).
- Date query parameters use the standard `YYYY-MM-DD` format (e.g., `date=2026-09-20`).

### Standard Error Structure
Whenever a request fails validation or triggers a business conflict, the server returns an HTTP 4xx or 5xx status code with a JSON payload:
```json
{
  "detail": "The requested time slot is already booked or held for payment checkout."
}
```
Validation errors (HTTP 422) return Pydantic's structured error detail list:
```json
{
  "detail": [
    {
      "loc": ["body", "phone_number"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## 2. Authentication & Session Endpoints (`/auth`)

### 2.1 Customer Registration
Register a new player account.

- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "full_name": "Tariqul Islam",
    "phone_number": "01711223344",
    "email": "tariqul@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "user": {
      "id": "c1f728c4-9a56-42d8-bf97-09a4d8c6b12a",
      "phone_number": "01711223344",
      "full_name": "Tariqul Islam",
      "email": "tariqul@example.com",
      "role": "customer",
      "is_active": true,
      "is_superuser": false,
      "avatar_url": null,
      "created_at": "2026-09-20T10:45:00Z",
      "updated_at": "2026-09-20T10:45:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "d8b3c9a1e4f2...",
      "token_type": "bearer",
      "expires_in": 3600
    }
  }
  ```

---

### 2.2 User Login
Authenticate with phone number (or email) and password.

- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "phone_number": "01700000001",
    "password": "SuperUser2026!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "token_type": "bearer",
    "expires_in": 3600
  }
  ```

---

### 2.3 Refresh Access Token
Exchange a single-use refresh token for a fresh token pair. Implements automatic token reuse detection (RFC 6819).

- **Method**: `POST`
- **Path**: `/api/v1/auth/refresh`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "refresh_token": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "token_type": "bearer",
    "expires_in": 3600
  }
  ```

---

### 2.4 Logout
Revoke the specific refresh token session.

- **Method**: `POST`
- **Path**: `/api/v1/auth/logout`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "refresh_token": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "message": "Logged out successfully."
  }
  ```

---

### 2.5 Change Password
Change password for the authenticated user and invalidate all other sessions.

- **Method**: `POST`
- **Path**: `/api/v1/auth/change-password`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "old_password": "CurrentPassword123!",
    "new_password": "NewSecurePassword2026!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "message": "Password updated successfully. All other sessions have been logged out."
  }
  ```

---

## 3. Users Management (`/users`)

### 3.1 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/v1/users/me`
- **Access**: Authenticated (`CUSTOMER`, `STAFF`, `ADMIN`)
- **Response**: `200 OK`
  ```json
  {
    "id": "c1f728c4-9a56-42d8-bf97-09a4d8c6b12a",
    "phone_number": "01711223344",
    "full_name": "Tariqul Islam",
    "email": "tariqul@example.com",
    "role": "customer",
    "is_active": true,
    "is_superuser": false,
    "avatar_url": null,
    "created_at": "2026-09-20T10:45:00Z",
    "updated_at": "2026-09-20T10:45:00Z"
  }
  ```

---

### 3.2 Update Current User Profile
- **Method**: `PATCH`
- **Path**: `/api/v1/users/me`
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "full_name": "Tariqul I. Chowdhury",
    "email": "new.email@example.com"
  }
  ```
- **Response**: `200 OK` (Updated `UserResponse`)

---

### 3.3 Create Business Admin Account
- **Method**: `POST`
- **Path**: `/api/v1/users/admin`
- **Access**: `SUPERUSER` only
- **Request Body**:
  ```json
  {
    "phone_number": "01700000099",
    "full_name": "Arena Owner",
    "email": "owner@arena.com",
    "password": "AdminPassword2026!"
  }
  ```
- **Response**: `201 Created` (Created `UserResponse` with `role: "admin"`)

---

### 3.4 Create Desk Staff Account
- **Method**: `POST`
- **Path**: `/api/v1/users/staff`
- **Access**: `ADMIN` or `SUPERUSER`
- **Request Body**:
  ```json
  {
    "phone_number": "01700000088",
    "full_name": "Shift Desk Operator",
    "email": "desk@arena.com",
    "password": "StaffPassword2026!"
  }
  ```
- **Response**: `201 Created` (Created `UserResponse` with `role: "staff"`)

---

### 3.5 List Users (Staff & Admin)
- **Method**: `GET`
- **Path**: `/api/v1/users`
- **Access**: `STAFF`, `ADMIN`
- **Query Parameters**:
  - `role` *(optional)*: `customer` | `staff` | `admin`
  - `is_active` *(optional)*: `true` | `false`
  - `skip` *(optional, default 0)*: Integer
  - `limit` *(optional, default 50, max 100)*: Integer
- **Response**: `200 OK` (`Array<UserResponse>`)

---

## 4. Venues & Facilities (`/venues`)

### 4.1 List Active Venues
- **Method**: `GET`
- **Path**: `/api/v1/venues`
- **Access**: Public
- **Query Parameters**:
  - `district` *(optional)*: e.g., `Chattogram`, `Cumilla`, `Dhaka`
  - `area` *(optional)*: e.g., `Nasirabad`, `Kandirpar`
  - `search` *(optional)*: String
  - `skip` *(optional, default 0)*: Integer
  - `limit` *(optional, default 50)*: Integer
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "e9b2512f-6872-4d7a-a430-8ef5f58c7042",
      "name": "TurfMate Arena Cumilla",
      "slug": "turfmate-arena-cumilla",
      "address": "Kotwali Road, Kandirpar",
      "city": "Cumilla",
      "district": "Cumilla",
      "area": "Kandirpar",
      "latitude": 23.4607,
      "longitude": 91.1809,
      "opening_time": "00:00:00",
      "closing_time": "00:00:00",
      "contact_phone": "+8801700000001",
      "contact_email": "cumilla@turfmate.com",
      "amenities": ["Floodlights", "Changing Room", "Parking", "Water"],
      "status": "active",
      "status_note": null,
      "is_active": true,
      "created_at": "2026-09-20T00:00:00Z"
    }
  ]
  ```

---

### 4.2 Get Venue Details
- **Method**: `GET`
- **Path**: `/api/v1/venues/{venue_id}`
- **Access**: Public
- **Response**: `200 OK` (`VenueResponse`)

---

### 4.3 Create Venue
- **Method**: `POST`
- **Path**: `/api/v1/venues`
- **Access**: `STAFF`, `ADMIN`
- **Request Body**:
  ```json
  {
    "name": "Chittagong Turf Sports Complex",
    "slug": "chittagong-turf-sports-complex",
    "address": "GEC Circle, Nasirabad",
    "city": "Chattogram",
    "district": "Chattogram",
    "area": "Nasirabad",
    "opening_time": "00:00:00",
    "closing_time": "00:00:00",
    "contact_phone": "+8801812345678",
    "amenities": ["Floodlights", "Cafeteria", "Shower"]
  }
  ```
- **Response**: `201 Created` (`VenueResponse`)

---

### 4.4 Update Venue & Maintenance Status
Toggle facility maintenance or change hours.

- **Method**: `PATCH`
- **Path**: `/api/v1/venues/{venue_id}`
- **Access**: `STAFF`, `ADMIN`
- **Request Body**:
  ```json
  {
    "status": "maintenance",
    "status_note": "Turf relaying underway until Friday 4 PM"
  }
  ```
- **Response**: `200 OK` (`VenueResponse`)

---

## 5. Courts / Pitches (`/courts`)

### 5.1 List Active Courts
- **Method**: `GET`
- **Path**: `/api/v1/courts`
- **Access**: Public
- **Query Parameters**:
  - `venue_id` *(optional)*: UUID
  - `sport_type` *(optional)*: `football` | `cricket` | `badminton`
  - `skip` *(optional, default 0)*: Integer
  - `limit` *(optional, default 50)*: Integer
- **Response**: `200 OK`
  ```json
  [
    {
      "id": "7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad",
      "venue_id": "e9b2512f-6872-4d7a-a430-8ef5f58c7042",
      "name": "The Champions Ground (7-A-Side)",
      "sport_type": "football",
      "court_size": "7-A-Side (120x80 ft)",
      "surface_type": "artificial_turf",
      "base_price_per_hour": "1500.00",
      "status": "active",
      "status_note": null,
      "is_active": true,
      "created_at": "2026-09-20T00:00:00Z"
    }
  ]
  ```

---

### 5.2 Create Court Under Venue
- **Method**: `POST`
- **Path**: `/api/v1/venues/{venue_id}/courts`
- **Access**: `STAFF`, `ADMIN`
- **Request Body**:
  ```json
  {
    "name": "Pitch Beta (5-A-Side)",
    "sport_type": "football",
    "court_size": "5-A-Side (90x60 ft)",
    "surface_type": "artificial_turf",
    "base_price_per_hour": "1200.00"
  }
  ```
- **Response**: `201 Created` (`CourtResponse`)

---

### 5.3 Update Court Details
- **Method**: `PATCH`
- **Path**: `/api/v1/courts/{court_id}`
- **Access**: `STAFF`, `ADMIN`
- **Request Body**:
  ```json
  {
    "base_price_per_hour": "1600.00",
    "status": "active"
  }
  ```
- **Response**: `200 OK` (`CourtResponse`)

---

## 6. Dynamic Pricing Engine (`/pricing-rules`)

### 6.1 Create Dynamic Pricing Override Rule
- **Method**: `POST`
- **Path**: `/api/v1/courts/{court_id}/pricing-rules`
- **Access**: `STAFF`, `ADMIN`
- **Request Body**:
  ```json
  {
    "rule_name": "Friday Prime Time Floodlights",
    "day_of_week": 4,
    "start_time": "18:00:00",
    "end_time": "23:00:00",
    "price_per_hour": "2200.00",
    "is_active": true
  }
  ```
  *(Note: `day_of_week`: 0=Monday, 4=Friday, 6=Sunday. Pass `null` for all-days override)*
- **Response**: `201 Created`
  ```json
  {
    "id": "18db35b7-789a-471a-85d8-912a7d65ef43",
    "court_id": "7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad",
    "rule_name": "Friday Prime Time Floodlights",
    "day_of_week": 4,
    "start_time": "18:00:00",
    "end_time": "23:00:00",
    "price_per_hour": "2200.00",
    "is_active": true,
    "created_at": "2026-09-20T10:45:00Z"
  }
  ```

---

### 6.2 List Pricing Rules for Court
- **Method**: `GET`
- **Path**: `/api/v1/courts/{court_id}/pricing-rules`
- **Access**: Public
- **Response**: `200 OK` (`Array<PricingRuleResponse>`)

---

### 6.3 Calculate Slot Price
Get the exact calculated price per hour for a given slot start time according to rule precedence.

- **Method**: `GET`
- **Path**: `/api/v1/courts/{court_id}/calculate-price`
- **Access**: Public
- **Query Parameters**:
  - `slot_time`: ISO 8601 string (e.g. `2026-09-20T19:00:00+06:00`)
- **Response**: `200 OK`
  ```json
  {
    "price_per_hour": "2200.00"
  }
  ```

---

### 6.4 Delete Pricing Rule
- **Method**: `DELETE`
- **Path**: `/api/v1/pricing-rules/{rule_id}`
- **Access**: `STAFF`, `ADMIN`
- **Response**: `200 OK`
  ```json
  {
    "message": "Pricing rule deleted successfully."
  }
  ```

---

## 7. Court Availability & Bookings Engine

### 7.1 Get Court 24-Hour Availability Grid
Returns all time slots from 12:00 AM (00:00) to 11:00 PM (23:00) in Bangladesh Standard Time (`UTC+06:00`) with dynamic pricing and availability status (`available`, `pending`, `booked`, or `blocked`).

- **Method**: `GET`
- **Path**: `/api/v1/courts/{court_id}/availability`
- **Access**: Public
- **Query Parameters**:
  - `date`: `YYYY-MM-DD` (e.g. `2026-09-20`)
  - `duration_minutes` *(optional, default 60)*: Integer between 30 and 180
- **Response**: `200 OK`
  ```json
  {
    "court_id": "7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad",
    "court_name": "The Champions Ground (7-A-Side)",
    "date": "2026-09-20",
    "venue_id": "e9b2512f-6872-4d7a-a430-8ef5f58c7042",
    "venue_name": "TurfMate Arena Cumilla",
    "venue_status": "active",
    "court_status": "active",
    "slots": [
      {
        "start_time": "2026-09-19T18:00:00Z",
        "end_time": "2026-09-19T19:00:00Z",
        "price": "1500.00",
        "is_available": true,
        "status": "available",
        "reason": null
      },
      {
        "start_time": "2026-09-20T14:00:00Z",
        "end_time": "2026-09-20T15:00:00Z",
        "price": "2200.00",
        "is_available": false,
        "status": "pending",
        "reason": "Slot is temporarily held for payment checkout"
      }
    ]
  }
  ```

---

### 7.2 Create Customer Booking & Initiate 10-Minute Hold
Locks the selected slot via PostgreSQL row-level locking (`SELECT FOR UPDATE`) and starts a 10-minute hold countdown.

- **Method**: `POST`
- **Path**: `/api/v1/bookings`
- **Access**: Authenticated (`CUSTOMER`, `STAFF`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "court_id": "7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad",
    "start_datetime": "2026-09-20T20:00:00+06:00",
    "end_datetime": "2026-09-20T21:00:00+06:00",
    "customer_notes": "Friendly match with corporate team"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "id": "e305e557-4180-45c1-90a6-1e66c0efbbf3",
    "booking_reference": "TM-260920-X8J2",
    "court_id": "7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad",
    "court": {
      "id": "7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad",
      "name": "The Champions Ground (7-A-Side)",
      "sport_type": "football",
      "venue_id": "e9b2512f-6872-4d7a-a430-8ef5f58c7042",
      "venue_name": "TurfMate Arena Cumilla"
    },
    "customer_id": "c1f728c4-9a56-42d8-bf97-09a4d8c6b12a",
    "customer": {
      "id": "c1f728c4-9a56-42d8-bf97-09a4d8c6b12a",
      "full_name": "Tariqul Islam",
      "phone_number": "01711223344",
      "email": "tariqul@example.com"
    },
    "start_datetime": "2026-09-20T14:00:00Z",
    "end_datetime": "2026-09-20T15:00:00Z",
    "status": "pending",
    "total_amount": "2200.00",
    "deposit_paid": "0.00",
    "remaining_balance": "2200.00",
    "customer_notes": "Friendly match with corporate team",
    "internal_notes": null,
    "cancellation_reason": null,
    "cancelled_at": null,
    "created_by_user_id": "c1f728c4-9a56-42d8-bf97-09a4d8c6b12a",
    "expires_at": "2026-09-20T10:55:00Z",
    "created_at": "2026-09-20T10:45:00Z",
    "updated_at": "2026-09-20T10:45:00Z"
  }
  ```
- **Error Conditions**:
  - `409 Conflict`: Slot is already booked or held by another player.
  - `400 Bad Request`: Booking is in the past, or outside venue hours.

---

### 7.3 Create Staff / Walk-In Booking
Allows front-desk staff to reserve slots on behalf of walk-in or telephone customers, with optional upfront cash deposit recording.

- **Method**: `POST`
- **Path**: `/api/v1/bookings/staff`
- **Access**: `STAFF`, `ADMIN`
- **Request Body**:
  ```json
  {
    "court_id": "7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad",
    "customer_id": null,
    "walk_in_name": "Rahim Uddin",
    "walk_in_phone": "01899887766",
    "start_datetime": "2026-09-20T21:00:00+06:00",
    "end_datetime": "2026-09-20T22:00:00+06:00",
    "deposit_paid": "1000.00",
    "status": "confirmed",
    "internal_notes": "Counter advance paid in cash"
  }
  ```
- **Response**: `201 Created` (`BookingResponse`)

---

### 7.4 Block Slot for Maintenance
Locks a court window against any customer bookings.

- **Method**: `POST`
- **Path**: `/api/v1/bookings/block`
- **Access**: `STAFF`, `ADMIN`
- **Request Body**:
  ```json
  {
    "court_id": "7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad",
    "start_datetime": "2026-09-21T02:00:00+06:00",
    "end_datetime": "2026-09-21T06:00:00+06:00",
    "reason": "Floodlight bulb replacement"
  }
  ```
- **Response**: `201 Created` (`BookingResponse` with `status: "blocked"`)

---

### 7.5 List Bookings with Filters
- **Method**: `GET`
- **Path**: `/api/v1/bookings`
- **Access**: Authenticated (`CUSTOMER` sees only their own; `STAFF`/`ADMIN` can view and filter all)
- **Query Parameters**:
  - `court_id` *(optional)*: UUID
  - `venue_id` *(optional)*: UUID
  - `customer_id` *(optional, Staff/Admin only)*: UUID
  - `status` *(optional)*: `pending` | `confirmed` | `completed` | `cancelled` | `blocked`
  - `start_date` *(optional)*: `YYYY-MM-DD`
  - `end_date` *(optional)*: `YYYY-MM-DD`
  - `search` *(optional, Staff/Admin only)*: String (matches reference, phone, or name)
  - `skip` *(optional, default 0)*: Integer
  - `limit` *(optional, default 50)*: Integer
- **Response**: `200 OK` (`Array<BookingResponse>`)

---

### 7.6 Get Booking by Reference Code
- **Method**: `GET`
- **Path**: `/api/v1/bookings/reference/{reference}`
- **Access**: Authenticated (Owner, Staff, or Admin)
- **Example**: `/api/v1/bookings/reference/TM-260920-X8J2`
- **Response**: `200 OK` (`BookingResponse`)

---

### 7.7 Cancel Booking
- **Method**: `POST`
- **Path**: `/api/v1/bookings/{booking_id}/cancel`
- **Access**: Authenticated (Owner, Staff, or Admin)
- **Request Body**:
  ```json
  {
    "cancellation_reason": "Heavy rain forecast"
  }
  ```
- **Response**: `200 OK` (`BookingResponse` with `status: "cancelled"`)

---

### 7.8 Update Booking Status (Staff/Admin)
- **Method**: `PATCH`
- **Path**: `/api/v1/bookings/{booking_id}/status`
- **Access**: `STAFF`, `ADMIN`
- **Request Body**:
  ```json
  {
    "status": "completed",
    "internal_notes": "Match completed with full balance settled at desk"
  }
  ```
- **Response**: `200 OK` (`BookingResponse`)

---

## 8. Payments & SSLCOMMERZ Gateway (`/payments`)

### 8.1 Initiate SSLCOMMERZ Payment Session
Generates a payment gateway session with SSLCOMMERZ (bKash, Nagad, Visa, Mastercard) and returns the redirection URL.

- **Method**: `POST`
- **Path**: `/api/v1/payments/sslcommerz/initiate`
- **Access**: Authenticated (`CUSTOMER`, `STAFF`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "booking_id": "e305e557-4180-45c1-90a6-1e66c0efbbf3",
    "amount": "2200.00"
  }
  ```
  *(If `amount` is omitted, defaults to the booking's remaining due balance)*
- **Response**: `200 OK`
  ```json
  {
    "status": "SUCCESS",
    "gateway_url": "https://sandbox.sslcommerz.com/gwprocess/v4/gw.php?Q=s&SESSIONKEY=...",
    "sessionkey": "F2B68E56DB737D8CA4F5B011D12F2C5A",
    "transaction_id": "TXN-TM-260920-X8J2-K9Q1",
    "amount": "2200.00",
    "currency": "BDT"
  }
  ```

---

### 8.2 SSLCOMMERZ Success Callback
Browser redirection target invoked by the SSLCOMMERZ gateway upon successful payment.

- **Method**: `POST`
- **Path**: `/api/v1/payments/sslcommerz/success`
- **Access**: SSLCOMMERZ Gateway / Public Form POST
- **Form Data**:
  - `tran_id`: e.g. `TXN-TM-260920-X8J2-K9Q1`
  - `val_id`: e.g. `2026092010451293810`
  - `amount`: `2200.00`
- **Behavior**:
  - Validates transaction against SSLCOMMERZ validation API.
  - Updates `Payment` to `SUCCESS` and `Booking` to `CONFIRMED`.
  - Redirects browser to `${FRONTEND_URL}/booking/success?ref={ref}&tran_id={tran_id}&amount={amount}`.

---

### 8.3 SSLCOMMERZ Fail Callback
- **Method**: `POST`
- **Path**: `/api/v1/payments/sslcommerz/fail`
- **Access**: SSLCOMMERZ Gateway
- **Behavior**: Marks `Payment` as `FAILED` and redirects to `${FRONTEND_URL}/booking/failed`.

---

### 8.4 SSLCOMMERZ Cancel Callback
- **Method**: `POST`
- **Path**: `/api/v1/payments/sslcommerz/cancel`
- **Access**: SSLCOMMERZ Gateway
- **Behavior**: Marks `Payment` as `CANCELLED` and redirects to `${FRONTEND_URL}/booking/cancel`.

---

### 8.5 SSLCOMMERZ Instant Payment Notification (IPN Webhook)
Server-to-server webhook triggered asynchronously by SSLCOMMERZ.

- **Method**: `POST`
- **Path**: `/api/v1/payments/sslcommerz/ipn`
- **Access**: SSLCOMMERZ IPN
- **Form Data**:
  - `tran_id`: String
  - `val_id`: String
  - `status`: `VALID` | `FAILED` | `CANCELLED`
- **Response**: `200 OK`
  ```json
  {
    "status": "IPN_RECEIVED"
  }
  ```

---

### 8.6 Record Manual Desk Payment
Allows desk staff to register an in-person cash payment, direct counter bKash/Nagad transfer, or POS card swipe.

- **Method**: `POST`
- **Path**: `/api/v1/bookings/{booking_id}/payments`
- **Access**: `STAFF`, `ADMIN`
- **Request Body**:
  ```json
  {
    "amount": "2200.00",
    "payment_method": "cash",
    "notes": "Full settlement at entrance counter"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "id": "893c52bf-1823-455b-bf99-8cf0731a2931",
    "booking_id": "e305e557-4180-45c1-90a6-1e66c0efbbf3",
    "transaction_reference": "DESK-CASH-746281",
    "amount": "2200.00",
    "currency": "BDT",
    "payment_method": "cash",
    "payment_status": "success",
    "completed_at": "2026-09-20T10:50:00Z",
    "created_at": "2026-09-20T10:50:00Z"
  }
  ```

---

### 8.7 List Financial Transactions (Audit & Reporting)
- **Method**: `GET`
- **Path**: `/api/v1/payments`
- **Access**: `STAFF`, `ADMIN`
- **Query Parameters**:
  - `booking_id` *(optional)*: UUID
  - `payment_method` *(optional)*: `sslcommerz` | `bkash` | `nagad` | `cash` | `card`
  - `status` *(optional)*: `pending` | `success` | `failed` | `cancelled` | `refunded`
  - `start_date` *(optional)*: `YYYY-MM-DD`
  - `end_date` *(optional)*: `YYYY-MM-DD`
  - `skip` *(optional, default 0)*: Integer
  - `limit` *(optional, default 50)*: Integer
- **Response**: `200 OK` (`Array<PaymentResponse>`)

---

## 9. Quick cURL Test Examples

### Login & Retrieve JWT Bearer Token
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "01700000001", "password": "SuperUser2026!"}'
```

### Inspect Slot Availability for a Court
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/courts/7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad/availability?date=2026-09-20"
```

### Create a Slot Hold (Authenticated Player)
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/bookings" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "court_id": "7bf36f93-3d0d-44a5-bfe4-7e882a9db3ad",
    "start_datetime": "2026-09-20T20:00:00+06:00",
    "end_datetime": "2026-09-20T21:00:00+06:00",
    "customer_notes": "Weekend practice session"
  }'
```

### Trigger SSLCOMMERZ Payment Checkout
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/payments/sslcommerz/initiate" \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"booking_id": "<YOUR_BOOKING_UUID>"}'
```
