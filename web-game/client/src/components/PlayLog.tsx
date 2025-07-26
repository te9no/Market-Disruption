import React from 'react';

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'action' | 'phase' | 'round' | 'game';
  playerId?: string;
  playerName?: string;
  message: string;
}

interface PlayLogProps {
  logs: LogEntry[];
  currentRound: number;
  currentPhase: string;
}

const PlayLog: React.FC<PlayLogProps> = ({ logs, currentRound, currentPhase }) => {
  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return '⚡';
      case 'phase': return '🔄';
      case 'round': return '🎯';
      case 'game': return '🎮';
      default: return '📝';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'action': return 'text-blue-600';
      case 'phase': return 'text-purple-600';
      case 'round': return 'text-green-600';
      case 'game': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          📜 プレイログ
        </h3>
        <div className="text-sm text-gray-600 mt-1">
          ラウンド {currentRound} | {currentPhase === 'action' ? '🎯 アクション' : currentPhase === 'automata' ? '🤖 オートマ' : '🏪 市場'}フェーズ
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3" data-playlog-scroll>
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-3">📜</div>
            <div className="font-medium">まだログがありません</div>
            <div className="text-sm mt-2">ゲームが進行するとここに表示されます</div>
          </div>
        ) : (
          logs.slice().reverse().map((log) => (
            <div
              key={log.id}
              className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getLogTypeIcon(log.type)}</span>
                  {log.playerName && (
                    <span className="text-sm font-medium text-gray-700">
                      {log.playerName}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatTime(log.timestamp)}
                </span>
              </div>
              <div className={`text-sm ${getLogTypeColor(log.type)}`}>
                {log.message}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Auto-scroll to bottom button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => {
            const logContainer = document.querySelector('[data-playlog-scroll]');
            if (logContainer) {
              logContainer.scrollTop = logContainer.scrollHeight;
            }
          }}
          className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded transition-colors"
        >
          ⬇️ 最新ログへ
        </button>
      </div>
    </div>
  );
};

export default PlayLog;