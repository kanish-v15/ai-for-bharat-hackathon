import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('swasthya-auth');
    return saved ? JSON.parse(saved) : null;
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
    setUser({ role, phone, language, name: role === 'doctor' ? 'Dr. Priya Sharma' : 'Ramesh Kumar' });
    setShowLogin(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, showLogin, setShowLogin, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
