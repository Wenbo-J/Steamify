# Steamify

A web application that recommends Spotify tracks based on Steam games, creating personalized gaming playlists.

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
npm install
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

## License

ISC

