import React from 'react';
import type { Design } from '../store/gameSlice';

interface DesignBoardProps {
  designs: { [slot: number]: Design };
  openSourceDesigns: string[];
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'game-console': return 'bg-gradient-to-br from-red-200 to-red-300 border-red-400 text-red-900 shadow-red-100';
    case 'diy-gadget': return 'bg-gradient-to-br from-blue-200 to-blue-300 border-blue-400 text-blue-900 shadow-blue-100';
    case 'figure': return 'bg-gradient-to-br from-purple-200 to-purple-300 border-purple-400 text-purple-900 shadow-purple-100';
    case 'accessory': return 'bg-gradient-to-br from-green-200 to-green-300 border-green-400 text-green-900 shadow-green-100';
    case 'toy': return 'bg-gradient-to-br from-yellow-200 to-yellow-300 border-yellow-400 text-yellow-900 shadow-yellow-100';
    default: return 'bg-gray-100 border-gray-300 text-gray-800';
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

const DesignBoard: React.FC<DesignBoardProps> = ({ designs, openSourceDesigns }) => {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl p-6 border border-blue-100">
      <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
        📋 設計図ボード
      </h3>
      
      <div className="flex space-x-2 overflow-x-auto">
        {[1, 2, 3, 4, 5, 6].map(slot => {
          const design = designs[slot];
          const isOpenSource = design && openSourceDesigns.includes(design.id);
          
          return (
            <div key={slot} className="relative flex-shrink-0 w-24">
              <div className={`border-2 rounded-lg p-1 h-20 flex flex-col justify-center transition-all duration-200 hover:scale-105 shadow-lg ${
                design 
                  ? `${getCategoryColor(design.category)} shadow-lg`
                  : 'border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
              }`}>
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-700 mb-0.5">#{slot}</div>
                  {design ? (
                    <>
                      <div className="font-bold text-xs leading-tight mb-0.5">{getCategoryName(design.category)}</div>
                      <div className="text-xs font-medium leading-tight">💎 {design.value}</div>
                      <div className="text-xs font-medium leading-tight">💰 {design.cost}</div>
                    </>
                  ) : (
                    <div className="text-gray-400 text-xs font-medium">
                      <div className="text-base mb-0.5">📝</div>
                      <div className="leading-tight">未設計</div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Open Source Badge */}
              {isOpenSource && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold shadow-lg border border-white">
                  🌐
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Open Source Legend */}
      <div className="mt-6 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold border-2 border-white shadow">
            🌐 OSS
          </div>
          <span className="text-sm text-gray-700">
            <strong>オープンソース設計:</strong> 他のプレイヤーも製造可能、外注料収入あり (+2威厳)
          </span>
        </div>
      </div>
    </div>
  );
};

export default DesignBoard;