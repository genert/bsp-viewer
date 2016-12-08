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
