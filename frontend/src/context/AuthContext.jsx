import { createContext, useState, useEffect, useContext } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user?.token) {
      setAuthToken(user.token);
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.data);
    localStorage.setItem('user', JSON.stringify(res.data.data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setAuthToken(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};
