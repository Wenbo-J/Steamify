# Steamify

A web app that recommends Spotify tracks based on Steam games, creating personalized gaming playlists.

## Features

- **Game-Based Recommendations**: Get music recommendations tailored to your favorite Steam games
- **Playlist Management**: Create and save playlists with recommended tracks
- **Audio Analytics**: Explore genre audio profiles and music analytics
- **User Authentication**: Sign in with Google to save playlists permanently

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **Authentication**: Google OAuth

## Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Google OAuth credentials

### Backend

```bash
cd backend
npm install
```

Create `config.json`:
```json
{
  "rds_host": "your-db-host",
  "rds_user": "your-db-user",
  "rds_password": "your-db-password",
  "rds_port": 5432,
  "rds_db": "your-db-name"
}
```

```bash
npm run dev
```

Backend runs on `http://localhost:5001`

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
```

**Note**: Use `--legacy-peer-deps` flag due to React 19 compatibility with testing libraries. This is expected and safe to use.

If you encounter issues with `@vitest/coverage-v8` when running tests, install it separately:
```bash
npm install --legacy-peer-deps -D @vitest/coverage-v8@^1.0.4
```

Create `.env`:
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   └── index.js       # Express server
│   └── config.json        # Database configuration
├── frontend/
│   ├── src/
│   │   ├── pages/         # React page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API service layer
│   │   └── contexts/      # React contexts
│   └── .env               # Environment variables
└── query/                  # SQL queries
```

## API Routes

- `/games` - Steam game endpoints
- `/music` - Spotify track and playlist endpoints
- `/recommends/:game_id` - Game recommendations (Route 6)
- `/analytics` - Music analytics endpoints
- `/auth/google` - Google authentication


## Testing

### Backend Tests

```bash
cd backend
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

### Frontend Tests

```bash
cd frontend
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

Watch mode:
```bash
npm run test:watch
```
