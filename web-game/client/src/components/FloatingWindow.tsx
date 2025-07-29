import React, { useState, useRef, useEffect } from 'react';

interface FloatingWindowProps {
  title: string;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  isOpen: boolean;
  onClose: () => void;
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
  className?: string;
}

const FloatingWindow: React.FC<FloatingWindowProps> = ({
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 500 },
  isOpen,
  onClose,
  onToggleMinimize,
  isMinimized = false,
  className = ''
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      className={`fixed bg-white rounded-lg shadow-2xl border border-gray-300 z-50 ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: isMinimized ? 'auto' : size.height,
        minWidth: 300,
        minHeight: isMinimized ? 'auto' : 200,
      }}
    >
      {/* Title Bar */}
      <div
        className="drag-handle flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-t-lg cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <h3 className="font-bold text-sm">{title}</h3>
        <div className="flex items-center space-x-2">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
              title={isMinimized ? "最大化" : "最小化"}
            >
              {isMinimized ? '⬆️' : '⬇️'}
            </button>
          )}
          <button
            onClick={onClose}
            className="hover:bg-red-500 rounded p-1 transition-colors"
            title="閉じる"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 overflow-auto" style={{ height: size.height - 60 }}>
          {children}
        </div>
      )}

      {/* Resize Handle */}
      {!isMinimized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{
            background: 'linear-gradient(-45deg, transparent 30%, #ccc 30%, #ccc 70%, transparent 70%)'
          }}
          onMouseDown={(e) => {
            setIsResizing(true);
            setDragStart({ x: e.clientX, y: e.clientY });
          }}
        />
      )}
    </div>
  );
};

export default FloatingWindow;