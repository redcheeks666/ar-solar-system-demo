# TODO.zh-CN.md

项目：AR Solar System Webcam Gesture Demo  
当前规划基线：PRD v0.3，2026-06-21  
主要交付目标：Web Demo 优先

## 如何使用本文件

本文件是 `TODO.md` 的中文阅读镜像，供用户阅读使用。

权威规则：

- `TODO.md` 是 Codex 和未来 coding agents 的权威英文工作任务板。
- `TODO.zh-CN.md` 只作为中文阅读镜像，不作为规划、状态判断或实现决策依据。
- Codex 和未来 agents 必须继续以英文 `TODO.md` 为准。
- 每次 `TODO.md` 发生变化时，需要在同一变更中同步更新本文件。

状态值：

- `TODO` — 尚未开始。
- `IN_PROGRESS` — 正在实现。
- `BLOCKED` — 因决策、依赖或人工测试而无法继续。
- `NEEDS_MANUAL_VERIFY` — 代码已存在，但摄像头/手势行为需要人工在浏览器中验证。
- `DONE` — 已实现、已检查，并且文档已同步。

只有当任务验收标准满足，并且已遵循 `AGENTS.md` 中的文档同步规则时，任务才能标记为 `DONE`。

## 文档同步检查清单

当 Codex 对话期间需求发生变化时，使用此清单。

- [ ] 用简明语言复述变更后的需求。
- [ ] 确认用户同意，或用户已继续要求按新理解实现。
- [ ] 如果产品行为、交互规则、验收标准或范围变化，更新 `ar_solar_system_prd.md`。
- [ ] 如果里程碑范围、状态、任务顺序、验收标准、阻塞项或当前计划变化，更新 `TODO.md`。
- [ ] 每当 `TODO.md` 变化时，更新 `TODO.zh-CN.md`；本文件只保持阅读镜像定位。
- [ ] 如果长期编码规则、架构约束、工作流规则或禁止事项变化，更新 `AGENTS.md`。
- [ ] 在本文件底部的变更日志中增加一条记录。
- [ ] 在 Codex 最终回复中提到已变更的文档。

## 当前不可妥协的产品规则

- [ ] Web Demo 优先。
- [ ] 初始 AR 场景为空：在拉开手势之前，不显示 3D 太阳、行星、轨道、星云、奇点、星尘或装饰性 3D 物体。
- [ ] 太阳系只在用户双手/双拳在摄像头可见画面任意位置合拢并向两侧拉开之后出现。
- [ ] 展开进度由手距驱动；如果手停住，不应自动展开完成。
- [ ] 展开端点需要视觉上跟随双手。
- [ ] 展开后的太阳系锚定在胸前附近，而不是屏幕中心。
- [ ] 双手缩放会改变太阳系大小。
- [ ] 双手空间旋转应产生可见的 3D 倾斜和深度，而不只是 2D 旋转。
- [ ] MVP 中水星、金星、地球、火星、木星、土星、天王星、海王星和月球均可抓取。
- [ ] Pinch 抓取会将选中的天体吸附到手上，并冻结其自主运动。
- [ ] 普通释放会让天体保持脱离状态，悬浮在释放位置并自转。
- [ ] 甩出释放会让天体返回原始轨道。
- [ ] 当需求或已完成范围变化时，文档必须更新；每当 `TODO.md` 变化时，也必须同步更新 `TODO.zh-CN.md`。

## Milestone 0 — 仓库和文档设置

状态：`DONE`

目标：准备仓库，使 Codex 拥有稳定上下文，并能按里程碑推进。

任务：

- [x] 创建或确认仓库根目录。
- [x] 将最新 PRD 放在 `ar_solar_system_prd.md`。
- [x] 在仓库根目录添加 `AGENTS.md`。
- [x] 在仓库根目录添加 `TODO.md`。
- [x] 初始化 Vite TypeScript Web Demo。
- [x] 添加基础脚本：`dev`、`build`，并优先添加 `typecheck`。
- [x] 添加包含本地运行命令的最小 README。
- [x] 确认 `npm install` 和 `npm run build` 可用。

验收标准：

- [x] Codex 可以从仓库根目录读取 `AGENTS.md`、`TODO.md` 和 `ar_solar_system_prd.md`。
- [x] 运行 `npm run dev` 可以启动本地浏览器 Demo。
- [x] 运行 `npm run build` 成功。
- [x] 没有引入 Electron、后端、登录、数据库、部署或非 Web 引擎。

