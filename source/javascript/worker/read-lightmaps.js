import { brightnessAdjust } from '../common/colors';

export default function (lump, src) {
  return new Promise((success) => {
    var lightmapSize = 128 * 128;
    var count = lump.length / (lightmapSize*3);

    var gridSize = 2;

    while(gridSize * gridSize < count) {
      gridSize *= 2;
    }

    var textureSize = gridSize * 128;

    var xOffset = 0;
    var yOffset = 0;

    var lightmaps = [];
    var lightmapRects = [];
    var rgb = [ 0, 0, 0 ];

    src.seek(lump.offset);
    for(var i = 0; i < count; ++i) {
      var elements = new Array(lightmapSize*4);

      for(var j = 0; j < lightmapSize*4; j+=4) {
        rgb[0] = src.readUByte();
        rgb[1] = src.readUByte();
        rgb[2] = src.readUByte();

        brightnessAdjust(rgb, 4.0);

        elements[j] = rgb[0];
        elements[j+1] = rgb[1];
        elements[j+2] = rgb[2];
        elements[j+3] = 255;
      }

      lightmaps.push({
        x: xOffset, y: yOffset,
        width: 128, height: 128,
        bytes: elements
      });

      lightmapRects.push({
        x: xOffset/textureSize,
        y: yOffset/textureSize,
        xScale: 128/textureSize,
        yScale: 128/textureSize
      });

      xOffset += 128;
      if(xOffset >= textureSize) {
        yOffset += 128;
        xOffset = 0;
      }
    }

    // Send the lightmap data back to the render thread
    postMessage({
      type: 'lightmap',
      size: textureSize,
      lightmaps: lightmaps
    });

    success(lightmapRects);
  });
}
