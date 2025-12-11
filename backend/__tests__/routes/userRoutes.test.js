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

// Mock config
jest.mock('../../config.json', () => ({
  rds_host: 'localhost',
  rds_user: 'test',
  rds_password: 'test',
  rds_port: 5432,
  rds_db: 'test_db'
}), { virtual: true });

const userRoutes = require('../../src/routes/userRoutes');

describe('User Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.post('/users', userRoutes.createUser);
    app.post('/auth/google', userRoutes.googleAuth);
    app.get('/users/:user_id', userRoutes.userAccounts);
    app.patch('/users/:user_id', userRoutes.updateUser);
    app.post('/users/:user_id/playlists/:playlist_id/save', userRoutes.savePlaylist);
    app.delete('/users/:user_id/playlists/:playlist_id/save', userRoutes.deleteSavedPlaylist);
    app.get('/users/:user_id/games', userRoutes.getUserGames);
    app.get('/users/:user_id/playlists', userRoutes.getUserPlaylists);
    
    jest.clearAllMocks();
  });

  describe('POST /auth/google', () => {
    it('should create a new user on first login', async () => {
      const mockUser = { user_id: 'user123' };
      
      // First query: check if user exists (returns empty)
      // Second query: insert new user
      let callCount = 0;
      mockConnection.query.mockImplementation((query, params, callback) => {
        if (callCount === 0) {
          callCount++;
          callback(null, { rows: [] }); // User doesn't exist
        } else {
          callback(null, { rows: [mockUser] }); // User created
        }
      });

      const response = await request(app)
        .post('/auth/google')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/pic.jpg',
          google_id: 'google123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user_id');
    });

    it('should return existing user on subsequent login', async () => {
      const mockUser = {
        user_id: 'user123',
        steam_id: null,
        steam_name: null,
        spotify_id: null,
        spotify_name: 'test@example.com'
      };
      
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [mockUser] }); // User exists
      });

      const response = await request(app)
        .post('/auth/google')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          google_id: 'google123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user_id');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/auth/google')
        .send({
          name: 'Test User',
          google_id: 'google123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email is required');
    });

    it('should handle database errors when finding user', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .post('/auth/google')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          google_id: 'google123'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Database error');
    });

    it('should handle database errors when creating new user', async () => {
      // First query: user doesn't exist, second query: create fails
      let callCount = 0;
      mockConnection.query.mockImplementation((query, params, callback) => {
        if (callCount === 0) {
          callCount++;
          callback(null, { rows: [] }); // User doesn't exist
        } else {
          callback(new Error('Database error'), null); // Create fails
        }
      });

      const response = await request(app)
        .post('/auth/google')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          google_id: 'google123'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to create user');
    });
  });

  describe('GET /users/:user_id', () => {
    it('should return user account information', async () => {
      const mockUser = {
        user_id: 'user123',
        steam_id: 'steam123',
        steam_name: 'Steam User',
        spotify_id: 'spotify123',
        spotify_name: 'Spotify User'
      };
      
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [mockUser] });
      });

      const response = await request(app)
        .get('/users/user123')
        .expect(200);

      // userAccounts returns data.rows (array), not data.rows[0]
      expect(response.body).toEqual([mockUser]);
    });

    it('should return empty object when user not found', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [] });
      });

      const response = await request(app)
        .get('/users/nonexistent')
        .expect(200);

      // Returns {} when not found, not 404
      expect(response.body).toEqual({});
    });
  });

  describe('PATCH /users/:user_id', () => {
    it('should update user account information', async () => {
      const mockUser = {
        user_id: 'user123',
        steam_id: 'new_steam_id',
        steam_name: 'New Steam Name'
      };
      
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [mockUser] });
      });

      const response = await request(app)
        .patch('/users/user123')
        .send({
          steam_id: 'new_steam_id',
          steam_name: 'New Steam Name'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user_id');
    });

    it('should handle database errors', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .patch('/users/user123')
        .send({ steam_id: 'new_id' })
        .expect(200);

      // Returns {} on error, not 500
      expect(response.body).toEqual({});
    });
  });

  describe('GET /users/:user_id/playlists', () => {
    it('should return user playlists', async () => {
      const mockPlaylists = [
        { playlist_id: 'playlist1', playlist_name: 'Playlist 1' },
        { playlist_id: 'playlist2', playlist_name: 'Playlist 2' }
      ];
      
      // First query: check user exists, second query: get playlists
      let callCount = 0;
      mockConnection.query.mockImplementation((query, params, callback) => {
        if (callCount === 0) {
          callCount++;
          callback(null, { rows: [{ user_id: 'user123' }] }); // User exists
        } else {
          callback(null, { rows: mockPlaylists }); // Playlists
        }
      });

      const response = await request(app)
        .get('/users/user123/playlists')
        .expect(200);

      expect(response.body).toEqual(mockPlaylists);
    });

    it('should return empty object when user not found', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [] }); // User doesn't exist
      });

      const response = await request(app)
        .get('/users/user123/playlists')
        .expect(200);

      // Returns {} when user not found, not []
      expect(response.body).toEqual({});
    });
  });

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const mockUser = { user_id: 'user123' };
      
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [mockUser] });
      });

      const response = await request(app)
        .post('/users')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          steam_id: 'steam123',
          spotify_id: 'spotify123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user_id');
      expect(response.body).toHaveProperty('message', 'User created successfully');
    });

    it('should handle database errors', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .post('/users')
        .send({ email: 'test@example.com' })
        .expect(500);

      // Returns 500 on error
      expect(response.body).toHaveProperty('error', 'Failed to create user');
    });
  });

  describe('POST /users/:user_id/playlists/:playlist_id/save', () => {
    it('should save a playlist for a user', async () => {
      // Nested queries: playlist exists, user exists, not already saved, insert
      let callCount = 0;
      mockConnection.query.mockImplementation((query, params, callback) => {
        if (callCount === 0) {
          callCount++;
          callback(null, { rows: [{ playlist_id: 'playlist123' }] }); // Playlist exists
        } else if (callCount === 1) {
          callCount++;
          callback(null, { rows: [{ user_id: 1 }] }); // User exists
        } else if (callCount === 2) {
          callCount++;
          callback(null, { rows: [] }); // Not already saved
        } else {
          callback(null, { rows: [{ playlist_id: 'playlist123', user_id: 1 }] }); // Insert success
        }
      });

      const response = await request(app)
        .post('/users/1/playlists/playlist123/save')
        .send({ user_id: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Playlist saved successfully');
    });

    it('should return empty object when playlist does not exist', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [] }); // Playlist doesn't exist
      });

      const response = await request(app)
        .post('/users/1/playlists/nonexistent/save')
        .send({ user_id: 1 })
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should handle database errors', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .post('/users/1/playlists/playlist123/save')
        .send({ user_id: 1 })
        .expect(200);

      // Returns {} on error
      expect(response.body).toEqual({});
    });
  });

  describe('DELETE /users/:user_id/playlists/:playlist_id/save', () => {
    it('should delete a saved playlist', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [{ playlist_id: 'playlist123', user_id: 1 }] });
      });

      const response = await request(app)
        .delete('/users/1/playlists/playlist123/save')
        .send({ user_id: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Saved playlist deleted successfully');
    });

    it('should return empty object when playlist not found', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [] });
      });

      const response = await request(app)
        .delete('/users/1/playlists/nonexistent/save')
        .send({ user_id: 1 })
        .expect(200);

      expect(response.body).toEqual({});
    });
  });

  describe('GET /users/:user_id/games', () => {
    it('should return user games', async () => {
      const mockGames = [
        { game_id: 'game1', game_name: 'Game 1' },
        { game_id: 'game2', game_name: 'Game 2' }
      ];
      
      // First query: check user exists, second query: get games
      let callCount = 0;
      mockConnection.query.mockImplementation((query, params, callback) => {
        if (callCount === 0) {
          callCount++;
          callback(null, { rows: [{ user_id: 1 }] }); // User exists
        } else {
          callback(null, { rows: mockGames }); // Games
        }
      });

      const response = await request(app)
        .get('/users/1/games')
        .expect(200);

      expect(response.body).toEqual(mockGames);
    });

    it('should return empty object when user not found', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(null, { rows: [] }); // User doesn't exist
      });

      const response = await request(app)
        .get('/users/1/games')
        .expect(200);

      expect(response.body).toEqual({});
    });

    it('should handle database errors', async () => {
      mockConnection.query.mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .get('/users/1/games')
        .expect(200);

      // Returns {} on error, not 500
      expect(response.body).toEqual({});
    });
  });
});