建议 Codex 提示词：

```text
Goal:
Set up the repository for the AR Solar System Web Demo.

Context:
Read @AGENTS.md, @TODO.md, and @ar_solar_system_prd.md.

Constraints:
- Web Demo first.
- Use Vite + TypeScript.
- Do not add Electron, backend services, or another engine.
- Keep the project small and easy to run locally.

Done when:
- npm install works.
- npm run dev starts the app.
- npm run build passes.
- TODO.md is updated with the status of Milestone 0.
```

## Milestone 1 — 摄像头背景和透明 3D 覆盖层

状态：`DONE`

目标：将摄像头作为完整 16:9 AR 预览背景，并在其上方叠加匹配尺寸的透明 Three.js canvas，且初始不显示 3D 模型。

任务：

- [x] 通过浏览器 MediaDevices API 请求摄像头权限。
- [x] 将视频显示为 AR 预览背景层。
- [x] 水平镜像视频，使交互符合自拍直觉。
- [x] 在 16:9 预览舞台中保留完整 16:9 摄像头画面，不使用 `cover` 裁切。
- [x] 在视频上方添加透明 Three.js WebGL canvas。
- [x] 保持视频、canvas 和预览 overlay 的尺寸对齐。
- [x] 添加启动 UI：标题、`开启摄像头` 按钮和极简提示文字。
- [x] 添加调试面板开关，但默认隐藏。
- [x] 添加临时调试值：视频源尺寸、显示尺寸、显示比例、`object-fit` 和 canvas 尺寸。
- [x] 确保初始渲染循环不包含可见 3D 物体。
- [x] 优雅处理摄像头权限被拒绝或摄像头不可用状态。

验收标准：

- [x] 用户可以从浏览器启动摄像头。
- [x] 摄像头画面完整显示在 16:9 预览舞台中，没有明显变形或裁切。
- [x] Three.js canvas 透明并与视频对齐。
- [x] 初始场景不显示 3D 太阳、行星、轨道、星云、星尘、奇点或装饰性 3D 物体。
- [x] `npm run build` 通过。
- [x] 摄像头行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 1: webcam background plus transparent Three.js overlay.

Context:
Read @ar_solar_system_prd.md section 7.1 and 7.3, plus @AGENTS.md product invariants.

Constraints:
- Initial scene must be empty of all 3D content.
- Only minimal 2D instructions and hidden debug UI are allowed.
- Keep camera and rendering logic separated.

