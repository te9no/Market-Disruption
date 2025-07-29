import React, { useState } from 'react';
import type { Product, Player } from '../store/gameSlice';

interface SharedMarketBoardProps {
  sharedMarket: { [price: number]: { [popularity: number]: Product[] } };
  players: Player[];
  currentPlayer?: Player;
  canInteract?: boolean;
  isMyTurn?: boolean;
  onPurchase?: (productId: string, price: number, popularity: number) => void;
  onReview?: (productId: string) => void;
}

const getPlayerColor = (playerId: string, players: Player[]) => {
  const playerIndex = players.findIndex(p => p.id === playerId);
  const colors = [
    'bg-red-500',     // Player 1: Red
    'bg-blue-500',    // Player 2: Blue
    'bg-green-500',   // Player 3: Green
    'bg-yellow-500',  // Player 4: Yellow
    'bg-purple-500',  // Automata: Purple
    'bg-orange-500'   // Extra: Orange
  ];
  
  // Special handling for automata
  if (playerId === 'manufacturer-automata') return 'bg-gray-700';
  if (playerId === 'resale-automata') return 'bg-orange-600';
  
  return colors[playerIndex] || 'bg-gray-500';
};

const getPlayerName = (playerId: string, players: Player[]) => {
  if (playerId === 'manufacturer-automata') return 'メーカー';
  if (playerId === 'resale-automata') return '転売ヤー';
  
  const player = players.find(p => p.id === playerId);
  return player?.name || 'Unknown';
};

const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'game-console': return '🎮';
    case 'diy-gadget': return '🔧';
    case 'figure': return '🎭';
    case 'accessory': return '💍';
    case 'toy': return '🧸';
    default: return '📦';
  }
};

