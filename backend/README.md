# Backend - EduManage API

## Scripts

- `npm run dev` - start dev server with hot reload
- `npm run build` - compile TypeScript
- `npm start` - run compiled app
- `npm run seed` - load dummy data

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `FRONTEND_URL`
- `FRONTEND_URLS` (comma-separated allowlist, recommended for Vercel preview + production domains)

## API Base

`/api/v1`

## Modules

- Auth
- Principal
- Teacher
- Student
- Notifications

## Security

- Helmet
- CORS
- Rate limiting
- JWT auth and RBAC middleware
- Input validation with Zod
- Centralized error handling
