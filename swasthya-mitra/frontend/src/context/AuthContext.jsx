import { createContext, useContext, useState, useEffect } from 'react';
import { getProfileDefaults, isProfileComplete } from '../utils/profileHelpers';
import { clearAllData } from '../services/dataStore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('swasthya-auth');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Migration: old sessions without profileComplete field
    if (parsed && parsed.profileComplete === undefined) {
      return { ...parsed, profileComplete: true, abhaLinked: false, abhaId: null, profile: null };
    }
    return parsed;
  });

  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('swasthya-auth', JSON.stringify(user));
    } else {
      localStorage.removeItem('swasthya-auth');
    }
  }, [user]);

  const login = (role, phone, language) => {
    setUser({
      role,
      phone,
      language,
      name: null,
      profileComplete: false,
      abhaLinked: false,
      abhaId: null,
      profile: getProfileDefaults(role),
    });
    setShowLogin(false);
  };

  const updateProfile = (profileData) => {
    setUser(prev => {
      if (!prev) return prev;
      const newProfile = { ...prev.profile, ...profileData };
      // Handle nested address merge
      if (profileData.address) {
        newProfile.address = { ...prev.profile?.address, ...profileData.address };
      }
      if (profileData.clinicAddress) {
        newProfile.clinicAddress = { ...prev.profile?.clinicAddress, ...profileData.clinicAddress };
      }
      const complete = isProfileComplete(prev.role, newProfile);
      return {
        ...prev,
        profile: newProfile,
        name: newProfile.fullName || prev.name,
        profileComplete: complete,
      };
    });
  };

  const linkAbha = (abhaId) => {
    setUser(prev => prev ? { ...prev, abhaLinked: true, abhaId } : prev);
  };

  const logout = () => {
    clearAllData();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateProfile,
      linkAbha,
      showLogin,
      setShowLogin,
      isLoggedIn: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
