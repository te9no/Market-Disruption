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
  // 威厳購入関連のログをデバッグ出力
  React.useEffect(() => {
    const dignityLogs = logs.filter(log => 
      log.type === 'buy_dignity' || 
      log.type === 'prestige_purchase' ||
      log.type === 'purchase_prestige' ||
      log.type?.includes('dignity') ||
      log.type?.includes('prestige') ||
      log.message?.includes('威厳')
    );
    
    if (dignityLogs.length > 0) {
      console.log('👑 威厳関連ログ found in PlayLog:', dignityLogs);
    }
    
    // 全ログのタイプを確認
    const allTypes = [...new Set(logs.map(log => log.type))];
    console.log('📋 All log types in PlayLog:', allTypes);
  }, [logs]);
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
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            📜 プレイログ
            <span className="text-xs text-gray-500 font-normal">
              ラウンド {currentRound} | {currentPhase === 'action' ? '🎯 アクション' : currentPhase === 'automata' ? '🤖 オートマ' : '🏪 市場'}フェーズ
            </span>
          </h3>
          <button
            onClick={() => {
              const logContainer = document.querySelector('[data-playlog-scroll]');
              if (logContainer) {
                logContainer.scrollTop = logContainer.scrollHeight;
              }
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded transition-colors"
          >
            ⬇️ 最新
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2" data-playlog-scroll>
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            <div className="text-2xl mb-2">📜</div>
            <div className="text-sm font-medium">まだログがありません</div>
            <div className="text-xs mt-1">ゲームが進行するとここに表示されます</div>
          </div>
        ) : (
          logs.slice().reverse().map((log) => (
            <div
              key={log.id}
              className="bg-gray-50 rounded-md p-2 border-l-3 border-blue-200 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-sm">{getLogTypeIcon(log.type)}</span>
                  {log.playerName && (
                    <span className="text-xs font-medium text-gray-700 flex-shrink-0">
                      {log.playerName}
                    </span>
                  )}
                  <div className={`text-xs ${getLogTypeColor(log.type)} flex-1 min-w-0`}>
                    <div className="truncate">{log.message}</div>
                    {log.details && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        {renderLogDetails(log.details, log.type)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatTime(log.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlayLog;