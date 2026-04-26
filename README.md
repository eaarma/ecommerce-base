# Single Shop E-Commerce Platform

## Overview

This project is a fresh, single-shop e-commerce platform built as a reusable foundation for product-based online stores.

It is intentionally simpler than a marketplace or multi-tenant commerce system.

The system supports:

- a single storefront
- guest checkout only
- admin and manager users for back-office operations
- product management
- stock tracking
- order creation and payment handling
- a reusable storefront structure that can be adapted for future shops

The goal is to keep the project fast to build, easy to reason about, and structured in a way that avoids rework later.

---

## Locked Project Decisions

The following decisions are considered fixed for the initial version of the project:

- fresh repo
- one backend
- one frontend
- one database
- guest checkout only
- admin and manager login only
- one lightweight `StoreConfig` entity
- `Product` does not carry payment state
- payment handled by a separate `Payment` entity
- `Order` and `OrderItem` are required
- stock is reduced only after successful payment confirmation
- Redux is used only for cart persistence on the frontend
- soft delete is preferred through archived/inactive status instead of hard delete by default

These decisions should guide all future implementation branches unless explicitly changed.

---

## Product Scope

This project is a **single-shop product-based e-commerce site**.

It is not a marketplace and does not support multi-tenant shop logic.

### Main user types

#### Guests
Guests do not have accounts.

They can:

- browse products
- view product details
- add products to cart
- proceed through checkout
- complete payment

#### Managers
Managers are authenticated back-office users.

They can:

- manage products
- manage product stock
- manage shipping-related data
- view and manage orders/sales data depending on final implementation scope

#### Admins
Admins are authenticated back-office users with full access.

They can do everything managers can, plus:

- manage admin/manager users
- manage all store configuration and operational data

---

## Core Domain Model

### StoreConfig
A lightweight store-wide configuration entity.

Purpose:

- store name
- store branding data
- contact details
- general shop-level text/content
- homepage/shop-wide settings
- reusable site-wide configuration

This is **not** a multi-tenant shop model. It only represents the single store's global configuration.

### Product
Represents an item offered for sale.

Typical responsibilities:

- product identity
- name and description
- price
- stock quantity
- status
- media/images
- category association
- active/archive state

Important:

- `Product` does **not** store payment state
- stock changes only after confirmed payment

### Order
Represents a guest purchase attempt / purchase record.

Typical responsibilities:

- guest order details
- shipping/customer data
- total amount
- currency
- status
- timestamps

An order contains one or more order items.

### OrderItem
Represents one purchased product line inside an order.

Typical responsibilities:

- product reference or product snapshot data
- ordered quantity
- unit price at time of purchase
- subtotal

### Payment
Represents payment state and provider-related information.

Typical responsibilities:

- payment provider data
- payment intent / transaction reference
- payment status
- amount
- timestamps
- refund-related tracking if added

Important:

- payment state belongs here, not on `Product`
- successful payment confirmation drives stock updates and order finalization

---

## Initial Status Model

These are starting recommendations and can be refined later.

### Product status
- `DRAFT`
- `ACTIVE`
- `ARCHIVED`
- `OUT_OF_STOCK`

### Order status
- `PENDING`
- `PAID`
- `FAILED`
- `CANCELLED`
- `REFUNDED`
- `SHIPPED` *(optional later)*
- `DELIVERED` *(optional later)*

### Payment status
- `PENDING`
- `SUCCEEDED`
- `FAILED`
- `REFUNDED`
- `PARTIALLY_REFUNDED`

### User roles
- `ADMIN`
- `MANAGER`

---

## Frontend Scope

The frontend is intentionally simple and focused.

Initial public pages:

- homepage
- product detail page
- cart page
- checkout page
- payment page / payment step
- contact page
- FAQ page
- privacy policy page

Initial admin/back-office pages:

- admin/manager login
- product management
- sales/orders management
- user management for admins
- shipping-related management

Redux is intended only for cart persistence and refresh-safe cart behavior.

---

## Backend Scope

The backend will expose APIs for:

- public product retrieval
- product detail retrieval
- cart/checkout support
- order creation
- payment handling
- stock updates after successful payment
- admin/manager authentication
- product management
- order/sales management
- user management for admins
- store-wide configuration management

---

## Payment and Stock Rules

The initial rule set is:

1. guests can browse and prepare an order
2. payment is handled through a dedicated payment flow
3. successful payment confirmation updates the payment state
4. successful payment confirmation updates the order state
5. successful payment confirmation reduces product stock

This means:

- stock is **not** reduced when an item is only added to cart
- stock is **not** reduced before payment confirmation
- `Product` does **not** become `PAID`
- order/payment state is separate from product lifecycle state

---

## Data Deletion Strategy

Default deletion strategy should be soft-delete or inactive/archive behavior where appropriate.

Examples:

- products should usually be archived/inactivated instead of permanently removed
- historical order and payment data should be preserved

Hard delete should only be used where clearly safe and intentional.

---

## Proposed Technical Stack

### Backend
- Java 21
- Spring Boot 3.5.x
- Spring Web
- Spring Data JPA
- Spring Security
- Spring Scheduling
- Spring Boot Actuator
- PostgreSQL
- Flyway
- Hibernate / JPA
- Jakarta Validation
- MapStruct
- Lombok
- Stripe integration

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- DaisyUI
- Axios
- Redux Toolkit
- Redux Persist *(if kept for cart persistence)*
- Stripe frontend integration

### Infrastructure
- Docker
- Docker Compose
- GitHub Actions
- Nginx
- Linux VM deployment
- Prometheus / Grafana *(optional from early stage depending on rollout timing)*

---

## Suggested Initial Branch Plan

### Branch 0 - foundation
Purpose:

- define scope
- lock architecture decisions
- prepare repo documentation

### Branch 1 - backend bootstrap
Purpose:

- generate backend project
- install backend dependencies
- establish package structure
- add configuration skeleton

### Branch 2 - frontend bootstrap
Purpose:

- generate frontend project
- install frontend dependencies
- establish folder structure
- add shared layout and state skeleton

Later branches should focus on one meaningful implementation area at a time.

---

## Initial Non-Goals

The first version does not aim to include:

- multi-tenant support
- guest/customer user accounts
- marketplace behavior
- complex payout logic
- advanced coupon engine
- wishlist/review systems
- unnecessary domain complexity from the previous tour platform

---

## Working Principle For Future Tasks

Implementation should happen in focused branches with clearly bounded scope.

Before building each feature branch:

1. define exact scope
2. confirm affected domain areas
3. confirm whether migration/schema changes are needed
4. implement backend foundation first where required
5. implement frontend on top of stable backend contracts
6. keep main branch summaries simple and high-level

---

## Summary

This project is a clean, fresh, single-shop e-commerce foundation with:

- one storefront
- guest checkout
- admin and manager back-office users
- product/order/payment separation
- stock updates only after successful payment
- reusable store configuration through `StoreConfig`

It is intentionally designed to stay lean, focused, and easy to extend without carrying over unnecessary complexity from the previous multi-tenant tour platform.
