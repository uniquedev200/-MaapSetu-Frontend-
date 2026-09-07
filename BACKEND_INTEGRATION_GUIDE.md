# LM-Verify Backend Integration Guide

This guide details exactly how to integrate your FastAPI backend with the LM-Verify React frontend. The frontend has been hardened, mock data has been completely stripped out, and it strictly uses Axios for real API calls.

## 1. Environment Configuration

The frontend dynamically loads the API base URL from the environment variables.

In the frontend repository, create a `.env` file at the root:
```env
# For Web Development
VITE_API_BASE_URL=http://localhost:8000/api/v1

# ⚠️ CRITICAL FOR MOBILE (CAPACITOR) DEVELOPMENT ⚠️
# The Android emulator cannot route `localhost` to your computer.
# If building for Android emulator, you MUST use:
# VITE_API_BASE_URL=http://10.0.2.2:8000/api/v1
#
# If deploying to a physical device on your WiFi, use your machine's local IP:
# VITE_API_BASE_URL=http://192.168.1.xxx:8000/api/v1
```

## 2. Authentication (JWT)

The frontend uses standard Bearer token authentication. When a user logs in, the `AuthContext` stores the session in `localStorage` (`lm_session`). 
The Axios interceptor in `src/api.ts` automatically attaches the token to every outgoing request.

### `POST /api/v1/auth/login`
**Request Body:**
```json
{
  "email": "user@business.com",
  "password": "securepassword"
}
```
**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "USR-1234",
    "name": "Acme Corp",
    "email": "user@business.com",
    "role": "BUSINESS"
  }
}
```

### `POST /api/v1/auth/signup`
**Request Body:**
```json
{
  "name": "Acme Corp",
  "email": "user@business.com",
  "password": "securepassword"
}
```
*Expected response is identical to the login response.*

---

## 3. Resource Endpoints & Expected Shapes

Below are the exact shapes the frontend expects when it calls `GET` on these endpoints. Ensure your FastAPI Pydantic models serialize to match these properties exactly.

### `GET /api/v1/dashboard/metrics`
```json
{
  "registered_instruments": 1248,
  "active_applications": 34,
  "valid_certificates": 892,
  "expiring_soon": 12
}
```

### `GET /api/v1/verification`
```json
[
  { 
    "id": "APP-2023-8901", 
    "type": "New Verification", 
    "status": "DRAFT" 
  },
  { 
    "id": "APP-2023-8895", 
    "type": "Renewal", 
    "status": "SUBMITTED" 
  }
]
```
*Supported Application Statuses:* `DRAFT`, `SUBMITTED`, `SCHEDULED`, `IN_PROGRESS`, `APPROVED`, `REJECTED`.

### `GET /api/v1/instruments`
```json
[
  { 
    "id": "1", 
    "serial_number": "SN-9823-XYZ", 
    "instrument_type": "Electronic Scale", 
    "model_number": "Non-automatic", 
    "capacity_max": 15, 
    "unit_of_measurement": "kg", 
    "verification_frequency_months": 12, 
    "status": "REGISTERED" 
  }
]
```
*Supported Instrument Statuses:* `REGISTERED`, `PENDING_VERIFICATION`, `UNDER_VERIFICATION`, `VERIFIED`, `FAILED`.

### `GET /api/v1/inspections`
```json
[
  { 
    "id": "INSP-2023-110", 
    "date": "2023-10-25", 
    "inspector": "J. Doe", 
    "status": "PENDING", 
    "location": "124 Valley Road" 
  }
]
```
*Supported Inspection Statuses:* `PENDING`, `COMPLETED`, `FAILED`.

### `GET /api/v1/certificates`
```json
[
  { 
    "id": "CERT-2023-994A", 
    "instrument": "Industrial Flow Meter Type-X", 
    "issue_date": "2023-10-24", 
    "expiry": "2024-10-24", 
    "status": "ACTIVE" 
  }
]
```
*Supported Certificate Statuses:* `ACTIVE`, `EXPIRED`.

---

## 4. Error Handling

The frontend expects standard HTTP status codes.
- Return `401 Unauthorized` if the token is invalid/expired. The Axios interceptor will catch this.
- For business logic errors (e.g., invalid login), return a `400 Bad Request` or `401` with a JSON payload:
  ```json
  { "detail": "Incorrect email or password." }
  ```
  The frontend UI (Toast system) will automatically parse `error.response.data.detail` and display it to the user.

## 5. Next Steps for Backend Engineer
1. Update FastAPI CORS middleware to allow origins from the Vite dev server (`http://localhost:5175`).
2. Update Pydantic response models to match the JSON structures outlined above.
3. Test locally by running `npm run dev` in this directory and launching your FastAPI server.
