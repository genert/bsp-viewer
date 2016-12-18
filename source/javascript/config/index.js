const ENGINES = {
  QUAKE3: 46,
  WOLFET: 47,
  RTCW: 47
};

const config = {
  ENGINE: ENGINES.QUAKE3,

  // Map related
  MAP: 'q3tourney2.bsp',
  SHADERS: ['demo.shaders'],

  // Rendering related.
  LIGHTMAPS_ENABLED: true,

  // Do not remove
  ENGINES: ENGINES
};

export default config;
