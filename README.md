# AR Solar System Demo

Browser-based webcam AR gesture interaction demo. The current milestone shows a complete 16:9 webcam preview with a transparent Three.js canvas above it. The 3D scene intentionally starts empty.

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run typecheck
```

## Manual Camera Check

1. Open the local dev URL shown by Vite.
2. Click `开启摄像头`.
3. Grant camera permission.
4. Confirm the webcam appears as a complete 16:9 preview, is mirrored like a selfie view, and is not cropped into a close-up.
5. Confirm no 3D sun, planet, orbit, nebula, particle, singularity, or decorative object is visible.
6. Toggle `Debug` and confirm camera status, state, FPS, video source size, display size, display ratio, `object-fit`, and canvas size update.
