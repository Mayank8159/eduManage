# EduManage - School Management System (Production-Level MERN)

A full-stack School Management System with role-based access for Principal, Teacher, and Student.

## Tech Stack

- Frontend: Next.js 16 (App Router), TypeScript, Tailwind CSS, Recharts
- Backend: Node.js, Express.js, TypeScript, MongoDB, Mongoose
- Auth: JWT access token + refresh token lifecycle
- DevOps: Docker, docker-compose, GitHub Actions CI, Render/Vercel deployment guidance

## Project Structure

```text
eduManage/
  frontend/
    app/
    components/
    lib/
    Dockerfile
  backend/
    src/
      config/
      constants/
      middleware/
      models/
      routes/
      services/
      seed/
      utils/
    postman/
    Dockerfile
    render.yaml
  .github/workflows/ci.yml
  docker-compose.yml
```

## Core Features Delivered

### RBAC Roles
- Principal (Admin)
- Teacher
- Student

### Principal Dashboard
- View teachers/students with search and pagination API
- Teacher activity log monitoring
- Teacher performance analytics:
  - Attendance tracking volume
  - Class completion rate
  - Student feedback score
  - Weighted performance score
- Weekly/Monthly report generation
- Teacher class assignment and approval workflows
- Chart-based KPI visualization

### Teacher Dashboard
- View assigned classes and student lists
- Upload attendance and marks
- Simulate student performance prediction (AI-style logic)
- Action logging for principal oversight

### Student Dashboard
- View marks, attendance, and feedback
- View predicted performance status:
  - At risk
  - Needs improvement
  - Excellent
- Notification polling
- Chart-based performance view

### Advanced Modules
- Teacher activity tracking system (`ActivityLog`)
- Performance scoring algorithm (`src/utils/scoring.ts`)
- Student simulation module (`simulateStudentInsights`)
- Notification system with polling support
- Query search/filter and pagination on list APIs

## Authentication and Security

- Register/Login/Refresh/Logout APIs
- Access token validation middleware
- Role authorization middleware
- Helmet, CORS, rate-limit, compression, centralized error handling
- Environment variable validation at startup

## Database Schemas

Implemented with Mongoose models:
- Users
- TeacherProfile
- StudentProfile
- Class
- Attendance
- Mark
- Feedback
- ActivityLog
- Notification
- RefreshToken

## Local Setup (No Docker)

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### 3. Seed Dummy Data

```bash
cd backend
npm run seed
```

Demo credentials (all use Password@123):
- Principal: principal@school.com
- Teacher: teacher1@school.com
- Student: student1@school.com

## Docker Setup

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

## API Testing

Import Postman collection:
- backend/postman/School-Management-API.postman_collection.json

## CI/CD

GitHub Actions workflow in .github/workflows/ci.yml:
- Installs dependencies for frontend and backend
- Runs production build for both projects on PR/push

## Deployment

### Frontend on Vercel

1. Import this GitHub repository in Vercel.
2. In Vercel project settings, set Root Directory to `frontend`.
3. Set environment variable:
   - NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api/v1
4. Build command: npm run build
5. Output handled automatically by Next.js.

For preview deployments, make sure backend CORS allowlist includes your Vercel domain(s):
- https://<your-project>.vercel.app
- https://<your-project>-<branch>-<team>.vercel.app (preview URLs, if used)

### Backend on Render

1. Create a Web Service and set root directory to backend.
2. Build command: npm ci && npm run build
3. Start command: npm start
4. Add env vars from backend/.env.example.
5. Ensure MongoDB URI points to Atlas/managed MongoDB.

### Backend on AWS (Alternative)

1. Build backend image from backend/Dockerfile.
2. Push to ECR.
3. Deploy via ECS/Fargate or EC2 Docker.
4. Configure ALB + HTTPS + env vars + MongoDB Atlas.

## Production Optimization Checklist

- Use managed MongoDB with backups.
- Rotate JWT secrets via secret manager.
- Enforce HTTPS and strict CORS allowlist.
- Add Redis for token deny-list and caching.
- Add observability (OpenTelemetry + log aggregation).
- Extend CI with API integration tests.

## Build Validation

- Backend: npm run build (passes)
- Frontend: npm run build (passes)
