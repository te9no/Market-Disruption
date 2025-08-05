import React from 'react';
import { PlayLogEntry } from '../game/GameState';

interface PlayLogProps {
  playLog: PlayLogEntry[];
}

interface PlayLogPropsExtended extends PlayLogProps {
  isMobile?: boolean;
}

export const PlayLog: React.FC<PlayLogPropsExtended> = ({ playLog, isMobile = window.innerWidth <= 768 }) => {
  const getActorName = (actor: string) => {
    if (actor === 'manufacturer-automata') return '🏭 メーカー・オートマ';
    if (actor === 'resale-automata') return '🔄 転売ヤー・オートマ';
    return `👤 プレイヤー${parseInt(actor) + 1}`;
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'action': return '🎯';
      case 'automata': return '🤖';
      case 'market': return '🏪';
      default: return '📋';
    }
  };

  const getActionColor = (actor: string) => {
    if (actor === 'manufacturer-automata') return '#2196F3';
    if (actor === 'resale-automata') return '#FF5722';
    return '#4CAF50';
  };

  // 最新20件のログを表示（古い順）
  const recentLogs = playLog.slice(-20);

  return (
    <div style={{
      width: isMobile ? '100%' : '320px',
      height: isMobile ? 'auto' : '100vh',
      backgroundColor: '#f5f5f5',
      borderLeft: isMobile ? 'none' : '2px solid #ddd',
      borderTop: isMobile ? '2px solid #ddd' : 'none',
      padding: isMobile ? '5px' : '10px',
      overflowY: isMobile ? 'visible' : 'auto',
      fontSize: isMobile ? '10px' : '12px',
      maxHeight: isMobile ? '300px' : '100vh',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ 
        margin: '0 0 10px 0', 
        padding: '10px', 
        backgroundColor: '#2196F3', 
        color: 'white', 
        borderRadius: '4px',
        textAlign: 'center',
        fontSize: isMobile ? '12px' : '14px'
      }}>
        📋 プレイログ
      </h3>
      
      <div style={{ 
        maxHeight: isMobile ? '200px' : 'calc(100vh - 80px)', 
        overflowY: 'auto' 
      }}>
        {recentLogs.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
            まだアクションがありません
          </div>
        ) : (
          recentLogs.map((entry) => (
            <div
              key={entry.id}
              style={{
                marginBottom: '8px',
                padding: '8px',
                backgroundColor: 'white',
                border: `1px solid ${getActionColor(entry.actor)}`,
                borderRadius: '4px',
                borderLeft: `4px solid ${getActionColor(entry.actor)}`
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: getActionColor(entry.actor),
                  fontSize: isMobile ? '9px' : '11px'
                }}>
                  {getPhaseIcon(entry.phase)} R{entry.round} - {getActorName(entry.actor)}
                </span>
                <span style={{ 
                  fontSize: isMobile ? '8px' : '10px', 
                  color: '#666',
                  backgroundColor: '#f0f0f0',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}>
                  {entry.action}
                </span>
              </div>
              <div style={{ 
                color: '#333',
                lineHeight: '1.3',
                fontSize: isMobile ? '9px' : '11px'
              }}>
                {entry.details}
              </div>
            </div>
          ))
        )}
      </div>
      
      {playLog.length > 20 && (
        <div style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '10px',
          marginTop: '10px',
          padding: '5px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px'
        }}>
          最新20件を表示中 (全{playLog.length}件)
        </div>
      )}
    </div>
  );
};