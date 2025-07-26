import React from 'react';

interface TrendResult {
  name: string;
  effect: string;
  cost: number;
}

interface TrendResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dice: number[];
  total: number;
  trendEffect: TrendResult;
}

const TrendResultDialog: React.FC<TrendResultDialogProps> = ({
  isOpen,
  onClose,
  dice,
  total,
  trendEffect
}) => {
  if (!isOpen) return null;

  const getTrendTypeColor = (total: number) => {
    if (total <= 6) return 'from-green-500 to-emerald-600'; // 良い効果
    if (total <= 12) return 'from-blue-500 to-indigo-600'; // 普通の効果
    if (total <= 16) return 'from-purple-500 to-violet-600'; // 強力な効果
    return 'from-red-500 to-pink-600'; // 最強効果
  };

  const getTrendIcon = (total: number) => {
    if (total <= 6) return '🌟';
    if (total <= 12) return '📈';
    if (total <= 16) return '🚀';
    return '💫';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 animate-pulse-scale">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getTrendTypeColor(total)} text-white p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{getTrendIcon(total)}</div>
              <div>
                <h2 className="text-xl font-bold">📈 トレンド調査結果</h2>
                <p className="text-sm opacity-90">市場の未来を垣間見た</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dice Result */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">🎲 ダイス結果</h3>
            <div className="flex justify-center items-center space-x-4">
              {dice.map((die, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-lg border-2 ${getTrendTypeColor(total).replace('from-', 'border-').replace(' to-.*', '')} bg-gradient-to-br ${getTrendTypeColor(total)} text-white font-bold text-lg flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform`}>
                    {die}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">D{index + 1}</div>
                </div>
              ))}
              <div className="text-2xl text-gray-400 mx-2">=</div>
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-xl border-3 bg-gradient-to-br ${getTrendTypeColor(total)} text-white font-bold text-2xl flex items-center justify-center shadow-xl`}>
                  {total}
                </div>
                <div className="text-sm text-gray-600 mt-1 font-medium">合計</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trend Effect */}
        <div className="p-6">
          <div className="text-center mb-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${getTrendTypeColor(total)} text-white font-bold text-lg shadow-lg`}>
              <span className="mr-2">{getTrendIcon(total)}</span>
              {trendEffect.name}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center">
              <span className="mr-2">🎯</span>
              効果内容
            </h4>
            <p className="text-gray-700 leading-relaxed">{trendEffect.effect}</p>
          </div>

          {trendEffect.cost > 0 && (
            <div className="mt-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border-l-4 border-orange-500">
              <h4 className="font-bold text-orange-800 mb-2 flex items-center">
                <span className="mr-2">💰</span>
                実行コスト
              </h4>
              <p className="text-orange-700">
                この効果を適用するには <span className="font-bold">{trendEffect.cost}資金</span> が必要です
              </p>
            </div>
          )}

          {trendEffect.cost === 0 && (
            <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-l-4 border-green-500">
              <p className="text-green-700 font-medium flex items-center">
                <span className="mr-2">✨</span>
                この効果は無料で適用されます！
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className={`w-full py-3 px-6 bg-gradient-to-r ${getTrendTypeColor(total)} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
          >
            <span className="mr-2">{getTrendIcon(total)}</span>
            結果を確認
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrendResultDialog;