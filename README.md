# RightFit

RightFit is a resource allocation platform. It places employees on client projects, tracks everyone who isn't on a project in a resource pool, and manages training while people wait.

| | Link |
|---|---|
| **App** | https://rightfitapplication.vercel.app |
| **API** | https://rightfit-application.onrender.com |
| **Source** | https://github.com/sparshchaturvedi78/RightFit |

## Roles

- **Admin**: manages employees, projects, users, catalogs, bench policy, reports and the audit log.
- **RMG** (Resource Management Group): runs the resource pool and bench, approves allocations, and manages training.
- **Manager**: claims projects, raises requirements, invites candidates, runs interviews, and requests allocations.
- **Associate**: keeps a profile, answers invitations and interviews, applies to requirements, and asks to join training.

## How it works

1. A manager claims a project and raises requirements.
2. Candidates are sourced or apply, get invited, and go through interviews.
3. The manager selects a candidate, who confirms the opportunity.
4. The RMG approves the allocation. The associate moves from the pool to the project.
5. Anyone not allocated stays on the bench, with status set by the bench policy. Training is available while they wait.

Sign-in is by employee ID and password, followed by a one-time code sent by email.

## Screenshots

| Home | Sign in |
|---|---|
| ![Home](docs/screenshots/01-home.png) | ![Sign in](docs/screenshots/02-login.png) |

| Sign-in code email | Welcome email |
|---|---|
| ![Sign-in code](docs/screenshots/09-email-login-otp.png) | ![Welcome](docs/screenshots/10-email-account-created.png) |

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Redux Toolkit |
| Backend | Spring Boot 4, Java 17, Spring Security (JWT), Hibernate, Flyway |
| Database | PostgreSQL (Neon) |
| Email | Spring Mail over Gmail SMTP, with HTML templates |
| Hosting | Vercel (frontend), Render (API), Neon (database) |

## Architecture

```
Browser ── HTTPS/JWT ──> Spring Boot API ──> PostgreSQL
                              │
                              └──> Gmail SMTP (codes and event emails)
```

- `frontend/`: the React app, with one folder of pages per role.
- `backend/`: the REST API, organised as controllers, services, repositories and entities.
- `backend/src/main/resources/db/migration/`: database schema changes.
- `backend/src/main/resources/mail/`: email templates.

## Running locally

Requirements: Java 17, Node.js 20+, and PostgreSQL (for example, Docker with `backend/docker-compose.yml`).

```bash
# Backend (port 8081)
cd backend
cp .env.example .env        # fill in the values
./mvnw spring-boot:run

# Frontend (port 5173)
cd frontend
npm install
npm run dev
```

The frontend calls the hosted API by default. To use a local API, set `VITE_API_BASE_URL=http://localhost:8081` in `frontend/.env.local`.

See `backend/.env.example` for the backend settings.

## Deployment

- **Frontend** on Vercel, built from `frontend/`.
- **API** on Render in Singapore, built from `backend/`.
- **Database** on Neon in Singapore.
