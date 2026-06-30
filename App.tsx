import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BentoGrid } from './components/BentoGrid';

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
    <div className="min-h-screen px-4 py-4 transition-colors duration-300 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl">
        <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />
        <BentoGrid />
      </div>
    </div>
  );
}