const SharedMarketBoard: React.FC<SharedMarketBoardProps> = ({ 
  sharedMarket, 
  players,
  currentPlayer,
  canInteract = false, 
  isMyTurn = false,
  onPurchase,
  onReview 
}) => {
  const [showSection, setShowSection] = useState<'all' | 'low' | 'high'>('low');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const renderProducts = (productsAtLocation: Product[] | null, price?: number, popularity?: number) => {
    if (!productsAtLocation || productsAtLocation.length === 0) {
      return (
        <div className="w-24 h-24 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center rounded-lg transition-colors">
          <span className="text-gray-400 text-sm">空き</span>
        </div>
      );
    }

    // Display multiple products in the same cell
    if (productsAtLocation.length === 1) {
      const product = productsAtLocation[0];
      const isResale = product.isResale === true;
      const isOtherPlayer = canInteract && product.ownerId !== currentPlayer?.id;
      const canPurchaseOrReview = isOtherPlayer && isMyTurn;
      const playerColor = getPlayerColor(product.ownerId, players);
      const playerName = getPlayerName(product.ownerId, players);
      
      return (
        <div className={`w-24 h-24 border-2 border-gray-400 flex flex-col items-center justify-center text-white ${playerColor} hover:opacity-80 cursor-pointer rounded-lg shadow-sm relative transition-all group`}>
          {/* Product value displayed as dice face */}
          <div className="text-3xl font-bold text-white bg-black bg-opacity-30 rounded-full w-10 h-10 flex items-center justify-center">
            {product.value}
          </div>
          
          {/* Player name indicator */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-xs px-1 rounded text-center min-w-12">
            {playerName.slice(0, 3)}
          </div>
          
          {/* Resale indicator */}
          {isResale && (
            <div className="absolute -top-1 -right-1 bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white">
              🥤
            </div>
          )}
          
          {/* Interaction buttons for other players' products */}
          {canPurchaseOrReview && price && popularity && (
          <div className="absolute inset-0 bg-black bg-opacity-70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center space-y-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPurchase?.(product.id, price, popularity);
              }}
              className="px-1 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded font-bold"
              title="購入する (1AP)"
            >
              🛒
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReview?.(product.id);
              }}
              className="px-1 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-bold"
              title="レビューする (1AP)"
            >
              ⭐
            </button>
          </div>
        )}
      </div>
    );
    } else {
      // Multiple products at the same location - show stacked view
      return (
        <div className="w-24 h-24 border-2 border-gray-400 bg-gray-100 rounded-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-bl font-bold">
            {productsAtLocation.length}
          </div>
          <div className="grid grid-cols-2 gap-0.5 p-1 h-full">
            {productsAtLocation.slice(0, 4).map((product) => {
              const playerColor = getPlayerColor(product.ownerId, players);
              const playerName = getPlayerName(product.ownerId, players);
              return (
                <div key={product.id} className={`${playerColor} text-white text-xs flex flex-col items-center justify-center rounded relative`}>
                  <div className="text-sm font-bold">{product.value}</div>
                  <div className="text-xs truncate w-full text-center">{playerName.slice(0, 3)}</div>
                  {product.isResale && (
                    <div className="absolute -top-0.5 -right-0.5 bg-orange-500 rounded-full w-2 h-2"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const getPriceRange = () => {
    switch (showSection) {
      case 'low': return Array.from({ length: 10 }, (_, i) => i + 1);
      case 'high': return Array.from({ length: 10 }, (_, i) => i + 11);
      default: return Array.from({ length: 20 }, (_, i) => i + 1);
    }
  };

  const getAllProducts = () => {
    const products: Array<Product & { price: number; popularity: number }> = [];
    
    Object.entries(sharedMarket).forEach(([priceStr, popularityMap]) => {
      const price = parseInt(priceStr);
      Object.entries(popularityMap || {}).forEach(([popularityStr, productsAtLocation]) => {
        const popularity = parseInt(popularityStr);
        if (productsAtLocation && Array.isArray(productsAtLocation)) {
          productsAtLocation.forEach(product => {
            products.push({
              ...product,
              price,
              popularity
            });
          });
        }
      });
    });
    
    return products.sort((a, b) => {
      // Sort by price first, then by popularity
      if (a.price !== b.price) return a.price - b.price;
      return a.popularity - b.popularity;
    });
  };

  const renderTableView = () => {
    const products = getAllProducts();
    
    if (products.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-3">📦</div>
          <div>出品中の商品がありません</div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100 to-purple-100 border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 font-bold text-gray-700">所有者</th>
              <th className="text-left py-3 px-4 font-bold text-gray-700">商品</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">値</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">コスト</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">💰価格</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">⭐人気度</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">状態</th>
              {canInteract && (
                <th className="text-center py-3 px-2 font-bold text-gray-700">アクション</th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const playerColor = getPlayerColor(product.ownerId, players);
              const playerName = getPlayerName(product.ownerId, players);
              const isResale = product.isResale === true;
              const canAct = canInteract && product.ownerId !== currentPlayer?.id && isMyTurn;
              
              return (
                <tr 
                  key={`${product.price}-${product.popularity}-${index}`}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${playerColor}`}></div>
                      <div className="font-medium text-sm">{playerName}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">
                        {getCategoryEmoji(product.category)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">#{product.id.slice(-4)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 font-medium">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${playerColor}`}>
                      {product.value}
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 font-medium">
                    ⚒️{product.cost}
                  </td>
                  <td className="text-center py-3 px-2 font-bold text-green-600">
                    💰{product.price}
                  </td>
                  <td className="text-center py-3 px-2 font-medium">
                    {'⭐'.repeat(product.popularity)}
                  </td>
                  <td className="text-center py-3 px-2">
                    {isResale ? (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        🔄 転売
                      </span>
                    ) : (
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        ✨ 正規
                      </span>
                    )}
                  </td>
                  {canInteract && (
                    <td className="text-center py-3 px-2">
                      {canAct ? (
                        <div className="flex space-x-1 justify-center">
                          <button
                            onClick={() => onPurchase?.(product.id, product.price, product.popularity)}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded font-bold"
                            title="購入する (1AP)"
                          >
                            🛒
                          </button>
                          <button
                            onClick={() => onReview?.(product.id)}
                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-bold"
                            title="レビューする (1AP)"
                          >
                            ⭐
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {product.ownerId === currentPlayer?.id ? '自分の商品' : 'あなたのターンではありません'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Table Summary */}
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
          <h4 className="text-sm font-bold mb-3 text-gray-800">📊 マーケット統計</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{products.length}</div>
              <div className="text-gray-600">総商品数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{products.filter(p => p.isResale).length}</div>
              <div className="text-gray-600">転売商品</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">¥{products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length) : 0}</div>
              <div className="text-gray-600">平均価格</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">¥{products.reduce((sum, p) => sum + p.price, 0)}</div>
              <div className="text-gray-600">総売上予定</div>
            </div>
          </div>
          
          {/* Player breakdown */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h5 className="text-xs font-bold mb-2 text-gray-700">プレイヤー別内訳</h5>
            <div className="flex flex-wrap gap-2 text-xs">
              {players.map(player => {
                const count = products.filter(p => p.ownerId === player.id).length;
                if (count === 0) return null;
                return (
                  <div key={player.id} className={`px-2 py-1 rounded-full text-white ${getPlayerColor(player.id, players)}`}>
                    {player.name}: {count}個
                  </div>
                );
              })}
              {/* Automata products */}
              {['manufacturer-automata', 'resale-automata'].map(automataId => {
                const count = products.filter(p => p.ownerId === automataId).length;
                if (count === 0) return null;
                return (
                  <div key={automataId} className={`px-2 py-1 rounded-full text-white ${getPlayerColor(automataId, players)}`}>
                    {getPlayerName(automataId, players)}: {count}個
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold">🏪 共有マーケットボード (価格×人気度)</h3>
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex space-x-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
            >
              <span>🎯</span>
              <span>グリッド</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${viewMode === 'table' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
            >
              <span>📋</span>
              <span>表形式</span>
            </button>
          </div>
          
          {/* Section Filter (only for grid view) */}
          {viewMode === 'grid' && (
            <div className="flex space-x-1">
              <button
                onClick={() => setShowSection('all')}
                className={`px-3 py-1 text-xs rounded ${showSection === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                全体
              </button>
              <button
                onClick={() => setShowSection('low')}
                className={`px-3 py-1 text-xs rounded ${showSection === 'low' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                1-10
              </button>
              <button
                onClick={() => setShowSection('high')}
                className={`px-3 py-1 text-xs rounded ${showSection === 'high' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                11-20
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Player Color Legend */}
      <div className="mb-2 p-2 bg-gray-50 rounded-lg">
        <h4 className="text-xs font-bold mb-1 text-gray-700">プレイヤー色分け</h4>
        <div className="flex flex-wrap gap-2 text-sm">
          {players.map(player => (
            <div key={player.id} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${getPlayerColor(player.id, players)}`}></div>
              <span>{player.name}</span>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-gray-700"></div>
            <span>メーカー</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-orange-600"></div>
            <span>転売ヤー</span>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        <div style={{
          height: 'calc(100vh - 220px)',
          overflowY: 'auto',
          overflowX: 'auto',
          border: '2px solid #d1d5db',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f3e8ff 100%)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0',
            minWidth: '584px'
          }}>
            {/* Header Row */}
            <div style={{
              position: 'sticky',
              top: '0',
              backgroundColor: '#f3f4f6',
              borderRight: '2px solid #9ca3af',
              borderBottom: '2px solid #9ca3af',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              zIndex: 10
            }}>
              価格＼人気
            </div>
            {[1, 2, 3, 4, 5, 6].map(popularity => (
              <div key={`header-${popularity}`} style={{
                position: 'sticky',
                top: '0',
                backgroundColor: '#bfdbfe',
                borderRight: '2px solid #9ca3af',
                borderBottom: '2px solid #9ca3af',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                zIndex: 10
              }}>
                ⭐{popularity}
              </div>
            ))}
            
            {/* Market Grid Rows */}
            {getPriceRange().map(price => [
              // Price Label
              <div key={`price-${price}`} style={{
                background: 'linear-gradient(to right, #dcfce7, #dbeafe)',
                borderRight: '2px solid #9ca3af',
                borderBottom: '1px solid #9ca3af',
                height: '96px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                position: 'sticky',
                left: '0',
                zIndex: 5
              }}>
                💰{price}
              </div>,
              // Market Cells
              ...([1, 2, 3, 4, 5, 6].map(popularity => (
                <div key={`${price}-${popularity}`} style={{
                  position: 'relative',
                  borderRight: '2px solid #9ca3af',
                  borderBottom: '1px solid #9ca3af',
                  height: '96px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  transition: 'background-color 0.2s'
                }} className="group hover:bg-white hover:bg-opacity-50">
                  {renderProducts(sharedMarket[price]?.[popularity] || null, price, popularity)}
                  
                  {/* Hover tooltip */}
                  {sharedMarket[price]?.[popularity] && sharedMarket[price][popularity].length > 0 && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none shadow-lg">
                      {sharedMarket[price][popularity].length === 1 ? (
                        <>
                          <div className="font-bold text-yellow-300">
                            {getPlayerName(sharedMarket[price][popularity][0].ownerId, players)}の商品
                          </div>
                          <div>値: {sharedMarket[price][popularity][0].value} | コスト: {sharedMarket[price][popularity][0].cost}</div>
                          {sharedMarket[price][popularity][0].isResale && <div className="text-red-300">🔄 転売品</div>}
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-yellow-300">
                            {sharedMarket[price][popularity].length}個の商品
                          </div>
                          {sharedMarket[price][popularity].map((product, idx) => (
                            <div key={idx} className="text-xs">
                              {getPlayerName(product.ownerId, players)}: 値{product.value} コスト{product.cost}
                              {product.isResale && ' 🔄'}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )))
            ]).flat()}
          </div>
        </div>
      ) : (
        <div className="border-2 border-gray-300 rounded-lg bg-white overflow-auto" style={{ height: 'calc(100vh - 220px)' }}>
          {renderTableView()}
        </div>
      )}
    </div>
  );
};

export default SharedMarketBoard;