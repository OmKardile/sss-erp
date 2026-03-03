# SSShopee - ERP System

A full-stack modern ERP/Dashboard application built perfectly for single shop management. It tracks Income, Expenses, Inventory/Products, Purchases, and Udhar (Credit) Ledgers. 

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS (v4), Recharts for graphs, Lucide React for modern icons.
- **Backend**: Node.js, Express, pg (PostgreSQL driver).
- **Database**: PostgreSQL (Recommended: Neon)
- **Authentication**: JWT based authentication with bcrypt password hashing.

---

## 🚀 Local Development Guide

### 1. Prerequisites
- Node.js (v18+)
- A local PostgreSQL instance OR a free cloud Postgres database from [Neon.tech](https://neon.tech/)

### 2. Installation
Clone the project or open the folder, then run:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root folder. You can use `.env.example` as a template. Make sure you define your `DATABASE_URL`!

**.env example:**
```env
# Server Port
PORT=3000

# Secret used to sign JWT Tokens
JWT_SECRET=supersecretkey

# PostgreSQL Connection String
DATABASE_URL=postgresql://username:password@localhost:5432/erp
# OR using Neon: DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

### 4. Start Development Server
```bash
npm run dev
```
The server will automatically connect to your PostgreSQL database, generate all tables if they don't exist, and seed a default Admin user.

**Default Login:**
- Username: `admin`
- Password: `admin123`

---

## 🌍 Free Deployment Guide (Render + Neon Postgres)

To get this app online for free without credit card requirements, we'll split the layers:
1. **[Neon.tech](https://neon.tech/)** - For a permanent, free PostgreSQL database.
2. **[Render.com](https://render.com/)** - For free web hosting.

### Step 1: Set up the Database (Neon)
1. Go to [Neon.tech](https://neon.tech/) and sign up.
2. Create a new Free Project.
3. From the dashboard, look for your **Connection String** (it starts with `postgresql://...`). Copy this securely.

### Step 2: Push your code to GitHub
1. Log into your GitHub account and create a new Repository.
2. Open your terminal in the `SSShopee` folder:
```bash
git add .
git commit -m "Prep for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 3: Deploy Web Service (Render)
1. Go to [Render.com](https://render.com/) and create a free account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your new `SSShopee` repository.
4. Apply the following configurations:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run dev`
5. At the bottom, click on **Advanced** -> **Add Environment Variables** and add:
   - **Key:** `JWT_SECRET` | **Value:** `(A strong random string)`
   - **Key:** `DATABASE_URL` | **Value:** `(Your Neon Connection String here)`
6. Click **Create Web Service**. 

Wait around 3-5 minutes for Render to install the dependencies, build Vite, and launch the server. Once the status shows "Live", use the provided Render URL to access your application securely 24/7!
