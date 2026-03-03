# SSShopee Documentation

Welcome to the comprehensive documentation for the **SSShopee** ERP system. This guide covers local setup, cloud deployment, system architecture, database design, and advanced conversion strategies towards offline, mobile, and desktop formats.

---

## 📖 Table of Contents
1. [Installation & Local Setup](#1-installation--local-setup)
2. [Deployment Guide](#2-deployment-guide)
3. [System Architecture & Working Mechanics](#3-system-architecture--working-mechanics)
4. [Converting to Offline / Desktop / Mobile Apps](#4-converting-to-offline--desktop--mobile-apps)

---

## 1. Installation & Local Setup

### Prerequisites
- Node.js (v18 or higher)
- A local PostgreSQL instance OR a free cloud Postgres database from [Neon.tech](https://neon.tech/)

### Environment Configuration
The application relies heavily on environment variables for sensitive connections. Create a `.env` file in the root directory.

```env
# The port where your Express server runs
PORT=3000

# Secret used to sign JWT Tokens
JWT_SECRET=supersecretkey_change_me_in_production

# PostgreSQL Connection String
DATABASE_URL=postgresql://username:password@localhost:5432/erp
# If using a cloud provider like Neon: 
# DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

### Running the App
```bash
npm install
npm run dev
```

Upon first boot, the system connects to PostgreSQL automatically and generates all necessary tables via `db.ts`. 

**Default Administrator Account:**
- **Username:** `admin`
- **Password:** `admin123`

---

## 2. Deployment Guide

The optimal path for free deployment utilizes **Render.com** (Hosting) and **Neon.tech** (Database).

### Step 1: Set up the Database (Neon)
1. Sign up on [Neon.tech](https://neon.tech/).
2. Create a new Free Project.
3. Locate your **Connection String** from the dashboard (`postgresql://...`).

### Step 2: Push code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 3: Deploy Web Service (Render)
1. Register on [Render.com](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub account and select your repository.
4. **Configuration:**
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run dev` (or `node server.js` if compiled to standard Node format).
5. **Environment Variables:** Add `JWT_SECRET` and `DATABASE_URL` under the Advanced settings.
6. Click **Create Web Service**. 

*Note: Render’s internal Postgres deletes itself after 90 days on the free tier. Utilizing Neon ensures your data persists permanently.*

---

## 3. System Architecture & Working Mechanics

### Overview
SSShopee is a monolithic application utilizing the PERN stack (PostgreSQL, Express, React, Node.js). 
- **Frontend**: A Single Page Application (SPA) built with React and Vite. Requests are authenticated using JWTs stored securely on the client side.
- **Backend**: Express APIs manage routing and act as the middle layer to run async queries through the `pg` driver against PostgreSQL.
- **Database (`src/server/db.ts`)**: Initialized automatically. Contains tables dynamically verified and structured via `CREATE TABLE IF NOT EXISTS` clauses on boot.

### Database Design details
- **Owner**: Admin user credentials.
- **Products & Categories**: Relational linking for robust inventory tracking.
- **DailyIncome & Expenses**: Simplistic double-entry ledgers for tracking daily cash flow.
- **PurchaseSpend**: Logging wholesale spends to calculate overall monthly/yearly profit margins.
- **UdharLedger & UdharPayments**: A parent-child relationship tracking the total credit loop of specific customers and their staggered repayment history.

---

## 4. Converting to Offline / Desktop / Mobile Apps

SSShopee currently relies on an active PostgreSQL backend. To transition the application into a pure offline, mobile, or standalone desktop application, significant structural shifts in how data is stored must occur:

### Strategy 1: Data Storage via `localStorage` or `IndexedDB` (Offline Web App)
To allow the app to work entirely offline in the browser without an active Express server:
1. **Remove PostgreSQL / Express**: Eliminate the backend APIs.
2. **Transition to IndexedDB API**: Instead of `fetch` calls to `/api/products`, the React frontend should read and write directly to the browser's persistent `IndexedDB` (using simple wrapper libraries like `dexie.js` or `localforage`).
   - *LocalStorage* has a 5MB hardware limit and is synchronous (blocking the UI), making `IndexedDB` the required method for heavy ERP data.
3. **PWA (Progressive Web App)**: By introducing a `service-worker.js` file to cache HTML, JavaScript, and CSS assets, the application can be installed on Windows/Android directly from the browser window and opened without an internet connection.

### Strategy 2: Converting to a Native Mobile App (React Native / Capacitor)
To deploy an installable `.apk` or `.ipa` to the App Store or Google Play:
1. **Option A (CapacitorJS / Ionic)**: Wrap the existing React Vite codebase in Capacitor. It translates the SPA into an embedded WebView inside a native mobile wrapper. If utilizing `IndexedDB` as mentioned above, the app will run entirely natively and offline.
2. **Option B (React Native + SQLite)**: Rebuild the UI components utilizing `react-native` primitives (`<View>`, `<Text>`). Switch the DB from PostgreSQL back to a localized mobile SQLite engine (`react-native-sqlite-storage`) keeping all shop data strictly constrained precisely to the phone's internal memory.

### Strategy 3: Converting to a Desktop App (Electron.js / Tauri)
To construct a `.exe` or `.dmg` for Windows/Mac:
1. Wrap the Vite application utilizing **Electron.js** or **Tauri** (which is rust-based, lighter). 
2. Within an Electron environment, the application possesses full access to the local machine's file system, meaning you can confidently switch back to `better-sqlite3`. 
3. The Express API logic and SQLite engine run entirely internally within the `.exe` package via Electron's Main process, while the React UI renders securely in the Renderer process. 

### Remote Syncing / Caching Architecture
If an offline-first app that *eventually* syncs to the cloud is required (such as syncing shop data to a cloud PostgreSQL server once internet connectivity is restored):
- Use robust state-syncing frameworks like **WatermelonDB** or **RxDB**.
- These local-first databases maintain exact query logs and push batched synchronizations asynchronously whenever the device reconnects to Wi-Fi.
