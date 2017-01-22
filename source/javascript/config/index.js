const ENGINES = {
  QUAKE3: 46,
  WOLFET: 47,
  RTCW: 47
};

const config = {
  ENGINE: ENGINES.WOLFET,

  // Map related
  MAP: 'maps/pilsner.bsp',
  SHADERS: ['demo.shaders'],

  // Rendering related.
  LIGHTMAPS_ENABLED: false,

  // Do not remove
  ENGINES: ENGINES
};

export default config;
