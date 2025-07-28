import React, { useState } from 'react';
import type { Player, GameState } from '../store/gameSlice';
import { useSocket } from '../hooks/useSocket';
import ModernButton from './ModernButton';
import SimpleSelect from './SimpleSelect';
import ModernButtonGroup from './ModernButtonGroup';

interface ActionPanelProps {
  player: Player;
  isMyTurn: boolean;
  gamePhase: 'action' | 'automata' | 'market';
  gameState: GameState;
}

const ActionPanel: React.FC<ActionPanelProps> = ({ 
  player, 
  isMyTurn, 
  gamePhase, 
  gameState 
}) => {
  const { sendGameAction } = useSocket();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Debug logging
  console.log('🎯 ActionPanel player data:', {
    designs: player.designs,
    designCount: Object.keys(player.designs || {}).length,
    inventory: player.inventory,
    inventoryCount: player.inventory?.length || 0,
    actionPoints: player.actionPoints
  });
  const [actionParams, setActionParams] = useState<any>({});
  const [diceOptions, setDiceOptions] = useState<any[]>([]);
  const [showDiceSelection, setShowDiceSelection] = useState(false);
  const [selectedDice, setSelectedDice] = useState<any>(null);
  const [showSlotSelection, setShowSlotSelection] = useState(false);

  const canPerformActions = isMyTurn && gamePhase === 'action' && player.actionPoints > 0 && !isProcessingAction && gameState.state !== 'finished';

  // Clear messages after delay
  React.useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const showError = (message: string) => {
    setErrorMessage(message);
    console.error('❌ ActionPanel Error:', message);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    console.log('✅ ActionPanel Success:', message);
  };

  const handleAction = (actionType: string, params: any = {}) => {
    try {
      console.log('🎯 Executing action:', actionType, params);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Validate action prerequisites
      if (!canPerformActions) {
        showError('現在アクションを実行できません');
        return;
      }

      // Validate AP requirements
      const apCosts = {
        'manufacture': 1, 'sell': 1, 'purchase': 1, 'review': 1, 'buyback': 1, 'buy_dignity': 1,
        'design': 2, 'part_time_job': 2, 'promote_regulation': 2, 'trend_research': 2,
        'day_labor': 3
      };
      const requiredAP = apCosts[actionType as keyof typeof apCosts] || 0;
      if (player.actionPoints < requiredAP) {
        showError(`アクションポイントが不足しています (必要: ${requiredAP}AP, 現在: ${player.actionPoints}AP)`);
        return;
      }

      // Specific validations
      if (actionType === 'manufacture' && (!player.designs || Object.keys(player.designs).length === 0)) {
        showError('製造に必要な設計がありません');
        return;
      }

      if (actionType === 'sell' && (!player.inventory || player.inventory.length === 0)) {
        showError('販売する商品がありません');
        return;
      }

      if (actionType === 'buy_dignity' && player.funds < 10) {
        showError('威厳購入に必要な資金が不足しています (必要: 10資金)');
        return;
      }

      if (actionType === 'day_labor' && player.funds > 100) {
        showError('日雇い労働は資金100以下の場合のみ利用できます');
        return;
      }
      
      if (actionType === 'design') {
        // For design action, first show dice roll
        handleDesignAction(params);
      } else if (actionType === 'trend_research') {
        // For trend research, handle result display
        setIsProcessingAction(true);
        sendGameAction({ type: actionType, ...params });
        showSuccess('トレンド調査を実行しました');
        
        // Note: We'll receive the trend result through game update events
        // The trend dialog will be shown via useSocket event handling
        setTimeout(() => {
          setSelectedAction(null);
          setActionParams({});
          setIsProcessingAction(false);
        }, 1000);
      } else {
        setIsProcessingAction(true);
        sendGameAction({ type: actionType, ...params });
        showSuccess(`${actionType}アクションを実行しました`);
        
        // Reset UI state after action
        setTimeout(() => {
          setSelectedAction(null);
          setActionParams({});
          setIsProcessingAction(false);
        }, 1000); // Give time for server response
      }
    } catch (error) {
      console.error('❌ Action execution error:', error);
      setIsProcessingAction(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(`アクション実行エラー: ${errorMessage}`);
    }
  };

  const handleDesignAction = (params: any) => {
    try {
      // Simulate dice roll (3 dice)
      const categories = ['game-console', 'diy-gadget', 'figure', 'accessory', 'toy'];
      const dice1 = { 
        category: categories[Math.floor(Math.random() * categories.length)],
        value: Math.floor(Math.random() * 6) + 1,
        cost: 0
      };
      const dice2 = { 
        category: categories[Math.floor(Math.random() * categories.length)],
        value: Math.floor(Math.random() * 6) + 1,
        cost: 0
      };
      const dice3 = { 
        category: categories[Math.floor(Math.random() * categories.length)],
        value: Math.floor(Math.random() * 6) + 1,
        cost: 0
      };

      // Calculate costs
      const costMap = { 6: 1, 5: 2, 4: 3, 3: 4, 2: 5, 1: 6 };
      dice1.cost = costMap[dice1.value as keyof typeof costMap] || dice1.value;
      dice2.cost = costMap[dice2.value as keyof typeof costMap] || dice2.value;
      dice3.cost = costMap[dice3.value as keyof typeof costMap] || dice3.value;

      const diceResults = [dice1, dice2, dice3];
      if (diceResults.some(dice => !dice.category || !dice.value || !dice.cost)) {
        throw new Error('ダイス生成に失敗しました');
      }

      setDiceOptions(diceResults);
      setShowDiceSelection(true);
      setActionParams(params);
    } catch (error) {
      console.error('❌ Design action error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`設計アクションエラー: ${errorMessage}`);
      
      // Reset states on error
      setSelectedAction(null);
      setActionParams({});
    }
  };

  const handleDiceSelection = (selectedDiceIndex: number) => {
    try {
      const dice = diceOptions[selectedDiceIndex];
      if (!dice) {
        throw new Error('選択されたダイスが無効です');
      }
      setSelectedDice(dice);
      setShowDiceSelection(false);
      setShowSlotSelection(true);
    } catch (error) {
      console.error('❌ Dice selection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`ダイス選択エラー: ${errorMessage}`);
    }
  };

  const handleSlotSelection = (slotNumber: number) => {
    try {
      setIsProcessingAction(true);
      sendGameAction({ 
        type: 'design', 
        ...actionParams,
        selectedDice,
        designSlot: slotNumber
      });
      
      // Reset states after a delay to allow server response
      setTimeout(() => {
        setShowSlotSelection(false);
        setSelectedDice(null);
        setDiceOptions([]);
        setSelectedAction(null);
        setActionParams({});
        setIsProcessingAction(false);
      }, 1000);
    } catch (error) {
      console.error('❌ Design slot selection error:', error);
      setIsProcessingAction(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`設計スロット選択エラー: ${errorMessage}`);
      
      // Don't reset states on error, allow user to retry
    }
  };

  const renderDiceSelection = () => {
    if (!showDiceSelection) return null;

    return (
      <div className="space-y-4">
        <h4 className="font-bold text-lg">ダイスロール結果 - 1つ選択してください</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {diceOptions.map((dice, index) => (
            <div key={index} className="border-2 border-gray-300 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-all"
                 onClick={() => !isProcessingAction && handleDiceSelection(index)}>
              <div className="text-center">
                <div className="text-4xl mb-2">🎲</div>
                <div className="font-bold text-lg mb-1">ダイス {index + 1}</div>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">カテゴリー:</span> {dice.category}</div>
                  <div><span className="font-medium">価値:</span> {dice.value}</div>
                  <div><span className="font-medium">コスト:</span> {dice.cost}</div>
                </div>
                <ModernButton 
                  className="mt-3 w-full" 
                  variant="primary" 
                  size="md"
                  disabled={isProcessingAction}
                >
                  {isProcessingAction ? '処理中...' : '選択'}
                </ModernButton>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <ModernButton
            onClick={() => {
              setShowDiceSelection(false);
              setDiceOptions([]);
              setSelectedAction(null);
              setActionParams({});
            }}
            variant="secondary"
            size="md"
          >
            キャンセル
          </ModernButton>
        </div>
      </div>
    );
  };

  const renderSlotSelection = () => {
    if (!showSlotSelection || !selectedDice) return null;

    // Get available slots (1-6, excluding already occupied slots)
    const occupiedSlots = Object.keys(player.designs).map(Number);
    const availableSlots = [1, 2, 3, 4, 5, 6].filter(slot => !occupiedSlots.includes(slot));

    return (
      <div className="space-y-4">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h4 className="font-bold text-lg mb-2">選択されたダイス</h4>
          <div className="text-sm space-y-1">
            <div><span className="font-medium">カテゴリー:</span> {selectedDice.category}</div>
            <div><span className="font-medium">価値:</span> {selectedDice.value}</div>
            <div><span className="font-medium">コスト:</span> {selectedDice.cost}</div>
          </div>
        </div>
        
        <h4 className="font-bold text-lg">設計図ボードのスロットを選択してください</h4>
        
        {availableSlots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableSlots.map((slotNumber) => (
              <div key={slotNumber} 
                   className="border-2 border-gray-300 rounded-lg p-4 hover:border-green-500 cursor-pointer transition-all text-center"
                   onClick={() => !isProcessingAction && handleSlotSelection(slotNumber)}>
                <div className="text-2xl mb-2">📋</div>
                <div className="font-bold">スロット {slotNumber}</div>
                <div className="text-sm text-gray-600">空き</div>
                <ModernButton 
                  className="mt-3 w-full" 
                  variant="primary" 
                  size="md"
                  disabled={isProcessingAction}
                >
                  {isProcessingAction ? '処理中...' : '選択'}
                </ModernButton>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-red-600 py-4">
            <p>利用可能なスロットがありません</p>
            <p className="text-sm">設計図ボードが満杯です</p>
          </div>
        )}
        
        <div className="flex justify-center">
          <ModernButton
            onClick={() => {
              setShowSlotSelection(false);
              setSelectedDice(null);
              setShowDiceSelection(true);
            }}
            variant="secondary"
            size="md"
            className="mr-3"
          >
            ダイス選択に戻る
          </ModernButton>
          <ModernButton
            onClick={() => {
              setShowSlotSelection(false);
              setSelectedDice(null);
              setDiceOptions([]);
              setSelectedAction(null);
              setActionParams({});
            }}
            variant="danger"
            size="md"
          >
            キャンセル
          </ModernButton>
        </div>
      </div>
    );
  };

  const renderActionForm = () => {
    if (!selectedAction) return null;

    switch (selectedAction) {
      case 'manufacture':
        // Debug: Check player designs
        console.log('🔍 Player designs raw:', player.designs);
        console.log('🔍 Player designs type:', typeof player.designs);
        console.log('🔍 Player designs keys:', Object.keys(player.designs || {}));
        console.log('🔍 Player designs entries:', Object.entries(player.designs || {}));
        
        const designOptions = Object.entries(player.designs || {}).map(([slot, design]) => {
          console.log(`🔍 Processing slot ${slot}:`, design);
          const categoryName = {
            'game-console': 'ゲーム機',
            'diy-gadget': '自作ガジェット', 
            'figure': 'フィギュア',
            'accessory': 'アクセサリー',
            'toy': 'おもちゃ'
          }[design?.category] || design?.category || 'unknown';
          
          const categoryIcon = {
            'game-console': '🎮',
            'diy-gadget': '🔧',
            'figure': '🎭',
            'accessory': '💍', 
            'toy': '🧸'
          }[design?.category] || '📦';
          
          return {
            value: slot,
            label: `${categoryIcon} スロット${slot}: ${categoryName}`,
            description: `価値${design?.value || 0} / コスト${design?.cost || 0} / 人気度1`
          };
        });
        console.log('🔍 Final design options for ModernButtonGroup:', designOptions);
        console.log('🔍 Design options length:', designOptions.length);
        
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-gray-800">🏭 製造アクション (1AP)</h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                設計から商品を製造して在庫に追加します
              </div>
            </div>
            <ModernButtonGroup
              label="使用する設計スロット"
              value={actionParams.designSlot?.toString() || ''}
              onChange={(value) => setActionParams({...actionParams, designSlot: parseInt(value)})}
              options={designOptions}
              emptyMessage="利用可能な設計がありません"
              columns={2}
            />
            {/* Debug info */}
            {import.meta.env.DEV && (
              <div className="text-xs bg-gray-100 p-2 rounded">
                <div>設計数: {Object.keys(player.designs).length}</div>
                <div>設計: {JSON.stringify(player.designs)}</div>
                <div>選択値: {actionParams.designSlot}</div>
                {Object.keys(player.designs).length === 0 && (
                  <div className="mt-2">
                    <ModernButton
                      onClick={() => sendGameAction({ type: 'design' })}
                      variant="primary"
                      size="sm"
                    >
                      テスト用設計獲得
                    </ModernButton>
                  </div>
                )}
              </div>
            )}
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => handleAction('manufacture', actionParams)}
                disabled={!actionParams.designSlot}
                variant="primary"
                size="md"
              >
                製造実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );


      case 'sell':
        const inventoryOptions = (player.inventory || []).map((product) => {
          const categoryName = {
            'game-console': 'ゲーム機',
            'diy-gadget': '自作ガジェット', 
            'figure': 'フィギュア',
            'accessory': 'アクセサリー',
            'toy': 'おもちゃ'
          }[product.category] || product.category || '不明';
          
          const categoryIcon = {
            'game-console': '🎮',
            'diy-gadget': '🔧',
            'figure': '🎭',
            'accessory': '💍', 
            'toy': '🧸'
          }[product.category] || '📦';
          
          const isResale = product.previousOwner !== undefined;
          
          return {
            value: product.id,
            label: `${categoryIcon} ${categoryName} ${isResale ? '(転売品)' : ''}`,
            description: `価値${product.value || 0} / コスト${product.cost || 0} / 人気度${product.popularity || 1}`
          };
        });
        
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-lg text-gray-800">🏪 販売アクション (1AP)</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                在庫から商品を選んでマーケットに出品します
              </div>
            </div>
            <ModernButtonGroup
              label="販売する商品"
              value={actionParams.productId || ''}
              onChange={(value) => {
                const product = player.inventory?.find(p => p.id === value);
                if (product) {
                  let maxPrice;
                  if (product.previousOwner) {
                    // 転売品の場合は転売価格を計算
                    const basePrice = (product.purchasePrice || 0) + 5 + (player.resaleHistory <= 1 ? 0 : 
                                    player.resaleHistory <= 4 ? 3 : 
                                    player.resaleHistory <= 7 ? 6 : 10);
                    maxPrice = basePrice;
                  } else {
                    // 通常の販売は製造コストの1.5倍
                    maxPrice = Math.floor((product.cost || 0) * 1.5) || 1;
                  }
                  setActionParams({
                    ...actionParams, 
                    productId: value,
                    maxPrice,
                    isResale: !!product.previousOwner
                  });
                } else {
                  setActionParams({
                    ...actionParams, 
                    productId: value,
                    maxPrice: 1,
                    isResale: false
                  });
                }
              }}
              options={inventoryOptions}
              emptyMessage="在庫に商品がありません"
              columns={2}
            />
            {actionParams.productId && (
              <div>
                {actionParams.isResale && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                    <div className="text-sm text-orange-800">
                      🔄 転売品: 購入価格+5+転売履歴ペナルティ
                      {gameState.regulationLevel >= 2 && (
                        <div className="text-red-600 mt-1">⚠️ 規制により価格制限あり</div>
                      )}
                    </div>
                  </div>
                )}
                <label className="block text-sm font-medium mb-1">
                  価格を選択 (上限: {actionParams.maxPrice}):
                </label>
                {actionParams.maxPrice <= 12 ? (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {Array.from({length: actionParams.maxPrice}, (_, i) => i + 1).map(price => (
                      <ModernButton
                        key={price}
                        onClick={() => setActionParams({...actionParams, price})}
                        variant={actionParams.price === price ? "primary" : "ghost"}
                        size="sm"
                        className={`text-center ${actionParams.price === price ? 'ring-2 ring-blue-300' : ''}`}
                      >
                        ¥{price}
                      </ModernButton>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
                      {[Math.ceil(actionParams.maxPrice * 0.5), Math.ceil(actionParams.maxPrice * 0.75), actionParams.maxPrice].map(price => (
                        <ModernButton
                          key={price}
                          onClick={() => setActionParams({...actionParams, price})}
                          variant={actionParams.price === price ? "primary" : "secondary"}
                          size="sm"
                          className={`text-center ${actionParams.price === price ? 'ring-2 ring-blue-300' : ''}`}
                        >
                          ¥{price}
                        </ModernButton>
                      ))}
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-gray-600 mb-1">カスタム価格:</label>
                      <input
                        type="number"
                        min="1"
                        max={actionParams.maxPrice}
                        value={actionParams.price || ''}
                        onChange={(e) => setActionParams({...actionParams, price: parseInt(e.target.value)})}
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder={`1〜${actionParams.maxPrice}`}
                      />
                    </div>
                  </div>
                )}
                {actionParams.price && (
                  <div className="mt-2 p-2 bg-blue-50 rounded">
                    <span className="text-sm text-blue-800">選択済み: ¥{actionParams.price}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => {
                  const actionType = actionParams.isResale ? 'resale' : 'sell';
                  handleAction(actionType, actionParams);
                }}
                disabled={!actionParams.productId || !actionParams.price}
                variant="primary"
                size="md"
              >
                販売実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'review':
        // Get products from target player (including self)
        const getPlayerProducts = (targetPlayerId: string) => {
          const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
          if (!targetPlayer) return [];
          
          const products: Array<{value: string, label: string}> = [];
          
          Object.entries(targetPlayer.personalMarket || {}).forEach(([price, popularityMap]) => {
            Object.entries(popularityMap).forEach(([popularity, product]) => {
              if (product) {
                const categoryName = {
                  'game-console': 'ゲーム機',
                  'diy-gadget': '自作ガジェット', 
                  'figure': 'フィギュア',
                  'accessory': 'アクセサリー',
                  'toy': 'おもちゃ'
                }[product.category] || product.category;
                
                products.push({
                  value: `${price}-${popularity}`,
                  label: `${categoryName} (価格${price}、人気度${popularity})`
                });
              }
            });
          });
          
          return products;
        };

        return (
          <div className="space-y-3">
            <h4 className="font-bold">レビューアクション (1AP)</h4>
            <div>
              <label className="block text-sm font-medium mb-1">対象プレイヤー:</label>
              <SimpleSelect
                value={actionParams.targetPlayerId || ''}
                onChange={(value) => setActionParams({...actionParams, targetPlayerId: value, price: undefined, popularity: undefined})}
                placeholder="対象プレイヤーを選択"
                options={gameState.players.map((p) => ({
                  value: p.id,
                  label: p.name + (p.id === player.id ? ' (自分)' : '')
                }))}
              />
            </div>
            {actionParams.targetPlayerId && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">商品 (価格-人気度):</label>
                  <SimpleSelect
                    value={`${actionParams.price}-${actionParams.popularity}` || ''}
                    onChange={(value) => {
                      const [price, popularity] = value.split('-').map(Number);
                      setActionParams({...actionParams, price, popularity});
                    }}
                    placeholder="商品を選択"
                    options={getPlayerProducts(actionParams.targetPlayerId)}
                    emptyMessage="対象プレイヤーの商品がありません"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">レビュータイプ:</label>
                  <SimpleSelect
                    value={actionParams.reviewType || ''}
                    onChange={(value) => setActionParams({...actionParams, reviewType: value})}
                    placeholder="レビュータイプを選択"
                    options={[
                      { value: 'positive', label: '高評価 (+1人気度)' },
                      { value: 'negative', label: '低評価 (-1人気度)' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <input
                      type="checkbox"
                      checked={actionParams.useOutsourcing || false}
                      onChange={(e) => setActionParams({...actionParams, useOutsourcing: e.target.checked})}
                      className="mr-2"
                    />
                    レビュー外注 (威厳消費なし、費用: 高評価3資金/低評価2資金、発覚リスクあり)
                  </label>
                </div>
              </>
            )}
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => {
                  console.log('🔍 Review action params:', actionParams);
                  console.log('🔍 Required params check:', {
                    targetPlayerId: actionParams.targetPlayerId,
                    price: actionParams.price,
                    popularity: actionParams.popularity,
                    reviewType: actionParams.reviewType
                  });
                  handleAction('review', actionParams);
                }}
                disabled={!actionParams.targetPlayerId || !actionParams.reviewType || !actionParams.price || !actionParams.popularity}
                variant="primary"
                size="md"
              >
                レビュー実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'buyback':
        return (
          <div className="space-y-3">
            <h4 className="font-bold">買い戻しアクション (1AP)</h4>
            <div className="text-sm text-gray-600 mb-3">
              マーケットに出品中の商品を在庫に戻します。
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">商品 (価格-人気度):</label>
              <SimpleSelect
                value={`${actionParams.price}-${actionParams.popularity}` || ''}
                onChange={(value) => {
                  const [price, popularity] = value.split('-').map(Number);
                  const product = Object.values(player.personalMarket[price] || {})
                    .find(p => p && p.popularity === popularity);
                  setActionParams({
                    ...actionParams, 
                    price, 
                    popularity,
                    productInfo: product
                  });
                }}
                placeholder="買い戻しする商品を選択"
                options={Object.entries(player.personalMarket).flatMap(([price, popularityMap]) =>
                  Object.entries(popularityMap).map(([popularity, product]) => {
                    if (product) {
                      return {
                        value: `${price}-${popularity}`,
                        label: `${product.category} (価格${price}、人気度${popularity})`
                      };
                    }
                    return null;
                  }).filter((item): item is {value: string, label: string} => item !== null)
                )}
              />
            </div>
            {actionParams.productInfo && (
              <div className="bg-gray-100 p-3 rounded">
                <div className="text-sm">
                  <div><strong>カテゴリー:</strong> {actionParams.productInfo.category}</div>
                  <div><strong>価値:</strong> {actionParams.productInfo.value}</div>
                  <div><strong>コスト:</strong> {actionParams.productInfo.cost}</div>
                  <div><strong>現在価格:</strong> {actionParams.price}</div>
                </div>
              </div>
            )}
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => handleAction('buyback', actionParams)}
                disabled={!actionParams.price || !actionParams.popularity}
                variant="primary"
                size="md"
              >
                買い戻し実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'design':
        return (
          <div className="space-y-3">
            <h4 className="font-bold">設計アクション (2AP)</h4>
            <div className="text-sm text-gray-600">
              新しい設計を取得します。ダイスを3個振り、1個を選択してコストを決定します。
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                <input
                  type="checkbox"
                  checked={actionParams.openSource || false}
                  onChange={(e) => setActionParams({...actionParams, openSource: e.target.checked})}
                  className="mr-2"
                />
                オープンソース化 (+2威厳、他プレイヤーも製造可能)
              </label>
            </div>
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => handleAction('design', actionParams)}
                variant="primary"
                size="md"
              >
                設計実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'part_time_job':
        return (
          <div className="space-y-3">
            <h4 className="font-bold">アルバイト (2AP)</h4>
            <div className="text-sm text-gray-600">
              5資金を即座に獲得します。
            </div>
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => handleAction('part_time_job')}
                variant="primary"
                size="md"
              >
                実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'purchase':
        return (
          <div className="space-y-3">
            <h4 className="font-bold">購入アクション (1AP)</h4>
            <div className="text-sm text-gray-600 mb-3">
              他のプレイヤーやオートマの商品を購入します。
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">対象プレイヤー:</label>
              <SimpleSelect
                value={actionParams.targetPlayerId || ''}
                onChange={(value) => setActionParams({...actionParams, targetPlayerId: value})}
                placeholder="対象プレイヤーを選択"
                options={[
                  // 他のプレイヤー
                  ...gameState.players
                    .filter(p => p.id !== player.id)
                    .map((p) => ({
                      value: p.id,
                      label: p.name
                    })),
                  // オートマ
                  {
                    value: 'manufacturer-automata',
                    label: '🤖 メーカーオートマ'
                  },
                  {
                    value: 'resale-automata', 
                    label: '🔄 転売オートマ'
                  }
                ]}
              />
            </div>
            {actionParams.targetPlayerId && (
              <div>
                <label className="block text-sm font-medium mb-1">商品 (価格-人気度):</label>
                <SimpleSelect
                  value={`${actionParams.price}-${actionParams.popularity}` || ''}
                  onChange={(value) => {
                    const [price, popularity] = value.split('-').map(Number);
                    setActionParams({...actionParams, price, popularity});
                  }}
                  placeholder="商品を選択"
                  options={(() => {
                    let targetMarket = null;
                    
                    // プレイヤーかオートマかを判定
                    if (actionParams.targetPlayerId === 'manufacturer-automata') {
                      targetMarket = gameState.manufacturerAutomata?.personalMarket;
                    } else if (actionParams.targetPlayerId === 'resale-automata') {
                      targetMarket = gameState.resaleAutomata?.personalMarket;
                    } else {
                      const targetPlayer = gameState.players.find(p => p.id === actionParams.targetPlayerId);
                      targetMarket = targetPlayer?.personalMarket;
                    }
                    
                    if (!targetMarket) return [];
                    
                    const availableProducts: Array<{value: string; label: string}> = [];
                    Object.entries(targetMarket).forEach(([price, priceRow]) => {
                      Object.entries(priceRow || {}).forEach(([popularity, product]) => {
                        if (product) {
                          const categoryIcons = {
                            'game-console': '🎮',
                            'diy-gadget': '🔧',
                            'figure': '🎭',
                            'accessory': '💍',
                            'toy': '🧸'
                          } as const;
                          
                          const categoryNames = {
                            'game-console': 'ゲーム機',
                            'diy-gadget': '自作ガジェット',
                            'figure': 'フィギュア', 
                            'accessory': 'アクセサリー',
                            'toy': 'おもちゃ'
                          } as const;
                          
                          const categoryIcon = categoryIcons[product.category as keyof typeof categoryIcons] || '📦';
                          const categoryName = categoryNames[product.category as keyof typeof categoryNames] || product.category;
                          
                          const isResale = product.previousOwner !== undefined;
                          
                          availableProducts.push({
                            value: `${price}-${popularity}`,
                            label: `${categoryIcon} ${categoryName} ${isResale ? '(転売品)' : ''} - ¥${price} (人気度${popularity})`
                          });
                        }
                      });
                    });
                    return availableProducts;
                  })()}
                  emptyMessage="対象の商品がありません"
                />
              </div>
            )}
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => handleAction('purchase', {
                  sellerId: actionParams.targetPlayerId,
                  price: actionParams.price,
                  popularity: actionParams.popularity
                })}
                disabled={!actionParams.targetPlayerId || !actionParams.price}
                variant="primary"
                size="md"
              >
                購入実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'promote_regulation':
        return (
          <div className="space-y-3">
            <h4 className="font-bold">規制推進 (2AP)</h4>
            <div className="text-sm text-gray-600 mb-3">
              転売規制の推進を試みます。2d6で9以上が必要です。
            </div>
            <div className="bg-yellow-100 p-3 rounded mb-3">
              <div className="text-sm">
                <div><strong>現在の規制レベル:</strong> {gameState.regulationLevel}</div>
                <div className="text-xs text-gray-600 mt-1">
                  0: 規制なし / 1: パブリックコメント / 2: 検討中 / 3: 規制発動
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => handleAction('promote_regulation', actionParams)}
                variant="primary"
                size="md"
              >
                規制推進実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'trend_research':
        return (
          <div className="space-y-3">
            <h4 className="font-bold">トレンド調査 (2AP)</h4>
            <div className="text-sm text-gray-600 mb-3">
              市場トレンドを調査し、特殊効果を発動します。3d6の合計で効果が決まります。
            </div>
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => handleAction('trend_research', actionParams)}
                variant="primary"
                size="md"
              >
                トレンド調査実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'day_labor':
        return (
          <div className="space-y-3">
            <h4 className="font-bold">日雇い労働 (3AP)</h4>
            <div className="text-sm text-gray-600">
              18資金を獲得します。(資金100以下の場合のみ)
            </div>
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => handleAction('day_labor')}
                disabled={player.funds > 100}
                variant="primary"
                size="md"
              >
                実行
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'buy_dignity':
        return (
          <div className="space-y-3">
            <h4 className="font-bold">威厳購入アクション (1AP)</h4>
            <div className="text-sm text-gray-600 mb-3">
              10資金を支払って威厳を1ポイント購入します。
            </div>
            <div className="bg-violet-50 p-3 rounded-lg">
              <div className="text-sm">
                <div>💰 必要資金: 10</div>
                <div>💰 現在資金: {player.funds}</div>
                <div>👑 現在威厳: {player.prestige}</div>
                <div>👑 購入後威厳: {player.prestige + 1}</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <ModernButton
                onClick={() => {
                  console.log('🔍 Buy dignity action - player funds:', player.funds);
                  handleAction('buy_dignity');
                }}
                disabled={player.funds < 10}
                variant="primary"
                size="md"
              >
                威厳を購入
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                variant="secondary"
                size="md"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      case 'end_game':
        return (
          <div className="space-y-4">
            <h4 className="font-bold text-red-800">ゲーム終了確認</h4>
            <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-bold text-red-800 mb-2">本当にゲームを終了しますか？</div>
                  <div className="text-sm text-red-700 space-y-1">
                    <div>• ゲームは即座に終了し、現在の状態で順位が決定されます</div>
                    <div>• 他のプレイヤーにも影響します</div>
                    <div>• この操作は取り消すことができません</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="text-sm text-yellow-800">
                <div className="font-bold mb-1">現在の状況:</div>
                <div>ラウンド {gameState.currentRound} | あなたの威厳: {player.prestige} | 資金: {player.funds}</div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <ModernButton
                onClick={() => {
                  if (window.confirm('本当にゲームを終了しますか？この操作は取り消せません。')) {
                    handleAction('end_game');
                  }
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-bold"
              >
                🏁 ゲーム終了
              </ModernButton>
              <ModernButton
                onClick={() => setSelectedAction(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-bold"
              >
                キャンセル
              </ModernButton>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!canPerformActions) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold mb-4">アクション</h3>
        <div className="text-center text-gray-500 py-8">
          {gameState.state === 'finished' ? (
            <div>
              <div className="text-4xl mb-4">🏁</div>
              <p className="text-lg font-bold text-gray-700">ゲーム終了</p>
              <p className="text-sm mt-2">
                勝者: {gameState.winner?.name || '未確定'}
              </p>
            </div>
          ) : !isMyTurn ? (
            <div>
              <p>あなたのターンではありません</p>
              <p className="text-sm mt-2">
                現在のプレイヤー: {gameState.players[gameState.currentPlayerIndex]?.name}
              </p>
            </div>
          ) : gamePhase !== 'action' ? (
            <div>
              <p>現在は{gamePhase}フェーズです</p>
              {gamePhase === 'automata' && (
                <div className="mt-4">
                  <p className="text-sm mb-3">オートマフェーズ中...</p>
                  <ModernButton
                    onClick={() => sendGameAction({ type: 'skip-automata' })}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    オートマフェーズをスキップ
                  </ModernButton>
                </div>
              )}
              {gamePhase === 'market' && (
                <div className="mt-4">
                  <p className="text-sm mb-3">マーケットフェーズ中...</p>
                  <ModernButton
                    onClick={() => sendGameAction({ type: 'skip-market' })}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    マーケットフェーズをスキップ
                  </ModernButton>
                </div>
              )}
            </div>
          ) : (
            'アクションポイントがありません'
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-xl p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <span className="text-white text-xl">⚡</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800">アクション</h3>
        </div>
        <div className="flex items-center space-x-3">
          {isProcessingAction && (
            <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
              <span className="text-sm font-medium">処理中...</span>
            </div>
          )}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-md">
            <div className="text-xs font-medium opacity-90">残りAP</div>
            <div className="text-lg font-bold">{player.actionPoints}/3</div>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">❌</span>
            <span className="font-medium">{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700 rounded-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">✅</span>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {showDiceSelection ? (
        renderDiceSelection()
      ) : showSlotSelection ? (
        renderSlotSelection()
      ) : selectedAction ? (
        renderActionForm()
      ) : (
        <div className="space-y-6">
          {/* 1AP Actions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">1AP</div>
              <h4 className="font-semibold text-gray-700">基本アクション</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <ModernButton
                onClick={() => setSelectedAction('manufacture')}
                disabled={!canPerformActions || !player.designs || Object.keys(player.designs).length === 0 || player.actionPoints < 1}
                variant="primary"
                size="lg"
              className="action-card-button bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏭</span>
                  <div className="text-left">
                    <div className="font-medium text-blue-900">製造</div>
                    <div className="text-xs text-blue-600">設計から商品を1個製造</div>
                    {(!player.designs || Object.keys(player.designs).length === 0) && 
                      <div className="text-xs text-red-500">⚠️ 設計なし</div>
                    }
                  </div>
                </div>
              </ModernButton>
              
              <ModernButton
                onClick={() => setSelectedAction('sell')}
                disabled={!canPerformActions || !player.inventory || player.inventory.length === 0 || player.actionPoints < 1}
                variant="primary"
                size="lg"
              className="action-card-button bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-green-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <div className="text-left">
                    <div className="font-medium text-green-900">販売</div>
                    <div className="text-xs text-green-600">商品をマーケットに出品</div>
                    {(!player.inventory || player.inventory.length === 0) && 
                      <div className="text-xs text-red-500">⚠️ 在庫なし</div>
                    }
                  </div>
                </div>
              </ModernButton>
              
              <ModernButton
                onClick={() => setSelectedAction('purchase')}
                disabled={!canPerformActions || player.actionPoints < 1}
                variant="primary"
                icon="🛒"
                fullWidth
              >
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontWeight: '600', marginBottom: '2px' }}>購入</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    他プレイヤーの商品を購入
                  </div>
                </div>
              </ModernButton>
              
              
              <ModernButton
                onClick={() => setSelectedAction('review')}
                disabled={!canPerformActions || player.actionPoints < 1}
                variant="primary"
                size="lg"
              className="action-card-button bg-gradient-to-r from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border-indigo-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⭐</span>
                  <div className="text-left">
                    <div className="font-medium text-indigo-900">レビュー</div>
                    <div className="text-xs text-indigo-600">商品の人気度を操作</div>
                  </div>
                </div>
              </ModernButton>
              
              <ModernButton
                onClick={() => setSelectedAction('buyback')}
                disabled={!canPerformActions || Object.values(player.personalMarket).every(priceRow => 
                  Object.values(priceRow).every(product => product === null)
                ) || player.actionPoints < 1}
                variant="primary"
                size="lg"
              className="action-card-button bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📦</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">買い戻し</div>
                    <div className="text-xs text-gray-600">出品商品を在庫に戻す</div>
                  </div>
                </div>
              </ModernButton>
              
              <ModernButton
                onClick={() => setSelectedAction('buy_dignity')}
                disabled={!canPerformActions || player.actionPoints < 1 || player.funds < 10}
                variant="primary"
                size="lg"
              className="action-card-button bg-gradient-to-r from-violet-50 to-violet-100 hover:from-violet-100 hover:to-violet-200 border-violet-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👑</span>
                  <div className="text-left">
                    <div className="font-medium text-violet-900">威厳購入</div>
                    <div className="text-xs text-violet-600">10資金で威厳+1</div>
                    {player.funds < 10 && 
                      <div className="text-xs text-red-500">⚠️ 資金不足</div>
                    }
                  </div>
                </div>
              </ModernButton>
            </div>
          </div>

          {/* 2AP Actions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">2AP</div>
              <h4 className="font-semibold text-gray-700">戦略アクション</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <ModernButton
                onClick={() => setSelectedAction('design')}
                disabled={!canPerformActions || player.actionPoints < 2}
                variant="primary"
                size="lg"
              className="action-card-button bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 border-cyan-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔧</span>
                  <div className="text-left">
                    <div className="font-medium text-cyan-900">設計</div>
                    <div className="text-xs text-cyan-600">新しい設計を取得</div>
                  </div>
                </div>
              </ModernButton>
              
              <ModernButton
                onClick={() => setSelectedAction('part_time_job')}
                disabled={!canPerformActions || player.actionPoints < 2}
                variant="primary"
                size="lg"
              className="action-card-button bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-emerald-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💼</span>
                  <div className="text-left">
                    <div className="font-medium text-emerald-900">アルバイト</div>
                    <div className="text-xs text-emerald-600">5資金を獲得</div>
                  </div>
                </div>
              </ModernButton>
              
              <ModernButton
                onClick={() => setSelectedAction('promote_regulation')}
                disabled={!canPerformActions || player.actionPoints < 2}
                variant="primary"
                size="lg"
              className="action-card-button bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-red-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚖️</span>
                  <div className="text-left">
                    <div className="font-medium text-red-900">規制推進</div>
                    <div className="text-xs text-red-600">転売規制を推進</div>
                  </div>
                </div>
              </ModernButton>
              
              <ModernButton
                onClick={() => setSelectedAction('trend_research')}
                disabled={!canPerformActions || player.actionPoints < 2}
                variant="primary"
                size="lg"
              className="action-card-button bg-gradient-to-r from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 border-pink-200"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📈</span>
                  <div className="text-left">
                    <div className="font-medium text-pink-900">トレンド調査</div>
                    <div className="text-xs text-pink-600">市場トレンドを調査</div>
                  </div>
                </div>
              </ModernButton>
            </div>
          </div>

          {/* 3AP Actions */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">3AP</div>
              <h4 className="font-semibold text-gray-700">重大アクション</h4>
            </div>
            
            <ModernButton
              onClick={() => setSelectedAction('day_labor')}
              disabled={!canPerformActions || player.actionPoints < 3 || player.funds > 100}
              variant="primary"
              size="lg"
              className="action-card-button bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border-amber-200 w-full"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏗️</span>
                <div className="text-left">
                  <div className="font-medium text-amber-900">日雇い労働</div>
                  <div className="text-xs text-amber-600">18資金を獲得</div>
                  {player.funds > 100 && 
                    <div className="text-xs text-red-500">⚠️ 資金100以下のみ</div>
                  }
                </div>
              </div>
            </ModernButton>
          </div>

          {/* Turn End and Game Actions */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <ModernButton
              onClick={() => handleAction('end_turn')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">✅</span>
                <span>ターン終了</span>
              </div>
            </ModernButton>
            
            <ModernButton
              onClick={() => setSelectedAction('end_game')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 border-2 border-red-300"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">🏁</span>
                <span>ゲーム終了</span>
              </div>
            </ModernButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionPanel;