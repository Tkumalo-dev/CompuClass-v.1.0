import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const appTheme = {
  background: '#FFFFFF',
  surface: '#F3F4F6',
  card: '#FFFFFF',
  primary: '#2563EB',
  secondary: '#FACC15',
  accent: '#EF4444',
  success: '#22C55E',
  purple: '#8B5CF6',
  text: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  error: '#EF4444',
  warning: '#FACC15',
  overlay: 'rgba(0,0,0,0.5)',
  primaryGradient: ['#2563EB', '#1D4ED8'],
  headerGradient: ['#FFFFFF', '#FFFFFF'],
  gradient: ['#F3F4F6', '#FFFFFF'],
};

export const lightTheme = appTheme;
export const darkTheme = appTheme;

export const ThemeProvider = ({ children }) => {
  const [theme] = useState(appTheme);
  const [isDark] = useState(false);
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
