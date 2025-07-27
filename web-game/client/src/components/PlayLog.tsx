import React from 'react';

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'action' | 'phase' | 'round' | 'game' | 'automata' | 'trend' | 'purchase' | 'sell' | 'manufacture' | 'design' | 'review' | 'labor' | 'regulate' | 'skip' | 'buy_dignity' | 'buyback' | 'resale' | 'promote_regulation' | 'end_game' | 'prestige_purchase' | 'purchase_prestige';
  playerId?: string;
  playerName?: string;
  message: string;
  details?: any; // 追加の詳細情報
}

interface PlayLogProps {
  logs: LogEntry[];
  currentRound: number;
  currentPhase: string;
}

const PlayLog: React.FC<PlayLogProps> = ({ logs, currentRound, currentPhase }) => {
  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return '⚡';
      case 'phase': return '🔄';
      case 'round': return '🎯';
      case 'game': return '🎮';
      case 'automata': return '🤖';
      case 'trend': return '📈';
      case 'purchase': return '🛒';
      case 'sell': return '💰';
      case 'manufacture': return '🏭';
      case 'design': return '📐';
      case 'review': return '⭐';
      case 'labor': return '💼';
      case 'regulate': return '⚖️';
      case 'skip': return '⏭️';
      case 'buy_dignity': 
      case 'prestige_purchase':
      case 'purchase_prestige': return '👑';
      case 'buyback': return '🔄';
      case 'resale': return '🔃';
      case 'promote_regulation': return '📢';
      case 'end_game': return '🏁';
      default: return '📝';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'action': return 'text-blue-600';
      case 'phase': return 'text-purple-600';
      case 'round': return 'text-green-600';
      case 'game': return 'text-red-600';
      case 'automata': return 'text-orange-600';
      case 'trend': return 'text-pink-600';
      case 'purchase': return 'text-emerald-600';
      case 'sell': return 'text-yellow-600';
      case 'manufacture': return 'text-indigo-600';
      case 'design': return 'text-violet-600';
      case 'review': return 'text-amber-600';
      case 'labor': return 'text-slate-600';
      case 'regulate': return 'text-rose-600';
      case 'skip': return 'text-gray-500';
      case 'buy_dignity': 
      case 'prestige_purchase':
      case 'purchase_prestige': return 'text-purple-600';
      case 'buyback': return 'text-cyan-600';
      case 'resale': return 'text-orange-600';
      case 'promote_regulation': return 'text-red-600';
      case 'end_game': return 'text-gray-800';
      default: return 'text-gray-600';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderLogDetails = (details: any, type: string) => {
    if (!details) return null;

    switch (type) {
      case 'purchase':
        return `価格: ¥${details.price} | 人気度: ${details.popularity || '不明'}`;
      case 'sell':
        return `価格: ¥${details.price} | スロット: ${details.slot || '不明'}`;
      case 'manufacture':
        return `コスト: ¥${details.cost} | 設計: ${details.design || '不明'}`;
      case 'design':
        return `ダイス: [${details.dice?.join(', ') || '不明'}] | 結果: ${details.result || '不明'}`;
      case 'review':
        return `タイプ: ${details.reviewType === 'positive' ? 'ポジティブ' : 'ネガティブ'} | 外注: ${details.useOutsourcing ? 'はい' : 'いいえ'}`;
      case 'trend':
        return `ダイス: [${details.dice?.join(', ') || '不明'}] | 効果: ${details.effect || '不明'}`;
      case 'regulate':
        return `ダイス: [${details.dice?.join(', ') || '不明'}] | 成功: ${details.success ? 'はい' : 'いいえ'}`;
      case 'buy_dignity':
      case 'prestige_purchase':
      case 'purchase_prestige':
        return `支払い: ¥10 | 威厳: +1 | 残り資金: ¥${details.remainingFunds || '不明'}`;
      case 'buyback':
        return `価格: ¥${details.price} | 元の商品: ${details.productName || '不明'}`;
      case 'resale':
        return `価格: ¥${details.price} | 利益: ¥${details.profit || '不明'}`;
      case 'promote_regulation':
        return `ダイス: [${details.dice?.join(', ') || '不明'}] | 成功: ${details.success ? 'はい' : 'いいえ'} | 規制レベル: ${details.newRegulationLevel || '不明'}`;
      case 'end_game':
        return `理由: ${details.reason || '勝利条件達成'} | 最終スコア: ${details.finalScore || '不明'}`;
      default:
        return Object.entries(details)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          📜 プレイログ
        </h3>
        <div className="text-sm text-gray-600 mt-1">
          ラウンド {currentRound} | {currentPhase === 'action' ? '🎯 アクション' : currentPhase === 'automata' ? '🤖 オートマ' : '🏪 市場'}フェーズ
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3" data-playlog-scroll>
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-3">📜</div>
            <div className="font-medium">まだログがありません</div>
            <div className="text-sm mt-2">ゲームが進行するとここに表示されます</div>
          </div>
        ) : (
          logs.slice().reverse().map((log) => (
            <div
              key={log.id}
              className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getLogTypeIcon(log.type)}</span>
                  {log.playerName && (
                    <span className="text-sm font-medium text-gray-700">
                      {log.playerName}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatTime(log.timestamp)}
                </span>
              </div>
              <div className={`text-sm ${getLogTypeColor(log.type)}`}>
                {log.message}
                {log.details && (
                  <div className="text-xs text-gray-500 mt-1">
                    {renderLogDetails(log.details, log.type)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Auto-scroll to bottom button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => {
            const logContainer = document.querySelector('[data-playlog-scroll]');
            if (logContainer) {
              logContainer.scrollTop = logContainer.scrollHeight;
            }
          }}
          className="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded transition-colors"
        >
          ⬇️ 最新ログへ
        </button>
      </div>
    </div>
  );
};

export default PlayLog;