Done when:
- npm run build passes.
- The browser can show webcam video as the background.
- The transparent WebGL canvas sits above the video.
- TODO.md reflects the new milestone status.
```

## Milestone 2 — 姿态和手部追踪基础

状态：`DONE`

目标：检测身体姿态和双手，并暴露稳定的关键点数据，供后续交互使用。

任务：

- [x] 添加 MediaPipe Tasks Vision 依赖。
- [x] 实现用于肩部关键点的 pose tracker。
- [x] 实现左右手 hand tracker。
- [x] 计算手部中心、拇指指尖、食指指尖、手掌尺度和可选手腕点。
- [x] 将追踪坐标归一化到一致的应用坐标系统。
- [x] 添加手部和肩部关键点平滑工具。
- [x] 为姿态/手部检测状态添加调试 overlay。
- [x] 只在 debug mode 开启时显示关键点调试可视化。

验收标准：

- [x] 调试面板报告是否检测到姿态。
- [x] 调试面板报告是否检测到左手和右手。
- [x] 手部位置足够稳定，可用于基础交互。
- [x] 初始空场不显示任何 3D 太阳系元素。
- [x] `npm run build` 通过。
- [x] 摄像头/手势行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 2: MediaPipe pose and hand tracking foundation.

Context:
Read @ar_solar_system_prd.md sections 7.2, 7.3, 10, 12, and 13.

Constraints:
- Do not show solar-system 3D content yet.
- Landmarks may be shown only in debug mode.
- Keep tracking code separate from rendering code.

Done when:
- Debug panel shows pose and both-hand detection state.
- Landmark data is available to interaction modules.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 3 — 纯双手合拢到拉开预备空闲状态

状态：`NEEDS_MANUAL_VERIFY`

目标：只基于双手检测启动手势：双手合拢，然后向两侧拉开。该手势不得依赖胸前锚点、肩膀或身体姿态。只要双手在摄像头可见画面中，用户应能在胸前、头顶、身体侧边或其他任意可见位置触发拉开预备状态。

任务：

- [x] 检测稳定的左手和右手中心点。
- [x] 计算双手中点、手距、手部方向向量和手距速度。
- [x] 使用低通滤波平滑双手位置和手距。
- [x] 当手部追踪短暂丢失时，短暂保持上一稳定手部位置。
- [x] 检测双手是否在摄像头可见画面的任意位置合拢。
- [x] 检测双手在合拢状态后是否持续向两侧拉开。
- [x] 添加交互状态：`CameraReady`、`EmptyIdle`、`HandsClosed` 和 `PullArmed`。
- [x] `HandsClosed` 表示双手已合拢，但不应出现任何 3D 内容。
- [x] `PullArmed` 表示已检测到有效拉开趋势，但太阳系仍不应出现。
- [x] 当用户尚未进入双手合拢状态时，显示极简 2D 引导。
- [x] 添加调试值：左手 x/y、右手 x/y、双手中点、手距、手部方向向量、手距速度、当前状态、双手是否可见、丢手保持是否激活。
- [x] `HandsClosed` 或 `PullArmed` 的必要条件不得使用胸前锚点、肩膀位置或身体姿态。

验收标准：

- [x] 摄像头开启后，应用视觉上保持没有 3D 太阳内容。
- [x] 当双手在摄像头可见画面的任意位置合拢时，应用可以进入 `HandsClosed`。
- [x] 当双手从合拢状态持续拉开时，应用可以进入 `PullArmed`。
- [x] 双手在头顶合拢并拉开可以进入 `PullArmed`，待人工摄像头验证。
- [x] 双手在胸前合拢并拉开可以进入 `PullArmed`，待人工摄像头验证。
- [x] 双手在身体侧边合拢并拉开可以进入 `PullArmed`，待人工摄像头验证。
- [x] 如果双手丢失或拉开趋势停止，应用回到 `EmptyIdle` 或其他合适空闲状态。
- [x] 进入 `HandsClosed` 或 `PullArmed` 不会渲染太阳、行星、轨道环、星云、粒子、奇点或任何 3D 模型。
- [x] 调试面板显示稳定手部位置、手距、距离速度、中点和状态变化。
- [x] `npm run build` 通过。
- [x] 行为标记为 `NEEDS_MANUAL_VERIFY`，用于真实摄像头验证胸前、头顶和身体侧边位置。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 3: hand-only closed-to-pull armed idle state.

Context:
Read @AGENTS.md, @TODO.md, and @ar_solar_system_prd.md.
This is a requirement adjustment. The startup gesture must no longer depend on the chest anchor, shoulders, or body position. The core trigger is hand gesture only: both hands close together, then pulled apart.

Requirements:
1. Detect left-hand and right-hand centers.
2. Smooth both hand positions.
3. Compute hand midpoint, hand distance, hand distance velocity, and hand direction vector.
4. Detect when both hands are close together anywhere in the visible camera frame.
5. Detect when both hands continuously move apart after being close.
6. Add states: `CameraReady`, `EmptyIdle`, `HandsClosed`, and `PullArmed`.
7. Show debug values for left hand, right hand, hand midpoint, hand distance, distance velocity, current state, both-hands-visible, and lost-hand hold.
8. Keep the AR scene empty. Do not render the solar system yet.

Constraints:
- Do not use chest anchor, shoulder landmarks, or body pose as required conditions for this milestone.
- The gesture must work even if the user raises both hands above the head.
- The gesture must work even if both hands are on the side of the body, as long as both hands are visible.
- Do not implement solar system opening yet; that belongs to the next milestone.
- Do not show any 3D solar content, including sun, planets, orbit rings, nebula, particles, glowing singularity, or any 3D model.
- Keep existing camera and transparent canvas behavior stable.
- Use smoothing and short lost-hand hold to avoid jitter and flickering.

Documentation Sync:
This milestone changes the product requirement from “hands close in front of the chest” to “hands close anywhere in the camera frame”.
After implementation, update:
- `ar_solar_system_prd.md`
- `TODO.md`
- `TODO.zh-CN.md`
- `AGENTS.md` if it contains the old chest-dependent startup rule.

Done when:
- `npm run build` passes.
- The page starts with camera video only and no 3D model.
- The debug panel shows `EmptyIdle` / `HandsClosed` / `PullArmed` state changes.
- Hands closed near the chest can enter `HandsClosed`.
- Hands closed above the head can enter `HandsClosed`.
- Hands closed at the side of the body can enter `HandsClosed`.
- Pulling hands apart from any of those positions can enter `PullArmed`.
- `TODO.md` is updated with implementation status and manual verification notes.
```

