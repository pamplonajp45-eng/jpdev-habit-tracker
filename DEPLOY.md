# Deploying HaBITAW to Vercel

Your project is now configured for Vercel! Follow these steps to deploy.

## 1. Environment Variables
You will need to add these variables to your Vercel Project Settings (under **Settings > Environment Variables**):

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | Your MongoDB Connection String |
| `JWT_SECRET` | A random strong string for security |
| `JWT_EXPIRE` | (Optional) Token expiry, e.g., `30d` |
| `GMAIL_USER` | Your Gmail address (for verification emails) |
| `GMAIL_APP_PASSWORD` | Your Gmail App Password |

> **Note**: You do NOT need to set `PORT` on Vercel.

## 2. Push to GitHub
Commit your changes and push to your GitHub repository.
```bash
git add .
git commit -m "Prepare for Vercel Deployment"
git push
```

## 3. Import in Vercel
1. Go to your Vercel Dashboard.
2. Click **"Add New..."** -> **"Project"**.
3. Import your `jpdev-habit-tracker` repository.
4. **Framework Preset**: It should likely detect `Vite`. If not, select `Vite`.
5. **Root Directory**: Leave as `./` (Project Root).
6. **Environment Variables**: Add the variables from Step 1.
7. Click **Deploy**.

## Troubleshooting
- **Build Failures**: Check the logs. Ensure all dependencies (`mongoose`, etc.) are in the root `package.json` (I have already done this for you).
- **Runtime Errors**: If API calls fail, check the **Functions** tab in Vercel logs. Ensure `MONGODB_URI` is correct.
