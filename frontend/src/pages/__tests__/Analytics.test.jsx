import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Analytics from '../Analytics';
import * as api from '../../services/api';

vi.mock('../../services/api');
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null
  })
}));

describe('Analytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Analytics Dashboard title', () => {
    api.getGenreAudioProfile.mockResolvedValue([]);
    api.getTopAudioGenres.mockResolvedValue([]);
    api.getSimilarUserPlaylist.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('should load and display audio profile data', async () => {
    const mockProfile = [
      {
        game_genre: 'Action',
        track_count: 100,
        avg_tempo: 120.5,
        avg_energy: 0.8,
        avg_valence: 0.7
      }
    ];
    api.getGenreAudioProfile.mockResolvedValue(mockProfile);
    api.getTopAudioGenres.mockResolvedValue([]);
    api.getSimilarUserPlaylist.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Action')).toBeInTheDocument();
    });
  });

  it('should load and display top genre pairs', async () => {
    const mockTopGenres = [
      {
        game_genre: 'Action',
        music_genre: 'Electronic',
        track_count: 50
      }
    ];
    api.getGenreAudioProfile.mockResolvedValue([]);
    api.getTopAudioGenres.mockResolvedValue(mockTopGenres);
    api.getSimilarUserPlaylist.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.getTopAudioGenres).toHaveBeenCalled();
    });
  });

  it('should handle loading states', () => {
    api.getGenreAudioProfile.mockImplementation(() => new Promise(() => {}));
    api.getTopAudioGenres.mockResolvedValue([]);
    api.getSimilarUserPlaylist.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    expect(api.getGenreAudioProfile).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    api.getGenreAudioProfile.mockRejectedValue(new Error('Network error'));
    api.getTopAudioGenres.mockResolvedValue([]);
    api.getSimilarUserPlaylist.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.getGenreAudioProfile).toHaveBeenCalled();
    });
  });

  it('should display empty state when no data', async () => {
    api.getGenreAudioProfile.mockResolvedValue([]);
    api.getTopAudioGenres.mockResolvedValue([]);
    api.getSimilarUserPlaylist.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      // There may be multiple "no data available" messages, so use getAllByText
      const emptyStates = screen.getAllByText(/no data available/i);
      expect(emptyStates.length).toBeGreaterThan(0);
    });
  });
});

