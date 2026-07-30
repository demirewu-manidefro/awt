# 🔐 Advanced Authentication System

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933.svg?logo=nodedotjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-336791.svg?logo=postgresql)

A robust, full-stack authentication system built with **React (Vite)** on the frontend and **Node.js/Express** with **PostgreSQL** on the backend. This project features secure JWT-based authentication, Google OAuth 2.0 integration, advanced session management (device tracking), and security best practices like rate limiting and password strength validation.

---

## ✨ Key Features

- **Standard Authentication**: Secure email/password registration and login.
- **Google OAuth 2.0**: Seamless single sign-on (SSO) with Google.
- **Advanced Session Management**:
  - Track active sessions across multiple devices.
  - View device and browser information (via `ua-parser-js`).
- **Security First**:
  - Password hashing with `bcryptjs`.
  - Password strength validation using `zxcvbn`.
  - API rate limiting & security headers (`express-rate-limit`, `helmet`).
  - Secure Cookie handling & JWT Tokens.
- **Modern Frontend**: Built with React 19, Vite, and styled for a seamless user experience. Includes `react-hot-toast` for notifications and `lucide-react` for beautiful iconography.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: React 19 (Vite)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons & UI**: Lucide React, React Hot Toast
- **Linting**: Oxlint

### Backend (API)
- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL (`pg`)
- **Authentication**: Passport.js (Google OAuth20), JSON Web Tokens (JWT)
- **Security**: Helmet, Express Rate Limit, Bcrypt.js, Zxcvbn

---

## 📂 Project Structure

```text
challenge222/
├── backend/                  # Node.js / Express API
│   ├── config/               # DB and Passport configurations
│   ├── controllers/          # Route logic and handlers
│   ├── middleware/           # Rate limiters, Auth guards
│   ├── models/               # PostgreSQL Database models
│   ├── routes/               # Express route definitions
│   ├── utils/                # Helper functions (e.g., JWT signing)
│   └── index.js              # Entry point for backend
│
└── frontend/                 # React / Vite Client
    ├── public/               # Static assets
    ├── src/
    │   ├── components/       # Reusable React components (e.g., ProtectedRoute)
    │   ├── context/          # React Context (AuthContext)
    │   ├── pages/            # Application views (Login, Register, Dashboard)
    │   └── App.jsx           # Main React component
    └── vite.config.js        # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) database

### 1. Clone the repository

```bash
git clone <repository-url>
cd challenge222
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory based on the following template:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=auth_db
DB_PASSWORD=your_password
DB_PORT=5432

# Security & Sessions
SESSION_SECRET=your_super_secret_session_key
JWT_SECRET=your_super_secret_jwt_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Initialize the database (if applicable):
```bash
npm run db:init
```

Start the backend development server:
```bash
npm run dev
```
The API will run on `http://localhost:5000`.

### 3. Frontend Setup

Open a new terminal window, navigate to the frontend directory, and install dependencies:

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory (if needed):
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## 📡 API Endpoints Summary

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login via email/password
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout user

### Session Routes (`/api/sessions`)
- `GET /api/sessions` - Retrieve all active sessions for the user
- `DELETE /api/sessions/:id` - Revoke a specific session

---

## 📄 License

This project is licensed under the ISC License.
