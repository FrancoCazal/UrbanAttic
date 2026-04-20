# Urban Attic — Ecommerce Platform

Full-stack ecommerce platform built with Django REST Framework and React, showcased with the Urban Attic streetwear brand.

![Python](https://img.shields.io/badge/python-3.12-blue)
![Django](https://img.shields.io/badge/django-5.x-green)
![DRF](https://img.shields.io/badge/DRF-3.14+-blue)
![React](https://img.shields.io/badge/react-18-61DAFB)
![Tests](https://img.shields.io/badge/tests-93%20passed-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-84%25-brightgreen)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-blue)

### [Live Demo](https://urbanattic.vercel.app)

---

## Overview

A production-ready ecommerce system featuring JWT authentication via HttpOnly cookies, a Redis-backed shopping cart, Stripe Checkout integration, async order processing with Celery, transactional email via SendGrid, and a brutalist-inspired frontend design system ("Concrete Gallery").

### Key Features

- **JWT Auth with HttpOnly Cookies** — Secure token storage, refresh rotation, blacklisting
- **Email Verification (hard blocking)** — Registration requires email confirmation via signed token; login returns 403 until verified
- **Password Reset Flow** — Signed tokens with 1h expiry, non-enumerable endpoints
- **Product Catalog** — Variants (size/color), multiple images, category tree, filtering, search, pagination
- **Redis Shopping Cart** — Fast cart operations with 7-day TTL, variant-based items
- **Wishlist** — Per-user favorites with toggle endpoint, heart button on ProductCard
- **Stripe Checkout** — Hosted payment page, webhook verification, retry payment flow
- **Async Processing** — Celery tasks for order confirmation, email verification, password reset
- **Transactional Email** — SendGrid via django-anymail (HTTP API)
- **S3 Media Storage** — Product images served from AWS S3
- **Health Check Endpoint** — `GET /api/v1/health/` with DB + Redis connectivity probes
- **Security Headers** — CSP (Stripe-safe), HSTS, X-Frame-Options, Referrer-Policy
- **CI/CD** — GitHub Actions running backend tests (with PostgreSQL service container) and frontend typecheck + build on every PR
- **API Documentation** — Auto-generated OpenAPI/Swagger via drf-spectacular
- **Brutalist Design System** — Custom "Concrete Gallery" design with Space Grotesk + Manrope typography, 0px border-radius, industrial aesthetic

---

## Architecture

```
React SPA (Vite + TypeScript)
    |
    | Vercel (proxy /api → Railway)
    v
Django REST Framework (Railway)
    |
    |--- PostgreSQL (Railway)
    |       Users, Products, Variants, Images, Orders, WishlistItems
    |
    |--- Redis (Railway)
    |       Cart data (per-user hash, TTL 7d)
    |       Celery broker + result backend
    |
    |--- Celery Workers (Railway — separate service)
    |       send_order_confirmation_email
    |       send_verification_email
    |       send_password_reset_email
    |
    |--- External Services
            Stripe API (Checkout Sessions + Webhooks)
            SendGrid API (Transactional email via django-anymail)
            AWS S3 (Product images)
```

### Checkout Flow

```
1. User adds variant to cart (Redis)
2. User fills shipping address → POST /api/v1/orders/
3. Backend: atomic transaction (validate stock → create order → decrement stock → clear cart)
4. Backend: create Stripe Checkout Session → return checkout_url
5. Frontend: redirect to Stripe hosted checkout
6. User pays with card
7. Stripe webhook → backend updates order to PROCESSING → sends confirmation email
```

---

## Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| Django 5.x | Web framework |
| Django REST Framework | API toolkit |
| PostgreSQL | Primary database |
| Redis | Cart storage + Celery broker |
| Celery | Async task processing |
| Stripe | Payment processing |
| SimpleJWT | JWT authentication |
| drf-spectacular | OpenAPI documentation |
| django-storages + boto3 | AWS S3 media storage |
| django-anymail[sendgrid] | Transactional email via SendGrid HTTP API |
| django-csp | Content Security Policy middleware |
| Gunicorn | Production WSGI server |
| Whitenoise | Static file serving |

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI library |
| TypeScript | Type safety |
| Vite | Build tool |
| TanStack Query v5 | Server state management |
| React Router v7 | Routing |
| React Hook Form + Zod | Form validation |
| Tailwind CSS 3 | Styling |
| Radix UI | Accessible primitives |
| Axios | HTTP client |
| Sonner | Toast notifications |
| Space Grotesk + Manrope | Typography |

### Infrastructure

| Technology | Purpose |
|---|---|
| Railway | Backend hosting (Django + PostgreSQL + Redis + Celery worker) |
| Vercel | Frontend hosting + API proxy |
| AWS S3 | Media file storage |
| SendGrid | Transactional email delivery |
| GitHub Actions | CI pipeline (tests + typecheck + build on every PR) |
| Docker | Local development |
| pytest + factory-boy | Testing (93 tests, 84% coverage) |

---

## API Endpoints

```
/api/v1/
├── health/                         GET     DB + Redis health probe
│
├── auth/
│   ├── register/                   POST    User registration (dispatches verification email)
│   ├── login/                      POST    JWT login (sets HttpOnly cookies; 403 if unverified)
│   ├── refresh/                    POST    Refresh access token
│   ├── logout/                     POST    Blacklist token + clear cookies
│   ├── me/                         GET/PATCH  User profile
│   ├── verify-email/               POST    Confirm email with signed token
│   ├── resend-verification/        POST    Re-send verification email (by email)
│   ├── password-reset-request/     POST    Request password reset (non-enumerable)
│   └── password-reset-confirm/     POST    Set new password with signed token
│
├── categories/                     GET     List active categories
│   └── tree/                       GET     Nested category tree
│
├── products/
│   ├── /                           GET     List (paginated, filterable, searchable, ordered)
│   ├── /{slug}/                    GET     Detail with variants & images
│   ├── /                           POST    Create (admin only)
│   ├── /{slug}/                    PATCH   Update (admin only)
│   └── /{slug}/                    DELETE  Soft-delete (admin only)
│
├── cart/
│   ├── /                           GET     Get cart details
│   ├── /add/                       POST    Add variant to cart
│   ├── /update/{variant_id}/       PATCH   Update quantity
│   ├── /remove/{variant_id}/       DELETE  Remove item
│   └── /clear/                     DELETE  Clear cart
│
├── orders/
│   ├── /                           GET     List user's orders (ordered)
│   ├── /                           POST    Create order from cart + Stripe session
│   ├── /{id}/                      GET     Order detail
│   ├── /{id}/cancel/               POST    Cancel pending order (restores stock)
│   ├── /{id}/checkout-session/     POST    Retry payment for pending order
│   └── webhook/stripe/             POST    Stripe webhook handler
│
├── wishlist/
│   ├── /                           GET     List user's wishlist items
│   └── /toggle/{slug}/             POST    Add product if absent, remove if present
│
├── schema/                         GET     OpenAPI schema
├── docs/                           GET     Swagger UI
└── redoc/                          GET     ReDoc
```

### Filtering & Search (Products)

| Parameter | Example |
|---|---|
| `search` | `?search=hoodie` |
| `category` | `?category=t-shirts` (includes descendants) |
| `min_price` | `?min_price=10` |
| `max_price` | `?max_price=30` |
| `ordering` | `?ordering=-created_at,name` |

---

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Stripe account ([dashboard.stripe.com](https://dashboard.stripe.com)) for payment testing

### Setup

```bash
# Clone the repository
git clone https://github.com/FrancoCazal/UrbanAttic.git
cd UrbanAttic

# Configure environment variables
cp backend/.env.example backend/.env.docker
# Edit backend/.env.docker with your Stripe test keys

# Start all services
docker compose up --build

# In a new terminal: run migrations and seed data
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed
```

### Access

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/api/docs/ |
| ReDoc | http://localhost:8000/api/redoc/ |

### Demo Accounts (created by seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@urbanattic.com | admin1234 |
| User | demo@urbanattic.com | demo1234 |

### Testing Stripe Payments

```bash
# Install Stripe CLI: https://docs.stripe.com/stripe-cli
stripe login
stripe listen --forward-to localhost:8000/api/v1/orders/webhook/stripe/
# Copy the whsec_... secret to your .env as STRIPE_WEBHOOK_SECRET

# Use test card: 4242 4242 4242 4242 (any future expiry, any CVC)
```

---

## Running Tests

```bash
# Local (requires PostgreSQL + Redis running)
cd backend
pytest

# Docker
docker compose exec backend pytest
```

**Results:** 93 tests, 84% coverage (runs on every PR via GitHub Actions with `--cov-fail-under=80`)

| Module | Coverage |
|---|---|
| Users (models + API + auth flows) | 88-100% |
| Products (models + API) | 73-100% |
| Cart (services + API) | 57-100% |
| Orders (models + services + API) | 67-100% |
| Wishlist (models + API) | 91-100% |
| Core (health check) | 100% |

---

## Product Catalog

15 products across 3 root categories, seeded with the `python manage.py seed` command:

**Men:** T-Shirts, Pants, Jackets — Oversized Tee "Street Vibes", Jogger "Flex Street", Short Jacket "Urban Cold", etc.

**Women:** Tops, Dresses, Skirts — Crop Top "Wave", Mom Jeans "Retro Fit", Denim Jacket "Skyline", etc.

**Unisex:** Accessories, Backpacks, Jeans — Snapback Cap, Fanny Pack, Backpack, Belt, Socks.

Each product has multiple variants (size + color combinations) with individual SKUs, prices, stock, and images.

---

## Project Structure

```
UrbanAttic/
├── .github/
│   └── workflows/
│       └── ci.yml          # Backend tests + frontend typecheck + build
├── backend/
│   ├── apps/
│   │   ├── core/           # Base model, seed command, health check
│   │   ├── users/          # Custom user, JWT auth, email verification, password reset, tasks
│   │   ├── products/       # Categories, products, variants, images
│   │   ├── cart/           # Redis-backed cart service
│   │   ├── orders/         # Orders, checkout, Stripe, Celery tasks
│   │   └── wishlist/       # Per-user favorites (toggle + list)
│   ├── config/
│   │   ├── settings/       # base, local, production (CSP, HSTS, security headers)
│   │   ├── urls.py
│   │   └── celery.py
│   ├── Dockerfile
│   ├── .coveragerc
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client with JWT refresh interceptor
│   │   ├── components/
│   │   │   ├── auth/       # ProtectedRoute, EmailVerificationBanner
│   │   │   ├── layout/     # Navbar (dark), Footer (4-col), Layout
│   │   │   ├── products/   # ProductCard, ProductGrid, ProductFilters, WishlistButton
│   │   │   ├── cart/       # CartItem, CartSummary ("DAMAGE")
│   │   │   ├── orders/     # OrderStatusBadge, OrderItemsTable
│   │   │   └── ui/         # Radix-based components (brutalist styled)
│   │   ├── hooks/          # React Query hooks (useProducts, useCart, useAuth, useOrders, useWishlist)
│   │   ├── lib/            # Types, utils (cn, formatCurrency, formatDate)
│   │   └── pages/          # HomePage, ProductsPage, CartPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage, WishlistPage, etc.
│   ├── vercel.json         # API proxy rewrites + SPA fallback
│   └── package.json
├── docs/
│   └── development/        # Planning docs, status tracking
├── docker-compose.yml
└── README.md
```

---

## Design Decisions

### Why HttpOnly Cookies for JWT?

Storing tokens in `localStorage` is vulnerable to XSS attacks. HttpOnly cookies are inaccessible to JavaScript, providing better security. A custom middleware reads the cookie and injects the `Authorization` header so SimpleJWT works transparently.

### Why Redis for Cart?

Cart data is ephemeral and accessed frequently. Redis provides sub-millisecond operations and built-in TTL expiration. Each user's cart is a Redis hash (`cart:user:{id}`) where fields are variant IDs and values are quantities.

### Why Stripe Checkout (Hosted) Instead of Elements?

Stripe's hosted checkout page handles all PCI compliance, 3D Secure, and payment methods. No card data touches our server. Simpler to implement and maintain than embedded Elements, with the same security guarantees.

### Why Create Order Before Payment?

Stock is decremented atomically at order creation (inside `transaction.atomic()` with `select_for_update()`). This prevents overselling even under concurrent requests. The order starts as PENDING and transitions to PROCESSING only after Stripe webhook confirms payment.

### Why `TimestampSigner` for Verification and Reset Tokens?

Instead of storing one-time tokens in the database, the email verification and password reset flows use Django's built-in `TimestampSigner` with a scoped salt per flow (`urbanattic.email-verification`, `urbanattic.password-reset`). The token is a signed payload of the user ID with an embedded timestamp. Verification reads the token, validates the signature against `SECRET_KEY`, and enforces a `max_age` (24h for verification, 1h for reset). No database table, no cleanup job, no token collision risk — and tokens become invalid automatically when `SECRET_KEY` rotates.

### Why "Concrete Gallery" Design?

The frontend uses a custom brutalist design system that fuses skate culture rawness with gallery-like refinement. Key principles: 0px border-radius everywhere, 2px structural borders, Space Grotesk for headlines (uppercase, tight tracking), warm cream backgrounds, and surgical use of red accents. The design was prototyped in Google Stitch and implemented in React + Tailwind.

---

## License

MIT
