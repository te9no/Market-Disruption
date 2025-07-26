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
  reason?: string;
}

interface AutomataLogProps {
  automataActions: AutomataAction[];
  currentRound: number;
  gamePhase: 'action' | 'automata' | 'market';
}

const AutomataLog: React.FC<AutomataLogProps> = ({ automataActions, currentRound, gamePhase }) => {
  console.log('🤖 AutomataLog rendering:', { automataActions, currentRound, gamePhase });

  if (!automataActions || automataActions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-bold mb-3 flex items-center">
          <span className="mr-2">🤖</span>
          オートマ行動ログ
        </h3>
        <div className="text-center text-gray-500 py-4">
          <div className="text-2xl mb-2">📋</div>
          <div>まだオートマの行動がありません</div>
          {gamePhase === 'automata' && (
            <div className="mt-2 text-sm text-blue-600">
              オートマフェーズ実行中...
            </div>
          )}
        </div>
      </div>
    );
  }

  const getActionDescription = (action: AutomataAction) => {
    const { type, action: actionType } = action;
    
    if (type === 'manufacturer') {
      switch (actionType) {
        case 'high_cost_manufacture':
          return {
            icon: '🏭',
            title: 'メーカー・オートマ: 高コスト製造',
            description: `コスト3-5の商品を製造し、コスト×3で販売。最高価格商品に悪評価。`,
            details: action.product ? `${action.product.category} (価値${action.product.value}, コスト${action.product.cost}) → 価格${action.price}` : '',
            color: 'from-red-50 to-red-100 border-red-200'
          };
        case 'medium_cost_manufacture':
          return {
            icon: '🏭',
            title: 'メーカー・オートマ: 中コスト製造',
            description: `コスト3の商品を製造し、コスト×2で販売。`,
            details: action.product ? `${action.product.category} (価値${action.product.value}, コスト${action.product.cost}) → 価格${action.price}` : '',
            color: 'from-yellow-50 to-yellow-100 border-yellow-200'
          };
        case 'low_cost_manufacture':
          return {
            icon: '🏭',
            title: 'メーカー・オートマ: 低コスト製造',
            description: `コスト1-3の商品を製造し、コスト×2で販売。自社最安商品に高評価。`,
            details: action.product ? `${action.product.category} (価値${action.product.value}, コスト${action.product.cost}) → 価格${action.price}` : '',
            color: 'from-green-50 to-green-100 border-green-200'
          };
        case 'inventory_clearance':
          return {
            icon: '🏭',
            title: 'メーカー・オートマ: 在庫整理',
            description: `全商品の価格を2下げる。`,
            details: '',
            color: 'from-blue-50 to-blue-100 border-blue-200'
          };
        default:
          return {
            icon: '🏭',
            title: 'メーカー・オートマ',
            description: `不明なアクション: ${actionType}`,
            details: '',
            color: 'from-gray-50 to-gray-100 border-gray-200'
          };
      }
    } else if (type === 'resale') {
      switch (actionType) {
        case 'mass_purchase':
          return {
            icon: '💰',
            title: '転売ヤー・オートマ: 大量購入',
            description: `最安値商品を最大${action.purchasedProducts?.length || 0}個購入し、+5で転売。`,
            details: action.purchasedProducts ? 
              action.purchasedProducts.map(p => `${p.category}(¥${p.purchasePrice}→¥${p.price})`).join(', ') : '',
            color: 'from-orange-50 to-orange-100 border-orange-200'
          };
        case 'selective_purchase':
          return {
            icon: '💰',
            title: '転売ヤー・オートマ: 選択購入',
            description: `最高人気度商品を1個購入し、+5で転売。`,
            details: action.purchasedProducts && action.purchasedProducts.length > 0 ? 
              `${action.purchasedProducts[0].category}(¥${action.purchasedProducts[0].purchasePrice}→¥${action.purchasedProducts[0].price})` : '',
            color: 'from-purple-50 to-purple-100 border-purple-200'
          };
        case 'wait_and_see':
          return {
            icon: '💰',
            title: '転売ヤー・オートマ: 様子見',
            description: `何もしない。`,
            details: '',
            color: 'from-gray-50 to-gray-100 border-gray-200'
          };
        case 'speculative_purchase':
          return {
            icon: '💰',
            title: '転売ヤー・オートマ: 投機購入',
            description: `ランダム商品を1個購入し、+5で転売。`,
            details: action.purchasedProducts && action.purchasedProducts.length > 0 ? 
              `${action.purchasedProducts[0].category}(¥${action.purchasedProducts[0].purchasePrice}→¥${action.purchasedProducts[0].price})` : '',
            color: 'from-indigo-50 to-indigo-100 border-indigo-200'
          };
        case 'paused':
          return {
            icon: '💰',
            title: '転売ヤー・オートマ: 活動停止',
            description: `規制により活動停止中。`,
            details: action.reason ? `理由: ${action.reason}` : '',
            color: 'from-red-50 to-red-100 border-red-200'
          };
        default:
          return {
            icon: '💰',
            title: '転売ヤー・オートマ',
            description: `不明なアクション: ${actionType}`,
            details: '',
            color: 'from-gray-50 to-gray-100 border-gray-200'
          };
      }
    }
    
    return {
      icon: '🤖',
      title: '不明なオートマ',
      description: `不明なアクション`,
      details: '',
      color: 'from-gray-50 to-gray-100 border-gray-200'
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold mb-3 flex items-center">
        <span className="mr-2">🤖</span>
        オートマ行動ログ (ラウンド {currentRound})
        {gamePhase === 'automata' && (
          <span className="ml-2 text-sm text-blue-600 animate-pulse">実行中...</span>
        )}
      </h3>
      
      <div className="space-y-3">
        {automataActions.map((action, index) => {
          const actionInfo = getActionDescription(action);
          
          return (
            <div 
              key={index} 
              className={`p-4 rounded-lg border-2 bg-gradient-to-r ${actionInfo.color}`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{actionInfo.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{actionInfo.title}</div>
                  <div className="text-sm text-gray-700 mt-1">{actionInfo.description}</div>
                  
                  {action.dice && action.dice.length >= 2 && (
                    <div className="flex items-center space-x-2 mt-2 text-xs">
                      <span className="bg-white px-2 py-1 rounded border">
                        🎲 {action.dice[0]} + {action.dice[1]} = {action.total}
                      </span>
                      {action.funds !== undefined && (
                        <span className="bg-white px-2 py-1 rounded border">
                          💰 残り資金: {action.funds}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {actionInfo.details && (
                    <div className="text-xs text-gray-600 mt-2 bg-white/50 p-2 rounded">
                      {actionInfo.details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {automataActions.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <div className="font-bold flex items-center">
            <span className="mr-2">ℹ️</span>
            オートマフェーズ完了
          </div>
          <div className="mt-1">
            {automataActions.length}つのオートマが行動を完了しました。
            {gamePhase === 'market' ? '次はマーケットフェーズです。' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomataLog;