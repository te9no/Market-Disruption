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
  
  // ロビー画面
  if (G.phase === 'lobby') {
    const currentPlayerCount = Object.keys(G.players).length;
    const isOwner = playerID === '0'; // プレイヤー0をオーナーとする
    const isPlayerJoined = playerID && G.players[playerID];
    
    return (
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '30px', 
          borderRadius: '12px',
          border: '2px solid #333',
          marginBottom: '20px'
        }}>
          <h1 style={{ fontSize: '36px', color: '#FF5722', marginBottom: '10px' }}>
            🏪 マーケット・ディスラプション
          </h1>
          <h2 style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
            転売ヤーをテーマにしたボードゲーム
          </h2>
          
          {/* 参加プレイヤー一覧 */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>👥 参加プレイヤー ({currentPlayerCount}/4)</h3>
            <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
              {Object.entries(G.players).map(([id, player]) => (
                <div key={id} style={{ 
                  padding: '8px 12px', 
                  backgroundColor: id === '0' ? '#e8f5e8' : '#f9f9f9',
                  border: `2px solid ${id === '0' ? '#4CAF50' : '#ddd'}`,
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>
                    <strong>{player.name}</strong> 
                    {id === '0' && <span style={{ color: '#4CAF50', marginLeft: '8px' }}>👑 オーナー</span>}
                  </span>
                  <span style={{ color: '#666' }}>プレイヤー{parseInt(id) + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ゲーム参加ボタン or 待機メッセージ */}
          {!isPlayerJoined ? (
            <div style={{ marginBottom: '20px' }}>
              {currentPlayerCount < 4 ? (
                <button
                  onClick={() => {
                    const playerName = prompt('プレイヤー名を入力してください:', `Player ${currentPlayerCount + 1}`);
                    if (playerName && moves.joinGame) {
                      moves.joinGame(playerName);
                    }
                  }}
                  style={{
                    fontSize: '20px',
                    padding: '12px 30px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    marginRight: '10px'
                  }}
                >
                  🎮 ゲームに参加
                </button>
              ) : (
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: '#ffeb3b', 
                  borderRadius: '8px',
                  border: '2px solid #fbc02d'
                }}>
                  <strong>ゲームが満員です (4/4)</strong>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#e8f5e8', 
              borderRadius: '8px',
              border: '2px solid #4CAF50',
              marginBottom: '20px'
            }}>
              <strong>✅ ゲームに参加済み</strong>
              {isOwner && <div style={{ marginTop: '8px', color: '#2E7D32' }}>オーナーとしてゲームを開始できます</div>}
            </div>
          )}

          {/* ゲーム開始ボタン（オーナーのみ） */}
          {isOwner && currentPlayerCount >= 1 && (
            <button
              onClick={() => {
                if (moves.startGame) {
                  moves.startGame();
                }
              }}
              style={{
                fontSize: '24px',
                padding: '15px 40px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              🎮 ゲーム開始！
            </button>
          )}

          {/* ゲーム情報 */}
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '20px', 
            borderRadius: '8px',
            marginTop: '20px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>📋 ゲーム情報</h3>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <div><strong>プレイ時間:</strong> 30-45分</div>
              <div><strong>勝利条件:</strong> 威厳17ポイント + 資金75以上 または 資金150以上</div>
              <div><strong>戦略:</strong> 正規ルート vs 転売ルートの選択</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!playerID) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          backgroundColor: '#ffebee',
          border: '2px solid #f44336',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <h2 style={{ color: '#d32f2f', marginBottom: '15px' }}>⚠️ プレイヤーIDが未設定</h2>
          <p>ゲームに参加するためにはプレイヤーIDが必要です。</p>
          <p>ページを再読み込みして、再度お試しください。</p>
        </div>
      </div>
    );
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
    // 6×24のグリッド（価格1-24 × 人気度1-6）
    const grid = Array(6).fill(null).map(() => Array(24).fill(null));
    
    // 商品をグリッドに配置（人気度は高い方が上に来るように逆順）
    player.personalMarket.forEach(product => {
      if (product.price > 0 && product.price <= 24 && product.popularity >= 1 && product.popularity <= 6) {
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
        <h4>{player.name} のパーソナル・マーケット {player.id === currentPlayer.id ? '(あなた - 転売ボタンなし)' : '(他プレイヤー - 🔴転売ボタンあり🔴)'}</h4>
        <div style={{ fontSize: '10px', color: '#FF5722', marginBottom: '5px' }}>
          {player.id === currentPlayer.id ? 
            '⚠️自分の商品には転売ボタンは表示されません。他のプレイヤーの商品を確認してください。' : 
            '✅このマーケットの商品には転売ボタンが表示されます（価格設定済みの商品のみ）'}
        </div>
        <div style={{ 
          display: 'inline-block', 
          border: '2px solid #333',
          overflowX: isMobile ? 'auto' : 'visible',
          width: isMobile ? '100%' : 'auto'
        }}>
          {/* ヘッダー（価格） */}
          <div style={{ display: 'flex' }}>
            <div style={{ 
              width: isMobile ? '40px' : '80px', 
              height: '30px', 
              border: '1px solid #ccc', 
              backgroundColor: '#f5f5f5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 'bold',
              fontSize: isMobile ? '8px' : '12px'
            }}>
              価格→
            </div>
            {Array.from({length: 24}, (_, i) => i + 1).map(price => (
              <div key={price} style={{ 
                width: isMobile ? '30px' : '65px', 
                height: '30px', 
                border: '1px solid #ccc', 
                backgroundColor: '#f5f5f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold', 
                fontSize: isMobile ? '8px' : '10px' 
              }}>
                {price}
              </div>
            ))}
          </div>
          
          {/* グリッド本体 */}
          {grid.map((row, popularityIndex) => (
            <div key={popularityIndex} style={{ display: 'flex' }}>
              {/* 人気度ラベル */}
              <div style={{ 
                width: isMobile ? '40px' : '80px', 
                height: isMobile ? '40px' : '60px', 
                border: '1px solid #ccc', 
                backgroundColor: '#f5f5f5', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold', 
                writingMode: 'vertical-rl',
                fontSize: isMobile ? '8px' : '12px'
              }}>
                人気{6 - popularityIndex}
              </div>
              
              {/* セル */}
              {row.map((cell, priceIndex) => (
                <div key={priceIndex} style={{ 
                  width: isMobile ? '30px' : '65px', 
                  height: isMobile ? '40px' : '60px', 
                  border: '1px solid #ccc', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: cell && cell.length > 0 ? '#e3f2fd' : 'white',
                  fontSize: isMobile ? '8px' : '10px',
                  overflow: 'hidden'
                }}>
                  {cell && cell.map((product: any) => (
                    <div key={product.id} style={{ 
                      margin: '1px',
                      padding: '2px',
                      backgroundColor: product.isResale ? '#ffcdd2' : '#c8e6c9',
                      border: product.isResale ? '2px solid #d32f2f' : '1px solid #999',
                      borderRadius: product.isResale ? '8px' : '2px',
                      fontSize: '6px',
                      textAlign: 'center',
                      width: isMobile ? '28px' : '60px',
                      position: 'relative'
                    }}>
                      {product.isResale ? (
                        <>
                          <div style={{ fontSize: '4px', color: '#d32f2f', fontWeight: 'bold' }}>🥤転売</div>
                          <div style={{ fontSize: '4px' }}>元:{G.players[product.originalPlayerId || '']?.name?.slice(0,2) || '?'}</div>
                          <div>C{product.originalCost || product.cost}</div>
                        </>
                      ) : (
                        <>
                          通常
                          <br/>C{product.cost}
                        </>
                      )}
                      {player.id !== currentPlayer.id && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '1px' }}>
                          <div style={{ 
                            fontSize: isMobile ? '2px' : '3px', 
                            color: '#666', 
                            marginBottom: '1px',
                            display: isMobile ? 'none' : 'block'
                          }}>
                            デバッグ: プレイヤー={player.name} vs 現在={currentPlayer.name}, アクティブ={isActive ? 'Yes' : 'No'}, 価格={product.price}
                          </div>
                          {currentPlayer.money >= product.price && currentPlayer.actionPoints >= 1 && isActive && (
                            <button 
                              onClick={() => moves.purchase(player.id, product.id)}
                              style={{ 
                                fontSize: isMobile ? '4px' : '5px', 
                                padding: '1px', 
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                width: isMobile ? '28px' : 'auto'
                              }}
                            >
                              {isMobile ? '購' : '購入'}
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              if (product.price === 0) {
                                alert('出品されていない商品は転売できません');
                                return;
                              }
                              if (!isActive) {
                                alert('あなたのターンではありません');
                                return;
                              }
                              if (player.id === currentPlayer.id) {
                                alert('自分の商品は転売できません');
                                return;
                              }
                              if (currentPlayer.money < product.price) {
                                alert(`資金不足: ${product.price}資金が必要です（現在${currentPlayer.money}資金）`);
                                return;
                              }
                              if (currentPlayer.actionPoints < 2) {
                                alert(`AP不足: 2APが必要です（現在${currentPlayer.actionPoints}AP）`);
                                return;
                              }
                              // 転売は悪の所業なので威厳が最低でも実行可能
                              
                              const resaleBonus = currentPlayer.resaleHistory <= 1 ? 5 : 
                                                 currentPlayer.resaleHistory <= 4 ? 8 :
                                                 currentPlayer.resaleHistory <= 7 ? 11 : 15;
                              const maxPrice = Math.min(24, product.price + resaleBonus);
                              const resalePrice = parseInt(prompt(`転売価格を入力 (${product.price + 1}-${maxPrice}):`) || '0', 10);
                              if (resalePrice >= product.price + 1 && resalePrice <= maxPrice) {
                                moves.resale(player.id, product.id, resalePrice);
                              } else if (resalePrice > 0) {
                                alert(`価格範囲外: ${product.price + 1}～${maxPrice}の間で入力してください`);
                              }
                            }}
                            style={{ 
                              fontSize: isMobile ? '4px' : '8px', 
                              padding: isMobile ? '1px 2px' : '3px 5px', 
                              backgroundColor: (product.price > 0 && isActive && player.id !== currentPlayer.id) ? '#FF5722' : '#999',
                              color: 'white',
                              border: isMobile ? '1px solid #FF0000' : '2px solid #FF0000',
                              cursor: 'pointer',
                              marginTop: '2px',
                              fontWeight: 'bold',
                              borderRadius: '4px',
                              width: isMobile ? '28px' : 'auto'
                            }}
                          >
                            {isMobile ? '転' : '🔴転売🔴'} {isMobile ? '' : (product.price === 0 ? '[未出品]' : !isActive ? '[非ターン]' : player.id === currentPlayer.id ? '[自分商品]' : '')}
                          </button>
                          {currentPlayer.actionPoints >= 1 && currentPlayer.prestige >= 1 && (
                            <div style={{ display: 'flex', gap: '1px' }}>
                              <button 
                                onClick={() => moves.review(player.id, product.id, true)}
                                style={{ 
                                  fontSize: '4px', 
                                  padding: '1px 1px', 
                                  backgroundColor: '#2196F3',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                👍
                              </button>
                              <button 
                                onClick={() => moves.review(player.id, product.id, false)}
                                style={{ 
                                  fontSize: '4px', 
                                  padding: '1px 1px', 
                                  backgroundColor: '#f44336',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                👎
                              </button>
                            </div>
                          )}
                          {currentPlayer.actionPoints >= 1 && currentPlayer.money >= 3 && (
                            <div style={{ display: 'flex', gap: '1px', marginTop: '1px' }}>
                              <button 
                                onClick={() => moves.outsourceReview(player.id, product.id, true)}
                                style={{ 
                                  fontSize: '3px', 
                                  padding: '1px 1px', 
                                  backgroundColor: '#FF9800',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                💰👍
                              </button>
                              <button 
                                onClick={() => moves.outsourceReview(player.id, product.id, false)}
                                style={{ 
                                  fontSize: '3px', 
                                  padding: '1px 1px', 
                                  backgroundColor: '#795548',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                💰👎
                              </button>
                            </div>
                          )}
                        </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>{player.name} {player.id === ctx.currentPlayer && isActive ? '👑' : ''}</h3>
        {player.id === ctx.currentPlayer && isActive && (
          <span style={{ 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '12px',
            fontWeight: 'bold'
          }}>現在のターン</span>
        )}
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
        gap: '8px', 
        marginBottom: '10px' 
      }}>
        <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
          <strong>💰 資金:</strong> {player.money}
          {/* 勝利条件チェック */}
          {player.money >= 150 && <span style={{ color: '#4CAF50', marginLeft: '5px' }}>🎉資金勝利!</span>}
          {player.money >= 75 && player.prestige >= 17 && <span style={{ color: '#4CAF50', marginLeft: '5px' }}>🎉威厳勝利!</span>}
        </div>
        <div style={{ 
          padding: '6px', 
          backgroundColor: player.prestige < 0 ? '#ffebee' : player.prestige >= 17 ? '#e8f5e8' : 'white', 
          borderRadius: '4px', 
          border: '1px solid #ddd'
        }}>
          <strong>⭐ 威厳:</strong> {player.prestige}
          {player.prestige >= 17 && <span style={{ color: '#4CAF50', marginLeft: '5px' }}>🎯達成!</span>}
        </div>
        <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
          <strong>🔄 転売履歴:</strong> {player.resaleHistory}
          <div style={{ fontSize: '10px', color: '#666' }}>ボーナス: +{
            player.resaleHistory <= 1 ? 5 :
            player.resaleHistory <= 4 ? 8 :
            player.resaleHistory <= 7 ? 11 : 15
          }資金</div>
        </div>
        <div style={{ 
          padding: '6px', 
          backgroundColor: player.actionPoints === 0 ? '#ffebee' : 'white', 
          borderRadius: '4px', 
          border: '1px solid #ddd'
        }}>
          <strong>⚡ AP:</strong> {player.actionPoints}/3
        </div>
      </div>
      
      <div>
        <h4>設計図</h4>
        {player.designs.map(design => (
          <div key={design.id} style={{ margin: '5px', padding: '5px', border: '1px solid #ccc' }}>
            コスト: {design.cost} {design.isOpenSource ? '(オープンソース)' : ''}
            {player.id === playerID && isActive && (
              <>
                <button 
                  onClick={() => handleManufacture(design.id)}
                  disabled={player.money < design.cost || player.actionPoints < 1}
                  style={{ marginLeft: '10px' }}
                >
                  製造 ({design.cost}資金)
                </button>
                {currentPlayer.prestige > -3 && (
                  <>
                    <button 
                      onClick={() => {
                        const quantity = parseInt(prompt('製造個数を入力してください（1-5）:') || '1', 10);
                        if (quantity > 0 && quantity <= 5) {
                          moves.outsourceManufacturing(design.id, quantity, 'automata');
                        }
                      }}
                      disabled={currentPlayer.money < (design.cost + 2) || currentPlayer.actionPoints < 1}
                      style={{ marginLeft: '5px', backgroundColor: '#FF9800', color: 'white', border: 'none', padding: '2px 6px', fontSize: '11px' }}
                    >
                      オートマ外注 ({design.cost + 2}/個)
                    </button>
                    {Object.values(G.players).filter(p => p.id !== currentPlayer.id).map(otherPlayer => (
                      <button 
                        key={otherPlayer.id}
                        onClick={() => moves.outsourceManufacturing(design.id, 1, 'player', otherPlayer.id)}
                        disabled={currentPlayer.money < design.cost || currentPlayer.actionPoints < 1}
                        style={{ marginLeft: '5px', backgroundColor: '#9C27B0', color: 'white', border: 'none', padding: '2px 6px', fontSize: '10px' }}
                      >
                        {otherPlayer.name}に外注 ({design.cost}資金)
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div>
        <h4>パーソナル・マーケット</h4>
        {player.personalMarket.map(product => (
          <div key={product.id} style={{ 
            margin: '5px', 
            padding: '5px', 
            border: product.isResale ? '2px solid #d32f2f' : '1px solid #ddd',
            borderRadius: product.isResale ? '8px' : '4px',
            backgroundColor: product.isResale ? '#ffebee' : 'white'
          }}>
            {product.isResale ? (
              <>
                🥤<strong>転売品</strong> (元製造者: {G.players[product.originalPlayerId || '']?.name || '不明'}) - 
                元コスト: {product.originalCost || product.cost}, 価格: {product.price || '未設定'}, 人気度: {product.popularity}
              </>
            ) : (
              <>通常品 - コスト: {product.cost}, 価格: {product.price || '未設定'}, 人気度: {product.popularity}</>
            )}
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

  const isMobile = window.innerWidth <= 768;
  
  return (
    <div style={{ 
      display: isMobile ? 'flex' : 'grid',
      gridTemplateColumns: isMobile ? 'none' : '1fr 320px',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      overflow: 'hidden',
      gap: 0
    }}>
      {/* メインゲーム画面 */}
      <div style={{ 
        padding: isMobile ? '10px' : '20px', 
        fontFamily: 'Arial, sans-serif',
        overflow: 'auto',
        minWidth: 0
      }}>
        <h1>マーケット・ディスラプション</h1>
      
      <div style={{ 
        marginBottom: '20px',
        backgroundColor: '#f5f5f5',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '15px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 ゲーム情報</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '10px', 
          fontSize: isMobile ? '12px' : '14px' 
        }}>
          <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
            <strong>ゲームモード:</strong> {ctx.numPlayers === 1 ? '🤖 オートマ対戦' : `👥 ${ctx.numPlayers}人プレイ`}
          </div>
          <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
            <strong>ラウンド:</strong> {G.round}
          </div>
          <div style={{ padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
            <strong>フェーズ:</strong> アクション
          </div>
          <div style={{ 
            padding: '8px', 
            backgroundColor: G.marketPollution > 8 ? '#ffebee' : G.marketPollution > 5 ? '#fff3e0' : 'white', 
            borderRadius: '4px',
            border: G.marketPollution > 8 ? '2px solid #f44336' : G.marketPollution > 5 ? '1px solid #ff9800' : 'none'
          }}>
            <strong>市場汚染:</strong> {G.marketPollution}/12 
            {G.marketPollution > 8 && <span style={{ color: '#f44336' }}> ⚠️重度</span>}
            {G.marketPollution > 5 && G.marketPollution <= 8 && <span style={{ color: '#ff9800' }}> ⚠️中度</span>}
          </div>
          <div style={{ 
            padding: '8px', 
            backgroundColor: (G?.regulationStage && G.regulationStage !== 'none') ? '#e8f5e8' : 'white', 
            borderRadius: '4px',
            border: (G?.regulationStage && G.regulationStage !== 'none') ? '1px solid #4CAF50' : 'none',
            color: (!G?.regulationStage || G.regulationStage === 'none') ? '#666' : 
                   G.regulationStage === 'public_comment' ? '#ff9900' :
                   G.regulationStage === 'consideration' ? '#ff6600' : '#f44336',
            fontWeight: (G?.regulationStage && G.regulationStage !== 'none') ? 'bold' : 'normal'
          }}>
            <strong>規制状態:</strong> {
              !G?.regulationStage || G.regulationStage === 'none' ? '規制なし' :
              G.regulationStage === 'public_comment' ? `📢 パブコメ中 (${G.regulationStageRounds}R)` :
              G.regulationStage === 'consideration' ? `🔍 検討中 (${G.regulationStageRounds}R)` :
              G.regulationStage === 'enforcement' ? `⚖️ 規制発動中 (${G.regulationStageRounds}R)` : '規制なし'
            }
          </div>
          {G.shortVideoBonus && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '4px',
              border: '1px solid #2196F3'
            }}>
              <strong>📱 ショート動画ブーム:</strong> 転売時+2資金
            </div>
          )}
        </div>
        
        {/* 汚染ペナルティ情報 */}
        {G.marketPollution > 2 && (
          <div style={{ 
            marginTop: '10px', 
            padding: '8px', 
            backgroundColor: '#fff3e0', 
            border: '1px solid #ff9800',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <strong>🏭 汚染ペナルティ:</strong> 全商品価格 -{
              G.marketPollution <= 5 ? 1 :
              G.marketPollution <= 8 ? 2 :
              G.marketPollution <= 11 ? 3 : 4
            } (転売品は除外)
          </div>
        )}
      </div>
        
        {/* 外注依頼通知 */}
        {G.pendingManufacturingOrders && G.pendingManufacturingOrders
          .filter(order => order.contractorId === playerID && order.status === 'pending')
          .map(order => {
            const client = G.players[order.clientId];
            return (
              <div key={order.id} style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e8', border: '1px solid #4CAF50', borderRadius: '4px' }}>
                <h4>📋 製造外注依頼</h4>
                <div><strong>{client?.name}</strong>からの依頼</div>
                <div>製造コスト: {order.cost}資金</div>
                <div>依頼ラウンド: {order.round}</div>
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => moves.respondToManufacturingOrder(order.id, true)}
                    disabled={!isActive}
                    style={{
                      marginRight: '8px',
                      padding: '8px 16px',
                      backgroundColor: isActive ? '#4CAF50' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isActive ? 'pointer' : 'not-allowed'
                    }}
                  >
                    ✅ 受諾 (次ラウンドAP-1)
                  </button>
                  <button
                    onClick={() => moves.respondToManufacturingOrder(order.id, false)}
                    disabled={!isActive}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isActive ? '#f44336' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isActive ? 'pointer' : 'not-allowed'
                    }}
                  >
                    ❌ 拒否
                  </button>
                </div>
              </div>
            );
          })}
        
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

      {/* 勝利条件ステータス */}
      <div style={{ 
        marginBottom: '20px',
        backgroundColor: '#e8f5e8',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        padding: '15px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#2E7D32' }}>🏆 勝利条件</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '10px' 
        }}>
          <div style={{ 
            padding: '10px', 
            backgroundColor: 'white', 
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}>
            <strong>💰 資金勝利:</strong> 150資金以上
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              現在: {currentPlayer.money}/150 ({Math.max(0, 150 - currentPlayer.money)}不足)
            </div>
          </div>
          <div style={{ 
            padding: '10px', 
            backgroundColor: 'white', 
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}>
            <strong>⭐ 威厳勝利:</strong> 威厳17 + 資金75以上
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              威厳: {currentPlayer.prestige}/17 ({Math.max(0, 17 - currentPlayer.prestige)}不足)
              <br/>資金: {currentPlayer.money}/75 ({Math.max(0, 75 - currentPlayer.money)}不足)
            </div>
          </div>
        </div>
      </div>
      
      {G.gameEnded && G.winner ? (
        <div style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 9999
        }}>
          🎉 {G.players[G.winner].name} の勝利！ 🎉
          <div style={{ fontSize: '16px', marginTop: '10px', fontWeight: 'normal' }}>
            おめでとうございます！
          </div>
        </div>
      ) : null}

      <div style={{ 
        marginBottom: '20px',
        backgroundColor: '#f5f5f5',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '15px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>⚙️ アクション</h2>
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: currentPlayer.id === ctx.currentPlayer && isActive && ctx.phase === 'action' ? '#e8f5e8' : '#ffebee',
          border: currentPlayer.id === ctx.currentPlayer && isActive && ctx.phase === 'action' ? '1px solid #4CAF50' : '1px solid #f44336',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>ステータス:</strong> {currentPlayer.id === ctx.currentPlayer && isActive && ctx.phase === 'action' ? '✅ アクション可能' : '❌ アクション不可'}
          <br/><strong>現在のプレイヤー:</strong> {G.players[ctx.currentPlayer]?.name || '不明'}
        </div>
        {currentPlayer.id === ctx.currentPlayer && isActive && ctx.phase === 'action' ? (
          <div>
            {/* 1APアクション */}
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>🔵 1APアクション</h3>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: isMobile ? '4px' : '8px',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button 
                  onClick={() => moves.research()}
                  disabled={currentPlayer.actionPoints < 1}
                  style={{ 
                    padding: isMobile ? '8px 12px' : '10px 15px',
                    backgroundColor: currentPlayer.actionPoints < 1 ? '#ccc' : '#9C27B0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPlayer.actionPoints < 1 ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  🔬 リサーチ {currentPlayer.actionPoints < 1 ? '[AP不足]' : ''}
                </button>
                <button 
                  onClick={() => moves.purchasePrestige()}
                  disabled={currentPlayer.actionPoints < 1 || currentPlayer.money < 5 || (G.prestigePurchasePerRound && G.prestigePurchasePerRound[`${G.round}-${currentPlayer.id}`])}
                  style={{ 
                    padding: isMobile ? '8px 12px' : '10px 15px',
                    backgroundColor: (currentPlayer.actionPoints < 1 || currentPlayer.money < 5 || (G.prestigePurchasePerRound && G.prestigePurchasePerRound[`${G.round}-${currentPlayer.id}`])) ? '#ccc' : '#FFD700',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (currentPlayer.actionPoints < 1 || currentPlayer.money < 5 || (G.prestigePurchasePerRound && G.prestigePurchasePerRound[`${G.round}-${currentPlayer.id}`])) ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  ⭐ 威厳購入 (5資金) {currentPlayer.actionPoints < 1 ? '[AP不足]' : currentPlayer.money < 5 ? '[資金不足]' : (G.prestigePurchasePerRound && G.prestigePurchasePerRound[`${G.round}-${currentPlayer.id}`]) ? '[使用済み]' : ''}
                </button>
              </div>
            </div>
            
            {/* 2APアクション */}
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#FF9800' }}>🟡 2APアクション</h3>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: isMobile ? '4px' : '8px',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button 
                  onClick={handlePartTimeWork}
                  disabled={currentPlayer.actionPoints < 2}
                  style={{ 
                    padding: isMobile ? '8px 12px' : '10px 15px',
                    backgroundColor: currentPlayer.actionPoints < 2 ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPlayer.actionPoints < 2 ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  💼 アルバイト (5資金) {currentPlayer.actionPoints < 2 ? '[AP不足]' : ''}
                </button>
                <button 
                  onClick={() => handleDesign(false)}
                  disabled={currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6}
                  style={{ 
                    padding: isMobile ? '8px 12px' : '10px 15px',
                    backgroundColor: (currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6) ? '#ccc' : '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6) ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  📝 設計 {currentPlayer.actionPoints < 2 ? '[AP不足]' : currentPlayer.designs.length >= 6 ? '[上限]' : ''}
                </button>
                <button 
                  onClick={() => handleDesign(true)}
                  disabled={currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6}
                  style={{ 
                    padding: isMobile ? '8px 12px' : '10px 15px',
                    backgroundColor: (currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6) ? '#ccc' : '#FF9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (currentPlayer.actionPoints < 2 || currentPlayer.designs.length >= 6) ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  🅾️ オープンソース設計 {currentPlayer.actionPoints < 2 ? '[AP不足]' : currentPlayer.designs.length >= 6 ? '[上限]' : ''}
                </button>
                <button 
                  onClick={() => moves.promoteRegulation()}
                  disabled={currentPlayer.actionPoints < 2}
                  style={{ 
                    padding: isMobile ? '8px 12px' : '10px 15px',
                    backgroundColor: currentPlayer.actionPoints < 2 ? '#ccc' : '#E91E63',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPlayer.actionPoints < 2 ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  ⚖️ 規制推進 {currentPlayer.actionPoints < 2 ? '[AP不足]' : ''}
                </button>
              </div>
            </div>
            
            {/* 3APアクション */}
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#f44336' }}>🔴 3APアクション</h3>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: isMobile ? '4px' : '8px',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <button 
                  onClick={() => moves.dayLabor()}
                  disabled={currentPlayer.actionPoints < 3 || currentPlayer.money > 100}
                  style={{ 
                    padding: isMobile ? '8px 12px' : '10px 15px',
                    backgroundColor: (currentPlayer.actionPoints < 3 || currentPlayer.money > 100) ? '#ccc' : '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (currentPlayer.actionPoints < 3 || currentPlayer.money > 100) ? 'not-allowed' : 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  🔨 日雇い労働 (18資金) {currentPlayer.actionPoints < 3 ? '[AP不足]' : currentPlayer.money > 100 ? '[資金上限]' : ''}
                </button>
              </div>
            </div>
            
            {/* ターン終了 */}
            <div style={{ marginTop: '20px', borderTop: '2px solid #333', paddingTop: '15px' }}>
              {ctx.numPlayers === 1 ? (
                // 一人プレイ: オートマ＆マーケット実行ボタン
                <button 
                  onClick={() => {
                    console.log('🎯 一人プレイ: オートマ＆マーケット実行:', { ctx, currentPlayer });
                    
                    try {
                      // 新しい統合ムーブを呼び出し
                      if (moves && moves.executeAutomataAndMarket) {
                        console.log('✅ Executing automata and market phases');
                        moves.executeAutomataAndMarket();
                      } else {
                        console.error('❌ executeAutomataAndMarket move not found');
                      }
                      
                    } catch (error) {
                      console.error('💥 Error executing automata and market:', error);
                    }
                  }}
                  style={{ 
                    margin: '5px', 
                    padding: '15px 30px',
                    backgroundColor: '#FF5722',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  🤖 オートマ＆マーケット実行 → 次ラウンド (残りAP: {currentPlayer.actionPoints})
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
                  {ctx.playOrderPos === ctx.numPlayers - 1 ? ' → オートマ＆市場実行' : ''}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
            {currentPlayer.id !== ctx.currentPlayer 
              ? 'あなたのターンではありません' 
              : 'アクションを実行できません'}
            <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
              💡 マルチプレイでは最後のプレイヤーのターン終了時に自動でオートマ＆市場フェーズが実行されます
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <h2>プレイヤー情報</h2>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          width: '100%',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {Object.values(G.players)
            .filter((_, index) => index < ctx.numPlayers)
            .map(renderPlayer)}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <div style={{ 
          backgroundColor: '#f5f5f5',
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#333' }}>🏪 マーケットボード</h2>
        <div style={{ fontSize: '12px', color: '#FF5722', backgroundColor: '#ffebee', padding: '10px', marginBottom: '10px', border: '2px solid #FF5722', borderRadius: '8px' }}>
          <strong>🔍 転売ボタン確認ガイド：</strong><br/>
          ✅ <strong>他のプレイヤーのマーケット</strong>の商品には転売ボタン（🔴転売🔴）が表示されます<br/>
          ❌ <strong>あなた自身のマーケット</strong>の商品には転売ボタンは表示されません<br/>
          📋 現在のプレイヤー: <strong>{currentPlayer.name}</strong> | ターン: {isActive ? '✅アクティブ' : '❌待機中'} | AP: {currentPlayer.actionPoints} | 資金: {currentPlayer.money} | 威厳: {currentPlayer.prestige}
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: isMobile ? '10px' : '20px', 
          overflowX: 'auto'
        }}>
          {Object.values(G.players)
            .filter((_, index) => index < ctx.numPlayers)
            .map((player) => renderMarketGrid(player))}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>🤖 オートマ・マーケット (転売可能)</h2>
        <div style={{ fontSize: '12px', color: '#FF5722', backgroundColor: '#ffebee', padding: '8px', marginBottom: '10px', border: '1px solid #FF5722', borderRadius: '4px' }}>
          ✅ オートマの商品も転売・レビューが可能です！
        </div>
        <div>メーカー・オートマ資金: 無限</div>
        <div>転売ヤー・オートマ資金: {G.automata.resaleOrganizationMoney}</div>
        
        <h3>オートマ商品</h3>
        {G.automata.market.map(product => (
          <div key={product.id} style={{ 
            margin: '5px', 
            padding: '5px', 
            border: product.isResale ? '2px solid #d32f2f' : '1px solid #eee',
            borderRadius: product.isResale ? '8px' : '4px',
            backgroundColor: product.isResale ? '#ffebee' : '#fafafa'
          }}>
            {product.isResale ? (
              <>
                🥤<strong>転売品</strong> (元製造者: {G.players[product.originalPlayerId || '']?.name || '不明'}) - 
                元コスト: {product.originalCost || product.cost}, 価格: {product.price}, 人気度: {product.popularity}
              </>
            ) : (
              <>通常品 - コスト: {product.cost}, 価格: {product.price}, 人気度: {product.popularity}</>
            )}
            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
              {currentPlayer.money >= product.price && isActive && currentPlayer.actionPoints >= 1 && (
                <button 
                  onClick={() => moves.purchase('automata', product.id)}
                  style={{ 
                    padding: '5px 10px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  購入 ({product.price}資金)
                </button>
              )}
              {product.price > 0 && isActive && currentPlayer.actionPoints >= 2 && (
                <button 
                  onClick={() => {
                    if (currentPlayer.money < product.price) {
                      alert(`資金不足: ${product.price}資金が必要です（現在${currentPlayer.money}資金）`);
                      return;
                    }
                    if (currentPlayer.actionPoints < 2) {
                      alert(`AP不足: 2APが必要です（現在${currentPlayer.actionPoints}AP）`);
                      return;
                    }
                    // 転売は悪の所業なので威厳が最低でも実行可能
                    
                    const resaleBonus = currentPlayer.resaleHistory <= 1 ? 5 : 
                                       currentPlayer.resaleHistory <= 4 ? 8 :
                                       currentPlayer.resaleHistory <= 7 ? 11 : 15;
                    const maxPrice = Math.min(24, product.price + resaleBonus);
                    const resalePrice = parseInt(prompt(`転売価格を入力 (${product.price + 1}-${maxPrice}):`) || '0', 10);
                    if (resalePrice >= product.price + 1 && resalePrice <= maxPrice) {
                      moves.resale('automata', product.id, resalePrice);
                    } else if (resalePrice > 0) {
                      alert(`価格範囲外: ${product.price + 1}～${maxPrice}の間で入力してください`);
                    }
                  }}
                  style={{ 
                    padding: '5px 10px',
                    backgroundColor: '#FF5722',
                    color: 'white',
                    border: '2px solid #FF0000',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🔴転売🔴 ({product.price}→{Math.min(24, product.price + (currentPlayer.resaleHistory <= 1 ? 5 : currentPlayer.resaleHistory <= 4 ? 8 : currentPlayer.resaleHistory <= 7 ? 11 : 15))}まで)
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '2px', marginTop: '3px' }}>
              {currentPlayer.actionPoints >= 1 && currentPlayer.prestige >= 1 && (
                <>
                  <button 
                    onClick={() => moves.review('automata', product.id, true)}
                    style={{ 
                      fontSize: '10px', 
                      padding: '2px 4px', 
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    👍
                  </button>
                  <button 
                    onClick={() => moves.review('automata', product.id, false)}
                    style={{ 
                      fontSize: '10px', 
                      padding: '2px 4px', 
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    👎
                  </button>
                </>
              )}
              {currentPlayer.actionPoints >= 1 && currentPlayer.money >= 3 && (
                <>
                  <button 
                    onClick={() => moves.outsourceReview('automata', product.id, true)}
                    style={{ 
                      fontSize: '8px', 
                      padding: '2px 4px', 
                      backgroundColor: '#FF9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    💰👍
                  </button>
                  <button 
                    onClick={() => moves.outsourceReview('automata', product.id, false)}
                    style={{ 
                      fontSize: '8px', 
                      padding: '2px 4px', 
                      backgroundColor: '#795548',
                      color: 'white',
                      border: 'none',
                      borderRadius: '2px',
                      cursor: 'pointer'
                    }}
                  >
                    💰👎
                  </button>
                </>
              )}
            </div>
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
      <PlayLog playLog={G.playLog} isMobile={isMobile} />
    </div>
  );
};