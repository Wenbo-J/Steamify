import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import GameTracks from './pages/GameTracks';
import BrowseMusic from './pages/BrowseMusic';
import UserPlaylists from './pages/UserPlaylists';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tracks/:gameId" element={<GameTracks />} />
          <Route path="/browse" element={<BrowseMusic />} />
          <Route path="/playlists" element={<UserPlaylists />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
