import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface WindowState {
  id: string;
  title: string;
  component: ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface FloatingWindowsContextType {
  windows: WindowState[];
  openWindow: (id: string, title: string, component: ReactNode, options?: Partial<WindowState>) => void;
  closeWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  updatePosition: (id: string, position: { x: number; y: number }) => void;
  updateSize: (id: string, size: { width: number; height: number }) => void;
  isWindowOpen: (id: string) => boolean;
}

const FloatingWindowsContext = createContext<FloatingWindowsContextType | undefined>(undefined);

interface FloatingWindowsProviderProps {
  children: ReactNode;
}

export const FloatingWindowsProvider: React.FC<FloatingWindowsProviderProps> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);

  const openWindow = (
    id: string, 
    title: string, 
    component: ReactNode, 
    options: Partial<WindowState> = {}
  ) => {
    setWindows(prev => {
      const existingIndex = prev.findIndex(w => w.id === id);
      const newWindow: WindowState = {
        id,
        title,
        component,
        isOpen: true,
        isMinimized: false,
        position: { x: 100 + (prev.length * 30), y: 100 + (prev.length * 30) },
        size: { width: 400, height: 500 },
        ...options
      };

      if (existingIndex >= 0) {
        // Update existing window
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newWindow };
        return updated;
      } else {
        // Add new window
        return [...prev, newWindow];
      }
    });
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isOpen: false } : w
    ));
  };

  const toggleMinimize = (id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
    ));
  };

  const updatePosition = (id: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, position } : w
    ));
  };

  const updateSize = (id: string, size: { width: number; height: number }) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, size } : w
    ));
  };

  const isWindowOpen = (id: string) => {
    return windows.some(w => w.id === id && w.isOpen);
  };

  return (
    <FloatingWindowsContext.Provider value={{
      windows,
      openWindow,
      closeWindow,
      toggleMinimize,
      updatePosition,
      updateSize,
      isWindowOpen
    }}>
      {children}
    </FloatingWindowsContext.Provider>
  );
};

export const useFloatingWindows = () => {
  const context = useContext(FloatingWindowsContext);
  if (!context) {
    throw new Error('useFloatingWindows must be used within a FloatingWindowsProvider');
  }
  return context;
};