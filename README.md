# WRFITTZ Atelier · Capsule 2026
> Contemporary Luxury Streetwear & High-End E-Commerce Platform engineered with Next.js 16, React 19, and Supabase.

---

## ✨ Overview

**WRFITTZ Atelier** is an ultra-modern, editorial e-commerce platform crafted for high-end fashion and streetwear connoisseurs. Designed with an aesthetic of quiet luxury, tactile minimalism, and rapid performance, it features a full storefront, responsive interactive hero visuals, customer self-service accounts, seamless checkout, and a confidential **Owner-Only White Executive Operations Dashboard**.

---

## 🚀 Key Highlights & Architecture

### 1. Editorial 4K Hero Experience
* **Cinematic Framing**: Tack-sharp 4K campaign imagery featuring male and female models with pristine headroom and uncropped expressions.
* **Framer Motion Parallax**: Micro-smooth depth shifts on scroll, interactive garment hotspots, and fluid typography.
* **Zero Telemetry Clutter**: Distraction-free luxury framing with clean call-to-actions.

### 2. Confidential White Executive Admin Suite (`/admin`)
* **Strict Owner Security Gate**: Completely hidden from public storefront navigation (no links or buttons visible to visitors).
* **PIN Authentication**: Protected by the Owner Gate (`x-admin-token` / `ADMIN_SECRET_KEY`) to prevent unauthorized access.
* **Customer Dossier & Logistics Tracking**: Real-time order monitoring with full customer delivery address, phone number, direct WhatsApp dispatch link, and Bangalore delivery verification.
* **Live Catalog & Product Studio**:
  - Image uploader (drag & drop / file picker / preview).
  - Product renaming and price editing.
  - Interactive Size Chips manager (`XS`, `S`, `M`, `L`, `XL`, `XXL`).
  - Visual Hex Color picker & palette builder.
  - Stock toggle and instant storefront synchronization.

### 3. Storefront & Commerce Engine
* **Catalog & Filtering**: Real-time filtering by category, price, and instant search modal.
* **Product Dossier**: Multiple gallery angles, size selector with stock feedback, and direct add-to-cart/wishlist.
* **Seamless Checkout & Payment**: Integrated Cash on Delivery and digital payment workflow with dynamic order confirmation & printable receipts.
* **Customer Hub**: Account drawer with order history tracking and Bangalore express waybill status.

### 4. Supabase Dual-Store Persistence
* **Resilient Architecture**: Automatically synchronizes products and incoming orders with Supabase PostgreSQL tables.
* **Zero-Downtime Fallback**: Seamlessly falls back to local data store when offline or during network latency.

---

## 🛠️ Technology Stack

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
* **Frontend**: React 19, Vanilla CSS Design System with Glassmorphism
* **Motion & Interactions**: Framer Motion, Canvas Confetti, Lucide React
* **Persistence & Backend**: Supabase (PostgreSQL), Next.js Server Route Handlers
* **Code Quality & Security**: Audited with `security-review` and `plankton-code-quality` standards

---

## 🏁 Getting Started

### Prerequisites
* Node.js 18.18+ or 20+
* npm or pnpm

### 1. Installation
```bash
git clone https://github.com/sumitmishraa/wrffitzz.git
cd wrffitzz
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ADMIN_SECRET_KEY=wrfitzz@2026
```

*(Note: The platform is built with full fallback resilience and will function cleanly even without active Supabase credentials).*

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront.

### 4. Accessing the Admin Operations Suite
Navigate directly to [http://localhost:3000/admin](http://localhost:3000/admin) and authenticate using the Owner Key:
```
Default Key: wrfitzz@2026
```

---

## 🛡️ Security & Privacy Notice
* The `/admin` path is intentionally excluded from all public storefront headers, footers, and hero overlays.
* All data modification routes (`POST /api/products`, `DELETE /api/products`, `GET /api/orders`, `PATCH /api/orders`, `POST /api/upload`) reject unauthenticated requests with HTTP 401.

---

## 📦 Production Build
```bash
npm run build
npm run start
```

---

© 2026 WRFITTZ Atelier. All rights reserved.
