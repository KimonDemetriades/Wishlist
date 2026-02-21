import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [autoClean, setAutoClean] = useState(true); // Auto-clean WhatsApp/etc formatting

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    saveSettings();
  }, [autoClean]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('@settings');
      if (saved) {
        const settings = JSON.parse(saved);
        setAutoClean(settings.autoClean ?? true);
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = { autoClean };
      await AsyncStorage.setItem('@settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  const value = {
    autoClean,
    setAutoClean,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};