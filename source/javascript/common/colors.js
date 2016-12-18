export function brightnessAdjust (color, factor) {
  let scale = 1.0;
  let temp = 0.0;

  color[0] *= factor;
  color[1] *= factor;
  color[2] *= factor;

  if (color[0] > 255 && (temp = 255/color[0]) < scale) { scale = temp; }
  if (color[1] > 255 && (temp = 255/color[1]) < scale) { scale = temp; }
  if (color[2] > 255 && (temp = 255/color[2]) < scale) { scale = temp; }

  color[0] *= scale;
  color[1] *= scale;
  color[2] *= scale;

  return color;
}

export function brightnessAdjustVertex (color, factor) {
  let scale = 1.0;
  let temp = 0.0;

  color[0] *= factor;
  color[1] *= factor;
  color[2] *= factor;

  if(color[0] > 1 && (temp = 1/color[0]) < scale) { scale = temp; }
  if(color[1] > 1 && (temp = 1/color[1]) < scale) { scale = temp; }
  if(color[2] > 1 && (temp = 1/color[2]) < scale) { scale = temp; }

  color[0] *= scale;
  color[1] *= scale;
  color[2] *= scale;

  return color;
}

export function colorToVec (color) {
  return [
    (color & 0xFF) / 0xFF,
    ((color & 0xFF00) >> 8) / 0xFF,
    ((color & 0xFF0000) >> 16) / 0xFF,
    1
  ];
}

export function HSVtoRGB (h, s, v) {
  var r, g, b, i, f, p, q, t;

  if (arguments.length === 1) {
    s = h.s, v = h.v, h = h.h;
  }

  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}
