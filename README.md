# E-Commerce Store

Single-store e-commerce platform built as a reusable baseline for product-based shops.

This repository contains the full application:

- a public storefront for browsing products and completing guest checkout
- a protected manager/admin workspace for running store operations
- a Spring Boot backend for API, business logic, auth, and payment workflows
- a Next.js frontend for the customer-facing site and the internal management UI

## Project Goals

- Keep the product model single-store and easy to reason about
- Support guest checkout without customer accounts
- Separate product, order, payment, refund, delivery, and store-content concerns cleanly
- Provide a baseline that can be stabilized first, then extended with infrastructure and deployment work later

## Product Scope

This is intentionally not a marketplace or multi-tenant system.

The current scope centers on one store with:

- storefront browsing and product detail pages
- cart and checkout flows
- Stripe-based payment flow
- order, payment, refund, and delivery tracking on the backend
- manager/admin tools for products, orders, payments, users, homepage content, and store pages
- centralized shop branding, contact, SEO, and legal/informational page content

## System Overview

### Frontend

The frontend in [frontend/](./frontend/README.md) is a Next.js application that serves both:

- the public storefront
- the authenticated back-office manager experience

It handles page rendering, cart persistence, checkout UX, Stripe client integration, and store-management screens for content and commerce operations.

### Backend

The backend in [backend/](./backend/README.md) is a Spring Boot application that provides:

- public storefront APIs
- authenticated management APIs
- JWT-based staff authentication
- order reservation and checkout workflows
- Stripe payment and refund handling
- Flyway-managed database migrations
- store configuration, homepage, and legal-page content management

### Supporting Services

The project currently expects or integrates with:

- PostgreSQL for primary persistence
- Stripe for payments and webhooks
- Firebase Storage for frontend-managed asset uploads
- SMTP for contact and order-related email delivery

## Core Domain Areas

- `Shop`: store identity, contact details, branding, and public-facing metadata
- `HomepageConfig`: hero, featured content, spotlight, CTA, and trust/value sections
- `StorePage`: legal and informational pages such as About, FAQ, Terms, Privacy, Shipping, and Refund Policy
- `Product` and `ProductVariant`: catalog structure, pricing, imagery, and availability
- `Order` and `Delivery`: guest checkout records, delivery state, and order lifecycle
- `Payment` and `Refund`: payment provider state, reconciliation, and refund workflows
- `User`: admin and manager accounts for back-office access

## Repository Layout

- [backend/](./backend/README.md): Spring Boot API, domain logic, migrations, and tests
- [frontend/](./frontend/README.md): Next.js storefront and manager UI
- `backend/.env.example`: backend environment variable template
- `frontend/.env.example`: frontend environment variable template
- `backend/src/main/resources/application-dev.example.yml`: local Spring dev-profile template

## Current Baseline

This branch is intended to act as the stabilization baseline before infrastructure work begins.

At this stage, the project is expected to satisfy:

- backend tests passing
- backend build passing
- frontend typecheck passing
- frontend lint passing
- frontend production build passing
- checked-in environment examples for local setup
- no obvious starter leftovers in the repo root and app packages

## How To Navigate This Repo

- Start here for the full project picture
- Read [backend/README.md](./backend/README.md) for the API and domain-service side
- Read [frontend/README.md](./frontend/README.md) for the storefront and manager-app side
- Use the `.env.example` files when setting up a local environment

## Local Setup References

This README is meant to stay overview-focused, so local setup details are intentionally light.

The most important starting points are:

- `backend/.env.example`
- `backend/src/main/resources/application-dev.example.yml`
- `frontend/.env.example`

The main verification commands remain:

- backend: `.\gradlew.bat clean build`
- frontend: `npm run typecheck`
- frontend: `npm run lint`
- frontend: `npm run build`
