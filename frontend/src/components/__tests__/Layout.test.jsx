import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../Layout';

const mockSignOut = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    signOut: mockSignOut
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: '/'
    })
  };
});

describe('Layout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the layout with children', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Browse Music')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should show sign in button when not authenticated', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('should navigate to login when sign in button clicked', () => {
    render(
      <BrowserRouter>
        <Layout>
          <div>Test</div>
        </Layout>
      </BrowserRouter>
    );

    const signInButton = screen.getByText('Sign In');
    fireEvent.click(signInButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
