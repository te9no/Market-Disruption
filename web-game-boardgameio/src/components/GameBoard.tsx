import React from 'react';
import { GameState, Player } from '../game/GameState';
import { PlayLog } from './PlayLog';

interface GameBoardProps {
  G: GameState;
  ctx: any;
  moves: any;
  events?: any;
  playerID: string | null;
  isActive: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ G, ctx, moves, events, playerID, isActive }) => {
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  
  if (!playerID) {
    return <div>プレイヤーIDが設定されていません</div>;
  }
  
  const currentPlayer = G.players[playerID];
  
  if (!currentPlayer) {
    return <div>プレイヤーが見つかりません</div>;
  }

  const handleManufacture = (designId: string) => {
    if (isActive) {
      moves.manufacture(designId);
    }
  };

  const handleSell = (productId: string, price: number) => {
    if (isActive && price > 0 && Number.isInteger(price)) {
      console.log('Selling product:', { productId, price, currentPlayer: ctx.currentPlayer });
      moves.sell(productId, price);
    } else {
      console.error('Invalid sell parameters:', { productId, price, isActive });
    }
  };

  const handleDesign = (isOpenSource: boolean = false) => {
    if (isActive) {
      moves.design(isOpenSource);
    }
  };

  const handlePartTimeWork = () => {
    if (isActive) {
      moves.partTimeWork();
    }
  };

  const renderMarketGrid = (player: Player) => {
    // 6×6のグリッド（価格1-6 × 人気度1-6）
    const grid = Array(6).fill(null).map(() => Array(6).fill(null));
    
    // 商品をグリッドに配置（人気度は高い方が上に来るように逆順）
    player.personalMarket.forEach(product => {
      if (product.price > 0 && product.price <= 6 && product.popularity >= 1 && product.popularity <= 6) {
        const priceIndex = product.price - 1;
        const popularityIndex = 6 - product.popularity; // 人気度6が0番目（上）になるように
        if (!grid[popularityIndex][priceIndex]) {
          grid[popularityIndex][priceIndex] = [];
        }
        grid[popularityIndex][priceIndex].push(product);
      }
    });

    return (
      <div style={{ margin: '10px 0' }}>
        <h4>{player.name} のパーソナル・マーケット</h4>
        <div style={{ display: 'inline-block', border: '2px solid #333' }}>
          {/* ヘッダー（価格） */}
          <div style={{ display: 'flex' }}>
            <div style={{ width: '60px', height: '30px', border: '1px solid #ccc', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              価格→
            </div>
            {[1, 2, 3, 4, 5, 6].map(price => (
              <div key={price} style={{ width: '80px', height: '30px', border: '1px solid #ccc', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {price}
              </div>
            ))}
          </div>
          
          {/* グリッド本体 */}
          {grid.map((row, popularityIndex) => (
            <div key={popularityIndex} style={{ display: 'flex' }}>
              {/* 人気度ラベル */}
              <div style={{ width: '60px', height: '60px', border: '1px solid #ccc', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', writingMode: 'vertical-rl' }}>
                人気{6 - popularityIndex}
              </div>
              
              {/* セル */}
              {row.map((cell, priceIndex) => (
                <div key={priceIndex} style={{ 
                  width: '80px', 
                  height: '60px', 
                  border: '1px solid #ccc', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: cell && cell.length > 0 ? '#e3f2fd' : 'white',
                  fontSize: '10px',
                  overflow: 'hidden'
                }}>
                  {cell && cell.map((product: any) => (
                    <div key={product.id} style={{ 
                      margin: '1px',
                      padding: '2px',
                      backgroundColor: product.isResale ? '#ffcdd2' : '#c8e6c9',
                      border: '1px solid #999',
                      borderRadius: '2px',
                      fontSize: '8px',
                      textAlign: 'center',
                      width: '70px'
                    }}>
                      {product.isResale ? '転売' : '通常'}
                      <br/>C{product.cost}
                      {currentPlayer.money >= product.price && isActive && currentPlayer.actionPoints >= 1 && player.id !== currentPlayer.id && (
                        <button 
                          onClick={() => moves.purchase(player.id, product.id)}
                          style={{ 
                            fontSize: '6px', 
                            padding: '1px 2px', 
                            marginTop: '1px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          購入
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPlayer = (player: Player) => (
    <div key={player.id} className="player-info" style={{
      border: player.id === playerID ? '2px solid blue' : '1px solid gray',
      padding: '10px',
      margin: '5px',
      backgroundColor: player.id === playerID ? '#e3f2fd' : '#f5f5f5'
    }}>
      <h3>{player.name} {player.id === ctx.currentPlayer && isActive ? '(現在のターン)' : ''}</h3>
      <div>資金: {player.money}</div>
      <div>威厳: {player.prestige}</div>
      <div>転売履歴: {player.resaleHistory}</div>
      <div>AP: {player.actionPoints}/3</div>
      
      <div>
        <h4>設計図</h4>
        {player.designs.map(design => (
          <div key={design.id} style={{ margin: '5px', padding: '5px', border: '1px solid #ccc' }}>
            コスト: {design.cost} {design.isOpenSource ? '(オープンソース)' : ''}
            {player.id === playerID && isActive && (
              <button 
                onClick={() => handleManufacture(design.id)}
                disabled={player.money < design.cost || player.actionPoints < 1}
                style={{ marginLeft: '10px' }}
              >
                製造 ({design.cost}資金)
              </button>
            )}
          </div>
        ))}
      </div>

      <div>
        <h4>パーソナル・マーケット</h4>
        {player.personalMarket.map(product => (
          <div key={product.id} style={{ margin: '5px', padding: '5px', border: '1px solid #ddd' }}>
            {product.isResale ? '転売品' : '通常品'} - コスト: {product.cost}, 価格: {product.price || '未設定'}, 人気度: {product.popularity}
            {player.id === playerID && isActive && product.price === 0 && (
              <div>
                <input 
                  id={`price-input-${product.id}`}
                  type="number" 
                  placeholder="価格設定"
                  min="1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const input = document.getElementById(`price-input-${product.id}`) as HTMLInputElement;
                      const price = parseInt(input.value, 10);
                      if (price > 0 && !isNaN(price)) {
                        handleSell(product.id, price);
                        input.value = '';
                      } else {
                        console.error('Invalid price input:', input.value);
                      }
                    }
                  }}
                />
                <button onClick={() => {
                  const input = document.getElementById(`price-input-${product.id}`) as HTMLInputElement;
                  const price = parseInt(input.value, 10);
                  if (price > 0 && !isNaN(price)) {
                    handleSell(product.id, price);
                    input.value = '';
                  } else {
                    console.error('Invalid price input:', input.value);
                  }
                }}>
                  販売
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex' }}>
      {/* メインゲーム画面 */}
      <div style={{ 
        flex: 1, 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        marginRight: '350px' // プレイログ分の余白
      }}>
        <h1>マーケット・ディスラプション</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>ゲーム情報</h2>
        <div>ゲームモード: {ctx.numPlayers === 1 ? '🤖 オートマ対戦' : `👥 ${ctx.numPlayers}人プレイ`}</div>
        <div>ラウンド: {G.round}</div>
        <div>フェーズ: {G.phase}</div>
        <div>市場汚染レベル: {G.marketPollution}</div>
        <div>規制レベル: {G.regulationLevel}</div>
        
        {G.availableTrends && G.availableTrends[playerID] && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e3f2fd', border: '1px solid #2196F3', borderRadius: '4px' }}>
            <h4>🔬 リサーチ結果</h4>
            <div><strong>{G.availableTrends[playerID].effect.name}</strong></div>
            <div>{G.availableTrends[playerID].effect.description}</div>
            {G.availableTrends[playerID].effect.cost && (
              <div style={{ color: '#f44336' }}>
                発動コスト: {G.availableTrends[playerID].effect.cost.prestige ? `威厳${G.availableTrends[playerID].effect.cost.prestige}` : ''}
              </div>
            )}
            <button
              onClick={() => moves.activateTrend()}
              disabled={!!(G.availableTrends[playerID].effect.cost?.prestige && currentPlayer.prestige < G.availableTrends[playerID].effect.cost.prestige)}
              style={{
                marginTop: '8px',
                padding: '8px 16px',
                backgroundColor: (G.availableTrends[playerID].effect.cost?.prestige && currentPlayer.prestige < G.availableTrends[playerID].effect.cost.prestige) ? '#ccc' : '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (G.availableTrends[playerID].effect.cost?.prestige && currentPlayer.prestige < G.availableTrends[playerID].effect.cost.prestige) ? 'not-allowed' : 'pointer'
              }}
            >
              トレンド発動 {G.availableTrends[playerID].effect.cost?.prestige && currentPlayer.prestige < G.availableTrends[playerID].effect.cost.prestige ? '[威厳不足]' : ''}
            </button>
          </div>
        )}
      </div>

      {G.gameEnded && G.winner ? (
        <div style={{ fontSize: '24px', color: 'green', textAlign: 'center', margin: '20px' }}>
          🎉 {G.players[G.winner].name} の勝利！ 🎉
        </div>
      ) : null}

      <div style={{ marginBottom: '20px' }}>
        <h2>アクション</h2>
        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
          デバッグ情報 (v16ba9b3): プレイヤーID={playerID}, 現在のプレイヤー={ctx.currentPlayer}, アクティブ={isActive ? 'Yes' : 'No'}, フェーズ={ctx.phase}<br/>
          条件チェック: currentPlayer.id({currentPlayer.id}) === ctx.currentPlayer({ctx.currentPlayer}) = {currentPlayer.id === ctx.currentPlayer ? 'True' : 'False'}<br/>
          フェーズチェック: ctx.phase({ctx.phase}) === 'action' = {ctx.phase === 'action' ? 'True' : 'False'}<br/>
          最終条件: {currentPlayer.id === ctx.currentPlayer && isActive && ctx.phase === 'action' ? 'アクション可能' : 'アクション不可'}
        </div>
        {currentPlayer.id === ctx.currentPlayer && isActive && ctx.phase === 'action' ? (
          <div>
            <button 
              onClick={handlePartTimeWork}
              disabled={currentPlayer.actionPoints < 2}
              style={{ 
                margin: '5px', 
                padding: '10px',
                backgroundColor: currentPlayer.actionPoints < 2 ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                cursor: currentPlayer.actionPoints < 2 ? 'not-allowed' : 'pointer'
              }}
            >
              アルバイト (2AP → 5資金) {currentPlayer.actionPoints < 2 ? '[AP不足]' : ''}
            </button>
            <button 
              onClick={() => handleDesign(false)}
              disabled={currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6}
              style={{ 
                margin: '5px', 
                padding: '10px',
                backgroundColor: (currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6) ? '#ccc' : '#2196F3',
                color: 'white',
                border: 'none',
                cursor: (currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6) ? 'not-allowed' : 'pointer'
              }}
            >
              設計 (2AP) {currentPlayer.actionPoints < 2 ? '[AP不足]' : currentPlayer.designs.length >= 6 ? '[設計上限]' : ''}
            </button>
            <button 
              onClick={() => handleDesign(true)}
              disabled={currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6}
              style={{ 
                margin: '5px', 
                padding: '10px',
                backgroundColor: (currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6) ? '#ccc' : '#FF9800',
                color: 'white',
                border: 'none',
                cursor: (currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6) ? 'not-allowed' : 'pointer'
              }}
            >
              オープンソース設計 (2AP) {currentPlayer.actionPoints < 2 ? '[AP不足]' : currentPlayer.designs.length >= 6 ? '[設計上限]' : ''}
            </button>
            <button 
              onClick={() => moves.dayLabor()}
              disabled={currentPlayer.actionPoints < 3 || currentPlayer.money > 100}
              style={{ 
                margin: '5px', 
                padding: '10px',
                backgroundColor: (currentPlayer.actionPoints < 3 || currentPlayer.money > 100) ? '#ccc' : '#f44336',
                color: 'white',
                border: 'none',
                cursor: (currentPlayer.actionPoints < 3 || currentPlayer.money > 100) ? 'not-allowed' : 'pointer'
              }}
            >
              日雇い労働 (3AP → 18資金) {currentPlayer.actionPoints < 3 ? '[AP不足]' : currentPlayer.money > 100 ? '[資金上限]' : ''}
            </button>
            <button 
              onClick={() => moves.research()}
              disabled={currentPlayer.actionPoints < 1}
              style={{ 
                margin: '5px', 
                padding: '10px',
                backgroundColor: currentPlayer.actionPoints < 1 ? '#ccc' : '#9C27B0',
                color: 'white',
                border: 'none',
                cursor: currentPlayer.actionPoints < 1 ? 'not-allowed' : 'pointer'
              }}
            >
              リサーチ (1AP → トレンド調査) {currentPlayer.actionPoints < 1 ? '[AP不足]' : ''}
            </button>
            <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
              {ctx.numPlayers === 1 ? (
                // 一人プレイ: オートマフェーズへ移行ボタン（ターン終了も含む）
                <button 
                  onClick={async () => {
                    if (isTransitioning) {
                      console.log('⚠️ 既にフェーズ遷移中です');
                      return;
                    }
                    
                    setIsTransitioning(true);
                    console.log('🎯 一人プレイ: オートマフェーズへ移行:', { events, ctx });
                    
                    try {
                      // 1人プレイ時はターン終了してからフェーズ終了
                      if (events && typeof events.endTurn === 'function') {
                        console.log('✅ Calling events.endTurn');
                        events.endTurn();
                      }
                      
                      // 少し待ってからフェーズ終了
                      setTimeout(() => {
                        // オートマフェーズに移行
                        if (events && typeof events.endPhase === 'function') {
                          console.log('✅ Transitioning to automata phase');
                          const result = events.endPhase();
                          console.log('📊 endPhase result:', result);
                        } else if (ctx.events && typeof ctx.events.endPhase === 'function') {
                          console.log('✅ Using ctx.events.endPhase');
                          ctx.events.endPhase();
                        } else {
                          console.error('❌ endPhase function not found');
                        }
                        
                        // 遷移状態をリセット
                        setTimeout(() => setIsTransitioning(false), 2000);
                      }, 100);
                      
                    } catch (error) {
                      console.error('💥 Error transitioning to automata phase:', error);
                      setIsTransitioning(false);
                    }
                  }}
                  disabled={isTransitioning}
                  style={{ 
                    margin: '5px', 
                    padding: '15px 30px',
                    backgroundColor: isTransitioning ? '#ccc' : '#FF5722',
                    color: 'white',
                    border: 'none',
                    cursor: isTransitioning ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  {isTransitioning ? 'フェーズ遷移中...' : `オートマフェーズへ (残りAP: ${currentPlayer.actionPoints})`}
                </button>
              ) : (
                // 複数人プレイ: 通常のターン終了ボタン
                <button 
                  onClick={() => {
                    console.log('👥 複数人プレイ: ターン終了:', { events, ctx });
                    if (events && events.endTurn) {
                      events.endTurn();
                    } else if (ctx.events && ctx.events.endTurn) {
                      ctx.events.endTurn();
                    } else {
                      console.error('endTurn イベントが見つかりません');
                    }
                  }}
                  style={{ 
                    margin: '5px', 
                    padding: '15px 30px',
                    backgroundColor: '#9C27B0',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  ターン終了 (残りAP: {currentPlayer.actionPoints})
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ color: '#999' }}>
            {currentPlayer.id !== ctx.currentPlayer 
              ? 'あなたのターンではありません' 
              : ctx.phase !== 'action' 
                ? `現在は${ctx.phase}フェーズです。アクションフェーズまでお待ちください。` 
                : 'アクションを実行できません'}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <h2>プレイヤー情報</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {Object.values(G.players).map(renderPlayer)}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>🏪 マーケットボード</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '20px' }}>
          {Object.values(G.players).map((player) => renderMarketGrid(player))}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>オートマ・マーケット</h2>
        <div>メーカー・オートマ資金: 無限</div>
        <div>転売ヤー・オートマ資金: {G.automata.resaleOrganizationMoney}</div>
        
        <h3>オートマ商品</h3>
        {G.automata.market.map(product => (
          <div key={product.id} style={{ margin: '5px', padding: '5px', border: '1px solid #eee' }}>
            {product.isResale ? '転売品' : '通常品'} - コスト: {product.cost}, 価格: {product.price}, 人気度: {product.popularity}
            {currentPlayer.money >= product.price && isActive && currentPlayer.actionPoints >= 1 && (
              <button 
                onClick={() => moves.purchase('automata', product.id)}
                style={{ marginLeft: '10px' }}
              >
                購入 ({product.price}資金)
              </button>
            )}
          </div>
        ))}
      </div>

      {ctx.gameover && (
        <div style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          border: '2px solid black',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2>ゲーム終了</h2>
          <p>勝者: {G.players[ctx.gameover.winner]?.name || '不明'}</p>
        </div>
      )}
      </div>

      {/* プレイログ */}
      <PlayLog playLog={G.playLog} />
    </div>
  );
};