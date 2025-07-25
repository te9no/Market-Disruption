import React from 'react';
import type { Player } from '../store/gameSlice';
import PersonalMarket from './PersonalMarket';
import DesignBoard from './DesignBoard';
import Inventory from './Inventory';

interface PlayerBoardProps {
  player: Player;
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({ player }) => {
  // Calculate prestige status and related info
  const getPrestigeStatus = (prestige: number) => {
    if (prestige >= 17) return { label: '👑 業界の帝王', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', textColor: '#fef3c7' };
    if (prestige >= 15) return { label: '🌟 業界リーダー', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', textColor: '#dbeafe' };
    if (prestige >= 10) return { label: '💼 信頼企業', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', textColor: '#d1fae5' };
    if (prestige >= 5) return { label: '🏢 一般企業', background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', textColor: '#f3f4f6' };
    if (prestige >= 0) return { label: '⚠️ 要注意企業', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', textColor: '#fef3c7' };
    if (prestige >= -3) return { label: '💥 問題企業', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', textColor: '#fecaca' };
    return { label: '🚫 市場排除', background: 'linear-gradient(135deg, #1f2937 0%, #000000 100%)', textColor: '#fecaca' };
  };

  const getResaleBonus = (history: number) => {
    if (history <= 1) return 0;
    if (history <= 4) return 3;
    if (history <= 7) return 6;
    return 10;
  };

  const prestigeInfo = getPrestigeStatus(player.prestige);
  const priceMultiplier = player.prestige <= 2 ? 2 : player.prestige <= 8 ? 3 : 4;
  const resaleBonus = getResaleBonus(player.resaleHistory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Enhanced Player Stats Header */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.1)'
      }}>
        {/* Gradient Header */}
        <div style={{
          background: prestigeInfo.background,
          padding: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: prestigeInfo.textColor,
                marginBottom: '8px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                margin: 0
              }}>
                🎯 {player.name}
              </h2>
              <p style={{
                fontSize: '18px',
                color: prestigeInfo.textColor,
                opacity: 0.9,
                margin: 0
              }}>
                {prestigeInfo.label}
              </p>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <div style={{
                fontSize: '14px',
                color: prestigeInfo.textColor,
                opacity: 0.8,
                marginBottom: '8px'
              }}>残りAP</div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: prestigeInfo.textColor
              }}>
                {player.actionPoints}<span style={{ fontSize: '20px', opacity: 0.6 }}>/3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ padding: '32px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {/* Funds */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '16px',
              padding: '20px',
              border: '2px solid #bbf7d0',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(34, 197, 94, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '24px', marginRight: '8px' }}>💰</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#15803d' }}>資金</span>
              </div>
              <div className="text-2xl font-bold text-green-800">
                ¥{player.funds.toLocaleString()}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {player.funds >= 150 ? '🎉 資金勝利圏!' : player.funds >= 100 ? '📈 好調' : '💪 頑張れ'}
              </div>
            </div>

            {/* Prestige */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">👑</span>
                <span className="text-sm font-medium text-purple-700">威厳</span>
              </div>
              <div className="text-2xl font-bold text-purple-800">
                {player.prestige}
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {player.prestige >= 17 ? '🏆 威厳勝利圏!' : `価格上限 ×${priceMultiplier}`}
              </div>
            </div>

            {/* Resale History */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🔄</span>
                <span className="text-sm font-medium text-orange-700">転売履歴</span>
              </div>
              <div className="text-2xl font-bold text-orange-800">
                {player.resaleHistory}
              </div>
              <div className="text-xs text-orange-600 mt-1">
                {resaleBonus > 0 ? `+¥${resaleBonus} ボーナス` : 'ボーナスなし'}
              </div>
            </div>

            {/* Market Access */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🏪</span>
                <span className="text-sm font-medium text-blue-700">市場アクセス</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {player.prestige >= -3 ? '✅' : '🚫'}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {player.prestige >= -3 ? '正規販売可能' : '市場排除中'}
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="mt-6 space-y-3">
            {/* Funds Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">資金勝利まで</span>
                <span className="text-gray-800">{Math.max(0, 150 - player.funds)}¥</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (player.funds / 150) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Prestige Progress (威厳勝利の場合は資金75も必要) */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">威厳勝利まで</span>
                <span className="text-gray-800">
                  威厳{Math.max(0, 17 - player.prestige)} & 資金{Math.max(0, 75 - player.funds)}¥
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(100, ((player.prestige >= 17 && player.funds >= 75) ? 100 : 
                             (player.prestige / 17) * 50 + (player.funds / 75) * 50))}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Design Board */}
      <DesignBoard designs={player.designs} openSourceDesigns={player.openSourceDesigns} />

      {/* Enhanced Inventory */}
      <Inventory inventory={player.inventory} />

      {/* Enhanced Personal Market */}
      <PersonalMarket 
        personalMarket={player.personalMarket} 
        playerId={player.id}
      />
    </div>
  );
};

export default PlayerBoard;