## Milestone 4 — 手部吸附拉开展开太阳系

状态：`TODO`

目标：实现第一个高光交互瞬间：用户从空场中用双手把太阳系拉开。

任务：

- [ ] 添加 `SolarOpening` 和 `SolarActive` 状态。
- [ ] 从 `PullArmed` 状态检测双手分离移动。
- [ ] 根据手距计算 `openProgress`。
- [ ] 限制并平滑 `openProgress`。
- [ ] 防止手距停止增加后自动展开完成。
- [ ] 构建包含太阳、简化轨道和天体的初始太阳系 group。
- [ ] 在展开开始前，让所有太阳系 3D 物体保持不可见。
- [ ] 展开期间，将视觉左右端点绑定到左右手。
- [ ] 根据 `openProgress` 渐进显示太阳、轨道、天体、星尘和星云。
- [ ] 展开完成后，将太阳系放置在胸前锚点附近。
- [ ] 添加 `openProgress`、起始距离、目标距离和状态的调试值。

验收标准：

- [ ] 有效拉开手势之前，没有可见 3D 太阳内容。
- [ ] 在 hand-only `PullArmed` 状态后拉开双手会开始展开。
- [ ] 展开宽度/进度明显跟随手距。
- [ ] 如果双手暂停，展开保持而不是自动播放到 100%。
- [ ] 展开端点明显跟随双手。
- [ ] 完成后，太阳系悬浮在胸前锚点附近。
- [ ] 触发失败不会造成闪烁或随机出现部分太阳物体。
- [ ] `npm run build` 通过。
- [ ] 行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 4: hand-attached pull-open solar system.

Context:
Read @ar_solar_system_prd.md sections 5.2, 5.3, 7.4, 8.3, and 17.

Constraints:
- Initial state must remain empty until opening starts.
- Opening progress must be controlled by hand distance, not a fixed timeline.
- Opening endpoints must visually attach to both hands.
- Do not implement grab logic yet.

Done when:
- EmptyIdle -> HandsClosed -> PullArmed -> SolarOpening -> SolarActive works.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 5 — 太阳系缩放和空间旋转

状态：`TODO`

目标：让双手控制已展开太阳系的大小和 3D 朝向。

任务：

- [ ] 在进入 `SolarActive` 时计算基准手距。
- [ ] 将手距映射为太阳系缩放。
- [ ] 将缩放限制在实用范围内，初始约为 `0.6x` 到 `2.5x`。
- [ ] 平滑缩放变化。
- [ ] 在映射后的 3D 空间中计算双手控制向量。
- [ ] 实现 quaternion 或 arcball 风格的旋转映射。
- [ ] 使用 slerp 平滑旋转。
- [ ] 让轨道平面可见地在 3D 中倾斜。
- [ ] 防止快速翻转或失控旋转。
- [ ] 添加缩放和旋转状态的调试值。

验收标准：

- [ ] 双手拉远会放大太阳系。
- [ ] 双手靠近会缩小太阳系。
- [ ] 扭动或改变双手相对姿态会让太阳系产生 3D 倾斜/旋转。
- [ ] 旋转明显不是单纯的屏幕平面 2D 旋转。
- [ ] 操控太阳系时，胸前锚定仍然有效。
- [ ] `npm run build` 通过。
- [ ] 行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 5: two-hand scaling and 3D spatial rotation of the active solar system.

Context:
Read @ar_solar_system_prd.md sections 5.4, 7.5, 7.6, 12.3, and 12.4.

Constraints:
- Use quaternion, arcball, or equivalent 3D rotation logic.
- Do not fake rotation with only screen-plane 2D rotation.
- Keep rotation and scale smoothed.
- Do not add planet grab logic yet.

Done when:
- Scaling and 3D rotation can be inspected in browser.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 6 — 天体数据模型和九个可抓取目标

状态：`TODO`

目标：为所有 MVP 可抓取天体创建统一的数据驱动模型。

任务：

