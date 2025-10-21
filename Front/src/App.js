import React from 'react';
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
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchTrails());
  })

  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path='/' element={ <HomePage /> } />
        <Route path='/trail-directory' element={ <TrailDirectory /> } />
        <Route path='/trail-directory/:id' element={ <TrailDetailPage /> } />
        <Route path='/contact-us' element={ <ContactPage /> } />
        <Route path='/safety' element={ <SafetyPage /> } />
        <Route path='/about-us' element={ <AboutPage /> } />
        <Route path='/user-profile' element={ <UserProfile /> } />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
