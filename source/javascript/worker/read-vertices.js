import { colorToVec, brightnessAdjustVertex } from '../common/colors';

export default function (lump, src) {
  return new Promise((success) => {
    const count = lump.length/44;
    let elements = [];

    src.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      elements.push({
        pos: [ src.readFloat(), src.readFloat(), src.readFloat() ],
        texCoord: [ src.readFloat(), src.readFloat() ],
        lmCoord: [ src.readFloat(), src.readFloat() ],
        lmNewCoord: [ 0, 0 ],
        normal: [ src.readFloat(), src.readFloat(), src.readFloat() ],
        color: brightnessAdjustVertex(colorToVec(src.readULong()), 4.0)
      });
    }

    success(elements);
  });
}
