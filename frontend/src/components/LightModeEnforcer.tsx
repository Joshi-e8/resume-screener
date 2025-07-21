"use client";

import { useEffect } from "react";

export function LightModeEnforcer() {
  useEffect(() => {
    // Force light mode by removing dark class and clearing localStorage
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
    
    // Set light theme explicitly
    localStorage.setItem('theme', 'light');
  }, []);

  return null; // This component doesn't render anything
}
