import React from 'react';
import { useFloatingWindows } from '../hooks/useFloatingWindows';
import ActionPanel from './ActionPanel';
import Inventory from './Inventory';
import type { Player, GameState } from '../store/gameSlice';

interface FloatingToolbarProps {
  player: Player;
  isMyTurn: boolean;
  gamePhase: 'action' | 'automata' | 'market';
  gameState: GameState;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  player,
  isMyTurn,
  gamePhase,
  gameState
}) => {
  const { openWindow, isWindowOpen, closeWindow } = useFloatingWindows();

  // モバイル判定
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const toggleActionPanel = () => {
    if (isWindowOpen('action-panel')) {
      closeWindow('action-panel');
    } else {
      openWindow(
        'action-panel',
        '🎯 アクションパネル',
        <ActionPanel 
          player={player}
          isMyTurn={isMyTurn}
          gamePhase={gamePhase}
          gameState={gameState}
        />,
        {
          position: { 
            x: isMobile ? 10 : Math.min(20, window.innerWidth * 0.02), 
            y: isMobile ? 60 : 80 
          },
          size: { 
            width: isMobile ? Math.min(window.innerWidth - 20, 350) : Math.min(380, window.innerWidth * 0.4), 
            height: isMobile ? Math.min(window.innerHeight - 120, 400) : Math.min(500, window.innerHeight * 0.6) 
          }
        }
      );
    }
  };

  const toggleInventory = () => {
    if (isWindowOpen('inventory')) {
      closeWindow('inventory');
    } else {
      openWindow(
        'inventory',
        '📦 在庫',
        <Inventory inventory={player.inventory} />,
        {
          position: { 
            x: isMobile ? 10 : Math.max(window.innerWidth - 320, window.innerWidth * 0.6), 
            y: isMobile ? 60 : 80 
          },
          size: { 
            width: isMobile ? Math.min(window.innerWidth - 20, 280) : Math.min(280, window.innerWidth * 0.35), 
            height: isMobile ? Math.min(window.innerHeight - 120, 300) : Math.min(350, window.innerHeight * 0.5) 
          }
        }
      );
    }
  };

  return (
    <div className={`fixed ${isMobile ? 'bottom-2 left-2 right-2' : 'bottom-4 left-1/2 transform -translate-x-1/2'} z-[9999]`}>
      <div className={`bg-white bg-opacity-95 backdrop-blur-sm ${isMobile ? 'rounded-lg' : 'rounded-full'} shadow-lg border border-gray-200 ${isMobile ? 'px-2 py-2' : 'px-3 py-1.5'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2 justify-center' : 'space-x-2 md:space-x-3'}`}>
          <button
            onClick={toggleActionPanel}
            className={`flex items-center space-x-1 ${isMobile ? 'px-2 py-1.5' : 'px-3 py-1.5'} rounded-full text-xs font-medium transition-all duration-200 ${
              isWindowOpen('action-panel')
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="アクションパネルを開く/閉じる"
          >
            <span>🎯</span>
            {!isMobile && <span>アクション</span>}
          </button>

          {!isMobile && <div className="w-px h-6 bg-gray-300" />}

          <button
            onClick={toggleInventory}
            className={`flex items-center space-x-1 ${isMobile ? 'px-2 py-1.5' : 'px-3 py-1.5'} rounded-full text-xs font-medium transition-all duration-200 ${
              isWindowOpen('inventory')
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="在庫を開く/閉じる"
          >
            <span>📦</span>
            {!isMobile && <span>在庫 ({player.inventory.length})</span>}
          </button>

          {!isMobile && <div className="w-px h-6 bg-gray-300" />}

          <div className={`flex items-center space-x-1 ${isMobile ? 'px-1.5 py-1' : 'px-2 py-1'} bg-gray-50 rounded-full`}>
            <span className="text-xs text-gray-600">💰</span>
            <span className="text-xs font-bold text-green-600">
              {isMobile ? `¥${Math.floor(player.funds / 1000)}k` : `¥${player.funds.toLocaleString()}`}
            </span>
          </div>

          <div className={`flex items-center space-x-1 ${isMobile ? 'px-1.5 py-1' : 'px-2 py-1'} bg-gray-50 rounded-full`}>
            <span className="text-xs text-gray-600">👑</span>
            <span className="text-xs font-bold text-purple-600">{player.prestige}</span>
          </div>

          <div className={`flex items-center space-x-1 ${isMobile ? 'px-1.5 py-1' : 'px-2 py-1'} bg-gray-50 rounded-full`}>
            <span className="text-xs text-gray-600">⚡</span>
            <span className="text-xs font-bold text-blue-600">{player.actionPoints}/3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingToolbar;