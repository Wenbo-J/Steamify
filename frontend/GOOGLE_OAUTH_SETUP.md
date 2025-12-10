# Google OAuth Setup Guide

## Common Issues and Solutions

### Error: "401: invalid_client"

This error means your Google OAuth client ID is not properly configured in Google Cloud Console. Follow these steps:

## Step 1: Verify Your Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID
5. Make sure it matches the one in your `.env` file:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

## Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in required fields:
   - App name: "Steamify" (or your app name)
   - User support email: Your email
   - Developer contact information: Your email
4. Click **Save and Continue**
5. Add scopes (at minimum):
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
6. Add test users (if app is in testing mode)
7. Click **Save and Continue**

## Step 3: Configure Authorized Origins and Redirect URIs

1. Go back to **APIs & Services** > **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:5173
   http://localhost:3000
   http://127.0.0.1:5173
   ```
   (Add the port your Vite dev server uses - default is 5173)

4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:5173
   http://localhost:3000
   http://127.0.0.1:5173
   ```

5. Click **Save**

## Step 4: Restart Your Dev Server

After making changes:
1. Stop your dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. Clear your browser cache or use incognito mode
4. Try signing in again

## Step 5: Verify Client ID Type

Make sure you're using a **Web application** client ID, not:
- iOS client ID
- Android client ID
- Desktop client ID

## Troubleshooting

### Still getting "invalid_client"?

1. **Check the console**: Open browser DevTools (F12) and check the Console tab for detailed error messages
2. **Verify .env file**: Make sure `.env` is in the `frontend/` directory (not root)
3. **Check for typos**: Client ID should end with `.apps.googleusercontent.com`
4. **No quotes needed**: Don't wrap the client ID in quotes in `.env`
5. **Check port**: Make sure the authorized origins match your actual dev server port

### Example .env file:
```
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### Testing in Production

When deploying, make sure to:
1. Add your production domain to **Authorized JavaScript origins**
2. Add your production domain to **Authorized redirect URIs**
3. Update your `.env` file (or environment variables) with the same client ID

