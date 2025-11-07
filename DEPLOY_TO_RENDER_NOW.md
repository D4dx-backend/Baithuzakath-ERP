# Deploy Backend to Render (5 Minutes)

## Step 1: Create render.yaml (for easy deployment)

I'll create this file for you. It tells Render how to deploy your backend.

## Step 2: Push to GitHub

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push
```

## Step 3: Deploy on Render

1. Go to https://render.com
2. Sign up/login (use GitHub)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render will detect the `render.yaml` and auto-configure
6. Click "Create Web Service"

## Step 4: Add Environment Variables

In Render dashboard, go to Environment and add these:

```
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://hi:owOF2zCPTR6J24b0@cluster0.6thpa.mongodb.net/baithuzakath-erp?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=baithuzzakath-super-secret-jwt-key-2025
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
FRONTEND_URL=https://baithuzakath.netlify.app
```

## Step 5: Get Your Backend URL

After deployment completes (2-3 minutes), you'll get a URL like:
```
https://baithuzakath-api.onrender.com
```

## Step 6: Update Netlify

1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Add: `VITE_API_URL` = `https://baithuzakath-api.onrender.com/api`
4. Trigger rebuild

## Done!

Your app will work after both are deployed.

---

## Alternative: Quick Manual Deploy

If you don't want to use render.yaml:

1. On Render, select "Web Service"
2. Root Directory: `api`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add environment variables
6. Deploy