- [ ] 为水星、金星、地球、火星、木星、土星、天王星、海王星和月球定义 `CelestialBodyId`。
- [ ] 定义天体元数据：名称、标签、近似视觉尺寸、轨道半径、轨道速度、自转速度、颜色/占位纹理、命中半径、父级天体（如有）。
- [ ] 为每个天体实现简化视觉模型。
- [ ] 添加可识别的土星环。
- [ ] 让月球默认围绕地球运行。
- [ ] 将所有天体保存在一个 registry 中，供渲染、hover、grab、detach 和 return 逻辑使用。
- [ ] 添加可在 hover/grab 时显示的标签。
- [ ] 添加原始轨道 transform 数据，以支持返回行为。
- [ ] 确保没有为每个行星编写重复的一次性抓取逻辑。

验收标准：

- [ ] 九个 MVP 天体都由同一个数据模型表示。
- [ ] 太阳系展开后，天体在简化轨道上渲染。
- [ ] 月球与地球视觉上可区分。
- [ ] 土星有明确的环。
- [ ] 返回轨道逻辑可获取原始轨道位置/层级数据。
- [ ] `npm run build` 通过。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 6: data-driven celestial body model for nine MVP grabbable bodies.

Context:
Read @ar_solar_system_prd.md sections 7.7, 8.2, and 17.

Constraints:
- Use one shared celestial body model and registry.
- Include Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon.
- Keep visuals lightweight and MVP-friendly.
- Do not implement full grab interaction yet unless needed for data hooks.

Done when:
- All nine bodies render after opening.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 7 — Hover、高亮和 Pinch 抓取

状态：`TODO`

目标：让用户的手可以选择并抓取九个 MVP 天体中的任意一个。

任务：

- [ ] 将每个可抓取天体的 3D 位置投影到屏幕坐标。
- [ ] 计算手到天体的屏幕空间距离。
- [ ] 为水星和月球添加更大的命中区域。
- [ ] 使用迟滞选择最近的有效天体，避免闪烁。
- [ ] 添加 hover 视觉反馈：光环、标签和轨道高亮。
- [ ] 使用拇指/食指距离和手掌尺度检测 pinch start 与 pinch end。
- [ ] 使用不同的 pinch start 和 pinch end 阈值。
- [ ] 实现 `BodyHover` 和 `BodyGrabbed` 转换。
- [ ] 将被抓取天体从轨道动画吸附到手部锚点。
- [ ] 将被抓取天体的位置绑定到手部锚点。
- [ ] 停止被抓取天体的自主公转和自转。
- [ ] 抓取时添加短暂追踪丢失容忍。

验收标准：

- [ ] 手靠近天体时，该天体清楚高亮。
- [ ] 高亮不会在相邻天体之间快速闪烁。
- [ ] 在高亮天体附近 pinch 可以抓取该天体。
- [ ] 被抓取天体吸附并跟随手移动。
- [ ] 被抓取天体在持有期间停止公转和自转。
- [ ] 九个天体都可以高亮并抓取。
- [ ] `npm run build` 通过。
- [ ] 行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 7: hover, highlight, and pinch grab for all nine MVP bodies.

Context:
Read @ar_solar_system_prd.md sections 7.7, 7.8, 7.9, and 12.4.

Constraints:
- Use one unified hover/grab pipeline.
- Only one body can be grabbed at a time.
- Use pinch hysteresis.
- Do not make normal release return to orbit.

Done when:
- All nine bodies can be hovered and grabbed.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 8 — 单体观赏、释放和脱离悬停

状态：`TODO`

目标：支持产品规则：被抓取天体用于观赏，普通释放会让它悬停，而不是返回轨道。

任务：

- [ ] 添加 `BodyDetached` 状态。
- [ ] 普通 pinch 释放时，让天体保持在当前场景位置。
- [ ] 释放后恢复自然自转。
- [ ] 脱离状态下，让天体保持离开原轨道。
- [ ] 在原轨道位置留下弱占位标记或 ghost。
- [ ] 允许再次抓取已脱离天体。
- [ ] 使用第二只手为抓取/脱离观赏添加独立缩放。
- [ ] 使用双手相对运动为被抓取天体添加独立 3D 旋转。
- [ ] 确保单体缩放/旋转不影响整个太阳系。
- [ ] 显示清楚的状态反馈：已抓取、已释放/脱离、可观赏。

