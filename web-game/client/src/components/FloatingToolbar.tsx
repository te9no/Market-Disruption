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
          position: { x: 50, y: 100 },
          size: { width: 450, height: 600 }
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
          position: { x: window.innerWidth - 350, y: 100 },
          size: { width: 300, height: 400 }
        }
      );
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 px-4 py-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleActionPanel}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isWindowOpen('action-panel')
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="アクションパネルを開く/閉じる"
          >
            <span>🎯</span>
            <span>アクション</span>
          </button>

          <div className="w-px h-6 bg-gray-300" />

          <button
            onClick={toggleInventory}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              isWindowOpen('inventory')
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="在庫を開く/閉じる"
          >
            <span>📦</span>
            <span>在庫 ({player.inventory.length})</span>
          </button>

          <div className="w-px h-6 bg-gray-300" />

          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full">
            <span className="text-sm text-gray-600">💰</span>
            <span className="text-sm font-bold text-green-600">¥{player.funds.toLocaleString()}</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full">
            <span className="text-sm text-gray-600">👑</span>
            <span className="text-sm font-bold text-purple-600">{player.prestige}</span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-full">
            <span className="text-sm text-gray-600">⚡</span>
            <span className="text-sm font-bold text-blue-600">{player.actionPoints}/3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingToolbar;