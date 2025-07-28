import React from 'react';
import type { Player } from '../store/gameSlice';
import ModernButton from './ModernButton';

interface VictoryDialogProps {
  winner: Player | null;
  players: Player[];
  onClose: () => void;
}

const VictoryDialog: React.FC<VictoryDialogProps> = ({ winner, players, onClose }) => {
  if (!winner) return null;

  // Determine victory type
  const prestigeVictory = winner.prestige >= 17 && winner.funds >= 75;
  const fundsVictory = winner.funds >= 150;

  // Sort all players by final score
  const rankedPlayers = [...players].sort((a, b) => {
    const aScore = a.funds + (a.prestige * 10);
    const bScore = b.funds + (b.prestige * 10);
    return bScore - aScore;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-t-2xl">
          <div className="text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold mb-2">ゲーム終了！</h1>
            <div className="text-xl opacity-90">マーケット・ディスラプション</div>
          </div>
        </div>

        {/* Winner Section */}
        <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-b">
          <div className="text-center">
            <div className="text-4xl mb-4">👑</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              勝者: {winner.name}
            </h2>
            
            <div className="bg-white rounded-lg p-4 shadow-inner">
              <div className="text-lg font-semibold text-gray-700 mb-3">勝利条件</div>
              
              {prestigeVictory && (
                <div className="bg-purple-100 border-l-4 border-purple-500 p-4 rounded-lg mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">👑</span>
                    <div>
                      <div className="font-bold text-purple-800">威厳勝利</div>
                      <div className="text-sm text-purple-600">
                        威厳{winner.prestige}ポイント + 資金{winner.funds}達成
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {fundsVictory && !prestigeVictory && (
                <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-lg mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💰</span>
                    <div>
                      <div className="font-bold text-green-800">資金勝利</div>
                      <div className="text-sm text-green-600">
                        資金{winner.funds}達成
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="text-lg font-bold text-blue-800">{winner.funds}</div>
                  <div className="text-xs text-blue-600">資金</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl mb-1">👑</div>
                  <div className="text-lg font-bold text-purple-800">{winner.prestige}</div>
                  <div className="text-xs text-purple-600">威厳</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl mb-1">🔄</div>
                  <div className="text-lg font-bold text-orange-800">{winner.resaleHistory}</div>
                  <div className="text-xs text-orange-600">転売履歴</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Rankings */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <span>📊</span>
            <span>最終順位</span>
          </h3>
          
          <div className="space-y-3">
            {rankedPlayers.map((player, index) => {
              const isWinner = player.id === winner.id;
              const totalScore = player.funds + (player.prestige * 10);
              
              return (
                <div 
                  key={player.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isWinner 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-lg' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                        index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
                        'bg-gradient-to-r from-gray-300 to-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold text-lg ${isWinner ? 'text-yellow-800' : 'text-gray-800'}`}>
                            {player.name}
                          </span>
                          {isWinner && <span className="text-2xl">👑</span>}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <span>💰</span>
                            <span>{player.funds}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>👑</span>
                            <span>{player.prestige}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>🔄</span>
                            <span>{player.resaleHistory}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-700">
                        {totalScore} pt
                      </div>
                      <div className="text-xs text-gray-500">
                        総合スコア
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex justify-center space-x-4">
            <ModernButton
              onClick={onClose}
              variant="primary"
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg"
            >
              ゲーム結果を確認
            </ModernButton>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            ゲーム時間: {Math.floor(Date.now() / 60000)} 分間<br/>
            お疲れ様でした！
          </div>
        </div>
      </div>
    </div>
  );
};

export default VictoryDialog;