# Deployment Guide: Article Search & Enhancement App

This guide explains how to deploy your application.
The configured setup allows you to deploy:

1.  **Frontend** (React + Vite) to **Vercel**.
2.  **Backend** (Express API) to **Vercel** (as Serverless Functions).
3.  **Enhancement Script** (Node.js) should run locally or on a VPS (cannot play nicely with Vercel timeouts).

## Prerequisites

- Use a Vercel account ([vercel.com](https://vercel.com)).
- Install Vercel CLI: `npm i -g vercel` (optional, can also use Git integration).
- Your PostgreSQL database (Neon) is already cloud-hosted, so no changes needed there!

---

## 1. Deploying the Backend (API)

The backend is configured to run as a serverless function on Vercel.

1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Deploy using Vercel CLI:

    ```bash
    vercel
    ```

    - Follow the prompts (Set up and deploy? **Yes**).
    - Link to existing project? **No**.
    - Project Name: `article-Enhancer` (or similar).
    - In which directory is your code located? `./` (default).
    - Want to modify these settings? **No**.

3.  **Environment Variables**:
    Once the project is created, go to the Vercel Dashboard for this project > **Settings** > **Environment Variables**.
    Add the following from your `.env`:

    - `DATABASE_URL`: (Your Neon DB URL)
    - `CORS_ORIGINS`: `https://your-frontend-project.vercel.app` (You'll get this URL in the next step, for now you can use `*` or update it later).

4.  **Redeploy**:
    ```bash
    vercel --prod
    ```
    Note the **Production URL** (e.g., `https://articleenhancer.vercel.app`).

---

## 2. Deploying the Frontend

1.  Navigate to the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Update the API URL:

    - Open `.env.production` (create if missing) or set it in Vercel Environment Variables.
    - Set `VITE_API_BASE_URL` to your **Backend Production URL** from Step 1 (e.g., `https://article-search-backend.vercel.app`).
    - _Note: Ensure your code uses `import.meta.env.VITE_API_BASE_URL`._

3.  Deploy using Vercel CLI:

    ```bash
    vercel
    ```

    - Project Name: `article-search-frontend`.
    - Framework Preset: **Vite**.
    - Build Command: `npm run build`.
    - Output Directory: `dist`.

4.  **Update Backend CORS**:
    Once you have the Frontend URL (e.g., `https://article-search-frontend.vercel.app`), go back to your **Backend Project in Vercel Dashboard** and update the `CORS_ORIGINS` variable to match this URL. Redeploy backend if needed.

---

## 3. Running the Enhancement Script

The **Enhancement Script** is a long-running process that scrapes usage and calls LLMs.
**It cannot be deployed to Vercel** because Vercel functions have short timeouts (10-60 seconds). This script needs minutes.

### Recommendation:

Run this script **Locally** when you want to enhance content, or deploy it to a service that supports background workers like **Railway** or **Heroku**.

**To run locally (as you do now):**

```bash
cd enhancement-script
npm start
```

Ensure your `enhancement-script/.env` points to the **Deployed Backend URL** if you want it to update the live database:

```env
API_URL="https://article-search-backend.vercel.app/api"
```
