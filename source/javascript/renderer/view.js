import { mat4 } from 'gl-matrix';

const vrIPDScale = 32.0; // There are 32 units per meter in Quake 3
const playerHeight = 57; // Roughly where my eyes sit (1.78 meters off the ground)

class View {
  static getViewMatrix(out, pose, playerMover, zAngle, xAngle) {
    const poseMatrix = mat4.create();

    mat4.identity(out);

    mat4.translate(out, out, playerMover.position);
    mat4.translate(out, out, [0, 0, playerHeight]);
    mat4.rotateZ(out, out, -zAngle);
    mat4.rotateX(out, out, Math.PI/2);

    if (pose) {
      let orientation = pose.orientation;
      let position = pose.position;

      if (!orientation) {
        orientation = [0, 0, 0, 1];
      }

      if (!position) {
        position = [0, 0, 0];
      }

      mat4.fromRotationTranslation(poseMatrix, orientation, [
        position[0] * vrIPDScale,
        position[1] * vrIPDScale,
        position[2] * vrIPDScale
      ]);

      mat4.multiply(out, out, poseMatrix);
    }

    mat4.rotateX(out, out, -xAngle);
    mat4.invert(out, out);
  }
}

export default View;
