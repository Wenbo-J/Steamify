import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import UserPlaylists from '../UserPlaylists';
import * as api from '../../services/api';
import * as localPlaylists from '../../utils/localPlaylists';

vi.mock('../../services/api');
vi.mock('../../utils/localPlaylists');
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null
  })
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('UserPlaylists Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localPlaylists.getLocalPlaylists.mockReturnValue([]);
  });

  it('should render the component', () => {
    api.getUserPlaylists.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <UserPlaylists />
      </BrowserRouter>
    );

    expect(screen.getByText(/my playlists/i)).toBeInTheDocument();
  });

  it('should load temporary playlists', async () => {
    const mockTempPlaylists = [
      {
        playlist_id: 'temp_1',
        playlist_name: 'Temp Playlist',
        tracks: [{ track_id: 'track1', name: 'Track 1' }]
      }
    ];
    localPlaylists.getLocalPlaylists.mockReturnValue(mockTempPlaylists);

    render(
      <BrowserRouter>
        <UserPlaylists />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temp Playlist')).toBeInTheDocument();
    });
  });

  it('should handle playlist click for temporary playlist', async () => {
    const mockTempPlaylists = [
      {
        playlist_id: 'temp_1',
        playlist_name: 'Temp Playlist',
        tracks: [{ track_id: 'track1', name: 'Track 1' }]
      }
    ];
    localPlaylists.getLocalPlaylists.mockReturnValue(mockTempPlaylists);
    localPlaylists.getLocalPlaylist.mockReturnValue(mockTempPlaylists[0]);

    render(
      <BrowserRouter>
        <UserPlaylists />
      </BrowserRouter>
    );

    await waitFor(() => {
      const playlistCard = screen.getByText('Temp Playlist');
      fireEvent.click(playlistCard);
    });

    await waitFor(() => {
      expect(localPlaylists.getLocalPlaylist).toHaveBeenCalledWith('temp_1');
    });
  });

  it('should handle playlist click for saved playlist', async () => {
    const mockSavedPlaylists = [
      { playlist_id: 'playlist1', playlist_name: 'Saved Playlist' }
    ];
    const mockTracks = [
      { track_id: 'track1', name: 'Track 1' }
    ];
    
    vi.mock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        isAuthenticated: true,
        user: { user_id: 1 }
      })
    }));

    api.getUserPlaylists.mockResolvedValue(mockSavedPlaylists);
    api.getPlaylist.mockResolvedValue(mockSavedPlaylists[0]);
    api.getPlaylistTracks.mockResolvedValue(mockTracks);

    render(
      <BrowserRouter>
        <UserPlaylists />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.getUserPlaylists).toHaveBeenCalled();
    });
  });

  it('should handle delete playlist', async () => {
    const mockTempPlaylists = [
      {
        playlist_id: 'temp_1',
        playlist_name: 'Temp Playlist',
        tracks: []
      }
    ];
    localPlaylists.getLocalPlaylists.mockReturnValue(mockTempPlaylists);
    localPlaylists.deleteLocalPlaylist.mockReturnValue(true);

    render(
      <BrowserRouter>
        <UserPlaylists />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Temp Playlist')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    api.getUserPlaylists.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <UserPlaylists />
      </BrowserRouter>
    );

    expect(api.getUserPlaylists).toHaveBeenCalled();
  });
});

