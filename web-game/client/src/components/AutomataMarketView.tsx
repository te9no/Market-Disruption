import React from 'react';
import PersonalMarket from './PersonalMarket';

interface AutomataMarketViewProps {
  automata: any;
  type: 'manufacturer' | 'resale';
  currentPlayerId: string;
  isMyTurn: boolean;
}

const AutomataMarketView: React.FC<AutomataMarketViewProps> = ({ 
  automata, 
  type, 
  currentPlayerId, 
  isMyTurn 
}) => {
  const automataName = type === 'manufacturer' ? 'メーカーオートマ' : '転売オートマ';
  const automataIcon = type === 'manufacturer' ? '🏭' : '💰';
  const automataId = type === 'manufacturer' ? 'manufacturer-automata' : 'resale-automata';

  const getAutomataDescription = () => {
    if (type === 'manufacturer') {
      return {
        description: '定期的に商品を製造・出品するオートマ',
        details: [
          '2d6の結果に応じて異なる行動を取ります',
          '高コスト商品や低コスト商品を製造',
          '人気商品にレビューを付けることがあります',
          '製造コストに応じた価格で出品します'
        ]
      };
    } else {
      return {
        description: '市場から商品を購入して転売するオートマ',
        details: [
          '2d6の結果に応じて異なる購入戦略を実行',
          '安い商品を大量購入したり、人気商品を狙い撃ち',
          `現在の資金: ${automata?.funds || 0}`,
          '規制レベルが高いと行動が制限されます'
        ]
      };
    }
  };

  const automataInfo = getAutomataDescription();

  // Convert automata market to the format expected by PersonalMarket
  const personalMarket = automata?.personalMarket || {};

  return (
    <div className="space-y-6">
      {/* Automata Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-r from-gray-600 to-gray-800"
            >
              {automataIcon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {automataName}
              </h2>
              <div className="text-sm text-gray-600">
                {automataInfo.description}
              </div>
            </div>
          </div>
        </div>

        {/* Automata Stats */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📋 動作仕様</h3>
          <ul className="space-y-2">
            {automataInfo.details.map((detail, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Inventory Count for Resale Automata */}
        {type === 'resale' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                📦 {automata?.inventory?.length || 0}個
              </div>
              <div className="text-sm text-gray-600">在庫</div>
            </div>
          </div>
        )}
      </div>

      {/* Personal Market */}
      <PersonalMarket 
        personalMarket={personalMarket}
        playerId={automataId}
        currentPlayerId={currentPlayerId}
        isMyTurn={isMyTurn}
        canInteract={isMyTurn}
      />
    </div>
  );
};

export default AutomataMarketView;