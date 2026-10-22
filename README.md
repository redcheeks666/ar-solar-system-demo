# AR 太阳系 · AR Solar System Demo

[![CI](https://github.com/redcheeks666/ar-solar-system-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/redcheeks666/ar-solar-system-demo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[中文](#中文) · [English](#english)

---

## 中文

在浏览器里用摄像头和双手"召唤"一个 3D 太阳系。画面一开始是空的：双手在镜头前合拢再拉开，太阳系会在两手之间展开；之后可以用手势整体移动、收起，或者捏住某颗行星把它拉到眼前细看。手部识别全部在本地浏览器里完成，不上传任何画面。

### 在线体验

- 体验地址：<https://demo.blushling.com>（先显示落地页，点「开启体验」进入）
- 需要带摄像头、支持 WebGL2 的**桌面浏览器**（Chrome / Edge 最佳）；手机和平板只能浏览落地页。
- 首次访问约需下载 30 MB（MediaPipe WASM、手部模型和纹理）。

### 截图

> 截图待补充：欢迎在 `docs/images/` 下放一张体验截图并在这里引用。

### 主要功能

- 双手合拢 → 拉开，召唤太阳系；双手扶住可整体移动、缩放、收起
- 捏合激活单颗星球，双击（DoubleClose）进入星球特写；单手跟随、双手缩放、甩出后引力回轨
- 地月特写切换、手部骨架显示等辅助手势
- 演示模式 `?demo=1`、完整调试面板 `/debug`、无摄像头的太阳系预览 `?solarPreview=1`
- WebGL2 / 上下文丢失 / 运行错误的降级处理，不适配设备软提示

### 技术栈

- TypeScript + [Vite](https://vite.dev/)
- [three.js](https://threejs.org/) 3D 渲染（选择性 Bloom、粒子与裂隙特效）
- [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker) 手部关键点（Web Worker，WASM 与模型自托管）
- [Vitest](https://vitest.dev/) 单元、手势控制器与回放测试
- 行星纹理来自 NASA 公开资源（见 `public/assets/solar/manifests/nasa-assets.json`）

### 本地运行

需要 Node.js 20.19+ 或 22.12+。

```bash
npm ci
npm run dev        # 默认 http://127.0.0.1:5173
```

`npm run dev` / `npm run build` 会先运行 `scripts/sync-mediapipe-assets.mjs`：从 `node_modules` 复制 MediaPipe WASM，并在首次运行时从 Google 模型存储下载 `hand_landmarker.task` 到 `public/mediapipe/`（已被 gitignore）。之后可离线运行。

其他命令：

```bash
npm run typecheck  # TypeScript 类型检查
npm test           # 全部测试（unit / gesture / replay）
npm run build      # 生产构建，输出到 dist/
npm run preview    # 预览构建产物
```

子路径部署：`VITE_BASE_PATH=/ar-solar-system/ npm run build`。托管要求（HTTPS、摄像头权限策略、缓存）见 [DEPLOYMENT.md](DEPLOYMENT.md)。

路由：`/` 落地页 · `/debug` 完整调试版 · `/?demo=1` 演示模式 · `/?solarPreview=1` 太阳系预览（无摄像头）。

### 关于音效

开源版本**不包含音效文件**：原先使用的第三方音效（Pixabay 等）授权不允许单独再分发。代码会在音效文件缺失时静默跳过，功能不受影响。如需声音，可按 `public/assets/solar/manifests/sfx-assets.json` 里的文件名自行放入授权音效到 `public/assets/solar/sfx/`。

### 文档

- [ar_solar_system_prd.md](ar_solar_system_prd.md)：产品需求与交互规则
- [docs/testing/test-and-replay-harness.md](docs/testing/test-and-replay-harness.md)：测试策略
- [DEPLOYMENT.md](DEPLOYMENT.md)、[docs/deployment/esa-pages.md](docs/deployment/esa-pages.md)：部署
- [AGENTS.md](AGENTS.md)：给编码代理的约定

### 许可证

[MIT](LICENSE) © 2026 redcheeks666。NASA 纹理遵循 NASA 媒体使用指南；MediaPipe 遵循 Apache-2.0。

---

## English

Summon a 3D solar system with your webcam and bare hands, right in the browser. The scene starts empty: bring both hands together in front of the camera and pull them apart, and the solar system unfolds between them. You can then move, scale and collapse it, or pinch a single planet and pull it into a close-up. Hand tracking runs entirely in your browser; no video leaves your machine.

### Live demo

- <https://demo.blushling.com> (landing page first; click 「开启体验」 to start)
- Requires a **desktop browser** with a webcam and WebGL2 (Chrome / Edge recommended). Phones and tablets can only view the landing page.
- First load downloads about 30 MB (MediaPipe WASM, hand model and textures).

### Screenshot

> Screenshot to be added (place one under `docs/images/` and link it here).

### Features

- Two-hand pull to summon the solar system; two-hand grip to move, scale and collapse it
- Pinch to activate a body, double-close to enter a planet close-up; one-hand follow, two-hand scale, throw-and-return with gravity capture
- Earth–Moon close-up switching and a hand-skeleton toggle
- Presentation mode `?demo=1`, full debug UI at `/debug`, camera-free preview `?solarPreview=1`
- Graceful fallbacks for missing WebGL2, context loss and runtime errors; soft warning on unsupported devices

### Tech stack

TypeScript · Vite · three.js · MediaPipe Tasks Vision (hand landmarker in a Web Worker, self-hosted WASM/model) · Vitest. Planet textures are public NASA resources.

### Run locally

Node.js 20.19+ or 22.12+:

```bash
npm ci
npm run dev        # http://127.0.0.1:5173
npm run typecheck
npm test
npm run build
```

`dev`/`build` first sync MediaPipe WASM from `node_modules` and download `hand_landmarker.task` once into `public/mediapipe/` (gitignored). See [DEPLOYMENT.md](DEPLOYMENT.md) for hosting requirements.

### Audio

Sound files are **not included** in the open-source version because the original third-party SFX licenses (e.g. Pixabay) do not allow standalone redistribution. The app skips missing audio silently. To add sound, drop your own licensed files into `public/assets/solar/sfx/` using the names in `public/assets/solar/manifests/sfx-assets.json`.

### License

[MIT](LICENSE) © 2026 redcheeks666. NASA textures follow NASA media usage guidelines; MediaPipe is Apache-2.0.
