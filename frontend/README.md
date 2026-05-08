# Frontend Overview

This directory contains the Next.js frontend for the full E-Commerce Store project.

For the complete product and architecture overview, start with the [root README](../README.md).

## Role In The System

The frontend is responsible for:

- rendering the public storefront
- rendering the authenticated manager/admin workspace
- driving cart, checkout, and payment UX
- consuming public and protected backend APIs
- handling Firebase-backed asset upload flows used by store and product management

## Main Areas

- `src/app`: route structure for storefront and manager pages
- `src/components/home`: homepage presentation
- `src/components/products`: product list and product detail UI
- `src/components/cart`: cart and checkout-adjacent UI
- `src/components/payment`: Stripe payment screens and summaries
- `src/components/manager`: back-office tools for users, products, orders, payments, and store customization
- `src/lib`: API clients and service-layer helpers
- `src/store`: Redux state for cart and auth-related client state
- `src/types`: shared TypeScript shapes for API-driven frontend features

## Configuration

Local setup is driven by:

- `../frontend/.env.example`
- `next.config.ts`

The frontend expects a backend base URL through `NEXT_PUBLIC_API_BASE_URL`, plus the public Stripe and Firebase values used by the current UI.

## Verification

Run from this directory:

- `npm run typecheck`
- `npm run lint`
- `npm run build`

These commands cover the current quality and production-build baseline for the frontend application.
