export default function (lump, source) {
  return new Promise((success) => {
    source.seek(lump.offset);

    let entities = source.readString(lump.length);
    let elements = {
      targets: {}
    };

    entities.replace(/\{([^}]*)\}/mg, ($0, entitySrc) => {
      let entity = {
        classname: 'unknown'
      };

      entitySrc.replace(/"(.+)" "(.+)"$/mg, ($0, key, value) => {
        switch (key) {
          case 'origin':
            value.replace(/(.+) (.+) (.+)/, ($0, x, y, z) => {
              entity[key] = [
                parseFloat(x),
                parseFloat(y),
                parseFloat(z)
              ];
            });
            break;

          case 'angle':
            entity[key] = parseFloat(value);
            break;

          default:
            entity[key] = value;
            break;
        }
      });

      if (entity['targetname']) {
        elements.targets[entity['targetname']] = entity;
      }

      if (!elements[entity.classname]) {
        elements[entity.classname] = [];
      }

      elements[entity.classname].push(entity);
    });

    success(elements);

    postMessage({
      type: 'entities',
      entities: elements
    });
  });
}
