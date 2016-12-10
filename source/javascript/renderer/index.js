import { mat4 } from 'gl-matrix';
import BSP from '../bsp';
import q3movement from '../movement';

class Renderer {
  _gl = null;
  _map = null;
  _lastIndex = 0;

  constructor (gl) {
    this._gl = gl;

    this.initialize();
  }

  initialize () {
    const gl = this._gl;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.enable(gl.CULL_FACE);

    leftViewMat = mat4.create();
    leftProjMat = mat4.create();

    this.initializeMap();
  }

  initializeMap () {
    this._map = new BSP(gl);

    this._map.onentitiesloaded = initMapEntities;
    this._map.onbsp = initPlayerMover;

    this._map.loadShaders(mapShaders);
    this._map.load('maps/' + mapName +'.bsp', 5);
  }

  initMapEntities () {
    this.respawnPlayer(0);
  }

  initPlayerMover (bsp) {
    playerMover = new q3movement(bsp);

    this.respawnPlayer(0);

    document.getElementById('viewport').style.display = 'block';

    onResize();
  }

  respawnPlayer (index) {
    if (this._map.entities && playerMover) {
      if (index == -1) {
        index = (lastIndex+1)% this._map.entities.info_player_deathmatch.length;
      }
      lastIndex = index;

      var spawnPoint = this._map.entities.info_player_deathmatch[index];
      playerMover.position = [
        spawnPoint.origin[0],
        spawnPoint.origin[1],
        spawnPoint.origin[2]+30 // Start a little ways above the floor
      ];

      playerMover.velocity = [0,0,0];

      zAngle = -(spawnPoint.angle || 0) * (3.1415/180) + (3.1415*0.5); // Negative angle in radians + 90 degrees
      xAngle = 0;
    }
  }

}

export default Renderer;
