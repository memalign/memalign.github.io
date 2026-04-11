if (typeof module !== 'undefined' && module.exports) {
  ({ assertEqual, assertTrue } = require('./UnitTests'));
  ({ MapProjection } = require('../src/MapProjection.js'));
  ({ GlobeRenderer } = require('../src/GlobeRenderer.js'));
  ({ Tuning } = require('../src/Tuning.js'));
}

class UnitTests_Globe {
  test_globeProjection_roundTrips_grid_centers() {
    const samples = [
      { x: 0, y: 0 },
      { x: 10, y: 25 },
      { x: 149, y: 150 },
      { x: 299, y: 299 }
    ];

    for (const sample of samples) {
      const latLon = MapProjection.gridToLatLon(sample.x, sample.y, 300, 300);
      const roundTrip = MapProjection.latLonToGrid(latLon.lat, latLon.lon, 300, 300);
      assertEqual(roundTrip.x, sample.x);
      assertEqual(roundTrip.y, sample.y);
    }
  }

  test_globeProjection_wraps_longitude() {
    const center = MapProjection.latLonToGrid(0, Math.PI * 2, 300, 300);
    const wrapped = MapProjection.latLonToGrid(0, 0, 300, 300);
    assertEqual(center.x, wrapped.x);
    assertEqual(center.y, wrapped.y);
  }

  test_globeProjection_roundTrips_unit_sphere() {
    const latLon = { lat: 0.4, lon: -1.2 };
    const sphere = MapProjection.unitSphereFromLatLon(latLon.lat, latLon.lon);
    const roundTrip = MapProjection.latLonFromUnitSphere(sphere.x, sphere.y, sphere.z);
    assertTrue(Math.abs(roundTrip.lat - latLon.lat) < 0.000001, 'Latitude should round-trip through the sphere conversion');
    assertTrue(Math.abs(roundTrip.lon - latLon.lon) < 0.000001, 'Longitude should round-trip through the sphere conversion');
  }

  test_globeRenderer_focus_grid_tracks_view() {
    const renderer = new GlobeRenderer(800, 600);
    renderer.setViewFromGrid(120, 42, 300, 300);
    const focus = renderer.getFocusGrid(300, 300);
    assertEqual(focus.x, 120);
    assertEqual(focus.y, 42);
  }

  test_globeRenderer_blend_thresholds() {
    const renderer = new GlobeRenderer(800, 600);
    assertEqual(renderer.getBlendForCellSize(Tuning.GLOBE_TRANSITION_START_CELL_SIZE), 0);
    assertEqual(renderer.getBlendForCellSize(Tuning.GLOBE_TRANSITION_END_CELL_SIZE), 1);
    assertTrue(renderer.getBlendForCellSize((Tuning.GLOBE_TRANSITION_START_CELL_SIZE + Tuning.GLOBE_TRANSITION_END_CELL_SIZE) / 2) > 0, 'Midpoint cell size should be in transition');
  }
  test_globeRenderer_camera_distance_zooms_out_as_cell_size_shrinks() {
    const renderer = new GlobeRenderer(800, 600);
    const nearDistance = renderer.getCameraDistanceForCellSize(Tuning.GLOBE_TRANSITION_START_CELL_SIZE);
    const farDistance = renderer.getCameraDistanceForCellSize(Tuning.CAMERA_MIN_CELL_SIZE);
    assertTrue(farDistance > nearDistance, 'Globe camera should pull back as the user zooms farther out');
  }

  test_globeRenderer_curvature_progress_matches_transition_window() {
    const renderer = new GlobeRenderer(800, 600);
    assertEqual(renderer.getCurvatureProgressForCellSize(Tuning.GLOBE_TRANSITION_START_CELL_SIZE), 0);
    assertEqual(renderer.getCurvatureProgressForCellSize(Tuning.GLOBE_TRANSITION_END_CELL_SIZE), 1);

    const midpoint = (Tuning.GLOBE_TRANSITION_START_CELL_SIZE + Tuning.GLOBE_TRANSITION_END_CELL_SIZE) / 2;
    assertTrue(renderer.getCurvatureProgressForCellSize(midpoint) > 0, 'Curvature should begin ramping during the 2D-to-globe transition window');
  }

  test_globeRenderer_smoothed_blend_matches_thresholds() {
    const renderer = new GlobeRenderer(800, 600);
    assertEqual(renderer.getSmoothedBlendForCellSize(Tuning.GLOBE_TRANSITION_START_CELL_SIZE), 0);
    assertEqual(renderer.getSmoothedBlendForCellSize(Tuning.GLOBE_TRANSITION_END_CELL_SIZE), 1);
  }

}

{
  const thisClass = UnitTests_Globe;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = thisClass;
  } else if (typeof ut !== 'undefined') {
    ut.importTestMethodsFromClass(thisClass);
  }
}
