# E-Commerce Store

Single-store e-commerce platform with a Spring Boot backend and a Next.js storefront/admin UI.

## Stack

- Backend: Java 25, Spring Boot 4, Gradle, PostgreSQL, Flyway, Spring Security, Stripe, SMTP mail
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, DaisyUI, Redux Toolkit, Firebase Storage, Stripe.js

## Repository Layout

- `backend/`: Spring Boot API, database migrations, domain logic, tests
- `frontend/`: Next.js storefront and manager UI

## Local Setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Copy `backend/src/main/resources/application-dev.example.yml` to `backend/src/main/resources/application-dev.yml`.
3. Update the copied files with your local database and JWT settings.
4. Leave `STRIPE_ENABLED=false` until you have working Stripe credentials.
5. Start the backend from `backend/` with:

```powershell
.\gradlew.bat bootRun
```

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env.local`.
2. Fill in the frontend API, Firebase, and Stripe values.
3. Install dependencies and start the app from `frontend/`:

```powershell
npm install
npm run dev
```

The frontend expects the backend API at `NEXT_PUBLIC_API_BASE_URL`.

## Verification Commands

Run these from the package directory they belong to.

### Backend

```powershell
.\gradlew.bat clean build
```

### Frontend

```powershell
npm run typecheck
npm run lint
npm run build
```

## Environment Notes

- `frontend/.env.example` contains the public runtime variables the Next.js app currently uses.
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` is intentionally not included because the codebase does not read it.
- `backend/.env.example` contains shared backend environment variables.
- `backend/src/main/resources/application-dev.example.yml` documents the local Spring `dev` profile shape.
- Real `.env` files stay ignored; only example files are meant to be committed.

## Current Baseline

Branch 15 is intended to be the stabilization baseline before infrastructure work:

- backend tests and build should pass
- frontend typecheck, lint, and production build should pass
- environment variable names are documented through checked-in examples
- obvious starter leftovers and unused assets are removed
