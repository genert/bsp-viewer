// The models lump describes rigid groups of world geometry.
// The first model correponds to the base portion of the map while the remaining models correspond
// to movable portions of the map, such as the map's doors, platforms, and buttons.
// Each model has a list of faces and list of brushes; these are especially important for the movable parts of the map,
// which (unlike the base portion of the map) do not have BSP trees associated with them.
// There are a total of length / sizeof(models) records in the lump, where length is the size of the lump itself, as specified in the lump directory.
export default function (lump, source) {
  return new Promise((success) => {
    const count = lump.length / (4 + 4 + 4 + 4 + (4 * 3) + (4 * 3));
    let elements = [];

    source.seek(lump.offset);

    for (let i = 0; i < count; ++i) {
      elements.push({
        mins: [                      // Bounding box min coord.
          source.readLong(),
          source.readLong(),
          source.readLong()
        ],  
        maxs: [                      // Bounding box max coord.
          source.readLong(),
          source.readLong(),
          source.readLong()
        ],
        face: source.readLong(),      // First face for model.
        n_faces: source.readLong(),   // Number of faces for model.
        brush: source.readLong(),     // First brush for model.
        n_brushes: source.readLong()  // Number of brushes for model.
      });
    }

    success(elements);
  });
}
