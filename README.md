# Jumpstart

Jumpstart is a MERN-based web application for assessment-driven student workflows, role-based access, and result management.  
It includes a React frontend, Node/Express API, MongoDB persistence, and admin review tools.

## Live Demo

- Frontend: `https://your-frontend-domain.vercel.app`
- API: `https://your-api-domain.vercel.app` or your Node host

## Tech Stack

- MongoDB Atlas for database storage
- Express.js for the backend API
- React + Vite for the frontend
- Node.js for the server runtime
- Tailwind CSS for UI styling
- JWT-based authentication with Google Sign-In support
- Vercel for frontend deployment

## Features

- Role-based authentication and access control
  Student, Teacher-ready workflow, and Admin routing/access patterns
- Assessment and registration workflows
  Test selection, section-wise progress, result review, and submission tracking
- Admin operations
  Submission review, result approval/publishing, user management, and analytics screens
- Payment-ready flow
  Purchase flow architecture is present and can be wired to Razorpay
- Email notification-ready architecture
  Environment section includes the expected config surface for future notification wiring
- Reporting
  Section-wise and subsection-wise score breakdowns, report history, and published results

## Folder Structure

```text
jumpstart/
├── frontend/                 # React + Vite client app
│   ├── public/               # Static assets and downloadable templates
│   └── src/
│       ├── api/              # API helpers
│       ├── assets/           # Images and static UI assets
│       ├── components/       # Reusable UI components
│       ├── config/           # Frontend config/env access
│       ├── context/          # Auth and shared state
│       ├── data/             # UI adapters and static data helpers
│       ├── layout/           # Shared layout wrappers
│       └── pages/            # User and admin pages
├── backend/                  # Node + Express API
│   ├── config/               # Seed/config files
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Auth and request middleware
│   ├── models/               # Mongoose models
│   ├── reference/            # Backend scoring/reference source assets
│   ├── routes/               # API routes
│   ├── scripts/              # Seed, scoring, and maintenance scripts
│   └── utils/                # Shared backend utilities
└── docs/
    └── design/               # Design-source references
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas connection string or local MongoDB

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd jumpstart
```

### 2. Install dependencies

```bash
cd frontend
npm install

cd ..\backend
npm install
```

### 3. Configure environment files

Create these files from the examples:

- `frontend/.env`
- `backend/.env`

### 4. Start the backend

```bash
cd backend
npm run dev
```

### 5. Start the frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

### 6. Open the app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## Environment Variables

### Frontend

- `VITE_API_URL`
  Base URL for the backend API used by the React app.
- `VITE_GOOGLE_CLIENT_ID`
  Google OAuth client ID used for Google Sign-In on the frontend.

### Backend

- `PORT`
  Port used by the Express server.
- `MONGODB_URI`
  MongoDB connection string for local MongoDB or MongoDB Atlas.
- `JWT_SECRET`
  Secret used to sign and verify JWT tokens.
- `GOOGLE_CLIENT_ID`
  Google OAuth client ID used to validate Google login tokens on the backend.
- `ADMIN_NAME`
  Default seeded admin display name.
- `ADMIN_EMAIL`
  Default seeded admin login email.
- `ADMIN_PASSWORD`
  Default seeded admin password for local setup.

### Optional Integration Variables

Add these only if you enable the related integrations:

- `RAZORPAY_KEY_ID`
  Razorpay public key for payment initialization.
- `RAZORPAY_KEY_SECRET`
  Razorpay secret used to verify payment requests on the backend.
- `SMTP_HOST`
  SMTP server host for email delivery.
- `SMTP_PORT`
  SMTP server port.
- `SMTP_USER`
  SMTP username or sender account.
- `SMTP_PASS`
  SMTP password or app password.
- `EMAIL_FROM`
  Default sender address for outbound notifications.

## Scripts

### Frontend

- `npm run dev`
  Start the Vite development server.
- `npm run build`
  Build the frontend for production.
- `npm run preview`
  Preview the production build locally.
- `npm run lint`
  Run ESLint on the frontend codebase.

### Backend

- `npm run dev`
  Start the backend server.
- `npm run dev:watch`
  Start the backend with Node watch mode.
- `npm run start`
  Start the backend in standard runtime mode.
- `npm run db:up`
  Start MongoDB through Docker Compose.
- `npm run db:down`
  Stop Docker Compose services.
- `npm run db:logs`
  Stream MongoDB container logs.
- `npm run seed:assessment`
  Seed assessment configuration into the database.
- `npm run seed:admin`
  Seed or update the admin account.
- `npm run generate:assessment-500`
  Regenerate the 500-question assessment package config.
- `npm run enrich:personality-csv`
  Enrich personality CSV metadata.
- `npm run smoke:career-500q`
  Run a smoke test for the 500-question scoring flow.

## Screenshots

Replace these placeholders with actual product screenshots.

### Student Dashboard

`docs/screenshots/student-dashboard.png`

### Results Page

`docs/screenshots/results-page.png`

### Admin Review Panel

`docs/screenshots/admin-review.png`

### Payment Flow

`docs/screenshots/payment-flow.png`

## Future Improvements

- Add automated backend and frontend test coverage
- Wire production payment handling with Razorpay webhooks
- Add transactional email notifications
- Improve frontend chunk splitting for smaller production bundles
- Add CI/CD validation for lint, build, and smoke scripts

## License

This project is licensed under the MIT License. Update this section if your repository uses a different license.
