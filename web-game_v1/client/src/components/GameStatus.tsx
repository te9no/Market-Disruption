import React from 'react';
import type { Player } from '../store/gameSlice';

interface GameStatusProps {
  round: number;
  phase: 'action' | 'automata' | 'market';
  currentPlayerIndex: number;
  players: Player[];
  pollution?: {
    'game-console': number;
    'diy-gadget': number;
    'figure': number;
    'accessory': number;
    'toy': number;
  };
  globalPollution?: number;
  regulationLevel: number;
}

const getPhaseNameJa = (phase: string) => {
  switch (phase) {
    case 'action': return 'アクションフェーズ';
    case 'automata': return 'オートマフェーズ';
    case 'market': return '市場フェーズ';
    default: return phase;
  }
};

const getCategoryNameJa = (category: string) => {
  switch (category) {
    case 'game-console': return 'ゲーム機';
    case 'diy-gadget': return '自作ガジェット';
    case 'figure': return 'フィギュア';
    case 'accessory': return 'アクセサリー';
    case 'toy': return 'おもちゃ';
    default: return category;
  }
};

const getRegulationStatus = (level: number) => {
  switch (level) {
    case 0: return { text: '規制なし', color: 'text-green-600' };
    case 1: return { text: 'パブリックコメント', color: 'text-yellow-600' };
    case 2: return { text: '検討中', color: 'text-orange-600' };
    case 3: return { text: '規制発動', color: 'text-red-600' };
    default: return { text: '不明', color: 'text-gray-600' };
  }
};

const GameStatus: React.FC<GameStatusProps> = ({ 
  round, 
  phase, 
  currentPlayerIndex, 
  players, 
  pollution, 
  globalPollution,
  regulationLevel 
}) => {
  const currentPlayer = players[currentPlayerIndex];
  const regulation = getRegulationStatus(regulationLevel);

  // Calculate overall market health
  const totalPollution = globalPollution || (pollution ? Object.values(pollution).reduce((sum, level) => sum + level, 0) : 0);
  const marketHealth = Math.max(0, 100 - (totalPollution * 4));

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'action': return '⚡';
      case 'automata': return '🤖';
      case 'market': return '🏪';
      default: return '❓';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'game-console': return '🎮';
      case 'diy-gadget': return '🔧';
      case 'figure': return '🎭';
      case 'accessory': return '💍';
      case 'toy': return '🧸';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Game Status */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <span>📊</span>
            <span>ゲーム状況</span>
          </h2>
          <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
            <div className="text-sm opacity-90">全体的な市場健全度</div>
            <div className="text-xl font-bold">{marketHealth}%</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">📅</span>
              <div>
                <div className="text-lg font-bold">ラウンド {round}</div>
                <div className="text-sm opacity-80">現在進行中</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">{getPhaseIcon(phase)}</span>
              <div>
                <div className="text-lg font-bold">{getPhaseNameJa(phase)}</div>
                <div className="text-sm opacity-80">実行中</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">👤</span>
              <div>
                <div className="text-lg font-bold">{currentPlayer?.name || '不明'}</div>
                <div className="text-sm opacity-80">現在のプレイヤー</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Pollution */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🏭</span>
            <h3 className="text-xl font-bold text-gray-800">市場汚染状況</h3>
          </div>
          
          <div className="space-y-3">
            {globalPollution !== undefined ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🌍</span>
                    <span className="font-medium">全体汚染</span>
                  </div>
                  <div className={`font-bold px-2 py-1 rounded-full text-xs ${
                    globalPollution <= 2 ? 'bg-green-100 text-green-800' :
                    globalPollution <= 5 ? 'bg-yellow-100 text-yellow-800' :
                    globalPollution <= 8 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {globalPollution}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      globalPollution <= 2 ? 'bg-green-500' :
                      globalPollution <= 5 ? 'bg-yellow-500' :
                      globalPollution <= 8 ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(globalPollution * 8, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600">
                  {globalPollution <= 2 ? '正常' :
                   globalPollution <= 5 ? '軽度汚染 (-1価格)' :
                   globalPollution <= 8 ? '中度汚染 (-2価格)' :
                   globalPollution <= 11 ? '重度汚染 (-3価格)' :
                   '極度汚染 (-4価格)'}
                </div>
              </div>
            ) : (
              pollution && Object.entries(pollution).map(([category, level]) => {
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                        <span className="font-medium">{getCategoryNameJa(category)}</span>
                      </div>
                      <div className={`font-bold px-2 py-1 rounded-full text-xs ${
                        level === 0 ? 'bg-green-100 text-green-800' :
                        level <= 2 ? 'bg-yellow-100 text-yellow-800' :
                        level <= 4 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {level >= 5 ? '💥 崩壊' : `${level}/5`}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          level === 0 ? 'bg-green-500' :
                          level <= 2 ? 'bg-yellow-500' :
                          level <= 4 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (level / 5) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Regulation Status */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">⚖️</span>
            <h3 className="text-xl font-bold text-gray-800">規制状況</h3>
          </div>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-l-4 ${
              regulationLevel === 0 ? 'bg-green-50 border-green-500' :
              regulationLevel === 1 ? 'bg-yellow-50 border-yellow-500' :
              regulationLevel === 2 ? 'bg-orange-50 border-orange-500' :
              'bg-red-50 border-red-500'
            }`}>
              <div className={`font-bold text-lg ${regulation.color}`}>
                {regulation.text}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {regulationLevel === 0 && '🟢 転売規制は未検討'}
                {regulationLevel === 1 && '🟡 転売ヤー・オートマが慎重になる'}
                {regulationLevel === 2 && '🟠 転売価格制限: 購入価格+3資金'}
                {regulationLevel === 3 && '🔴 転売価格制限: 購入価格+1資金、全転売在庫没収'}
              </div>
            </div>
            
            {/* Regulation Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">規制進行度</span>
                <span className="font-medium">{regulationLevel}/3</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(regulationLevel / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Player Rankings */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🏆</span>
            <h3 className="text-xl font-bold text-gray-800">プレイヤー順位</h3>
          </div>
          
          <div className="space-y-3">
            {[...players]
              .sort((a, b) => {
                // Victory conditions check
                const aVictory = (a.prestige >= 17 && a.funds >= 75) || a.funds >= 150;
                const bVictory = (b.prestige >= 17 && b.funds >= 75) || b.funds >= 150;
                
                if (aVictory && !bVictory) return -1;
                if (!aVictory && bVictory) return 1;
                
                // Sort by combined score (funds + prestige * 10)
                const aScore = a.funds + (a.prestige * 10);
                const bScore = b.funds + (b.prestige * 10);
                return bScore - aScore;
              })
              .map((player, index) => {
                const isVictory = (player.prestige >= 17 && player.funds >= 75) || player.funds >= 150;
                const isCurrentPlayer = player.id === currentPlayer?.id;
                
                return (
                  <div 
                    key={player.id} 
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      isCurrentPlayer ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    } ${isVictory ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-600' :
                          'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium flex items-center space-x-2">
                            <span>{player.name}</span>
                            {isVictory && <span className="text-yellow-500">👑</span>}
                            {isCurrentPlayer && <span className="text-blue-500">⭐</span>}
                          </div>
                          <div className="text-xs text-gray-600">
                            💰 {player.funds.toLocaleString()}資金 | 👑 {player.prestige}威厳 | 🔄 {player.resaleHistory}回転売
                          </div>
                        </div>
                      </div>
                      
                      {isVictory && (
                        <div className="text-right">
                          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                            勝利条件達成!
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStatus;