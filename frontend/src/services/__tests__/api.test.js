import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllGames,
  getGame,
  getTrack,
  getAllTracks,
  getPlaylist,
  getPlaylistTracks,
  createPlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  getRecommendations,
  getGameRecommendations,
  getUserPlaylists,
  savePlaylist,
  unsavePlaylist,
  getGenreAudioProfile,
  getTopAudioGenres,
  getSimilarUserPlaylist,
  searchSongs,
  googleAuth,
  linkSteamAccount,
  linkSpotifyAccount
} from '../api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllGames', () => {
    it('should fetch games with pagination', async () => {
      const mockGames = [
        { game_id: '1', name: 'Game 1' },
        { game_id: '2', name: 'Game 2' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGames
      });

      const result = await getAllGames(20, 0, '');
      expect(result).toEqual(mockGames);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/games/'),
        expect.any(Object)
      );
    });

    it('should handle search queries', async () => {
      const mockGames = [{ game_id: '730', name: 'Counter-Strike' }];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGames
      });

      const result = await getAllGames(20, 0, 'Counter');
      expect(result).toEqual(mockGames);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Counter'),
        expect.any(Object)
      );
    });

    it('should throw error on failed request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      await expect(getAllGames()).rejects.toThrow();
    });
  });

  describe('getGame', () => {
    it('should fetch a single game', async () => {
      const mockGame = { game_id: '730', name: 'Counter-Strike' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGame
      });

      const result = await getGame('730');
      expect(result).toEqual(mockGame);
    });

    it('should return empty object on 404', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await getGame('999999');
      expect(result).toEqual({});
    });
  });

  describe('getTrack', () => {
    it('should fetch track details', async () => {
      const mockTrack = {
        track_id: 'track123',
        name: 'Test Track',
        duration: 180
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTrack
      });

      const result = await getTrack('track123');
      expect(result).toEqual(mockTrack);
    });

    it('should return empty object on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getTrack('track123');
      expect(result).toEqual({});
    });
  });

  describe('getAllTracks', () => {
    it('should fetch all tracks', async () => {
      const mockTracks = [
        { track_id: '1', name: 'Track 1' },
        { track_id: '2', name: 'Track 2' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTracks
      });

      const result = await getAllTracks();
      expect(result).toEqual(mockTracks);
    });

    it('should return empty array on 404', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await getAllTracks();
      expect(result).toEqual([]);
    });
  });

  describe('getPlaylist', () => {
    it('should fetch playlist details', async () => {
      const mockPlaylist = {
        playlist_id: 'playlist123',
        playlist_name: 'My Playlist',
        total_tracks: 10
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlaylist
      });

      const result = await getPlaylist('playlist123');
      expect(result).toEqual(mockPlaylist);
    });
  });

  describe('getPlaylistTracks', () => {
    it('should fetch tracks in a playlist', async () => {
      const mockTracks = [
        { track_id: 'track1', name: 'Track 1' },
        { track_id: 'track2', name: 'Track 2' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTracks
      });

      const result = await getPlaylistTracks('playlist123');
      expect(result).toEqual(mockTracks);
    });

    it('should throw error on failed request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Database error' })
      });

      await expect(getPlaylistTracks('playlist123')).rejects.toThrow();
    });
  });

  describe('createPlaylist', () => {
    it('should create a playlist', async () => {
      const mockPlaylist = {
        playlist_id: 'new_playlist',
        playlist_name: 'New Playlist'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlaylist
      });

      const result = await createPlaylist('New Playlist', ['track1', 'track2']);
      expect(result).toEqual(mockPlaylist);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/music/playlists'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('New Playlist')
        })
      );
    });

    it('should create playlist with user_id when provided', async () => {
      const mockPlaylist = { playlist_id: 'new_playlist' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlaylist
      });

      await createPlaylist('New Playlist', ['track1'], 'user123');
      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body).toHaveProperty('user_id', 'user123');
    });
  });

  describe('deletePlaylist', () => {
    it('should delete a playlist', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Playlist deleted' })
      });

      await deletePlaylist('playlist123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/music/playlists/playlist123'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('getRecommendations', () => {
    it('should fetch recommendations from Route 6', async () => {
      const mockRecommendations = [
        { game_id: '730', track_id: 'track1', match_score: 0.95 },
        { game_id: '730', track_id: 'track2', match_score: 0.90 }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRecommendations
      });

      // Mock getTrack calls
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ track_id: 'track1', name: 'Track 1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ track_id: 'track2', name: 'Track 2' })
        });

      const result = await getRecommendations('730');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveLength(2);
    });

    it('should return empty data when no recommendations found', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => []
      });

      const result = await getRecommendations('999999');
      expect(result).toHaveProperty('route6Empty', true);
      expect(result.data).toEqual([]);
    });
  });

  describe('getGameRecommendations', () => {
    it('should fetch game recommendations with filters', async () => {
      const mockTracks = [
        { track_id: 'track1', name: 'Track 1', duration: 180 }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTracks
      });

      const result = await getGameRecommendations('730', 60, 0, 100, 0, 100);
      expect(result).toEqual(mockTracks);
      // Check that fetch was called with the correct URL containing session_minutes
      const fetchCalls = global.fetch.mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      expect(fetchCalls[0][0]).toContain('session_minutes=60');
    });
  });

  describe('googleAuth', () => {
    it('should authenticate with Google', async () => {
      const mockResponse = {
        user_id: 'user123',
        token: 'jwt_token_here'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await googleAuth('test@example.com', 'Test User', 'pic.jpg', 'google123');
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/google'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('test@example.com')
        })
      );
    });
  });

  describe('addTrackToPlaylist', () => {
    it('should add a track to a playlist', async () => {
      const mockResult = { playlist_id: 'playlist1', track_id: 'track1' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResult
      });

      const result = await addTrackToPlaylist('playlist1', 'track1');
      expect(result).toEqual(mockResult);
    });

    it('should throw error on failed request', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Database error' })
      });

      await expect(addTrackToPlaylist('playlist1', 'track1')).rejects.toThrow();
    });
  });

  describe('removeTrackFromPlaylist', () => {
    it('should remove a track from a playlist', async () => {
      const mockResult = { message: 'Track removed successfully' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResult
      });

      const result = await removeTrackFromPlaylist('playlist1', 'track1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserPlaylists', () => {
    it('should fetch user playlists', async () => {
      const mockPlaylists = [
        { playlist_id: 'playlist1', playlist_name: 'Playlist 1' }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlaylists
      });

      const result = await getUserPlaylists(1);
      expect(result).toEqual(mockPlaylists);
    });
  });

  describe('savePlaylist', () => {
    it('should save a playlist for a user', async () => {
      const mockResult = { message: 'Playlist saved successfully' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResult
      });

      const result = await savePlaylist('playlist1', 1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('unsavePlaylist', () => {
    it('should unsave a playlist for a user', async () => {
      const mockResult = { message: 'Playlist unsaved successfully' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResult
      });

      const result = await unsavePlaylist('playlist1', 1);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getGenreAudioProfile', () => {
    it('should fetch genre audio profile', async () => {
      const mockProfile = [
        { game_genre: 'Action', avg_energy: 0.8 }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile
      });

      const result = await getGenreAudioProfile();
      expect(result).toEqual(mockProfile);
    });
  });

  describe('getTopAudioGenres', () => {
    it('should fetch top audio genres', async () => {
      const mockGenres = [
        { game_genre: 'Action', music_genre: 'Electronic', track_count: 50 }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGenres
      });

      const result = await getTopAudioGenres();
      expect(result).toEqual(mockGenres);
    });
  });

  describe('getSimilarUserPlaylist', () => {
    it('should fetch similar user playlists', async () => {
      const mockTracks = [
        { track_id: 'track1', name: 'Track 1' }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTracks
      });

      const result = await getSimilarUserPlaylist(1);
      expect(result).toEqual(mockTracks);
    });
  });

  describe('searchSongs', () => {
    it('should search for songs with filters', async () => {
      const mockTracks = [
        { track_id: 'track1', name: 'Track 1', match_score: 0.9 }
      ];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTracks
      });

      const result = await searchSongs('Counter-Strike', 3600, 0, 100, 0, 100);
      expect(result).toEqual(mockTracks);
    });
  });

  describe('linkSteamAccount', () => {
    it('should link Steam account', async () => {
      const mockResult = { user_id: 1, steam_id: 'steam123' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResult
      });

      const result = await linkSteamAccount(1, 'steam123', 'Steam User');
      expect(result).toEqual(mockResult);
    });
  });

  describe('linkSpotifyAccount', () => {
    it('should link Spotify account', async () => {
      const mockResult = { user_id: 1, spotify_id: 'spotify123' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResult
      });

      const result = await linkSpotifyAccount(1, 'spotify123', 'Spotify User');
      expect(result).toEqual(mockResult);
    });
  });
});