验收标准：

- [ ] 持有期间，被抓取天体稳定且冻结。
- [ ] 普通释放不会让天体返回轨道。
- [ ] 释放后的天体停在释放位置附近并自转。
- [ ] 用户可以再次抓取已脱离天体。
- [ ] 用户可以独立缩放并空间旋转该天体。
- [ ] 太阳系其他天体继续正常运动。
- [ ] `npm run build` 通过。
- [ ] 行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 8: grabbed-body inspection, normal release to detached state, and independent body scale/rotation.

Context:
Read @ar_solar_system_prd.md sections 5.5, 7.10, and 7.11.

Constraints:
- Normal release must not return to orbit.
- Detached body remains inspectable and can be grabbed again.
- Independent body manipulation must not affect solar-system scale or rotation.
- Update docs if any interaction mapping changes.

Done when:
- Grab -> inspect -> normal release -> detached hover works.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 9 — 甩出手势和返回轨道

状态：`TODO`

目标：实现明确的“甩出回轨”行为，让脱离天体可以被送回轨道。

任务：

- [ ] 持有天体时追踪近期手部速度。
- [ ] 基于归一化屏幕/场景单位定义甩出速度阈值。
- [ ] 只在 pinch 释放前短时间内出现高速度时检测为甩出意图。
- [ ] 可选：当手部运动方向指向原轨道时，提高甩出置信度。
- [ ] 添加 `BodyReturning` 状态。
- [ ] 将 returning 天体动画回原轨道位置。
- [ ] 添加返回过程中的可见尾迹、光 streak 或光效反馈。
- [ ] 返回时恢复原始天体缩放和父子关系。
- [ ] 返回后恢复原始公转和自转。
- [ ] 确保低速释放仍保持脱离状态。
- [ ] 添加甩出速度和甩出置信度调试值。

验收标准：

- [ ] 普通释放不会让天体返回轨道。
- [ ] 明确甩出释放会让天体返回轨道。
- [ ] 返回动画可见且平滑。
- [ ] 返回后天体恢复原始轨道。
- [ ] 月球能正确回到地月关系。
- [ ] 误触发足够低，可以支持 30-60 秒演示。
- [ ] `npm run build` 通过。
- [ ] 行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 9: throw gesture and return-to-orbit behavior.

Context:
Read @ar_solar_system_prd.md sections 7.11, 7.12, and 13.

Constraints:
- Normal release must remain detached.
- Throw return requires clear velocity near release.
- Returning body should restore original scale, orbit layer, and motion.
- Update docs if thresholds or behavior are changed.

Done when:
- Detached body can be thrown back to orbit.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 10 — 视觉打磨、鲁棒性和录制模式

状态：`TODO`

目标：让 Demo 适合录制 30-60 秒演示视频。

任务：

- [ ] 改进太阳光晕、轨道材质和天体可读性。
- [ ] 只在展开开始后添加星尘和星云效果。
- [ ] 添加手部接近反馈，例如小型光环或粒子。
- [ ] 添加返回尾迹效果。
- [ ] 调整胸前锚点、手、缩放、旋转、pinch 和甩出的平滑参数。
- [ ] 针对常见笔记本摄像头构图调整触发阈值。
- [ ] 如果 FPS 不稳定，减少粒子数量或后处理。
- [ ] 添加隐藏调试 UI 的 presentation/recording mode。
- [ ] 添加弱光、姿态缺失或手部缺失时的 fallback 引导。
- [ ] 测试完整 30-60 秒流程。

验收标准：

- [ ] 观众能理解太阳系是从双手之间被拉出来的。
- [ ] 观众能理解太阳系悬浮在用户胸前。
- [ ] 缩放和旋转看起来具有空间感。
- [ ] 抓取、释放、脱离悬停和返回都在视觉上清楚。
- [ ] Demo 在普通笔记本上以可用帧率运行。
- [ ] 录制模式隐藏调试杂物。
- [ ] `npm run build` 通过。
- [ ] 完整流程已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 10: polish, robustness, and recording mode for a 30-60 second demo.

Context:
Read @ar_solar_system_prd.md sections 8, 13, 15, 16, and 17.

Constraints:
- Do not break the core interaction loop.
- Do not show 3D content in initial empty scene.
- Tune performance before adding heavy effects.
- Keep debug mode available but hidden for recording.

