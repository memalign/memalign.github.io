if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ Camera } = require('../src/Camera.js'));
}

class UnitTests_Camera {
  test_camera_edge_pan_target_uses_canvas_edges() {
    const camera = new Camera(800, 600, 300, 60);
    camera.x = 1100;
    camera.y = 900;
    camera.targetX = camera.x;
    camera.targetY = camera.y;

    const leftCell = camera.screenToGrid(80, 300);
    const leftTarget = camera.getEdgePanTargetForCell(leftCell.x, leftCell.y);
    assertEqual(leftTarget.targetX, (leftCell.x * 60) - (800 / 3));
    assertEqual(leftTarget.targetY, 900);

    const rightCell = camera.screenToGrid(700, 300);
    const rightTarget = camera.getEdgePanTargetForCell(rightCell.x, rightCell.y);
    assertEqual(rightTarget.targetX, (rightCell.x * 60) + 60 - ((2 * 800) / 3));
    assertEqual(rightTarget.targetY, 900);
  }

  test_camera_edge_pan_target_uses_visible_canvas_bounds() {
    const camera = new Camera(800, 600, 300, 60);
    camera.x = 8600;
    camera.y = 8700;

    const target = camera.getEdgePanTargetForCell(146, 150, {
      left: 212.5,
      top: 0,
      right: 800,
      bottom: 600,
    });

    assertTrue(target.targetX < camera.x, 'Cells near the visible left edge should trigger pan even if the logical canvas extends offscreen');
  }

  test_camera_edge_pan_target_triggers_from_partial_cell_proximity() {
    const camera = new Camera(800, 600, 300, 60);
    camera.x = 1000;
    camera.y = 900;

    const nearLeftCell = camera.screenToGrid(59, 300);
    const nearLeftTarget = camera.getEdgePanTargetForCell(nearLeftCell.x, nearLeftCell.y);
    assertTrue(nearLeftTarget.targetX < camera.x, 'Cell within 1.0 cell width of the left canvas edge should trigger pan');

    const safeLeftCell = camera.screenToGrid(151, 300);
    const safeLeftTarget = camera.getEdgePanTargetForCell(safeLeftCell.x, safeLeftCell.y);
    assertEqual(safeLeftTarget.targetX, camera.x);
  }

  test_camera_panBy_uses_current_position() {
    const camera = new Camera(800, 600, 300, 60);
    camera.x = 1000;
    camera.y = 900;
    camera.targetX = 1600;
    camera.targetY = 1200;

    camera.panBy(800 / 3, 0);

    assertEqual(camera.targetX, 1000 + (800 / 3));
    assertEqual(camera.targetY, 900);
  }

  test_camera_pan_persists_during_zoom_animation() {
    const camera = new Camera(800, 600, 300, 60);
    const initialX = camera.x;

    camera.zoom(1.2, 400, 300);
    camera.panBy(200, 0);

    const targetBeforeUpdate = camera.targetX;
    camera.update();

    assertTrue(camera.targetX > camera.x, 'Pan target should remain ahead of current position while zoom animates');
    assertTrue(camera.targetX > initialX, 'Pan target should still request movement toward the tapped edge');
    assertTrue(camera.targetX !== camera.x, 'Zoom update should not collapse the pending pan animation');
    assertTrue(camera.targetX >= targetBeforeUpdate, 'Zoom should preserve or extend the pending pan target');
  }
}

{
  const thisClass = UnitTests_Camera;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
