# HireOrbit — Job Portal

Professional end-to-end job posting platform with client, admin, and API.

## Structure

- `client` — public frontend (seekers & employers)
- `admin` — admin dashboard
- `server` — Express + MySQL API + OpenAI

## Prerequisites

- Node.js 18+
- MySQL running locally (XAMPP / MySQL Server)
- Database password is already set in `server/.env`

## Setup

### 1) Database

Start MySQL, then from `server`:

```bash
cd server
npm install
npm run seed
npm run dev
```

API: http://localhost:5000

### 2) Client

```bash
cd client
npm install
npm run dev
```

App: http://localhost:5173

### 3) Admin

```bash
cd admin
npm install
npm run dev
```

Admin: http://localhost:5174

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jobportal.com | Admin@123 |
| Employer | employer@nova.com | Employer@123 |
| Seeker | seeker@mail.com | Seeker@123 |

## Features

- Auth (seeker / employer / admin)
- Job browse, search, filters, save
- Apply with resume + AI cover letter assist
- Employer job posting + AI description generator
- Admin moderation for users, jobs, applications