Done when:
- Full demo flow can be recorded cleanly.
- npm run build passes.
- TODO.md is updated.
```

## 跨里程碑工程任务

状态：`TODO`

- [ ] 为关键点、手部状态、姿态状态、交互状态、天体和天体生命周期状态定义共享 TypeScript 类型。
- [ ] 为手势阈值创建命名常量。
- [ ] 创建调试状态 store，使调试 UI 不直接依赖内部类。
- [ ] 保持帧循环性能稳定，避免不必要的逐帧分配。
- [ ] 添加摄像头权限错误 UI。
- [ ] 在 README 中添加人工测试清单。
- [ ] MVP 可用后，添加截图或短 GIF 说明。

## 人工测试脚本

对涉及摄像头或手部追踪的每个里程碑进行人工验证时，使用此脚本。

1. 在浏览器中打开 Web Demo。
2. 点击 `开启摄像头`。
3. 确认只显示摄像头画面和极简 2D UI。
4. 站在摄像头画面中央。
5. 将双手/双拳在摄像头可见画面任意位置合拢。
6. 向两侧拉开双手，观察启动状态是否从 `HandsClosed` 进入 `PullArmed`；在后续里程碑中，再观察太阳系是否在双手之间展开。
7. 中途暂停双手，确认展开不会自动完成。
8. 完成展开，确认太阳系悬浮在胸前附近。
9. 身体轻微左右移动，确认太阳系平滑跟随。
10. 双手拉远/靠近，确认缩放变化。
11. 扭动双手，确认可见 3D 旋转。
12. 依次 hover 每个可抓取天体，确认标签/光晕。
13. Pinch 抓取天体，确认它吸附到手并冻结。
14. 普通释放，确认它保持脱离并自转。
15. 再次抓取并甩出释放，确认它回到轨道。
16. 用月球和土星重复测试。
17. 运行录制模式，确认 debug UI 已隐藏。

## 实现过程中待解决的问题

这些问题不应阻塞早期里程碑，但 Codex 应在解决时记录决策。

- [x] MediaPipe Tasks Vision 的具体包选择和加载策略。决策：使用 `@mediapipe/tasks-vision@0.10.35`，wasm 从匹配版本的 jsDelivr package 路径加载，MVP 阶段使用 Google 官方托管的 lite pose 和 float16 hand `.task` 模型。
- [x] 使用纯 TypeScript 模块还是添加 React。决策：初始 Web Demo 使用纯 TypeScript 模块。
- [ ] MediaPipe 关键点坐标到 Three.js 场景坐标的具体映射。
- [ ] 真实摄像头测试后的最终 pinch 阈值。
- [ ] 真实摄像头测试后的最终甩出速度阈值。
- [ ] 脱离天体应保持在太阳系平面前方，还是保留释放深度。
- [ ] 原轨道占位标记应该多明显。
- [ ] 标签使用中文名、英文名，还是双语。

## 延后 / Post-MVP 想法

在 MVP 闭环可用且用户明确要求之前，不要实现这些内容。

- [ ] Electron 桌面打包。
- [ ] TouchDesigner、Unity、Unreal 或 XR 迁移。
- [ ] 移动端适配。
- [ ] 真实空间 AR 锚定。
- [ ] 多人交互。
- [ ] 行星信息面板。
- [ ] 太阳系教育模式。
- [ ] 真实天文尺度模式。
- [ ] 真实碰撞物理。
- [ ] 录制/导出管线。
- [ ] 主题预设。

## 变更日志

### 2026-06-21 — Milestone 3 启动手势改为纯双手并实现

- 变更需求：启动手势现在只使用双手在摄像头可见画面任意位置合拢并拉开；不得依赖胸前锚点、肩膀或身体姿态。
- 任务状态变更：Milestone 2 标记为 `DONE`；Milestone 3 标记为 `NEEDS_MANUAL_VERIFY`。
- 实现 `HandsClosed` 和纯双手 `PullArmed` 检测，使用平滑手部中心、双手中点、方向向量、距离、距离速度和短暂丢手保持。
- 添加调试值：左/右手 x/y、中点、方向、手距速度、双手是否可见、丢手保持是否激活。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`index.html`、`src/main.ts`、`src/utils/types.ts`、`src/interaction/stateMachine.ts`、`src/interaction/handStartupGesture.ts`、`src/tracking/smoothing.ts` 和 `src/rendering/debugOverlay.ts`。
- 剩余不明确项：需要人工摄像头验证胸前、头顶和身体侧边的合拢到拉开手势；真实测试后可能需要调阈值。

### 2026-06-21 — 实现 Milestone 2 MediaPipe 追踪基础

- 任务状态变更：Milestone 1 在用户验收后标记为 `DONE`；Milestone 2 标记为 `NEEDS_MANUAL_VERIFY`。
- 添加 `@mediapipe/tasks-vision@0.10.35`，并通过独立 `tracking/` 模块加载 MediaPipe Pose Landmarker 和 Hand Landmarker。
- 实现平滑肩部关键点、左右手摘要、手部中心、手腕、拇指指尖、食指指尖、手掌尺度、归一化坐标、调试检测状态，以及仅 debug 模式显示的关键点 overlay。
- 影响文件：`package.json`、`package-lock.json`、`index.html`、`src/main.ts`、`src/styles.css`、`src/utils/types.ts`、`src/tracking/`、`src/rendering/debugOverlay.ts`、`src/rendering/landmarkOverlay.ts`、`TODO.md` 和 `TODO.zh-CN.md`。
- 剩余不明确项：真实摄像头 pose/hand 检测、左右手标签和关键点 overlay 对齐仍需在浏览器中使用摄像头和外部 MediaPipe model/CDN 访问进行人工验证。

### 2026-06-21 — 新增中文 TODO 阅读镜像

- 变更需求：保持 `TODO.zh-CN.md` 与 `TODO.md` 同步，作为仅供用户阅读的中文镜像；Codex 和未来 agents 必须继续以英文 `TODO.md` 作为权威任务板。
- 已将镜像规则加入文档同步协议和 Definition of Done。
- 影响文件：`AGENTS.md`、`TODO.md` 和 `TODO.zh-CN.md`。
- 剩余不明确项：无。

### 2026-06-21 — 修复摄像头预览比例和调试指标

- 变更需求：摄像头预览必须使用 16:9 预览舞台和 `object-fit: contain` 保留完整 16:9 画面；不得使用 `cover` 裁切，也不得将画面强制放入接近正方形的视口。
- 已实现匹配尺寸的视频、透明 Three.js canvas 和预览 overlay，使未来手势坐标共享同一显示图像基准。
- 添加临时调试指标：视频源尺寸、显示尺寸、显示比例、`object-fit`、canvas 显示尺寸、canvas buffer 尺寸和 overlay 尺寸。
- 影响文件：`index.html`、`src/styles.css`、`src/main.ts`、`src/rendering/scene.ts`、`src/rendering/debugOverlay.ts`、`src/utils/types.ts`、`ar_solar_system_prd.md`、`AGENTS.md`、`README.md` 和 `TODO.md`。
- 剩余不明确项：仍需在 Chrome 中开启摄像头权限后进行真实摄像头构图的人工浏览器验证。

### 2026-06-21 — Milestone 0 完成，Milestone 1 等待人工摄像头验证

- 任务状态变更：Milestone 0 标记为 `DONE`；Milestone 1 标记为 `NEEDS_MANUAL_VERIFY`。
- 添加 Vite + TypeScript + Three.js Web Demo 结构、本地脚本和 README 运行/人工测试说明。
- 实现摄像头权限流程、镜像视频预览层、透明空 Three.js canvas 和默认隐藏的调试面板。
- 在 npm audit 报告 dev-server 依赖漏洞后，将 Vite 升级到 `8.0.16`；现在 `npm audit` 报告 0 个漏洞。
- 影响文件：`package.json`、`package-lock.json`、`index.html`、`README.md`、`tsconfig.json`、`vite.config.ts`、`src/` 和 `TODO.md`。
- 剩余不明确项：真实摄像头权限、视频构图和浏览器 console 行为仍需在带摄像头的机器上进行人工浏览器验证。

### 2026-06-21 — 创建初始 Codex 工作文档

- 基线 PRD：v0.2，日期 2026-06-20。
- 创建 `AGENTS.md` 作为长期 Codex 指南。
- 创建 `TODO.md` 作为里程碑任务板。
- 锁定 Web Demo 为第一交付目标。
- 添加文档同步规则：当需求细化并被视为已对齐时，Codex 必须在声称完成前按适用情况更新 `ar_solar_system_prd.md`、`TODO.md` 和/或 `AGENTS.md`。
