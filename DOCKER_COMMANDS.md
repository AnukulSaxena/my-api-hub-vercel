# Docker Commands (my-api-hub-vercel)

Use these commands from the project folder:

- `cd c:\Users\anuku\Downloads\proj-test\my-api-hub-vercel`

## 1) First-time setup

1. Copy env file:
   - `copy .env.example .env`
2. Open `.env` and set:
   - `MONGODB_URI` (Atlas URI)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`

## 2) Run the app

- Build + start in background:
  - `docker compose up -d --build`

- Open in browser:
  - `http://localhost:8080/`

## 3) Check status and logs

- See running containers:
  - `docker compose ps`

- See API logs (live):
  - `docker compose logs -f api`

- Show last 100 log lines:
  - `docker compose logs --tail=100 api`

## 4) Stop / start / restart

- Stop containers:
  - `docker compose stop`

- Start again:
  - `docker compose start`

- Restart API:
  - `docker compose restart api`

## 5) After code changes

- Rebuild + restart:
  - `docker compose up -d --build`

## 6) Clean up

- Stop and remove containers/network:
  - `docker compose down`

- Remove old/orphan containers:
  - `docker compose up -d --remove-orphans`

- Remove unused Docker images:
  - `docker image prune -f`

## 7) Useful troubleshooting

- Validate compose config:
  - `docker compose config`

- If port 8080 is busy (Windows):
  - `netstat -ano | findstr :8080`

---

If Docker says command not found, start Docker Desktop first and wait until it is fully running.
