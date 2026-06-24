# Demo notes

## Run

Backend with demo data:

```powershell
cd backend
docker compose up --build -d
docker compose logs -f backend
```

Frontend:

```powershell
cd frontend
npm i
npm run dev
```

Backend API: `http://localhost:8081/api`

Postgres:

- Host: `localhost`
- Port: `5434`
- Database: `issue_db`
- User: `postgres`
- Password: `postgres`

Useful checks:

```sql
select id, email, username, global_admin, active from users order by id;
select id, name, owner_id, is_archived from projects order by id;
select id, project_id, name, status, deleted_at from issues order by id;
```

Local backend without full compose:

```powershell
cd backend
docker compose up -d postgres
$env:SPRING_PROFILES_ACTIVE='demo'
.\gradlew.bat bootRun
```

## Accounts

All passwords: `password`.

| Email | Role in demo |
| --- | --- |
| `owner@example.com` | Owner in `Vision QA Flow` |
| `admin@example.com` | Project admin + global admin |
| `developer@example.com` | Developer |
| `qa@example.com` | QA engineer |
| `qalead@example.com` | QA lead |
| `designer@example.com` | Product designer |

## Projects

- `Vision QA Flow` - main lifecycle demo.
- `Product Delivery Template` - reusable template source.
- `Legacy Support` - archived project.

## Demo path

Main project: `Vision QA Flow`.

Owner path:

- `owner@example.com`
- board has statuses `Backlog`, `In Progress`, `Review`, `QA`, `Done`
- owner-created issue can go `Review -> QA -> Done`
- direct `Review -> Done` is intentionally absent: QA is a required step

Assignee-only transition:

- `qa@example.com`
- issue: `Implement QA transition guard`
- current status: `Backlog`
- assignee: `developer@example.com`
- QA should not move it to `In Progress`
- `developer@example.com` can move it `Backlog -> In Progress`
- developer can move it back `In Progress -> Backlog`, so this part is repeatable

QA field transition:

- issue: `Validate QA ownership on Done`
- current status: `QA`
- field `QA Engineer` points to `qa@example.com`
- `qa@example.com` can move it `QA -> Done`
- `qalead@example.com` can also close QA work by role

Admin part:

- `admin@example.com`
- `/admin`
- users: global admin toggle, deactivate, restore
- projects: archive, restore, delete

Settings part:

- create enum or checkbox field
- save config
- create an issue with the new field
- toggle board card visibility and check cards
- create a project from `Product Delivery Template`

Trash:

- restore `Polish archived issue restore`
