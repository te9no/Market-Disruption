import React, { useState } from 'react';
import type { Product } from '../store/gameSlice';

interface PersonalMarketProps {
  personalMarket: { [price: number]: { [popularity: number]: Product | null } };
  playerId: string;
  canInteract?: boolean;
  currentPlayerId?: string;
  isMyTurn?: boolean;
  onPurchase?: (productId: string, price: number, popularity: number) => void;
  onReview?: (productId: string) => void;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'game-console': return 'bg-red-500';
    case 'diy-gadget': return 'bg-blue-500';
    case 'figure': return 'bg-purple-500';
    case 'accessory': return 'bg-green-500';
    case 'toy': return 'bg-yellow-500';
    default: return 'bg-gray-500';
  }
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

const getCategoryName = (category: string) => {
  switch (category) {
    case 'game-console': return 'ゲーム機';
    case 'diy-gadget': return '自作ガジェット';
    case 'figure': return 'フィギュア';
    case 'accessory': return 'アクセサリー';
    case 'toy': return 'おもちゃ';
    default: return 'その他';
  }
};

const PersonalMarket: React.FC<PersonalMarketProps> = ({ 
  personalMarket, 
  playerId, 
  canInteract = false, 
  currentPlayerId = '', 
  isMyTurn = false,
  onPurchase,
  onReview 
}) => {
  const [showSection, setShowSection] = useState<'all' | 'low' | 'high'>('low');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const renderProduct = (product: Product | null, price?: number, popularity?: number) => {
    if (!product) {
      return (
        <div className="w-16 h-16 border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center rounded-lg transition-colors">
          <span className="text-gray-400 text-sm">空き</span>
        </div>
      );
    }

    const isResale = product.previousOwner !== undefined;
    const isOtherPlayer = canInteract && playerId !== currentPlayerId;
    const canPurchaseOrReview = isOtherPlayer && isMyTurn;
    
    return (
      <div className={`w-16 h-16 border-2 border-gray-300 flex flex-col items-center justify-center text-white ${getCategoryColor(product.category)} hover:opacity-80 cursor-pointer rounded-lg shadow-sm relative transition-all group`}>
        <div className="text-lg">{getCategoryEmoji(product.category)}</div>
        <div className="text-xs font-bold">💎{product.value}</div>
        <div className="text-xs font-bold">💰{product.price || price || 0}</div>
        {isResale && (
          <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
            🔄
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
    
    Object.entries(personalMarket).forEach(([priceStr, popularityMap]) => {
      const price = parseInt(priceStr);
      Object.entries(popularityMap).forEach(([popularityStr, product]) => {
        const popularity = parseInt(popularityStr);
        if (product) {
          products.push({
            ...product,
            price,
            popularity
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
              <th className="text-left py-3 px-4 font-bold text-gray-700">商品</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">カテゴリー</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">価値</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">コスト</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">💰価格</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">⭐人気度</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">設計#</th>
              <th className="text-center py-3 px-2 font-bold text-gray-700">状態</th>
              {canInteract && playerId !== currentPlayerId && (
                <th className="text-center py-3 px-2 font-bold text-gray-700">アクション</th>
              )}
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              const isResale = product.previousOwner !== undefined;
              return (
                <tr 
                  key={`${product.price}-${product.popularity}-${index}`}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">
                        {getCategoryEmoji(product.category)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{getCategoryName(product.category)}</div>
                        <div className="text-xs text-gray-500">#{product.id.slice(-4)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-2">
                    <div className="text-lg">
                      {getCategoryEmoji(product.category)}
                    </div>
                  </td>
                  <td className="text-center py-3 px-2 font-medium">
                    💎{product.value}
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
                    {product.designSlot && (
                      <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        #{product.designSlot}
                      </span>
                    )}
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
                  {canInteract && playerId !== currentPlayerId && (
                    <td className="text-center py-3 px-2">
                      {isMyTurn ? (
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
                          {currentPlayerId === playerId ? '自分の商品' : 'あなたのターンではありません'}
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
          <h4 className="text-sm font-bold mb-3 text-gray-800">📊 販売統計</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{products.length}</div>
              <div className="text-gray-600">総商品数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{products.filter(p => p.previousOwner).length}</div>
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
          
          {/* Category breakdown */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h5 className="text-xs font-bold mb-2 text-gray-700">カテゴリー別内訳</h5>
            <div className="flex flex-wrap gap-2 text-xs">
              {['game-console', 'diy-gadget', 'figure', 'accessory', 'toy'].map(category => {
                const count = products.filter(p => p.category === category).length;
                if (count === 0) return null;
                return (
                  <div key={category} className={`px-2 py-1 rounded-full text-white ${getCategoryColor(category)}`}>
                    {getCategoryName(category)}: {count}個
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
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">パーソナルマーケット (価格×人気度)</h3>
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
      
      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        <div style={{
          maxHeight: '384px',
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
                height: '64px',
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
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  transition: 'background-color 0.2s'
                }} className="group hover:bg-white hover:bg-opacity-50">
                  {renderProduct(personalMarket[price]?.[popularity] || null, price, popularity)}
                  
                  {/* Hover tooltip */}
                  {personalMarket[price]?.[popularity] && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none shadow-lg">
                      <div className="font-bold text-yellow-300">{getCategoryName(personalMarket[price][popularity]!.category)}</div>
                      <div>価値: {personalMarket[price][popularity]!.value} | コスト: {personalMarket[price][popularity]!.cost}</div>
                      <div>価格: ¥{price} | 人気度: {popularity}⭐</div>
                      {personalMarket[price][popularity]!.previousOwner && <div className="text-red-300">🔄 転売品</div>}
                    </div>
                  )}
                </div>
              )))
            ]).flat()}
          </div>
        </div>
      ) : (
        <div className="border-2 border-gray-300 rounded-lg bg-white">
          {renderTableView()}
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-4 bg-white rounded-lg p-3 shadow-sm">
        <h4 className="text-sm font-bold mb-2 text-gray-700">🏷️ カテゴリー凡例</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>🎮 ゲーム機</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>🔧 自作ガジェット</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span>🎭 フィギュア</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>💍 アクセサリー</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>🧸 おもちゃ</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            <span>🔄 転売品</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalMarket;