# Demo Backend Runbook

## Requirements

- Docker Desktop
- Java 21, only for local `bootRun`
- Node.js/npm for the frontend

## Docker Backend With Demo Data

```powershell
cd backend
docker compose up --build -d
docker compose logs -f backend
```

The tracked `.env` sets `SPRING_PROFILE=demo`, so the backend runs with
`application-demo.properties` and loads `db/demo-data.sql`.

Backend URL: `http://localhost:8081/api`

Postgres connection:

- Host: `localhost`
- Port: `5434`
- Database: `issue_db`
- User: `postgres`
- Password: `postgres`

Useful DB checks:

```sql
select id, email, username, global_admin, active from users order by id;
select id, name, owner_id, is_archived from projects order by id;
select project_id, config_json from project_configs order by project_id;
select id, project_id, name, status, deleted_at from issues order by id;
```

## Local Java Backend

Start Postgres first:

```powershell
cd backend
docker compose up -d postgres
$env:SPRING_PROFILES_ACTIVE='demo'
.\gradlew.bat bootRun
```

## Frontend Against Real Backend

```powershell
cd frontend
npm i
npm run dev
```

Open the Vite URL and use the real backend default:
`http://localhost:8081/api`.

## Demo Logins

All demo users use password `password`.

- `owner@example.com` - project owner in `Vision QA Flow`
- `admin@example.com` - project admin and global admin
- `developer@example.com` - developer
- `qa@example.com` - QA engineer
- `qalead@example.com` - QA lead
- `designer@example.com` - product designer

## Demo Smoke Checklist

1. Login as `owner@example.com`.
2. Open `Vision QA Flow`, check board statuses and issue cards.
3. Move an owner-created issue from Review -> QA -> Done. Do not move Review
   directly to Done: the Vision lifecycle intentionally requires the QA step.
4. Open Settings, create an enum or checkbox field, save, then create an issue.
5. Toggle board card visibility in Settings and verify cards update.
6. Apply template from `Product Delivery Template` to a new project.
7. Login as `admin@example.com`.
8. Open `/admin`, grant/revoke global admin, deactivate/restore a user,
   archive/restore a project.
9. Open Trash and restore `Polish archived issue restore`.

## Lifecycle Walkthrough

Use the `Vision QA Flow` project.

1. Login as `owner@example.com` and show the intended happy path for the
   project owner: Review -> QA -> Done. This account is a project Owner, not a
   global admin, so the transition is allowed because Owner is explicitly listed
   in the lifecycle conditions.
2. Login as `qa@example.com` and open `Implement QA transition guard`.
   It is in Backlog and assigned to `developer@example.com`.
   Try to move it to In Progress: the transition is denied because only the
   assignee can do it.
3. Login as `developer@example.com`, open the same issue and move it
   Backlog -> In Progress.
4. Still as `developer@example.com`, move it In Progress -> Backlog. This keeps
   the demo repeatable.
5. Login as `qa@example.com`, open `Validate QA ownership on Done` and move it
   QA -> Done. The issue has `QA Engineer = qa@example.com`, so the
   `field_user_reference` transition allows it.
6. Login as `qalead@example.com` and repeat QA -> Done on a QA issue if you
   want to show that QA Lead can also close QA work.
7. Login as `admin@example.com` to show global admin separately: this account
   can open `/admin` and bypass project-level restrictions because global admin
   is a system-level flag, not a project role.
