# Connection Troubleshooting Guide

## Quick Checks

1. **Is the backend running?**
   ```bash
   cd backend
   npm start
   # or
   node src/index.js
   ```
   You should see: "Server running on port 5000"

2. **Test backend directly:**
   ```bash
   curl http://localhost:5000/api
   ```
   Should return: `{"message":"Backend is running"}`

3. **Is the frontend running?**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Check browser console:**
   - Open DevTools (F12)
   - Look for network errors in the Console tab
   - Check the Network tab to see if requests are being made

## What I Changed

1. **Vite Proxy Configuration** - Added proxy in `vite.config.js` to route API calls through the dev server
2. **Relative URLs in Development** - Frontend now uses relative URLs when in dev mode
3. **Better Backend Logging** - Backend now logs all requests

## If Still Not Working

1. **Restart both servers:**
   - Stop backend (Ctrl+C)
   - Stop frontend (Ctrl+C)
   - Start backend first: `cd backend && npm start`
   - Then start frontend: `cd frontend && npm run dev`

2. **Check for port conflicts:**
   ```bash
   lsof -ti:5000  # Should show backend process
   lsof -ti:5173  # Should show frontend process (Vite default)
   ```

3. **Check browser console for specific errors:**
   - CORS errors → Backend CORS config should fix this
   - Network errors → Check if backend is actually running
   - 404 errors → Check route paths match

4. **Try accessing backend directly in browser:**
   - Go to: http://localhost:5000/api
   - Should see JSON response

