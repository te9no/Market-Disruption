import React from 'react';
import type { Player } from '../store/gameSlice';
import PersonalMarket from './PersonalMarket';
import DesignBoard from './DesignBoard';
import Inventory from './Inventory';

interface PlayerBoardProps {
  player: Player;
}

const PlayerBoard: React.FC<PlayerBoardProps> = ({ player }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Enhanced Design Board */}
      <DesignBoard designs={player.designs} openSourceDesigns={player.openSourceDesigns} />

      {/* Enhanced Inventory */}
      <Inventory inventory={player.inventory} />

      {/* Personal Market廃止につき代替メッセージ */}
      <div className="text-center text-gray-500 py-8 bg-white rounded-lg shadow">
        <div className="text-4xl mb-4">🏪</div>
        <p className="text-lg font-bold">共有マーケットボードに移行しました</p>
        <p className="text-sm mt-2">メインゲーム画面で全プレイヤーの商品を確認できます</p>
      </div>
    </div>
  );
};

export default PlayerBoard;