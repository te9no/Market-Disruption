import React from 'react';
import type { Design } from '../store/gameSlice';

interface DesignBoardProps {
  designs: { [slot: number]: Design };
  openSourceDesigns: string[];
}


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

const getCategoryBorderColor = (category: string) => {
  switch (category) {
    case 'game-console': return 'border-l-red-400';
    case 'diy-gadget': return 'border-l-blue-400';
    case 'figure': return 'border-l-purple-400';
    case 'accessory': return 'border-l-green-400';
    case 'toy': return 'border-l-yellow-400';
    default: return 'border-l-gray-400';
  }
};

const DesignBoard: React.FC<DesignBoardProps> = ({ designs, openSourceDesigns }) => {
  const designSlots = [1, 2, 3, 4, 5, 6].map(slot => ({
    slot,
    design: designs[slot],
    isOpenSource: designs[slot] && openSourceDesigns.includes(designs[slot].id)
  }));

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl p-4 border border-blue-100 h-full">
      <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center">
        📋 設計図ボード
      </h3>
      
      {/* Table format design board */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <th className="px-3 py-2 text-center text-sm font-bold border-b-2 border-blue-700">スロット</th>
              <th className="px-4 py-2 text-left text-sm font-bold border-b-2 border-blue-700">カテゴリー</th>
              <th className="px-3 py-2 text-center text-sm font-bold border-b-2 border-blue-700">価値</th>
              <th className="px-3 py-2 text-center text-sm font-bold border-b-2 border-blue-700">コスト</th>
              <th className="px-3 py-2 text-center text-sm font-bold border-b-2 border-blue-700">OSS</th>
            </tr>
          </thead>
          <tbody>
            {designSlots.map(({ slot, design, isOpenSource }, index) => (
              <tr 
                key={slot} 
                className={`
                  transition-colors duration-200 hover:bg-gray-50
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}
                  ${design ? 'border-l-4' : 'border-l-4 border-l-gray-200'}
                  ${design ? getCategoryBorderColor(design.category) : ''}
                `}
              >
                <td className="px-3 py-3 text-center font-bold text-gray-700 border-b border-gray-200">
                  #{slot}
                </td>
                <td className="px-4 py-3 border-b border-gray-200">
                  {design ? (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-800">{getCategoryName(design.category)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <span className="text-sm">📝</span>
                      <span className="font-medium">未設計</span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-center border-b border-gray-200">
                  {design ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      💎 {design.value}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center border-b border-gray-200">
                  {design ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      💰 {design.cost}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-center border-b border-gray-200">
                  {isOpenSource ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 border border-yellow-500">
                      🌐 OSS
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DesignBoard;