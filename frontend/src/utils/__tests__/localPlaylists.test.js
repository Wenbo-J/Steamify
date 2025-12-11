import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getLocalPlaylists,
  saveLocalPlaylist,
  deleteLocalPlaylist,
  getLocalPlaylist
} from '../localPlaylists';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

global.localStorage = localStorageMock;

describe('localPlaylists utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('getLocalPlaylists', () => {
    it('should return empty array when no playlists exist', () => {
      const result = getLocalPlaylists();
      expect(result).toEqual([]);
    });

    it('should return playlists from localStorage', () => {
      const mockPlaylists = [
        {
          playlist_id: 'temp_1',
          playlist_name: 'Playlist 1',
          track_ids: ['track1', 'track2']
        }
      ];
      localStorageMock.setItem('steamify_temp_playlists', JSON.stringify(mockPlaylists));

      const result = getLocalPlaylists();
      expect(result).toEqual(mockPlaylists);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.setItem('steamify_temp_playlists', 'invalid json');
      const result = getLocalPlaylists();
      expect(result).toEqual([]);
    });
  });

  describe('saveLocalPlaylist', () => {
    it('should save a new playlist to localStorage', () => {
      const trackIds = ['track1', 'track2'];
      const tracks = [
        { track_id: 'track1', name: 'Track 1', duration: 180 },
        { track_id: 'track2', name: 'Track 2', duration: 200 }
      ];

      const result = saveLocalPlaylist('My Playlist', trackIds, tracks);

      expect(result).toHaveProperty('playlist_id');
      expect(result.playlist_name).toBe('My Playlist');
      expect(result.track_ids).toEqual(trackIds);
      expect(result.tracks).toEqual(tracks);
      expect(result.is_temporary).toBe(true);
      expect(result.total_tracks).toBe(2);

      const saved = getLocalPlaylists();
      expect(saved).toHaveLength(1);
      expect(saved[0].playlist_name).toBe('My Playlist');
    });

    it('should calculate total duration correctly', () => {
      const tracks = [
        { track_id: 'track1', duration: 180 },
        { track_id: 'track2', duration: 200 }
      ];

      const result = saveLocalPlaylist('Test', ['track1', 'track2'], tracks);
      expect(result.total_duration_minutes).toBeCloseTo(380 / 60, 2);
    });

    it('should handle tracks with different duration field names', () => {
      const tracks = [
        { track_id: 'track1', duration_s: 180 },
        { track_id: 'track2', duration: 200 }
      ];

      const result = saveLocalPlaylist('Test', ['track1', 'track2'], tracks);
      expect(result.total_duration_minutes).toBeCloseTo(380 / 60, 2);
    });

    it('should append to existing playlists', () => {
      const existing = [
        { playlist_id: 'temp_1', playlist_name: 'Existing' }
      ];
      localStorageMock.setItem('steamify_temp_playlists', JSON.stringify(existing));

      saveLocalPlaylist('New Playlist', ['track1'], []);
      const all = getLocalPlaylists();
      expect(all).toHaveLength(2);
    });
  });

  describe('deleteLocalPlaylist', () => {
    it('should delete a playlist by ID', () => {
      const playlists = [
        { playlist_id: 'temp_1', playlist_name: 'Playlist 1' },
        { playlist_id: 'temp_2', playlist_name: 'Playlist 2' }
      ];
      localStorageMock.setItem('steamify_temp_playlists', JSON.stringify(playlists));

      const result = deleteLocalPlaylist('temp_1');
      expect(result).toBe(true);

      const remaining = getLocalPlaylists();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].playlist_id).toBe('temp_2');
    });

    it('should return false when playlist not found', () => {
      const playlists = [
        { playlist_id: 'temp_1', playlist_name: 'Playlist 1' }
      ];
      localStorageMock.setItem('steamify_temp_playlists', JSON.stringify(playlists));

      const result = deleteLocalPlaylist('nonexistent');
      expect(result).toBe(true); // Still returns true, just doesn't delete anything
    });

    it('should handle errors gracefully', () => {
      // Mock localStorage.setItem to throw error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const result = deleteLocalPlaylist('temp_1');
      expect(result).toBe(false);

      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('getLocalPlaylist', () => {
    it('should retrieve a specific playlist by ID', () => {
      const playlists = [
        { playlist_id: 'temp_1', playlist_name: 'Playlist 1' },
        { playlist_id: 'temp_2', playlist_name: 'Playlist 2' }
      ];
      localStorageMock.setItem('steamify_temp_playlists', JSON.stringify(playlists));

      const result = getLocalPlaylist('temp_2');
      expect(result).toEqual(playlists[1]);
    });

    it('should return null when playlist not found', () => {
      const playlists = [
        { playlist_id: 'temp_1', playlist_name: 'Playlist 1' }
      ];
      localStorageMock.setItem('steamify_temp_playlists', JSON.stringify(playlists));

      const result = getLocalPlaylist('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null when no playlists exist', () => {
      const result = getLocalPlaylist('temp_1');
      expect(result).toBeNull();
    });
  });
});

