let lastLeaf = -1;

function checkVis (visCluster, testCluster, visBuffer, visSize) {
  if (visCluster == testCluster || visCluster == -1) {
    return true;
  }

  let i = (visCluster * visSize) + (testCluster >> 3);
  let visSet = visBuffer[i];

  return (visSet & (1 << (testCluster & 7)) !== 0);
}

export default function (leafIndex, visBuffer, visSize, shaders, leaves, faces, leafFaces) {
  // Determine visible faces
  if (leafIndex == lastLeaf) {
    return;
  }

  lastLeaf = leafIndex;

  var curLeaf = leaves[leafIndex];

  var visibleShaders = new Array(shaders.length);

  for (let i = 0; i < leaves.length; ++i) {
    let leaf = leaves[i];

    if (checkVis(curLeaf.cluster, leaf.cluster, visBuffer, visSize)) {
      for (let j = 0; j < leaf.leafFaceCount; ++j) {
        let face = faces[leafFaces[[j + leaf.leafFace]]];

        if (face) {
          visibleShaders[face.shader] = true;
        }
      }
    }
  }

  var ar = new Array(visSize);

  for (let i = 0; i < visSize; ++i) {
    ar[i] = visBuffer[(curLeaf.cluster * visSize) + i];
  }

  postMessage({
    type: 'visibility',
    visibleSurfaces: visibleShaders
  });
}
