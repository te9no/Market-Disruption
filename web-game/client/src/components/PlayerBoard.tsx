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

      {/* Enhanced Personal Market */}
      <PersonalMarket 
        personalMarket={player.personalMarket} 
        playerId={player.id}
      />
    </div>
  );
};

export default PlayerBoard;