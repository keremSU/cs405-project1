# CS405 Project 1

WebGPU transformations, scene graph, cameras and curves. Painting: Feyhaman Duran, Kabataş Rıhtımı (1936).

## Run

Use Node.js 20.19+ or 22.12+ and a browser with WebGPU support.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually [localhost:5173](http://localhost:5173).
[Vite](https://vite.dev/guide/) is a development tool. The application uses plain JavaScript, HTML, CSS and WGSL.

## Controls

- Drag to orbit; scroll to zoom.
- Translation, Rotation Z, Scale: change the orange cube.
- Order: select TRS or SRT. Both matrices are shown.
- Animate pivot: rotate the purple cube's parent.
- Show local axes: red X, green Y, blue Z.
- Stop pivot at 0 degrees: stop the parent at zero rotation.
- Projection and FOV: change the projection and field of view.

The second camera is fixed. Blue lines show the main camera's frustum.

## Curves

The initial curve follows the lower edge of the boat in the foreground.

- Curve: select Bezier or Catmull-Rom.
- Shift + drag: move a point. Edit points mode does not require Shift.
- Place 4 anchors: click four points on the painting to create three segments. Leaving this mode cancels an unfinished placement.
- Gold points are anchors; white points are handles; red marks the selected point.
- Show control points: toggle the points and control polygon.
- Segment, t, Show construction: display the Bezier de Casteljau steps.
- Animate follower and Speed: move the green arrow. Speed changes the curve parameter, not world-space distance.
- Restore boat curve: return to the initial trace.
- Export JSON: download the selected curve with normalized control points.

## Files and checks

`src/math` contains the calculations, `src/scene` the scene, `src/render` the drawing code and `src/ui` the controls. Notes and screenshots are in `docs/`; sample curves are in `exports/`.

Matrices use column vectors and column-major storage: `p_clip = P * V * M * p_local`.
Angles are radians in the code and degrees in the controls.

```sh
npm test
npm run build
```

The TRS/SRT screenshots in `docs/` use the same scene with the pivot stopped at zero and the follower hidden. Separate frustum images are saved as `frustum-perspective.jpg` and `frustum-orthographic.jpg`.

Current scope: A-D. Part E and the PDF report are still pending.
