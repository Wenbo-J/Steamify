const request = require('supertest');
const express = require('express');

// Create a mock connection object
const mockConnection = {
  query: jest.fn(),
  connect: jest.fn((callback) => callback && callback(null)),
  end: jest.fn()
};

// Mock pg module before requiring routes
jest.mock('pg', () => {
  return {
    Pool: jest.fn(() => mockConnection),
    types: {
      setTypeParser: jest.fn()
    }
  };
});

// Mock config
jest.mock('../../config.json', () => ({
  rds_host: 'localhost',
  rds_user: 'test',
  rds_password: 'test',
  rds_port: 5432,
  rds_db: 'test_db'
}), { virtual: true });

// Now require the routes after mocks are set up
const steamRoutes = require('../../src/routes/steamRoutes');

describe('Steam Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/games', steamRoutes.getAllGames);
    app.get('/games/:game_id', steamRoutes.getGame);
    app.get('/recommends/:game_id', steamRoutes.recommendedTracks);
    app.get('/games/:game_id/recommended_tracks', steamRoutes.getGameRecommendedTracks);
    
    jest.clearAllMocks();
  });

  describe('GET /games/:game_id', () => {
    it('should return a game when found', async () => {
      const mockGame = {
        game_id: '730',
        name: 'Counter-Strike: Global Offensive',
        genres: 'Action'
      };
      
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [mockGame] });
      });

      const response = await request(app)
        .get('/games/730')
        .expect(200);

      expect(response.body).toEqual(mockGame);
      expect(mockConnection.query).toHaveBeenCalled();
    });

    it('should return 404 when game not found', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [] });
      });

      const response = await request(app)
        .get('/games/999999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Game not found');
    });

    it('should handle database errors', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(new Error('Database connection failed'), null);
      });

      const response = await request(app)
        .get('/games/730')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database error');
    });
  });

  describe('GET /games', () => {
    it('should return games with default pagination', async () => {
      const mockGames = [
        { game_id: '1', name: 'Game 1' },
        { game_id: '2', name: 'Game 2' }
      ];
      
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: mockGames });
      });

      const response = await request(app)
        .get('/games')
        .expect(200);

      expect(response.body).toEqual(mockGames);
      expect(mockConnection.query).toHaveBeenCalled();
    });

    it('should handle pagination parameters', async () => {
      const mockGames = [{ game_id: '1', name: 'Game 1' }];
      
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: mockGames });
      });

      const response = await request(app)
        .get('/games?limit=10&offset=20')
        .expect(200);

      expect(response.body).toEqual(mockGames);
    });

    it('should handle search queries', async () => {
      const mockGames = [{ game_id: '730', name: 'Counter-Strike' }];
      
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: mockGames });
      });

      const response = await request(app)
        .get('/games?search=Counter')
        .expect(200);

      expect(response.body).toEqual(mockGames);
    });

    it('should handle database errors', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .get('/games')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database error');
    });
  });

  describe('GET /recommends/:game_id', () => {
    it('should return recommendations for a game', async () => {
      const mockRecommendations = [
        { game_id: '730', track_id: 'track1', match_score: 0.95 },
        { game_id: '730', track_id: 'track2', match_score: 0.90 }
      ];
      
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: mockRecommendations });
      });

      const response = await request(app)
        .get('/recommends/730')
        .expect(200);

      expect(response.body).toEqual(mockRecommendations);
    });

    it('should return empty array when no recommendations found', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [] });
      });

      const response = await request(app)
        .get('/recommends/999999')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .get('/recommends/730')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database error');
    });
  });

  describe('GET /games/:game_id/recommended_tracks', () => {
    it('should return recommended tracks with filters', async () => {
      const mockGenres = [{ music_genre: 'rock' }, { music_genre: 'electronic' }];
      const mockTracks = [
        { track_id: 'track1', name: 'Track 1', duration: 180, energy: 0.8, valence: 0.7 },
        { track_id: 'track2', name: 'Track 2', duration: 200, energy: 0.9, valence: 0.8 }
      ];
      
      let callCount = 0;
      mockConnection.query.mockImplementation((query, params, callback) => {
        if (callCount === 0) {
          callCount++;
          callback(null, { rows: mockGenres });
        } else {
          callback(null, { rows: mockTracks });
        }
      });

      const response = await request(app)
        .get('/games/730/recommended_tracks?session_minutes=60&min_energy=0&max_energy=100')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array when no genres found', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [] });
      });

      const response = await request(app)
        .get('/games/999999/recommended_tracks')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .get('/games/730/recommended_tracks')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database error');
    });
  });
});
