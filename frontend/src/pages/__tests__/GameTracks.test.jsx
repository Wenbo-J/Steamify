import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import GameTracks from '../GameTracks';
import * as api from '../../services/api';
import * as localPlaylists from '../../utils/localPlaylists';

// Mock dependencies
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
    useNavigate: () => mockNavigate,
    useParams: () => ({ gameId: '730' }),
    useLocation: () => ({
      state: {
        game: {
          game_id: '730',
          name: 'Counter-Strike: Global Offensive'
        }
      }
    })
  };
});

describe('GameTracks Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localPlaylists.getLocalPlaylists.mockReturnValue([]);
  });

  it('should render game name', async () => {
    api.getRecommendations.mockResolvedValue({
      data: []
    });

    render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Counter-Strike/i)).toBeInTheDocument();
    });
  });

  it('should fetch and display recommendations', async () => {
    const mockTracks = [
      {
        track_id: 'track1',
        name: 'Track 1',
        duration: 180,
        energy: 0.8,
        valence: 0.7
      },
      {
        track_id: 'track2',
        name: 'Track 2',
        duration: 200,
        energy: 0.9,
        valence: 0.8
      }
    ];

    api.getRecommendations.mockResolvedValue({
      data: mockTracks
    });

    render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Track 1')).toBeInTheDocument();
      expect(screen.getByText('Track 2')).toBeInTheDocument();
    });
  });

  it('should filter tracks by session duration', async () => {
    const mockTracks = [
      { track_id: 'track1', name: 'Track 1', duration: 180 }, // 3 min
      { track_id: 'track2', name: 'Track 2', duration: 180 }, // 3 min
      { track_id: 'track3', name: 'Track 3', duration: 180 }  // 3 min
    ];

    api.getRecommendations.mockResolvedValue({
      data: mockTracks
    });

    render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    // Wait for tracks to load
    await waitFor(() => {
      expect(screen.getByText('Track 1')).toBeInTheDocument();
    });

    // Change duration to 5 minutes (300 seconds)
    // Find the number input by its type and current value
    const durationInput = screen.getByDisplayValue('60');
    fireEvent.change(durationInput, { target: { value: '5' } });

    // Click apply duration filter
    const applyButton = screen.getByText(/apply duration filter/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      // Should only show tracks that fit in 5 minutes (300 seconds)
      // Track 1 (180s) + Track 2 (180s) = 360s > 300s, so only Track 1 should show
      expect(screen.getByText('Track 1')).toBeInTheDocument();
      // Track 2 and 3 should not be visible (filtered out)
      expect(screen.queryByText('Track 2')).not.toBeInTheDocument();
    });
  });

  it('should allow track selection', async () => {
    const mockTracks = [
      { track_id: 'track1', name: 'Track 1', duration: 180 }
    ];

    api.getRecommendations.mockResolvedValue({
      data: mockTracks
    });

    render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    await waitFor(() => {
      const trackCard = screen.getByText('Track 1');
      fireEvent.click(trackCard);
    });
  });

  it('should show playlist creation UI when track is selected', async () => {
    const mockTracks = [
      { track_id: 'track1', name: 'Track 1', duration: 180 }
    ];

    api.getRecommendations.mockResolvedValue({
      data: mockTracks
    });

    const { container } = render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Track 1')).toBeInTheDocument();
    });

    // Select a track by clicking the checkbox
    const trackCard = screen.getByText('Track 1').closest('div[class*="p-4"]');
    expect(trackCard).toBeInTheDocument();
    
    const checkboxDiv = trackCard?.querySelector('div[class*="border-2"]');
    if (checkboxDiv) {
      fireEvent.click(checkboxDiv);
    } else {
      fireEvent.click(trackCard);
    }

    // Wait a bit for state to update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify playlist creation UI appears (input field should be visible when track is selected)
    // The UI only appears when selectedTracks.size > 0
    await waitFor(() => {
      const input = screen.queryByPlaceholderText(/enter playlist name/i);
      expect(input).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify create button exists (it should be in the same container as the input)
    const input = screen.getByPlaceholderText(/enter playlist name/i);
    const playlistSection = input.closest('div[class*="bg-gradient"]');
    expect(playlistSection).toBeInTheDocument();
    
    // Find the button within the playlist creation section
    const createButton = playlistSection?.querySelector('button');
    expect(createButton).toBeTruthy();
    expect(createButton?.textContent).toMatch(/create|save/i);
  });

  it('should display loading state', () => {
    api.getRecommendations.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    // Component should be in loading state
    expect(api.getRecommendations).toHaveBeenCalled();
  });

  it('should handle empty recommendations', async () => {
    api.getRecommendations.mockResolvedValue({
      data: []
    });

    render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should not crash, just show no tracks message
      expect(screen.getByText(/no recommendations found/i)).toBeInTheDocument();
    });
  });

  it('should handle filter changes', async () => {
    const mockTracks = [
      { track_id: 'track1', name: 'Track 1', duration: 180 }
    ];
    api.getRecommendations.mockResolvedValue({
      data: mockTracks
    });

    render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Track 1')).toBeInTheDocument();
    });

    // Change duration filter
    const durationInput = screen.getByDisplayValue('60');
    fireEvent.change(durationInput, { target: { value: '30' } });
    
    // Click apply duration filter
    const applyButton = screen.getByText(/apply duration filter/i);
    fireEvent.click(applyButton);

    // Verify the filter was applied (track should still be visible since 180s < 30*60s)
    await waitFor(() => {
      expect(screen.getByText('Track 1')).toBeInTheDocument();
    });
  });

  it('should switch between tabs', async () => {
    api.getRecommendations.mockResolvedValue({
      data: []
    });

    render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    await waitFor(() => {
      const playlistsTab = screen.getByText(/my playlists/i);
      fireEvent.click(playlistsTab);
    });
  });

  it('should handle authenticated user creating playlist', async () => {
    vi.mock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        isAuthenticated: true,
        user: { user_id: 1 }
      })
    }));

    const mockTracks = [
      { track_id: 'track1', name: 'Track 1', duration: 180 }
    ];
    api.getRecommendations.mockResolvedValue({
      data: mockTracks
    });
    api.createPlaylist.mockResolvedValue({
      playlist_id: 'playlist1',
      playlist_name: 'Test Playlist'
    });

    render(
      <MemoryRouter>
        <GameTracks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Track 1')).toBeInTheDocument();
    });
  });
});

