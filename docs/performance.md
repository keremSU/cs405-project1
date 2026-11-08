# Performance notes

Measured on 8 November 2026, using the local Vite development server and Google Chrome on macOS.

- GPU: Apple Silicon GPU. The browser reports `apple`.
- Google Chrome version: 156.0.8078.80.
- Default perspective camera and initial boat curve; pivot and follower animations running.
- Chrome page zoom: 50%; screenshots include the browser window.
- Both canvases are rendered every frame. Local axes are off in both configurations.
- The rows are representative rolling readouts after warm-up, as shown in the saved Chrome screenshots.

| Configuration | Frame time (ms) | FPS | JS CPU (ms) | Vertices/frame | Draw calls/frame |
| --- | ---: | ---: | ---: | ---: | ---: |
| Debug drawings on | 8.26 | 121.1 | 0.99 | 1272 | 12 |
| Debug drawings off | 8.33 | 120.0 | 1.08 | 1008 | 12 |

Frame time averages the last 120 animation-frame intervals and refreshes every 500 ms. FPS is 1000 divided by the unrounded mean interval. JS CPU time averages the last 120 frame-update and command-submission samples measured with `performance.now()`. It does not wait for GPU completion.

The values are rolling readings, rather than a fixed-duration benchmark. Both configurations are near the display's 120 Hz refresh rate, so fewer submitted vertices alone do not show a frame-rate improvement. Raw observations and measurement details are in `performance-default.json` and `performance-debug-off.json`.

Vertex counts come from the actual draw calls and include both cameras:

```text
Main:       6 painting + 108 cubes + 102 markers/arrow + 408 lines = 624
Inspection: 6 painting + 108 cubes + 102 markers/arrow + 432 lines = 648
Total: 1272 vertices, 12 draw calls

Debug off: 2 * (6 painting + 108 cubes + 6 arrow + 384 curve lines) = 1008
```

`e-stats-main.jpg` and `e-stats-debug-off.jpg` show the Chrome readings used in the table. The GPU is described at the Apple Silicon family level; the browser does not show the full model name.
