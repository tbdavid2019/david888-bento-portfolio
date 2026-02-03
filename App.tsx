import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BentoGrid } from './components/BentoGrid';
import { FloatingDock } from './components/FloatingDock';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference on mount
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
        <BentoGrid />
      </div>
      <FloatingDock />
    </div>
  );
}