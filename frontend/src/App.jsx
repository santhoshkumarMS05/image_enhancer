import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BackgroundEffects from './components/BackgroundEffects';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';

// Landing Sections
import HeroSection from './components/HeroSection';
import TopFeatures from './components/TopFeatures';
import InteractiveDemo from './components/InteractiveDemo';
import FeatureShowcase from './components/FeatureShowcase';
import Statistics from './components/Statistics';
import FeatureGrid from './components/FeatureGrid';
import UploadSection from './components/UploadSection';

// Other Sections
import HistorySection from './components/HistorySection';
import AnalysisResults from './components/AnalysisResults';
import ImageComparison from './components/ImageComparison';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://127.0.0.1:5000';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadResult, setUploadResult] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleLogin = (newToken, newUsername) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername(null);
    setImages([]);
    setActiveTab('upload');
  };

  const fetchImages = async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/images`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('Failed to fetch images:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchImages();
    }
  }, [token]);

  const handleUploadSuccess = (result) => {
    if (result.type === 'error' && result.status === 401) {
      handleLogout();
      return;
    }
    setUploadResult(result);
    if (token) {
      fetchImages();
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background transition-colors duration-300 selection:bg-accent/30">
      {/* Skip to main content — keyboard accessibility */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <BackgroundEffects />
      
      <Navbar 
        username={username}
        onLogout={handleLogout}
        onLoginClick={() => setAuthModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        apiBase={API_BASE} 
        onLogin={handleLogin} 
      />

      <main id="main-content" className="flex-1 w-full z-10 pt-16">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col"
            >
              <HeroSection apiBase={API_BASE} onSuccess={handleUploadSuccess} token={token} />
              <div className="max-w-4xl mx-auto px-6 w-full -mt-10 mb-20 relative z-20">
                <UploadSection apiBase={API_BASE} onSuccess={handleUploadSuccess} token={token} />
              </div>
              
              {/* Results Section directly below Hero if available */}
              {uploadResult && (
                <div className="max-w-6xl mx-auto px-6 w-full mb-24">
                  {uploadResult.type === 'success' && uploadResult.analysis && (
                    <AnalysisResults
                      analysis={uploadResult.analysis}
                      recommendation={uploadResult.recommendation}
                      recommendations={uploadResult.recommendations}
                      enhancementsApplied={uploadResult.enhancementsApplied}
                      enhancementMode={uploadResult.enhancementMode}
                    />
                  )}
                  {uploadResult.type === 'success' && uploadResult.originalUrl && (
                    <ImageComparison 
                      originalUrl={uploadResult.originalUrl} 
                      enhancedUrl={uploadResult.enhancedUrl} 
                      filename={uploadResult.filename}
                      enhancementMode={uploadResult.enhancementMode}
                    />
                  )}
                  {uploadResult.type === 'error' && (
                    <div className="glass-panel p-6 bg-red-500/10 border-red-500/20 mt-8">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">❌</span>
                        <h3 className="text-[15px] font-bold text-red-500">{uploadResult.title}</h3>
                      </div>
                      <p className="text-sm text-red-400">{uploadResult.message}</p>
                    </div>
                  )}
                </div>
              )}

              <TopFeatures />
              <InteractiveDemo />
              <FeatureShowcase />
              <Statistics />
              <FeatureGrid />
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {token ? (
                <HistorySection 
                  images={images} 
                  loading={loadingHistory} 
                  onRefresh={fetchImages} 
                  apiBase={API_BASE} 
                />
              ) : (
                <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center z-10 relative">
                  <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6 shadow-lg shadow-accent/20">
                    🔒
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">Sign in to view history</h2>
                  <p className="text-muted-foreground max-w-md mx-auto mb-8">
                    Create a free account or sign in to save your enhanced images, view analysis history, and download high-resolution results at any time.
                  </p>
                  <button 
                    onClick={() => setAuthModalOpen(true)}
                    className="px-8 py-3 rounded-full bg-accent hover:bg-accent-light text-white font-bold transition-all shadow-lg shadow-accent/20"
                  >
                    Sign In / Register
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default App;

