# Report notes

## Painting and scene

The painting is Feyhaman Duran's Kabataş Rıhtımı (1936). The boat in the foreground has a curved lower edge that can be traced with a few segments. The painting is drawn on a quad. Three cubes sit in front of it, and a small arrow follows the traced curve.

## Transformations

Matrices are stored column-major and multiply column vectors:

```text
p_clip = P * V * M * p_local
```

TRS applies scale, rotation and translation in that order. SRT applies translation first, so the translation is also rotated and scaled. With T=(1,0,0.8), Rz=30 degrees and uniform scale 0.6, the TRS translation column is (1,0,0.8). In SRT it is approximately (0.519615,0.3,0.48). The rest of the scene uses TRS.

For a rigid transform M=[R t; 0 1], R is orthonormal. Therefore its inverse is [R^T -R^T*t; 0 1]. This shortcut is not used on matrices containing scale.

## Scene graph

```text
gallery
├── animated-pivot
│   └── lavender-cube
├── amber-cube
└── teal-cube
```

Traversal computes world=parent.world*local. At zero pivot angle:

```text
pivot.local = T(-0.8,0.8,0.9)
lavender.local = T(0.8,0,0) * S(0.5,0.5,0.5)
lavender.world = T(0,0.8,0.9) * S(0.5,0.5,0.5)

0.5  0    0    0
0    0.5  0    0.8
0    0    0.5  0.9
0    0    0    1
```

The local point (1,0,0) becomes (0.5,0.8,0.9). At a 90-degree pivot angle, the cube's center is (-0.8,1.6,0.9). Both results are checked by tests.

## View and projection

The camera looks down negative camera Z. Its basis is built with two cross products:

```text
b = normalize(eye-target)
r = normalize(cross(up,b))
u = cross(b,r)

V =
r.x  r.y  r.z  -dot(r,eye)
u.x  u.y  u.z  -dot(u,eye)
b.x  b.y  b.z  -dot(b,eye)
0    0    0     1
```

These rows take dot products with p-eye, so eye maps to the origin. If up is parallel to b, another up axis is chosen. Coincident eye and target use a fixed backward direction.

For perspective, f=1/tan(fovY/2) and w_clip=-z. Let z_clip=a*z+b. Requiring z=-near to map to zero gives b=a*near. Requiring z=-far to map to one gives a=far/(near-far), hence b=near*far/(near-far).

```text
P =
f/aspect  0  0                0
0         f  0                0
0         0  far/(near-far)    near*far/(near-far)
0         0 -1                0
```

Orthographic depth is (z+near)/(near-far), with the same zero-to-one endpoints. Near=0.5 and far=16 cover the initial scene at camera distance 9. The ratio is 32. Perspective depth has more precision near the camera; an unnecessarily small near or large far reduces useful precision. Orthographic depth is linear.

The inspection camera is fixed. Frustum corners are computed on the main camera's near and far planes, then transformed to world space using the rigid inverse of V. Twelve edges are drawn only in the inspection view.


## Curves


The cubic Bezier basis is:

```text
B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t)t^2 P2 + t^3 P3
```

At zero the weights are (1,0,0,0); at one they are (0,0,0,1). Thus B(0)=P0 and B(1)=P3. de Casteljau repeatedly interpolates adjacent points until one point remains.

```text
B'(t) = 3(1-t)^2(P1-P0) + 6(1-t)t(P2-P1) + 3t^2(P3-P2)
```

For a join, Q0=P3 and Q1=2P3-P2. This makes the two endpoint derivatives equal. Moving a handle reflects the opposite handle; moving an anchor translates both adjacent handles. Each segment has the same parameter interval.

The second family is uniform Catmull-Rom:

```text
C(t) = 0.5 * [2p1 + (-p0+p2)t
       + (2p0-5p1+4p2-p3)t^2 + (-p0+3p1-3p2+p3)t^3]
```

It goes from p1 to p2. At an interior anchor, both adjacent derivatives are (next-previous)/2. The first and last points are duplicated at the ends.

The mouse ray is intersected with the curve's plane. The curve is offset slightly from the painting to avoid depth conflicts. The arrow uses atan2(tangent.y,tangent.x) for orientation, reversing the tangent on its return trip. JSON stores u=x/4.45+0.5 and v=0.5-y/5.4. The complete example exports are in exports/.

##No generative AI tools were used for generating the core matrix, camera, or curve code. AI assistants were used strictly for debugging WebGPU validation errors, understanding syntax requirements, and formatting performance readouts.

## Integration, measurements and debugging

    One application contains all parts. The large view can be switched; Reset scene restores the controls and scene data. Debug drawings can be hidden together or individually.

Frame time is measured from animation-frame timestamps, not the clamped animation step. FPS is its reciprocal in seconds. JS CPU time is measured separately around the frame update and submission; it does not measure GPU execution. Submitted vertices are summed at each draw call across both views. The default scene submits 1272 vertices and 12 draw calls per frame. Hiding debug drawings leaves 1008 vertices. These counts are checked against the actual issued draw commands. Machine details and measured intervals are recorded in performance.md.

A small point-placement error came from including the canvas border in the mouse coordinates. Subtracting clientLeft/clientTop and using clientWidth/clientHeight fixed it. A regression test checks a known position on an orthographic painting plane. The run command also needed Vite scripts and asset handling, which were checked in both the dev server and a production build.

The enlarged inspection view initially clipped the frustum on a narrow screen. Its position stayed fixed; the orthographic volume was expanded from the frustum corners. A regression test now checks that all eight corners fit the inspection view.

## Report


The completed report is `../report.pdf`. It includes the derivations, scene tree, numerical checks, screenshots, Chrome performance readings and the normalized JSON exports.
