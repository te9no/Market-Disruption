import React from 'react';
import FloatingWindow from './FloatingWindow';
import { useFloatingWindows } from '../hooks/useFloatingWindows';

const FloatingWindowManager: React.FC = () => {
  const { windows, closeWindow, toggleMinimize } = useFloatingWindows();

  return (
    <>
      {windows.map(window => (
        <FloatingWindow
          key={window.id}
          title={window.title}
          isOpen={window.isOpen}
          isMinimized={window.isMinimized}
          defaultPosition={window.position}
          defaultSize={window.size}
          onClose={() => closeWindow(window.id)}
          onToggleMinimize={() => toggleMinimize(window.id)}
        >
          {window.component}
        </FloatingWindow>
      ))}
    </>
  );
};

export default FloatingWindowManager;