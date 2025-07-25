import React from 'react';

interface AutomataAction {
  type: 'manufacturer' | 'resale';
  action: string;
  dice: number[];
  total: number;
  design?: any;
  product?: any;
  price?: number;
  purchasedProducts?: any[];
  funds?: number;
}

interface AutomataLogProps {
  automataActions: AutomataAction[];
}

const AutomataLog: React.FC<AutomataLogProps> = ({ automataActions }) => {
  if (!automataActions || automataActions.length === 0) {
    return null;
  }

  const getActionDescription = (action: AutomataAction) => {
    const { type, action: actionType, dice, total, design, price, purchasedProducts } = action;

    if (type === 'manufacturer') {
      switch (actionType) {
        case 'high_cost_manufacture':
          return `🏭 高コスト製品製造 (🎲${dice[0]}+${dice[1]}=${total}) - ${design?.category} 価値${design?.value} コスト${design?.cost} を ¥${price}で出品`;
        case 'medium_cost_manufacture':
          return `🏭 中コスト製品製造 (🎲${dice[0]}+${dice[1]}=${total}) - ${design?.category} 価値${design?.value} コスト${design?.cost} を ¥${price}で出品`;
        case 'low_cost_manufacture':
          return `🏭 低コスト製品製造 (🎲${dice[0]}+${dice[1]}=${total}) - ${design?.category} 価値${design?.value} コスト${design?.cost} を ¥${price}で出品`;
        case 'inventory_clearance':
          return `🏭 在庫一掃セール (🎲${dice[0]}+${dice[1]}=${total}) - 全商品の価格を2下げる`;
        default:
          return `🏭 メーカーオートマ: ${actionType} (🎲${dice[0]}+${dice[1]}=${total})`;
      }
    } else {
      switch (actionType) {
        case 'mass_purchase':
          return `💰 大量購入 (🎲${dice[0]}+${dice[1]}=${total}) - 安い商品を${purchasedProducts?.length || 0}個購入`;
        case 'selective_purchase':
          return `💰 選択購入 (🎲${dice[0]}+${dice[1]}=${total}) - 人気商品を${purchasedProducts?.length || 0}個購入`;
        case 'wait_and_see':
          return `💰 様子見 (🎲${dice[0]}+${dice[1]}=${total}) - 購入を見送り`;
        case 'speculative_purchase':
          return `💰 投機購入 (🎲${dice[0]}+${dice[1]}=${total}) - ランダム商品を${purchasedProducts?.length || 0}個購入`;
        case 'paused':
          return `💰 規制により活動停止 - 転売規制発動中`;
        default:
          return `💰 転売オートマ: ${actionType} (🎲${dice[0]}+${dice[1]}=${total})`;
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-yellow-50 rounded-lg shadow-lg p-4 mb-4">
      <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
        🤖 オートマフェーズ ログ
        <span className="ml-2 text-sm font-normal text-gray-600">
          (ラウンド終了時の自動処理)
        </span>
      </h3>
      <div className="space-y-3">
        {automataActions.map((action, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg ${
              action.type === 'manufacturer' 
                ? 'bg-blue-100 border-l-4 border-blue-500' 
                : 'bg-green-100 border-l-4 border-green-500'
            }`}
          >
            <div className="text-sm font-medium text-gray-800">
              {getActionDescription(action)}
            </div>
            {action.type === 'resale' && action.funds !== undefined && (
              <div className="text-xs text-gray-600 mt-1">
                残り資金: ¥{action.funds}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutomataLog;