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
- [ ] 如果变更影响需求、TODO 状态、agent 工作流或工具使用上下文，更新私有 `agent-companion-repo` 伴生仓库。
- [ ] 在本文件底部的变更日志中增加一条记录。
- [ ] 在 Codex 最终回复中提到已变更的文档。

## 当前不可妥协的产品规则

- [ ] Web Demo 优先。
- [ ] 初始 AR 场景为空：在拉开手势之前，不显示 3D 太阳、行星、轨道、星云、奇点、星尘或装饰性 3D 物体。
- [ ] 太阳系只在用户双手/双拳在摄像头可见画面任意位置合拢并向两侧拉开之后出现。
- [ ] 只合拢双手/双拳本身不会播放任何太阳系动画，也不会显示 3D 内容。
- [ ] 展开进度由手距驱动；如果手停住，不应自动展开完成。
- [ ] 展开端点需要视觉上跟随双手。
- [ ] 展开后的太阳系可以使用身体相对参考来增强 AR 感，但松手后可以悬停在用户选择的任意位置。
- [ ] 松开整体双手控制后，太阳系保持悬浮在最后稳定 transform。
- [ ] 双手重新扶住左右端点后，可以继续控制整个太阳系。
- [ ] 双手缩放会改变太阳系大小，包括掌心朝前、像左右推拉玻璃窗一样移动。
- [ ] 已展开状态下，双手扶住端点向内合拢会让太阳系反向收起，并在完全合拢后回到空摄像头画面。
- [ ] 双手空间旋转应产生可见的 3D 倾斜和深度，而不只是 2D 旋转，包括掌心朝上的轻微旋转。
- [ ] MVP 中水星、金星、地球、火星、木星、土星、天王星、海王星和月球均可抓取。
- [ ] Pinch 抓取会将选中的天体吸附到手上，并冻结其自主运动。
- [ ] 普通释放会让天体保持脱离状态，悬浮在释放位置并自转。
- [ ] 甩出释放会让天体返回原始轨道。
- [ ] 当需求或已完成范围变化时，文档必须更新；每当 `TODO.md` 变化时，也必须同步更新 `TODO.zh-CN.md`。
- [ ] 每当主代码仓库提交，或 agent 工作流上下文变化时，私有 `agent-companion-repo` 伴生仓库也必须更新。

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
- [x] 当双手/双拳重叠导致一只手短时间丢失时，只基于最近有效的双手合拢证据进行容错。
- [x] 添加宽限窗口，避免 `HandsClosed` 和 `PullArmed` 在慢速起步、短暂停顿或短暂遮挡时闪烁。
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
- [x] 如果双手紧贴导致 MediaPipe 短暂丢失一只手，应用会保留最近有效的双手证据，而不是立刻闪回空闲状态。
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

## Milestone 3.5 — 接入 3D 前的整体太阳系交互合同

状态：`NEEDS_MANUAL_VERIFY`

目标：在添加可见太阳系 3D 内容之前，锁定并调试整体太阳系的交互语义。这个里程碑在 MediaPipe 关键点和未来太阳系控制器之间定义一层协议，用 debug-only 信号暴露松手、重新扶住、缩放、反向收起和旋转意图，但不得渲染太阳、行星、轨道环、星云、粒子、奇点或任何 3D 模型。

任务：

- [x] 定义协议层：`MediaPipe landmarks -> HandFrame -> WholeSystemIntent -> future SolarSystemController`。
- [x] 定义整体太阳系生命周期状态：`Inactive`、`VirtualOpeningHandle`、`SolarHandleControl`、`ReleaseCandidate`、`SolarFreeHover`、`ReGripCandidate` 和 `SolarClosing`。
- [x] 定义主要松手判断：双手完全张开，手部 open-hand 分数足够高、伸展手指数量足够、grip-pose 分数足够低。
- [x] 一旦张开手松手被接受，立即锁存释放：冻结端点、撤手期间阻止重新扶住，并且只有双手明确离开后再回到冻结端点附近，才允许重新扶住。
- [x] 进入 `ReleaseCandidate` 前，要求张开手松手证据稳定持续一小段时间；单帧 release 抖动不能让控制脱手。
- [x] 当掌心朝上的微弯托举手仍在端点附近时，托住/旋转意图优先于松手。
- [x] 在冻结端点周围使用更宽容的重新扶住磁吸区，成功后把虚拟端点吸回当前双手。
- [x] 保留端点不匹配、双手完全丢失或整体控制置信度过低作为兜底松手信号。
- [x] 定义重新扶住判断：双手回到冻结的视觉左/右虚拟端点附近，不要求 pinch 单个行星。
- [x] 定义由手距速度驱动的缩放意图；当双掌看起来朝向摄像头时，提高缩放置信度。
- [x] 定义反向收起意图：整体控制状态下双手向内移动，并且手距接近闭合阈值。
- [x] 定义掌心朝上的轻微旋转和掌心法线变化作为 3D 旋转意图信号，并在 debug 中区分 2D/3D 旋转意图。
- [x] 定义 MediaPipe 手部关键点中的掌心朝向基础量：手腕、食指掌指关节、中指掌指关节、小指掌指关节、掌心法线、朝向摄像头分数、朝上分数。
- [x] 掌心朝向只作为意图置信度加分，不作为硬性门槛。
- [x] 通过早期 pinch penalty，使整体太阳系控制与未来单个行星 pinch 抓取意图区分。
- [x] 添加 debug-only 视觉左/视觉右虚拟端点和端点匹配状态；这些只是 2D 调试标记，不是 3D 太阳系内容。
- [x] 添加整体控制状态、控制/松手/重新扶住置信度、缩放/旋转/收起意图、掌心法线、掌心分数、open-hand/grip-pose 分数、松手锁、释放稳定时长、松手阻止原因、握持保护状态、重新扶住原因和虚拟端点的 debug 字段。
- [x] 在 Debug 按钮左侧添加简短中文交互状态说明，展示当前系统理解的意图、原因和核心参数。
- [x] 在验证这个交互合同时，AR 场景视觉上保持空场。

验收标准：

- [x] 文档状态模型区分 `SolarOpening`、`SolarFreeHover`、`SolarHandleControl` 和 `SolarClosing`。
- [x] 松手表示未来太阳系会保持最后稳定的位置、缩放和朝向，而不是吸回胸前锚点或屏幕中心。
- [x] 已接受的张开手松手会冻结端点，并防止用户慢慢撤手时立刻重新扶住。
- [x] 掌心朝上的托举旋转会保持 `SolarHandleControl`，不会被误判为松手。
- [x] 重新扶住可以通过更宽容的磁吸区恢复，不要求用户精确重新对齐身体或摄像头位置。
- [x] 重新扶住表示双手回到视觉左/右端点附近后，可以不 pinch 就继续整体控制。
- [x] 掌心朝前左右推拉被定义并调试为缩放意图置信度加分。
- [x] 已展开状态下，双手扶住端点向内合拢被定义并调试为反向收起，而不仅是普通缩小。
- [x] 反向收起完成后，回到初始空摄像头画面。
- [x] 掌心朝上轻轻旋转和掌心法线变化被定义并调试为 3D 旋转意图。
- [x] Debug 面板暴露整体太阳系协议值，且不渲染太阳系 3D 内容。
- [x] 右上角中文状态说明能解释系统当前认为用户是在等待、握住、旋转、松手、悬浮、重新扶住、缩放还是收起，并显示该判断背后的核心参数。
- [x] Debug overlay 只可在 debug 模式下显示 2D 虚拟端点标记。
- [x] `npm run typecheck` 通过。
- [x] `npm run build` 通过。
- [ ] 真实摄像头验证确认 debug 值足够清晰且稳定，可以开始 Milestone 4。
- [x] 在 Milestone 4 开始前，`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md` 和 `AGENTS.md` 已对齐。
- [x] 状态保持为 `NEEDS_MANUAL_VERIFY`，直到用户确认 Milestone 3.5 checklist 通过。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 3.5: debug-only whole-system interaction protocol before adding 3D solar content.

Context:
Read @AGENTS.md, @TODO.md, and @ar_solar_system_prd.md.
Do not start Milestone 4 yet.

Constraints:
- Do not render solar-system 3D content.
- Keep the initial AR scene empty.
- Keep startup hand-only.
- Separate whole-system control from individual planet pinch-grab.
- Palm orientation should boost confidence, not act as a hard gate.
- Virtual endpoints may be shown only as debug-only 2D markers.

Done when:
- Release/re-grip/scale/reverse-collapse/rotation intent values are visible in the debug panel.
- No sun, planet, orbit, nebula, particle, singularity, or 3D model appears.
- npm run typecheck and npm run build pass.
- TODO.md and TODO.zh-CN.md are updated.
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
- [ ] 支持已展开端点双手向内移动时的反向进度。
- [ ] 构建包含太阳、简化轨道和天体的初始太阳系 group。
- [ ] 在展开开始前，让所有太阳系 3D 物体保持不可见。
- [ ] `HandsClosed` 保持视觉静止，不播放太阳系动画，也不显示 3D 内容。
- [ ] 展开期间，将视觉左右端点绑定到左右手。
- [ ] 根据 `openProgress` 渐进显示太阳、轨道、天体、星尘和星云。
- [ ] 展开完成后，将太阳系放置在双手拉开的当前位置，可选使用身体相对参考增强 AR 感。
- [ ] 当反向收起达到闭合阈值时，隐藏全部太阳系内容并回到 `EmptyIdle`。
- [ ] 整体双手控制松开后，保持最后稳定的太阳系 transform，不重新居中。
- [ ] 添加 `openProgress`、起始距离、目标距离和状态的调试值。

验收标准：

- [ ] 有效拉开手势之前，没有可见 3D 太阳内容。
- [ ] 在 hand-only `PullArmed` 状态后拉开双手会开始展开。
- [ ] 展开宽度/进度明显跟随手距。
- [ ] 如果双手暂停，展开保持而不是自动播放到 100%。
- [ ] 展开端点明显跟随双手。
- [ ] 完成后，太阳系出现在双手拉开的位置，而不是被强制吸到胸前或屏幕中心。
- [ ] 双手松开后，太阳系悬浮停留在松手位置。
- [ ] 双手扶住端点向内移动时，太阳系反向收起。
- [ ] 收起完成后，画面回到只有摄像头视频和 2D UI 的空场。
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
- [ ] 当双手回到左右端点附近时，检测整体太阳系重新扶住。
- [ ] 将手距映射为太阳系缩放。
- [ ] 区分普通缩小和接近闭合阈值时的反向收起意图。
- [ ] 将掌心朝前、左右推拉移动识别为缩放意图。
- [ ] 将缩放限制在实用范围内，初始约为 `0.6x` 到 `2.5x`。
- [ ] 平滑缩放变化。
- [ ] 在映射后的 3D 空间中计算双手控制向量。
- [ ] 估算掌心朝向或等价手部姿态，用于掌心朝前和掌心朝上意图。
- [ ] 实现 quaternion 或 arcball 风格的旋转映射。
- [ ] 将掌心朝上的轻微旋转识别为整体 3D 旋转意图。
- [ ] 使用 slerp 平滑旋转。
- [ ] 让轨道平面可见地在 3D 中倾斜。
- [ ] 防止快速翻转或失控旋转。
- [ ] 添加缩放和旋转状态的调试值。

验收标准：

- [ ] 双手拉远会放大太阳系。
- [ ] 双手靠近会缩小太阳系。
- [ ] 掌心朝前、左右推拉移动会像推拉玻璃窗一样缩放太阳系。
- [ ] 双手扶住端点足够靠近时，可以进入反向收起并回到空场。
- [ ] 扭动或改变双手相对姿态会让太阳系产生 3D 倾斜/旋转。
- [ ] 掌心朝上轻轻旋转会让太阳系产生 3D 旋转。
- [ ] 旋转明显不是单纯的屏幕平面 2D 旋转。
- [ ] 身体相对参考可以辅助初始 AR 感，但操控和自由悬浮由释放/控制 transform 决定。
- [ ] 松开整体双手控制后，当前 transform 保持稳定。
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
- [ ] 调整身体参考、手、缩放、旋转、pinch 和甩出的平滑参数。
- [ ] 针对常见笔记本摄像头构图调整触发阈值。
- [ ] 如果 FPS 不稳定，减少粒子数量或后处理。
- [ ] 添加隐藏调试 UI 的 presentation/recording mode。
- [ ] 添加弱光、姿态缺失或手部缺失时的 fallback 引导。
- [ ] 测试完整 30-60 秒流程。

验收标准：

- [ ] 观众能理解太阳系是从双手之间被拉出来的。
- [ ] 观众能理解太阳系是一个可由双手控制并停在松手位置的自由悬浮物体。
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
- [x] 创建私有伴生仓库 `<private-companion-repo>`，用于 Codex 交互日志、TODO 更新记录和 agent 工作流上下文。
- [x] 添加 `npm run sync:agent:push` 和版本化 `post-commit` hook，使每次主仓库提交都能同步伴生仓库。

## 人工测试脚本

对涉及摄像头或手部追踪的每个里程碑进行人工验证时，使用此脚本。

人工验收交接规则：

- 对于每个需要用户人工验收的里程碑，Codex 必须提供一份单独给用户使用的 checklist。
- checklist 的每一项都必须写清楚：用户要做什么动作、看哪里、什么结果算通过。
- 在用户明确说 checklist 通过之前，里程碑保持 `NEEDS_MANUAL_VERIFY`。
- 如果任何 checklist 项失败或不清楚，保持里程碑未完成，并继续调整行为、阈值或 checklist。

1. 在浏览器中打开 Web Demo。
2. 点击 `开启摄像头`。
3. 确认只显示摄像头画面和极简 2D UI。
4. 站在摄像头画面中央。
5. 将双手/双拳在摄像头可见画面任意位置合拢。
6. 向两侧拉开双手，观察启动状态是否从 `HandsClosed` 进入 `PullArmed`；在后续里程碑中，再观察太阳系是否在双手之间展开。
7. 中途暂停双手，确认展开不会自动完成。
8. 完成展开，确认太阳系出现在双手拉开的位置，并且之后可以停在松手位置。
9. 身体轻微左右移动，确认太阳系平滑跟随。
10. 双手拉远/靠近，确认缩放变化。
11. 扭动双手，确认可见 3D 旋转。
12. 依次 hover 每个可抓取天体，确认标签/光晕。
13. Pinch 抓取天体，确认它吸附到手并冻结。
14. 普通释放，确认它保持脱离并自转。
15. 再次抓取并甩出释放，确认它回到轨道。
16. 用月球和土星重复测试。
17. 运行录制模式，确认 debug UI 已隐藏。

### Milestone 3 人工验收 Checklist

用这份清单验证“纯双手合拢到拉开”的启动状态。

| 项目 | 你要做的动作 | 看哪里 | 通过标准 |
|---|---|---|---|
| 初始空场 | 打开页面，点击 `开启摄像头`，等待 tracking 加载完成。 | 摄像头预览和 Debug 面板。 | 画面只显示摄像头视频和 2D UI/debug。没有太阳、行星、轨道、星云、粒子、奇点或任何 3D 模型。摄像头开启后 Debug 的 `Startup state` 为 `EmptyIdle`。 |
| Debug 值可见 | 点击 `Debug`，让两只手都出现在画面里。 | Debug 面板。 | 能看到 `Left center`、`Right center`、`Both hands`、`Hand midpoint`、`Hand distance`、`Distance velocity`。两只手都被识别时，`Both hands` 显示 `visible`。 |
| 胸前 HandsClosed | 双手/双拳在胸前靠近并短暂停住。 | Debug 面板里的 `Startup state`。 | `Startup state` 变成 `HandsClosed`。画面不出现任何 3D 太阳系内容。 |
| 胸前 PullArmed | 从胸前合拢状态开始，双手向两侧拉开。 | Debug 面板里的 `Startup state`、`Hand distance`、`Distance velocity`。 | `Startup state` 变成 `PullArmed`；拉开过程中 `Hand distance` 增大。画面不出现任何 3D 太阳系内容。 |
| 合拢遮挡容错 | 双手/双拳非常靠近，让关键点 overlay 可能短时间只显示一只手，然后保持合拢姿势。 | Debug 面板里的 `Both hands`、`Lost-hand hold` 和 `Startup state`。 | 如果刚刚已经检测到双手合拢，短时间单手丢失时 `Lost-hand hold` 显示 `active`，`Startup state` 保持或进入 `HandsClosed`，而不是快速闪回 `EmptyIdle`。 |
| 头顶 HandsClosed | 双手举到头顶，在头顶合拢并短暂停住，保证两只手都在画面内。 | Debug 面板里的 `Startup state`。 | `Startup state` 变成 `HandsClosed`。这个动作不需要把手移到胸前。 |
| 头顶 PullArmed | 从头顶合拢状态开始，双手向两侧拉开。 | Debug 面板里的 `Startup state`、`Hand distance`、`Distance velocity`。 | `Startup state` 变成 `PullArmed`；`Hand distance` 增大。画面不出现任何 3D 太阳系内容。 |
| 身体侧边 HandsClosed | 双手移动到身体一侧，在侧边合拢并短暂停住，保证两只手都在画面内。 | Debug 面板里的 `Startup state`。 | `Startup state` 变成 `HandsClosed`。这个动作不需要把手移到胸前。 |
| 身体侧边 PullArmed | 从侧边合拢状态开始，双手向两侧拉开。 | Debug 面板里的 `Startup state`、`Hand distance`、`Distance velocity`。 | `Startup state` 变成 `PullArmed`；`Hand distance` 增大。画面不出现任何 3D 太阳系内容。 |
| 短暂丢手保持 | 在 `HandsClosed` 或 `PullArmed` 状态下，短暂遮住一只手，小于约 2 秒，再露出来。 | Debug 面板里的 `Lost-hand hold` 和 `Startup state`。 | `Lost-hand hold` 会显示 `active`，短时间丢手不会立刻造成启动状态乱跳。 |
| 丢手回空闲 | 遮住一只或两只手超过约 2.5 秒。 | Debug 面板里的 `Both hands`、`Lost-hand hold`、`Startup state`。 | `Both hands` 变成 `missing`；`Lost-hand hold` 变成 `inactive`；`Startup state` 回到 `EmptyIdle` 或其他合适空闲状态。 |
| 拉开停止回空闲 | 进入 `PullArmed` 后，不再继续拉开，双手保持不动。 | Debug 面板里的 `Startup state` 和 `Distance velocity`。 | 短暂停顿后，`Startup state` 回到 `EmptyIdle` 或其他合适空闲状态。 |
| 启动状态无 3D 内容 | 重复任意 `HandsClosed` 或 `PullArmed` 测试。 | 摄像头预览。 | 进入 `HandsClosed` 或 `PullArmed` 时，绝不会显示太阳系内容。 |

### Milestone 3.5 人工验收清单

用这份清单验证 Milestone 4 之前的 debug-only 整体太阳系交互协议。

| 项目 | 用户动作 | 观察位置 | 通过条件 |
|---|---|---|---|
| M3.5 空场 | 打开页面，点击 `开启摄像头`，打开 `Debug`，先不要把手放进画面。 | 摄像头预览、Debug 面板和 debug overlay。 | 摄像头预览不出现 3D 太阳、行星、轨道、星云、粒子、奇点或模型。`Whole control` 显示 `Inactive`。 |
| 右上角状态说明 | 保持 `Debug` 打开或关闭，执行任意 M3.5 手势动作。 | `Debug` 按钮左侧的小中文状态面板。 | 面板显示中文标题、状态、原因和核心参数。标题应与当前动作意图一致，例如等待、握住、旋转、松手、悬浮、重新扶住、缩放或收起。 |
| 拉开后协议启动 | 双手在画面任意位置合拢，然后拉开，直到 `Startup state` 进入 `PullArmed`。 | Debug 面板里的 `Whole control`、`Control confidence` 和 2D 端点圆圈。 | `Whole control` 从 `Inactive` 变为 `VirtualOpeningHandle`，随后变为 `SolarHandleControl`。只有打开 `Debug` 时，双手附近会出现两个小的 2D 调试端点圆圈。 |
| 掌心朝向数值 | 保持双手可见，慢慢把掌心转向摄像头、转到侧面、再转成朝上。 | Debug 面板里的 `Visual L palm normal`、`Visual R palm normal`、`Visual L palm facing/up` 和 `Visual R palm facing/up`。 | 掌心法线数值持续更新。facing/up 分数保持在 `0.00-1.00` 范围，并且会随掌心方向变化而明显变化。 |
| 微弯手保持抓住 | 当 `Whole control` 为 `SolarHandleControl` 时，双手保持微微弯曲，像握住两个把手。 | Debug 面板里的 `Visual L open/grip`、`Visual R open/grip`、`Grip hold`、`Release stable`、`Release gesture` 和 `Whole control`。 | `Grip hold` 显示 `yes`，`Release stable` 基本保持在 `0ms` 附近，`Release gesture` 保持 `no`，`Whole control` 保持 `SolarHandleControl`。虚拟端点继续跟随双手。 |
| 掌心朝上托举旋转保持 | 当 `Whole control` 为 `SolarHandleControl` 时，把双掌转成大致朝上，手指微弯，像托住托盘一样，然后轻轻旋转/扭动双手控制柄。 | Debug 面板里的 `Rotation intent`、`Release blocked`、`Grip hold`、`Release stable`、`Release gesture` 和 `Whole control`。 | `Rotation intent` 可以变成 `rotate2d` 或 `rotate3d`；托举过程中 `Release blocked` 应显示 `rotationHold` 或 `cuppedGrip`，`Grip hold` 应显示 `yes`，`Release stable` 不应攒到松手阈值，`Whole control` 应保持 `SolarHandleControl`。 |
| 张开手松手 | 当 `Whole control` 为 `SolarHandleControl` 时，双手五指完全张开并明显伸展，且先停止旋转。看到 `Release stable` 超过约 `280ms`、`Release gesture` 变成 `yes / lock on` 后，慢慢把手收回或放松手指。 | Debug 面板里的 `Visual L open/grip`、`Visual R open/grip`、`Release stable`、`Release blocked`、`Release gesture`、`Whole control` 和 2D 端点圆圈。 | open 分数升高，grip 分数降低，`Release blocked` 显示 `none`，`Release stable` 超过约 `280ms`，`Release gesture` 变成 `yes / lock on`，`Whole control` 进入 `ReleaseCandidate`，随后进入 `SolarFreeHover`。即使慢慢收手时手指放松，端点圆圈也应冻结；在双手先离开冻结端点、再主动回到端点前，`Whole control` 不能跳回 `SolarHandleControl`。 |
| 放大意图 | 当 `Whole control` 为 `SolarHandleControl` 时，双手向两侧拉远。 | Debug 面板里的 `Scale intent`、`Hand distance` 和 `Distance velocity`。 | 向外移动时，`Scale intent` 变为 `scaleUp`，且 `Hand distance` 增大。画面不出现任何 3D 太阳内容。 |
| 缩小意图 | 当 `Whole control` 为 `SolarHandleControl` 时，双手互相靠近，但不要完全合拢。 | Debug 面板里的 `Scale intent`、`Hand distance` 和 `Collapse intent`。 | `Scale intent` 变为 `scaleDown`；`Hand distance` 减小。`Collapse intent` 可能升高，但只要没有靠得很近，不一定需要完成收起。 |
| 反向收起意图 | 从 `SolarHandleControl` 开始，继续让双手向内靠近，直到接近合拢。 | Debug 面板里的 `Whole control` 和 `Collapse intent`。 | `Collapse intent` 向 `1.00` 升高；`Whole control` 可以进入 `SolarClosing`，完全合拢后回到 `Inactive` 附近。画面不出现 3D 内容。 |
| 兜底松手 | 进入 `SolarHandleControl` 后，把双手移出画面或遮住几秒。 | Debug 面板里的 `Whole control`、`Release confidence` 和端点圆圈。 | `Whole control` 先变成 `ReleaseCandidate`，再变成 `SolarFreeHover`。虚拟端点圆圈冻结在最后稳定位置。 |
| 重新扶住冻结端点 | 进入 `SolarFreeHover` 后，先把双手明显移离冻结端点圆圈，再把双手重新放到两个圆圈附近。不应该需要非常精确地重新调整身体或摄像头距离。 | Debug 面板里的 `Release gesture`、`Whole control`、`Re-grip confidence`、`Re-grip reason` 和 `Visual endpoint matched`。 | 双手离开端点后，`Release gesture` 变成 `no / lock off`。双手回到圆圈附近时，`Re-grip reason` 应变成 `endpoint` 或 `wideMagnet`，`Re-grip confidence` 升高，`Whole control` 经过 `ReGripCandidate` 回到 `SolarHandleControl`。 |
| 旋转意图 | 当 `Whole control` 为 `SolarHandleControl` 时，掌心大致朝上或明显不朝摄像头，轻轻旋转/扭动双手形成的控制柄。 | Debug 面板里的 `Rotation intent`、`Rotation intent score`、掌心 facing/up 分数和掌心法线。 | `Rotation intent` 从 `none` 变成 `rotate2d` 或 `rotate3d`；当掌心呈空间姿态或掌心法线变化清楚时，应能出现 `rotate3d`。 |
| 整体控制与 pinch 分离 | 当 `Whole control` 为 `SolarHandleControl` 时，用一只手做 pinch，像未来要抓某颗行星一样。 | Debug 面板里的 `Control confidence`。 | `Control confidence` 应下降，而不是把强 pinch 当成更强的整体太阳系控制。本里程碑不会抓取任何行星。 |

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

### 2026-06-22 — 明确自由悬浮位置规则

- 需求纠正：未来 3D 太阳系不受胸前锚点约束；松手后可以根据最后稳定 transform 悬停在用户选择的任意位置。
- 将肩膀/胸前数据重新定义为可选身体相对参考，只用于初始 AR 感，不作为启动、松手、重新扶住、缩放、旋转或自由悬浮的必要锚点。
- 默认隐藏肩膀 debug 线，并将 Debug 面板中的 `Chest X/Y` 改名为 `Body ref X/Y`，避免暗示太阳系固定在胸前。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`src/rendering/debugOverlay.ts` 和 `src/rendering/landmarkOverlay.ts`。
- 剩余不明确项：未来 M4/M5 实现时，需要决定初始放置中可选身体参考的权重，但不能覆盖双手驱动的自由悬浮规则。

### 2026-06-22 — 新增右上角中文交互状态说明

- 需求细化：下一次人工摄像头测试前，页面应在 Debug 按钮左侧显示当前状态机解释的简短中文说明。
- 新增状态说明条，把 `Startup state` 和 `Whole control` 翻译成人能直接理解的状态，例如等待、握住、旋转、松手、悬浮、重新扶住、缩放和收起。
- 状态说明会显示判断原因和核心参数，方便用户在真实动作意图与系统解释不一致时，精确反馈是哪类判断出了问题。
- 影响文件：`index.html`、`src/main.ts`、`src/styles.css`、`src/rendering/interactionStatusSummary.ts`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md` 和 `ar_solar_system_prd.md`。
- 剩余不明确项：需要真实摄像头测试确认说明文字可读，并且不会遮挡关键手部区域。

### 2026-06-22 — 调整 M3.5 托举/旋转优先级和重新扶住磁吸

- 需求细化：掌心朝上、手指微弯且仍在端点附近时，应理解为托住/旋转，而不是松手；托住/旋转意图优先于缩放/收起，张开手松手最后。
- 调整 release 行为：张开手松手需要稳定持续一小段时间后才进入 `ReleaseCandidate`，降低单帧 release 抖动。
- 调整重新扶住行为：冻结端点周围使用更宽容的磁吸区，重新获得控制后虚拟端点吸回当前双手。
- 添加 debug 字段：释放稳定时长、松手阻止原因、握持保护状态和重新扶住原因；同步更新 M3.5 人工验收清单，覆盖掌心朝上旋转和重新扶住恢复。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`src/interaction/wholeSystemIntent.ts`、`src/rendering/debugOverlay.ts` 和 `src/utils/types.ts`。
- 剩余不明确项：仍需真实摄像头验证 `rotationHold`/`cuppedGrip` 阻止逻辑不会让有意张开手松手变得过难。

### 2026-06-21 — 明确张开手松手锁和 debug 状态命名

- 需求细化：张开手松手一旦被接受，必须立即锁存，冻结虚拟端点，并阻止重新扶住，直到双手先明确离开冻结端点、之后再回到端点附近。
- 明确 debug 命名：`Startup state` 是 Milestone 3 的合拢到拉开启动状态；`Whole control` 是 Milestone 3.5 的整体太阳系协议状态，用来看 `ReleaseCandidate`、`SolarFreeHover`、`ReGripCandidate` 和 `SolarHandleControl`。
- 更新人工验收：`Release gesture` 达到 `yes / lock on` 后，慢慢收手不再粘手成为必须通过的测试项。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`src/interaction/wholeSystemIntent.ts`、`src/rendering/debugOverlay.ts` 和 `src/utils/types.ts`。
- 剩余不明确项：仍需真实摄像头验证释放锁在自然距离清除，同时不会让主动重新扶住变得过严。

### 2026-06-21 — 调整 Milestone 3.5 松手、视觉端点和 rotate3d

- 需求细化：整体太阳系松手应主要使用明确的张开手手势；双手微弯时应继续保持抓住端点。
- 明确 debug 命名：虚拟端点使用镜像摄像头预览中的视觉左/视觉右，不等同于 MediaPipe handedness 的 left/right。
- 放宽并增强 `rotate3d` 检测：使用掌心法线变化和更宽的空间掌心姿态分数，而不是只要求很高的掌心朝上分数。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`src/interaction/wholeSystemIntent.ts`、`src/rendering/debugOverlay.ts` 和 `src/utils/types.ts`。
- 剩余不明确项：需要真实摄像头测试 open-hand/grip-pose 阈值，并确认 `rotate3d` 更容易出现，同时不会影响正常抓住或松手稳定性。

### 2026-06-21 — 实现 Milestone 3.5 整体太阳系协议，用于 debug 验证

- 已将接入 3D 前的整体太阳系交互协议实现为 debug-only 层，位于 MediaPipe 手部数据和未来太阳系控制器之间。
- 添加掌心朝向基础量、虚拟端点、控制/松手/重新扶住置信度、缩放/旋转/反向收起意图值，以及端点匹配 debug 输出。
- 添加 Milestone 3.5 人工验收清单；每个测试项都包含用户动作、观察位置和通过条件。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`src/main.ts`、`src/utils/types.ts`、`src/interaction/stateMachine.ts`、`src/interaction/wholeSystemIntent.ts`、`src/rendering/debugOverlay.ts` 和 `src/rendering/landmarkOverlay.ts`。
- 剩余不明确项：Milestone 4 开始前，需要通过真实摄像头校准掌心 facing/up 分数、虚拟端点命中半径、可见手部松手行为、旋转意图阈值和最终收起阈值。

### 2026-06-21 — 新增反向收起回空场需求

- 需求澄清：在已展开或整体双手控制状态下，双手扶住左右端点向内合拢时，太阳系应按反向展开逻辑收起。
- 收起进度应跟随手距，手停住时收起暂停或保持，完全合拢后回到初始空摄像头画面。
- 将长期状态模型更新为包含 `SolarClosing`，并更新 Milestone 3.5、4、5，以区分普通缩小和有意的反向收起。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md` 和 `ar_solar_system_prd.md`。
- 剩余不明确项：普通缩小和完全收起之间的阈值与迟滞，需要在接入可见 3D 前通过 debug 校准。

### 2026-06-21 — 明确 M4 前整体太阳系交互语义

- 需求澄清：在添加太阳系 3D 内容之前，项目应先锁定整体太阳系交互合同，包括双手合拢不播放动画、双手吸附拉开展开、松手后自由悬浮、通过端点重新扶住、掌心朝前缩放、掌心朝上 3D 旋转。
- 新增 Milestone 3.5，作为 Milestone 4 前的接入 3D 前设计/debug 关口。
- 更新 Milestone 4 和 Milestone 5，使展开、松手、重新扶住、缩放和旋转语义匹配新的长期交互模型。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md` 和 `ar_solar_system_prd.md`。
- 剩余不明确项：掌心朝向阈值和端点命中区域仍需在接入 3D 前通过 debug-only 校准。

### 2026-06-21 — 根据用户录屏调优 Milestone 3 摄像头稳定性

- 真实摄像头录屏显示：双手/双拳紧贴时会出现 `State` 抖动，以及一只手短暂丢失的问题。
- 调整 M3 启动检测：锁存最近有效的双手合拢证据，为 `HandsClosed`/`PullArmed` 增加宽限窗口，稳定双手配对，并略微降低 MediaPipe 手部置信度阈值。
- 更新 M3 人工验收 checklist，新增合拢遮挡容错测试。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`src/interaction/handStartupGesture.ts` 和 `src/tracking/handTracker.ts`。
- 剩余不明确项：需要再次真实摄像头验证新阈值是否稳定，同时确认不会太容易误触发。

### 2026-06-21 — 新增人工验收 checklist 交接规则

- 工作流需求变更：每当里程碑需要用户人工验收时，Codex 必须提供单独 checklist，说明用户动作、观察位置和明确通过标准。
- 添加 Milestone 3 人工验收 checklist，覆盖 `HandsClosed`、`PullArmed`、丢手保持、回空闲行为和无 3D 内容检查。
- 影响文件：`AGENTS.md`、`TODO.md` 和 `TODO.zh-CN.md`。
- 剩余不明确项：无。

### 2026-06-21 — 新增私有 agent 伴生仓库

- 工作流需求变更：创建并维护名为 `agent-companion-repo` 的私有伴生仓库，用于保存 Codex/用户交互记录、TODO 更新记录、agent 工作流/工具决策，以及生成的主项目文档快照。
- 添加同步机制：`npm run sync:agent:push`、`scripts/sync-agent-repo.mjs` 和 `.githooks/post-commit`，使每次主仓库提交都能更新、提交并推送伴生仓库。
- 添加本地工作流规则：主仓库应使用 `core.hooksPath=.githooks`；如果自动同步失败，Codex 必须手动运行同步命令并报告失败。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`package.json`、`scripts/sync-agent-repo.mjs`、`.githooks/post-commit`，以及新的私有伴生仓库 `agent-companion-repo`。
- 剩余不明确项：初始设置无；后续 session 应根据需求或工作流变更的重要性决定每条交互记录的详细程度。

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
