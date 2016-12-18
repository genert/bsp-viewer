import BSP from './bsp';

var mapShaders = [
  'demo.shaders'
];

// ===========================================
// Everything below here is common to all maps
var leftViewMat, leftProjMat;
var map, playerMover;

var zAngle = 3;
var xAngle = 0;
var onResize = null;

// These values are in meters
var vrPose = null;

var SKIP_FRAMES = 0;
var REPEAT_FRAMES = 1;

var lastIndex = 0;

import { mat4, vec3 } from 'gl-matrix';
import config from './config';
import q3movement from './movement';
import _has from 'lodash/has';


class Renderer {
  _gl = null;
  _canvas = null;

  initialize (gl, canvas = null) {
    this._gl = gl;
    this._canvas = canvas;

    this.initializeGL(gl);
  }

  initializeGL () {
    const gl = this._gl;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.enable(gl.CULL_FACE);

    //gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    leftViewMat = mat4.create();
    leftProjMat = mat4.create();

    this.initializeMap();
  }

  initializeMap () {
    const gl = this._gl;

    const initMapEntities = () => {
      Logic.respawnPlayer(0);
    };
    const initPlayerMover = (bsp) => {
      playerMover = new q3movement(bsp);
      Logic.respawnPlayer(0);
      document.getElementById('viewport').style.display = 'block';
      onResize();
    };

    map = new BSP(gl);
    map.onentitiesloaded = initMapEntities;
    map.onbsp = initPlayerMover;
    map.loadShaders(mapShaders);

    map.load(`/${config.MAP}`, 5);
  }

  drawFrame () {
    const gl = this._gl;

    // Clear back buffer but not color buffer (we expect the entire scene to be overwritten)
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    if(!map || !playerMover) {
      return;
    }

    View.getViewMatrix(leftViewMat, vrPose, playerMover, zAngle, xAngle);

    // Here's where all the magic happens...
    map.draw(leftViewMat, leftProjMat);
  }


  renderLoop () {
    const startTime = new Date().getTime();
    const lastTimestamp = startTime;
    let timestamp = null;
    let frameId = 0;

    const onRequestedFrame = () => {
      timestamp = new Date().getTime();
      frameId++;

      if (SKIP_FRAMES !== 0 && frameId % SKIP_FRAMES !== 0) {
        return;
      }

      this.onFrame({
        timestamp: timestamp,
        elapsed: timestamp - startTime,
        frameTime: timestamp - lastTimestamp
      });

      window.requestAnimationFrame(onRequestedFrame);
    };

    onRequestedFrame();
  }

  onFrame (event) {
    if (!map || !playerMover) {
      return;
    }

    // Update player movement @ 60hz
    // The while ensures that we update at a fixed rate even if the rendering bogs down
    while (event.elapsed - lastMove >= 16) {
      updateInput(16);
      lastMove += 16;
    }

    // For great laggage!
    for (let i = 0; i < REPEAT_FRAMES; ++i) {
      this.drawFrame();
    }
  }
}

import _random from 'lodash/random';

