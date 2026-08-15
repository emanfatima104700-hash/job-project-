# HireOrbit — Job Portal

Full-stack job posting platform: client, admin, and API.

## Apps

- `client` — public job board (seekers & employers)
- `admin` — admin dashboard
- `server` — Express API + Supabase Postgres + OpenAI

## Local run

```bash
# server
cd server
npm install
npm run seed
npm run dev

# client
cd client
npm install
npm run dev

# admin
cd admin
npm install
npm run dev
```

## Demo logins (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jobportal.com | Admin@123 |
| Employer | employer@nova.com | Employer@123 |
| Seeker | seeker@mail.com | Seeker@123 |

## Deploy notes

- Server: Vercel (serverless) with `DATABASE_URL` = Supabase **pooler** URI
- Client / Admin: Vercel with `VITE_API_URL` pointing to live API `/api`
- Never commit `.env` files
