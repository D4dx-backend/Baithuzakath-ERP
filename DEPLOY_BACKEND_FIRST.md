# 🚨 CRITICAL: Deploy Backend API First

## The Problem
Your frontend is live on Netlify, but it's trying to call `localhost:8000` which doesn't exist in production. That's why you're getting 404 errors.

## Solution Steps

### 1. Deploy Your Backend API
Choose one of these platforms (all have free tiers):

**Option A: Render (Recommended)**
- Go to https://render.com
- Sign up/login
- Click "New +" → "Web Service"
- Connect your GitHub repo
- Select the `api` folder
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables from `api/.env`

**Option B: Railway**
- Go to https://railway.app
- Deploy from GitHub
- Select `api` folder
- Add environment variables

**Option C: Heroku**
- Install Heroku CLI
- `heroku create your-app-name`
- Deploy the `api` folder

### 2. Update Frontend Environment Variable

Once your backend is deployed, you'll get a URL like:
- `https://your-app.onrender.com`
- `https://your-app.up.railway.app`

Update `erp/.env.production`:
```
VITE_API_URL=https://your-backend-api.onrender.com/api
```

### 3. Update Backend CORS Settings

In `api/.env` (on your hosting platform), update:
```
FRONTEND_URL=https://baithuzakath.netlify.app
```

### 4. Rebuild and Redeploy Frontend

After backend is live:
```bash
cd erp
npm run build
```

Then push to GitHub (Netlify will auto-deploy) or manually upload the `dist` folder to Netlify.

## Quick Check
After deployment, test your API:
```
https://your-backend-api.onrender.com/api/health
```

Should return a success response.

## Important Notes
- Netlify only hosts static files (HTML/CSS/JS)
- Your Node.js backend needs a separate server
- Both need to be deployed independently
- Update CORS settings to allow your frontend domain
