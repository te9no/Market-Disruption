import React from 'react';
import type { Player } from '../store/gameSlice';
import PersonalMarket from './PersonalMarket';
import { useSocket } from '../hooks/useSocket';

interface PlayerMarketViewProps {
  player: Player;
  currentPlayerId: string;
  isMyTurn: boolean;
}

const PlayerMarketView: React.FC<PlayerMarketViewProps> = ({ 
  player, 
  currentPlayerId, 
  isMyTurn 
}) => {
  const { sendGameAction } = useSocket();
  const isCurrentPlayer = player.id === currentPlayerId;

  const getPrestigeStatus = (prestige: number) => {
    if (prestige >= 17) return { label: '👑 業界の帝王', color: '#fbbf24' };
    if (prestige >= 15) return { label: '🌟 業界リーダー', color: '#3b82f6' };
    if (prestige >= 10) return { label: '💼 信頼企業', color: '#10b981' };
    if (prestige >= 5) return { label: '🏢 一般企業', color: '#6b7280' };
    if (prestige >= 0) return { label: '⚠️ 要注意企業', color: '#f59e0b' };
    if (prestige >= -3) return { label: '💥 問題企業', color: '#ef4444' };
    return { label: '🚫 市場排除', color: '#1f2937' };
  };

  const prestigeInfo = getPrestigeStatus(player.prestige);

  // Handle purchase from this player's market
  const handlePurchase = (productId: string, price: number, popularity: number) => {
    console.log(`🛒 Purchasing from ${player.name}:`, { productId, price, popularity });
    sendGameAction({
      type: 'purchase',
      sellerId: player.id,
      productId,
      price,
      popularity
    });
  };

  // Handle review of this player's products
  const handleReview = (productId: string) => {
    console.log(`⭐ Reviewing ${player.name}'s product:`, { productId });
    sendGameAction({
      type: 'review',
      targetProductId: productId,
      reviewType: 'positive', // Default to positive review
      useOutsourcing: false // Default to direct review
    });
  };

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: prestigeInfo.color }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {player.name}
                {isCurrentPlayer && (
                  <span className="ml-2 bg-blue-500 text-white text-sm px-2 py-1 rounded-full">
                    YOU
                  </span>
                )}
              </h2>
              <div className="text-sm" style={{ color: prestigeInfo.color }}>
                {prestigeInfo.label}
              </div>
            </div>
          </div>
        </div>

        {/* Player Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ¥{player.funds.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">💰 資金</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: prestigeInfo.color }}>
              {player.prestige}
            </div>
            <div className="text-sm text-gray-600">👑 威厳</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {player.actionPoints}/3
            </div>
            <div className="text-sm text-gray-600">⚡ AP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {player.resaleHistory}
            </div>
            <div className="text-sm text-gray-600">🔄 転売回数</div>
          </div>
        </div>

        {/* Inventory Count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              📦 {player.inventory.length}個
            </div>
            <div className="text-sm text-gray-600">在庫</div>
          </div>
        </div>
      </div>

      {/* Personal Market */}
      <PersonalMarket 
        personalMarket={player.personalMarket}
        playerId={player.id}
        currentPlayerId={currentPlayerId}
        isMyTurn={isMyTurn}
        canInteract={isMyTurn && !isCurrentPlayer}
        onPurchase={handlePurchase}
        onReview={handleReview}
      />
    </div>
  );
};

export default PlayerMarketView;