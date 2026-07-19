# 公众站部署

## 构建与本地预览

```bash
npm ci
npm run build
npm run preview -- --host 127.0.0.1
```

产物位于 `dist/`。默认部署在域名根路径；同源子路径部署时设置 `VITE_BASE_PATH`，例如：

```bash
VITE_BASE_PATH=/ar-solar-system/ npm run build
```

## 托管要求

- 公网环境必须使用 HTTPS；浏览器只在安全上下文（或本机 `localhost`）开放摄像头。
- 响应头设置 `Permissions-Policy: camera=(self)`，并确认页面未被禁止摄像头的 iframe 策略包裹。
- 对 `<base>/mediapipe/**` 与 `<base>/assets/**` 返回 `Cache-Control: public, max-age=31536000, immutable`；部署时原子替换整份 `dist/`，避免旧模型与新代码混用。
- 为 `.js`、`.css`、`.wasm`、`.task`、`.json`、`.svg` 开启 Brotli，兼容回退为 gzip；图片保留原格式，不重复压缩。
- `index.html` 使用短缓存或 `no-cache`。静态托管将未知页面路径回退到 `index.html`，但不得把真实的 `/mediapipe/`、`/assets/` 请求重写成 HTML。

## 首访体积

浏览器运行时只会选择一份 MediaPipe WASM，首访仍约需下载 30 MB（WASM、7.5 MB 手部模型、应用代码和约 11 MB 纹理）。应启用 HTTP/2 或 HTTP/3、压缩与上述长期缓存；不要预加载全部 WASM 变体。
