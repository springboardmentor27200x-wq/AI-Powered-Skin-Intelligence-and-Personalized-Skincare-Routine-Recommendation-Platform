import React, { useState, useEffect } from 'react';
import { api, getUserData, getToken } from './api';
import LoginRegister from './LoginRegister';
import SkinProfileWizard from './SkinProfileWizard';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profileWizardActive, setProfileWizardActive] = useState(false);

  const checkSession = async () => {
    const token = getToken();
    const cachedUser = getUserData();
    
    if (token && cachedUser) {
      setUser(cachedUser);
      if (cachedUser.role === 'USER') {
        try {
          const profile = await api.getProfile();
          if (profile) {
            setHasProfile(true);
            setProfileWizardActive(false);
          }
        } catch (err) {
          if (err.message === 'Skin profile not created yet') {
            setHasProfile(false);
            setProfileWizardActive(true);
          }
        }
      } else {
        // Clinical/Admin roles don't complete the skin profile wizard
        setHasProfile(true);
        setProfileWizardActive(false);
      }
    }
    setCheckingAuth(false);
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleAuthSuccess = async (authenticatedUser) => {
    setUser(authenticatedUser);
    
    if (authenticatedUser.role === 'USER') {
      try {
        const profile = await api.getProfile();
        if (profile) {
          setHasProfile(true);
          setProfileWizardActive(false);
        }
      } catch (err) {
        if (err.message === 'Skin profile not created yet') {
          setHasProfile(false);
          setProfileWizardActive(true);
        }
      }
    } else {
      setHasProfile(true);
      setProfileWizardActive(false);
    }
  };

  const handleProfileComplete = (profileData) => {
    setHasProfile(true);
    setProfileWizardActive(false);
  };

  const handleLogout = () => {
    setUser(null);
    setHasProfile(false);
    setProfileWizardActive(false);
  };

  const handleResetProfile = () => {
    setProfileWizardActive(true);
  };

  if (checkingAuth) {
    return (
      <div className="app-loader">
        <div className="loader-spinner"></div>
        <p>Analyzing Credentials & Loading Profiles...</p>
      </div>
    );
  }

  // Component Router
  if (!user) {
    return <LoginRegister onAuthSuccess={handleAuthSuccess} />;
  }

  if (user.role === 'USER' && profileWizardActive) {
    return <SkinProfileWizard onProfileComplete={handleProfileComplete} />;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <Dashboard 
      user={user} 
      onLogout={handleLogout} 
      onResetProfile={handleResetProfile} 
    />
  );
}

export default App;
