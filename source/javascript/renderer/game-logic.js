import _has from 'lodash/has';

let lastIndex = 0;

class Logic {
  static respawnPlayer (index, map, playerMover, zAngle, xAngle) {
    if (map.entities && playerMover) {
      let spawnPoint = null;

      if(index == -1) {
        index = (lastIndex+1)% map.entities.info_player_deathmatch.length;
      }

      lastIndex = index;
      
      if (_has(map.entities, 'info_player_deathmatch')) {
        spawnPoint = map.entities.info_player_deathmatch[index];
      } else if (map.enities.team_CTF_redspawn[index]) {
        spawnPoint = map.entities.team_CTF_redspawn[index];
      }

      playerMover.position = [
        spawnPoint.origin[0],
        spawnPoint.origin[1],
        spawnPoint.origin[2] + 20 // Start a little ways above the floor
      ];

      playerMover.velocity = [0,0,0];

      zAngle = -(spawnPoint.angle || 0) * (3.1415/180) + (3.1415*0.5); // Negative angle in radians + 90 degrees
      xAngle = 0;
    }
  }
}

export default Logic;
