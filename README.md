# my-api-hub-vercel

## Run Locally With Docker

1. Copy env file:
   - `copy .env.example .env`
2. Set required values in `.env`:
   - `MONGODB_URI` (Atlas base URI)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
3. Start:
   - `docker compose up -d --build`
4. Verify:
   - `http://localhost:8080/`

## Deploy To Google Cloud Run

Set your project first:

- `gcloud config set project <YOUR_GCP_PROJECT_ID>`

Build and push image with Cloud Build:

- `gcloud builds submit --tag gcr.io/<YOUR_GCP_PROJECT_ID>/my-api-hub:latest`

Deploy:

- `gcloud run deploy my-api-hub --image gcr.io/<YOUR_GCP_PROJECT_ID>/my-api-hub:latest --platform managed --region <YOUR_REGION> --allow-unauthenticated --port 8080`

Set runtime environment variables on Cloud Run (do not set `PORT`; Cloud Run sets it automatically):

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- optional: `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CRON_SECRET`, `COOKIE_SAME_SITE`, `COOKIE_SECURE`

Note: this app appends DB name from `src/constants.js` to `MONGODB_URI`, so provide the Atlas base URI.