class Logic {
  static respawnPlayer () {
    if (map.entities && playerMover) {
      let spawnPoint = {
        origin: [0, 0, 0]
      };

      if (_has(map.entities, 'info_player_deathmatch')) {
        const spawnPointsLength = map.entities.info_player_deathmatch.length;
        spawnPoint = map.entities.info_player_deathmatch[_random(0, spawnPointsLength - 1)];
      } else if (_has(map.entities, 'team_CTF_redplayer')) {
        const spawnPointsLength = map.entities.team_CTF_redplayer.length;
        spawnPoint = map.entities.team_CTF_redplayer[_random(0, spawnPointsLength - 1)];
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

let renderer = new Renderer();
var lastMove = 0;

import View from './renderer/view';

var pressed = new Array(128);
var cameraMat = mat4.create();

function moveLookLocked(xDelta, yDelta) {
  zAngle += xDelta*0.0025;

  while (zAngle < 0)
    zAngle += Math.PI*2;

  while (zAngle >= Math.PI*2)
    zAngle -= Math.PI*2;

  xAngle += yDelta*0.0025;

  while (xAngle < -Math.PI*0.5)
    xAngle = -Math.PI*0.5;
  while (xAngle > Math.PI*0.5)
    xAngle = Math.PI*0.5;
}

function moveViewOriented(dir, frameTime) {
  if (dir[0] !== 0 || dir[1] !== 0 || dir[2] !== 0) {
    mat4.identity(cameraMat);
    mat4.rotateZ(cameraMat, cameraMat, zAngle);
    mat4.invert(cameraMat, cameraMat);

    vec3.transformMat4(dir, dir, cameraMat);
  }

  // Send desired movement direction to the player mover for collision detection against the map
  playerMover.move(dir, frameTime);
}

function updateInput(frameTime) {
  if(!playerMover) {
    return;
  }

  var dir = [0, 0, 0];

  // This is our first person movement code. It's not really pretty, but it works
  if(pressed['W'.charCodeAt(0)]) {
    dir[1] += 1;
  }

  if(pressed['S'.charCodeAt(0)]) {
    dir[1] -= 1;
  }

  if(pressed['A'.charCodeAt(0)]) {
    dir[0] -= 1;
  }

  if(pressed['D'.charCodeAt(0)]) {
    dir[0] += 1;
  }

  moveViewOriented(dir, frameTime);
}
  // Set up event handling
function initEvents() {
  var movingModel = false;
  var lastX = 0;
  var lastY = 0;
  var lastMoveX = 0;
  var lastMoveY = 0;
  var viewport = document.getElementById("viewport");
  var viewportFrame = document.getElementById("viewport-frame");

  document.addEventListener("keydown", function(event) {
    if(event.keyCode == 32 && !pressed[32]) {
      playerMover.jump();
    }
    pressed[event.keyCode] = true;
    if ((event.keyCode == 'W'.charCodeAt(0) ||
      event.keyCode == 'S'.charCodeAt(0) ||
      event.keyCode == 'A'.charCodeAt(0) ||
      event.keyCode == 'D'.charCodeAt(0) ||
      event.keyCode == 32) && !event.ctrlKey) {
      event.preventDefault();
    }
  }, false);

  document.addEventListener("keypress", function(event) {
    if(event.charCode == 'R'.charCodeAt(0) || event.charCode == 'r'.charCodeAt(0)) {
      Logic.respawnPlayer(-1);
    }
  }, false);

  document.addEventListener("keyup", function(event) {
    pressed[event.keyCode] = false;
  }, false);

  function startLook(x, y) {
    movingModel = true;
    lastX = x;
    lastY = y;
  }

  function endLook() {
    movingModel = false;
  }

  function moveLook(x, y) {
    var xDelta = x - lastX;
    var yDelta = y - lastY;
    lastX = x;
    lastY = y;

    if (movingModel) {
      moveLookLocked(xDelta, yDelta);
    }
  }

  function startMove(x, y) {
    lastMoveX = x;
    lastMoveY = y;
  }

  function moveUpdate(x, y, frameTime) {
    var xDelta = x - lastMoveX;
    var yDelta = y - lastMoveY;
    lastMoveX = x;
    lastMoveY = y;

    var dir = [xDelta, yDelta * -1, 0];

    moveViewOriented(dir, frameTime*2);
  }

  viewport.addEventListener("click", function(event) {
    viewport.requestPointerLock();
  }, false);

  // Mouse handling code
  // When the mouse is pressed it rotates the players view
  viewport.addEventListener("mousedown", function(event) {
    if(event.which == 1) {
      startLook(event.pageX, event.pageY);
    }
  }, false);

  viewport.addEventListener("mouseup", function(event) {
    endLook();
  }, false);

  viewportFrame.addEventListener("mousemove", function(event) {
    if(document.pointerLockElement) {
      moveLookLocked(event.movementX, event.movementY);
    } else {
      moveLook(event.pageX, event.pageY);
    }
  }, false);

  // Touch handling code
  viewport.addEventListener('touchstart', function(event) {
    var touches = event.touches;
    switch(touches.length) {
      case 1: // Single finger looks around
        startLook(touches[0].pageX, touches[0].pageY);
        break;
      case 2: // Two fingers moves
        startMove(touches[0].pageX, touches[0].pageY);
        break;
      case 3: // Three finger tap jumps
        playerMover.jump();
        break;
      default:
        return;
    }
    event.stopPropagation();
    event.preventDefault();
  }, false);

  viewport.addEventListener('touchend', function(event) {
    endLook();
    return false;
  }, false);

  viewport.addEventListener('touchmove', function(event) {
    var touches = event.touches;
    switch(touches.length) {
      case 1:
        moveLook(touches[0].pageX, touches[0].pageY);
        break;

      case 2:
        moveUpdate(touches[0].pageX, touches[0].pageY, 16);
        break;

      default:
        return;
    }
    event.stopPropagation();
    event.preventDefault();
  }, false);
}


import getAvailableContext from './renderer/get-available-context';

function main() {
  const canvas = document.getElementById('viewport');
  const gl = getAvailableContext(canvas, ['webgl', 'experimental-webgl']);

  onResize = function() {
    var devicePixelRatio = window.devicePixelRatio || 1;

    if(document.fullscreenElement) {
      canvas.width = screen.width * devicePixelRatio;
      canvas.height = screen.height * devicePixelRatio;
    } else {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    mat4.perspective(leftProjMat, 45.0, canvas.width/canvas.height, 1.0, 4096.0);
  };

  if (!gl) {
    document.getElementById('viewport-frame').style.display = 'none';
    document.getElementById('webgl-error').style.display = 'block';
  } else {
    initEvents();
    renderer.initialize(gl, canvas);
    renderer.renderLoop();
  }

  onResize();
  window.addEventListener("resize", onResize, false);


// Handle fullscreen transition
  var viewportFrame = document.getElementById("viewport-frame");
  var viewport = document.getElementById("viewport");

  document.addEventListener("fullscreenchange", function() {
    if(document.fullscreenElement) {
      viewport.requestPointerLock(); // Attempt to lock the mouse automatically on fullscreen
    }
    onResize();
  }, false);

  // Fullscreen
  function goFullscreen() {
    viewportFrame.requestFullScreen();
  }

  var fullscreenButton = document.getElementById('fullscreenBtn');
  var mobileFullscreenBtn = document.getElementById("mobileFullscreenBtn");

  fullscreenButton.addEventListener('click', goFullscreen, false);
  mobileFullscreenBtn.addEventListener('click', goFullscreen, false);
}

window.addEventListener("load", main); // Fire this once the page is loaded up
