import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

const ConnectionStatus: React.FC = () => {
  const { isConnected } = useSelector((state: RootState) => state.socket);
  const { gameId, error } = useSelector((state: RootState) => state.game);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium">
              {isConnected ? '接続済み' : '切断'}
            </span>
          </div>
          
          {gameId && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">ゲームID:</span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                {gameId}
              </code>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>エラー:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;