// src/App.js
import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import Header from './components/Header';
import Footer from './components/Footer';
import TrailDirectory from './pages/TrailDirectory';
import TrailDetailPage from './pages/TrailDetailPage';
import ContactPage from './pages/ContactPage';
import SafetyPage from './pages/SafetyPage';
import AboutPage from './pages/AboutPage';
import { fetchTrails } from './features/trails/trailsSlice';
import UserProfile from './pages/UserProfile';
import ProfileOnboarding from './components/ProfileOnboarding';
import { useDispatch } from 'react-redux';
import { useAuth0 } from '@auth0/auth0-react';
import { useProfileCheck } from './hooks/useProfileCheck';

import { RutasSenderismo } from './pages/RutasSenderismo';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useAuth0();
  const { hasHealthData, loading: profileLoading } = useProfileCheck();
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  useEffect(() => {
    dispatch(fetchTrails());
  }, [dispatch]);

  // Determinar si mostrar el onboarding
  const showOnboarding = isAuthenticated && 
                        !isLoading && 
                        !profileLoading && 
                        !hasHealthData && 
                        !onboardingCompleted;

  console.log('🔍 Estado de la aplicación:', {
    isAuthenticated,
    isLoading,
    profileLoading,
    hasHealthData,
    onboardingCompleted,
    showOnboarding
  });

  const handleOnboardingComplete = () => {
    console.log('✅ Onboarding completado manualmente');
    setOnboardingCompleted(true);
  };

  // Mostrar loading mientras se verifica el estado
  if (isAuthenticated && (isLoading || profileLoading)) {
    return (
      <div className="App">
        <Header />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="text-center">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-3 text-muted">
              {isLoading ? 'Iniciando sesión...' : 'Verificando tu perfil...'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      
      {/* MOSTRAR ONBOARDING SOLO EN PRIMERA VEZ */}
      {showOnboarding ? (
        <ProfileOnboarding onComplete={handleOnboardingComplete} />
      ) : (
        /* APLICACIÓN NORMAL */
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/trail-directory' element={<TrailDirectory />} />
          <Route path='/trail-directory/:id' element={<TrailDetailPage />} />
          <Route path='/contact-us' element={<ContactPage />} />
          <Route path='/safety' element={<SafetyPage />} />
          <Route path='/about-us' element={<AboutPage />} />
          <Route path='/user-profile' element={<UserProfile />} />
          <Route path='/list-routes' element={<RutasSenderismo />} />
        </Routes>
      )}
      
      <Footer />
    </div>
  );
}

export default App;