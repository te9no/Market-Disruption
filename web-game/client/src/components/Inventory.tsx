import React from 'react';
import type { Product } from '../store/gameSlice';

interface InventoryProps {
  inventory: Product[];
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'game-console': return 'bg-gradient-to-br from-red-400 to-red-600 border-red-300';
    case 'diy-gadget': return 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-300';
    case 'figure': return 'bg-gradient-to-br from-purple-400 to-purple-600 border-purple-300';
    case 'accessory': return 'bg-gradient-to-br from-green-400 to-green-600 border-green-300';
    case 'toy': return 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-300';
    default: return 'bg-gradient-to-br from-gray-400 to-gray-600 border-gray-300';
  }
};

const getCategoryName = (category: string) => {
  switch (category) {
    case 'game-console': return '🎮 ゲーム機';
    case 'diy-gadget': return '🔧 自作ガジェット';
    case 'figure': return '🎭 フィギュア';
    case 'accessory': return '💍 アクセサリー';
    case 'toy': return '🧸 おもちゃ';
    default: return category;
  }
};

const Inventory: React.FC<InventoryProps> = ({ inventory }) => {
  if (inventory.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-xl p-6 border border-purple-100">
        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          📦 在庫倉庫
        </h3>
        <div className="text-center text-gray-500 py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-3">📦</div>
          <div className="font-medium">製造済み商品がありません</div>
          <div className="text-sm mt-2">製造アクションで商品を作りましょう</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-xl p-6 border border-purple-100">
      <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
        📦 在庫倉庫 
        <span className="ml-2 bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
          {inventory.length}個
        </span>
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {inventory.map((product) => {
          const isResale = product.previousOwner !== undefined;
          
          return (
            <div 
              key={product.id} 
              className={`relative rounded-xl p-4 text-white text-center shadow-lg transition-all duration-200 hover:scale-105 border-2 ${getCategoryColor(product.category)}`}
            >
              <div className="text-sm font-bold mb-2">{getCategoryName(product.category)}</div>
              <div className="text-xs font-medium">💎 値: {product.value}</div>
              <div className="text-xs font-medium">💰 コスト: {product.cost}</div>
              <div className="text-xs font-medium">⭐ 人気度: {product.popularity}</div>
              
              {isResale && (
                <>
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg border-2 border-white">
                    🔄 転
                  </div>
                  <div className="text-xs mt-2 bg-black bg-opacity-30 rounded px-2 py-1">
                    購入価格: ¥{product.purchasePrice}
                  </div>
                </>
              )}
              
              {product.designSlot && (
                <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg border-2 border-white">
                  #{product.designSlot}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h4 className="text-sm font-bold mb-2 text-gray-700">🏷️ 商品説明</h4>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white px-2 py-1 rounded-full text-xs font-bold">🔄 転</div>
            <span className="text-gray-700">転売用商品 (他プレイヤーから購入)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">#</div>
            <span className="text-gray-700">設計スロット番号</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;