import React, { useState } from 'react';
import PersonalMarket from './PersonalMarket';
import type { Player } from '../store/gameSlice';
import { useSocket } from '../hooks/useSocket';

interface AllPlayersMarketsProps {
  players: Player[];
  currentPlayerId: string;
  isMyTurn: boolean;
  manufacturerAutomata: any;
  resaleAutomata: any;
}

const AllPlayersMarkets: React.FC<AllPlayersMarketsProps> = ({ 
  players, 
  currentPlayerId, 
  isMyTurn,
  manufacturerAutomata,
  resaleAutomata 
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(currentPlayerId);
  const { sendGameAction } = useSocket();

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const handlePurchase = (productId: string, price: number, popularity: number) => {
    if (!isMyTurn) {
      alert('あなたのターンではありません');
      return;
    }

    sendGameAction({
      type: 'purchase',
      sellerId: selectedPlayerId,
      productId,
      price,
      popularity
    });
  };

  const handleReview = (productId: string) => {
    if (!isMyTurn) {
      alert('あなたのターンではありません');
      return;
    }

    sendGameAction({
      type: 'review',
      targetProductId: productId,
      reviewType: 'positive', // Default to positive review
      useOutsourcing: false // Default to direct review
    });
  };

  return (
    <div className="space-y-4">
      {/* Player Selection Tabs */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">🏪 プレイヤー別マーケット</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedPlayerId(player.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedPlayerId === player.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {player.name}
              {player.id === currentPlayerId && ' (あなた)'}
              <span className="ml-2 text-xs opacity-75">
                ¥{player.funds} | 威厳{player.prestige}
              </span>
            </button>
          ))}
          <button
            onClick={() => setSelectedPlayerId('manufacturer-automata')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedPlayerId === 'manufacturer-automata'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏭 メーカーオートマ
          </button>
          <button
            onClick={() => setSelectedPlayerId('resale-automata')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              selectedPlayerId === 'resale-automata'
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💰 転売オートマ
            <span className="ml-2 text-xs opacity-75">
              ¥{resaleAutomata?.funds || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Selected Market Display */}
      <div className="bg-white rounded-lg shadow-lg">
        {selectedPlayerId === 'manufacturer-automata' ? (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4 text-red-700">🏭 メーカーオートマ マーケット</h3>
            <PersonalMarket 
              personalMarket={manufacturerAutomata?.personalMarket || {}} 
              playerId="manufacturer-automata"
              canInteract={true}
              currentPlayerId={currentPlayerId}
              isMyTurn={isMyTurn}
              onPurchase={handlePurchase}
              onReview={handleReview}
            />
          </div>
        ) : selectedPlayerId === 'resale-automata' ? (
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4 text-green-700">💰 転売オートマ マーケット</h3>
            <div className="mb-2 text-sm text-gray-600">
              現在の資金: ¥{resaleAutomata?.funds || 0}
            </div>
            <PersonalMarket 
              personalMarket={resaleAutomata?.personalMarket || {}} 
              playerId="resale-automata"
              canInteract={true}
              currentPlayerId={currentPlayerId}
              isMyTurn={isMyTurn}
              onPurchase={handlePurchase}
              onReview={handleReview}
            />
          </div>
        ) : selectedPlayer ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-blue-700">
                {selectedPlayer.name} のマーケット
                {selectedPlayer.id === currentPlayerId && ' (あなた)'}
              </h3>
              <div className="flex space-x-4 text-sm">
                <span>💰 資金: {selectedPlayer.funds}</span>
                <span>⭐ 威厳: {selectedPlayer.prestige}</span>
                <span>🔄 転売履歴: {selectedPlayer.resaleHistory}</span>
                <span>⚡ AP: {selectedPlayer.actionPoints}</span>
              </div>
            </div>
            {/* Personal Market廃止につきコメントアウト
            <PersonalMarket 
              personalMarket={selectedPlayer.personalMarket || {}} 
              playerId={selectedPlayer.id}
              canInteract={true}
              currentPlayerId={currentPlayerId}
              isMyTurn={isMyTurn} */}
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-4">🏪</div>
              <p className="text-lg font-bold">共有マーケットボードに移行しました</p>
              <p className="text-sm mt-2">メインゲーム画面で全プレイヤーの商品を確認できます</p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            プレイヤーが選択されていません
          </div>
        )}
      </div>
    </div>
  );
};

export default AllPlayersMarkets;