import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    const token = localStorage.getItem('hisabbook_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        setActiveProject(res.activeProject);
        if (res.activeProject) {
          localStorage.setItem('hisabbook_active_project_id', res.activeProject._id);
        }
        await refreshProjects();
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
      localStorage.removeItem('hisabbook_token');
      localStorage.removeItem('hisabbook_active_project_id');
      setUser(null);
      setActiveProject(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProjects = async () => {
    try {
      const res = await api.getProjects();
      if (res.success) {
        setProjects(res.data);
      }
    } catch (err) {
      console.error('Failed to load projects list:', err);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      localStorage.setItem('hisabbook_token', res.token);
      setUser(res.user);
      setActiveProject(res.activeProject);
      if (res.activeProject) {
        localStorage.setItem('hisabbook_active_project_id', res.activeProject._id);
      }
      await refreshProjects();
      return res;
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success) {
      localStorage.setItem('hisabbook_token', res.token);
      setUser(res.user);
      setActiveProject(res.activeProject);
      if (res.activeProject) {
        localStorage.setItem('hisabbook_active_project_id', res.activeProject._id);
      }
      await refreshProjects();
      return res;
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setActiveProject(null);
    setProjects([]);
  };

  const switchProject = async (projectId) => {
    try {
      const res = await api.switchProject(projectId);
      if (res.success) {
        setActiveProject(res.data);
        localStorage.setItem('hisabbook_active_project_id', res.data._id);
        await initAuth();
        return res.data;
      }
    } catch (err) {
      console.error('Project switch error:', err);
      throw err;
    }
  };

  const updateActiveProject = (updatedProject) => {
    setActiveProject(updatedProject);
    refreshProjects();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeProject,
        projects,
        loading,
        login,
        register,
        logout,
        switchProject,
        refreshProjects,
        updateActiveProject,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
