# Sanitation Management System · Authentication

Responsive React frontend for customer and organization registration, OTP verification, and login.

## Run locally

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the Spring Boot server origin (for example, `http://localhost:8080`). Leave off `/api/v1`; the auth client appends that path.
2. Install dependencies with `npm install`.
3. Start the frontend with `npm run dev`.

The frontend uses the public endpoints under `/api/v1/auth`. Authentication data is kept in `sessionStorage` for the current browser tab. No dashboard destinations are assumed because this workspace contains no application routes.

## Project checks

- `npm run build`
- `npm run lint`
