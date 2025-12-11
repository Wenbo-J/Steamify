import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BrowseMusic from '../BrowseMusic';
import * as api from '../../services/api';

vi.mock('../../services/api');

describe('BrowseMusic Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Browse Music title', async () => {
    api.getAllTracks.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <BrowseMusic />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Browse Music')).toBeInTheDocument();
    });
  });

  it('should load and display tracks', async () => {
    const mockTracks = [
      { track_id: 'track1', name: 'Track 1', artists: 'Artist 1' },
      { track_id: 'track2', name: 'Track 2', artists: 'Artist 2' }
    ];
    api.getAllTracks.mockResolvedValue(mockTracks);

    render(
      <BrowserRouter>
        <BrowseMusic />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Track 1')).toBeInTheDocument();
      expect(screen.getByText('Track 2')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    api.getAllTracks.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <BrowseMusic />
      </BrowserRouter>
    );

    expect(api.getAllTracks).toHaveBeenCalled();
  });

  it('should handle search functionality', async () => {
    const mockTracks = [
      { track_id: 'track1', name: 'Rock Song', artists: 'Rock Artist' },
      { track_id: 'track2', name: 'Jazz Song', artists: 'Jazz Artist' }
    ];
    api.getAllTracks.mockResolvedValue(mockTracks);

    render(
      <BrowserRouter>
        <BrowseMusic />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Rock Song')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search tracks by name/i);
    fireEvent.change(searchInput, { target: { value: 'Rock' } });

    await waitFor(() => {
      expect(screen.getByText('Rock Song')).toBeInTheDocument();
      expect(screen.queryByText('Jazz Song')).not.toBeInTheDocument();
    });
  });

  it('should handle track click and show details', async () => {
    const mockTracks = [
      { track_id: 'track1', name: 'Track 1', artists: 'Artist 1' }
    ];
    const mockTrackDetails = {
      track_id: 'track1',
      name: 'Track 1',
      artists: 'Artist 1',
      duration: 180,
      energy: 0.8,
      valence: 0.7
    };
    api.getAllTracks.mockResolvedValue(mockTracks);
    api.getTrack.mockResolvedValue(mockTrackDetails);

    render(
      <BrowserRouter>
        <BrowseMusic />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Track 1')).toBeInTheDocument();
    });

    const trackCard = screen.getByText('Track 1');
    fireEvent.click(trackCard);

    await waitFor(() => {
      expect(api.getTrack).toHaveBeenCalledWith('track1');
      expect(screen.getByText('Track 1')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    api.getAllTracks.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <BrowseMusic />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(api.getAllTracks).toHaveBeenCalled();
    });
  });

  it('should handle track detail modal interactions', async () => {
    const mockTracks = [{ track_id: 'track1', name: 'Track 1', artists: 'Artist 1' }];
    const mockTrackDetails = { track_id: 'track1', name: 'Track 1', artists: 'Artist 1', duration: 180 };
    api.getAllTracks.mockResolvedValue(mockTracks);
    api.getTrack.mockResolvedValue(mockTrackDetails);

    render(
      <BrowserRouter>
        <BrowseMusic />
      </BrowserRouter>
    );

    await waitFor(() => {
      const trackCards = screen.getAllByText('Track 1');
      // Click the first one (the track card, not the modal title)
      fireEvent.click(trackCards[0]);
    });

    await waitFor(() => {
      expect(api.getTrack).toHaveBeenCalledWith('track1');
    });
  });
});

