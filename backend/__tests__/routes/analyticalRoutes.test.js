const request = require('supertest');
const express = require('express');

// Create a mock connection object
const mockConnection = {
  query: jest.fn(),
  connect: jest.fn((callback) => callback && callback(null)),
  end: jest.fn()
};

// Mock pg module
jest.mock('pg', () => {
  return {
    Pool: jest.fn(() => mockConnection),
    types: {
      setTypeParser: jest.fn()
    }
  };
});

// Mock config.json
jest.mock('../../config.json', () => ({
  rds_host: 'localhost',
  rds_user: 'test',
  rds_password: 'test',
  rds_port: 5432,
  rds_db: 'test_db'
}), { virtual: true });

const analyticalRoutes = require('../../src/routes/analyticalRoutes');

describe('Analytical Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get('/analytics/genres/audio_profile', analyticalRoutes.get_genre_audio_profile);
    app.get('/analytics/genres/top_pairs', analyticalRoutes.get_top_genre_pairs);
    app.get('/analytics/social/recommendations', analyticalRoutes.get_social_recommendations);
    app.get('/analytics/search/songs', analyticalRoutes.search_songs);
    
    jest.clearAllMocks();
  });

  describe('GET /analytics/genres/audio_profile', () => {
    it('should return genre audio profiles', async () => {
      const mockProfiles = [
        { genre: 'rock', avg_energy: 0.75, avg_valence: 0.65 },
        { genre: 'pop', avg_energy: 0.80, avg_valence: 0.70 }
      ];
      
      mockConnection.query.mockResolvedValue({ rows: mockProfiles });

      const response = await request(app)
        .get('/analytics/genres/audio_profile')
        .expect(200);

      expect(response.body).toEqual(mockProfiles);
    }, 10000);

    it('should handle database errors', async () => {
      mockConnection.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/analytics/genres/audio_profile')
        .expect(500);

      // Returns [] on error with 500 status
      expect(response.body).toEqual([]);
    }, 10000);
  });

  describe('GET /analytics/genres/top_pairs', () => {
    it('should return top genre pairs', async () => {
      const mockPairs = [
        { game_genre: 'action', track_genre: 'rock', count: 150 },
        { game_genre: 'adventure', track_genre: 'electronic', count: 120 }
      ];
      
      mockConnection.query.mockResolvedValue({ rows: mockPairs });

      const response = await request(app)
        .get('/analytics/genres/top_pairs')
        .expect(200);

      expect(response.body).toEqual(mockPairs);
    }, 10000);
  });

  describe('GET /analytics/social/recommendations', () => {
    it('should return social recommendations when user_id provided', async () => {
      const mockRecommendations = [
        { track_id: 'track1', name: 'Track 1', match_score: 0.95 },
        { track_id: 'track2', name: 'Track 2', match_score: 0.90 }
      ];
      
      mockConnection.query.mockResolvedValue({ rows: mockRecommendations });

      // user_id must be a valid number (not a string)
      const response = await request(app)
        .get('/analytics/social/recommendations?user_id=123')
        .expect(200);

      expect(response.body).toEqual(mockRecommendations);
    });

    it('should return 400 when user_id is missing', async () => {
      const response = await request(app)
        .get('/analytics/social/recommendations')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /analytics/search/songs', () => {
    it('should return search results for songs', async () => {
      const mockResults = [
        {
          track_id: 'track1',
          track_name: 'Track 1',
          track_duration_s: 180,
          fit_score: 85,
          match_score: 0.9
        }
      ];
      
      mockConnection.query.mockResolvedValue({ rows: mockResults });

      const response = await request(app)
        .get('/analytics/search/songs?game_name=Counter-Strike&session_duration_s=3600')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    }, 10000);

    it('should return 400 when game_name is missing', async () => {
      const response = await request(app)
        .get('/analytics/search/songs?session_duration_s=3600')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle energy and valence conversion from 0-100 to 0-1', async () => {
      const mockResults = [];
      
      mockConnection.query.mockResolvedValue({ rows: mockResults });

      await request(app)
        .get('/analytics/search/songs?game_name=Test&min_energy=50&max_energy=75&min_valence=25&max_valence=100')
        .expect(200);

      // Verify the query was called (energy/valence should be converted)
      expect(mockConnection.query).toHaveBeenCalled();
    }, 10000);
  });
});
