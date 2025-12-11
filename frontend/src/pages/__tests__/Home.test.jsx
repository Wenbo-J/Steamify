import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../Home';
import * as api from '../../services/api';

// Mock the API
vi.mock('../../services/api', () => ({
  getAllGames: vi.fn()
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Steamify title', () => {
    api.getAllGames.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Steamify')).toBeInTheDocument();
  });

  it('should display search input', async () => {
    api.getAllGames.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search for a game/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should load and display games', async () => {
    const mockGames = [
      { game_id: '1', name: 'Game 1' },
      { game_id: '2', name: 'Game 2' }
    ];
    api.getAllGames.mockResolvedValue(mockGames);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Game 1')).toBeInTheDocument();
      expect(screen.getByText('Game 2')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    const mockGames = [{ game_id: '730', name: 'Counter-Strike' }];
    api.getAllGames.mockResolvedValue(mockGames);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search for a game/i);
      fireEvent.change(searchInput, { target: { value: 'Counter' } });
    });

    await waitFor(() => {
      expect(api.getAllGames).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'Counter'
      );
    }, { timeout: 2000 });
  });

  it('should navigate to game tracks page when game is selected', async () => {
    const mockGames = [{ game_id: '730', name: 'Counter-Strike' }];
    api.getAllGames.mockResolvedValue(mockGames);

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Counter-Strike')).toBeInTheDocument();
    });

    const gameCard = screen.getByText('Counter-Strike');
    gameCard.click();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/tracks/730',
        expect.objectContaining({
          state: expect.objectContaining({
            game: mockGames[0]
          })
        })
      );
    });
  });

  it('should display loading state', async () => {
    api.getAllGames.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Wait for useEffect to call getAllGames
    await waitFor(() => {
      expect(api.getAllGames).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.getAllGames.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});

