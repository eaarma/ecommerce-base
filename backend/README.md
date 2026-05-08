# Backend Overview

This directory contains the Spring Boot backend for the full E-Commerce Store project.

For the complete product and architecture overview, start with the [root README](../README.md).

## Role In The System

The backend is responsible for:

- exposing public APIs used by the storefront
- exposing protected APIs used by manager and admin screens
- enforcing security, authorization, and staff authentication
- managing products, orders, deliveries, payments, refunds, users, and store content
- coordinating persistence through JPA and Flyway migrations
- integrating with Stripe, PostgreSQL, and SMTP-backed email flows

## Main Areas

- `src/main/java/.../auth`: staff login and auth responses
- `src/main/java/.../security`: JWT, filters, and endpoint protection
- `src/main/java/.../product`: product catalog, variants, and image records
- `src/main/java/.../order`: checkout, order reservation, and order management
- `src/main/java/.../delivery`: delivery data and lifecycle handling
- `src/main/java/.../payment`: payment state, Stripe flows, and refunds
- `src/main/java/.../shop`: store-wide branding and profile data
- `src/main/java/.../homepage`: homepage configuration for the storefront
- `src/main/java/.../storepage`: public legal and informational pages
- `src/main/resources/db/migration`: database schema evolution
- `src/test/java`: backend test coverage

## Configuration

Local setup is driven by:

- `../backend/.env.example`
- `src/main/resources/application-dev.example.yml`
- `src/main/resources/application.yml`

The backend defaults to the Spring `dev` profile for local work.

## Verification

Run from this directory:

- `.\gradlew.bat clean build`

That command covers compile, tests, and packaging for the backend application.
