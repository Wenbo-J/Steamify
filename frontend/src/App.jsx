import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Generator from './pages/Generator';
import Browser from './pages/Browser';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/generator" element={<Generator />} />
          <Route path="/browser" element={<Browser />} />
          {/* Add more routes (About, etc.) as needed */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;