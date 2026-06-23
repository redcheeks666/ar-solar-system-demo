# TODO.zh-CN.md

项目：AR Solar System Webcam Gesture Demo
当前规划基线：PRD v0.5，2026-06-23
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
- [ ] 双手重新扶住左右端点后，可以继续进行整体把手控制，用于放置、松手和收起。
- [ ] 已展开状态下，双手扶住端点向内合拢会让太阳系反向收起，并在完全合拢后回到空摄像头画面。
- [ ] 当前太阳系观察控制以 Milestone 5.5 为准：进入 `SolarFreeHover` 后，单手五指张开放大、收拢缩小、握拳保持复位、推动平移。
- [ ] 掌心朝前“推拉玻璃窗”缩放和掌心朝上整体旋转属于已退役的 M5 旧手势语义；除非用户明确重新启用，否则只保留为历史/debug 协议上下文。
- [ ] MVP 中水星、金星、地球、火星、木星、土星、天王星、海王星和月球均可 hover 并 pinch 激活。
- [ ] 被 pinch 激活的天体停止原轨道公转但保持自然自转；其他天体继续正常公转和自转。
- [ ] 主手 pinch 锁定目标，副手张开/扩张手势进入单颗行星画面。
- [ ] 单颗行星画面中，背景太阳系弱化并锁定交互，但保留基础动效。
- [ ] 当前行星在激活、焦点、缩放、平移、托住跟手、放下悬浮和观赏期间都保持自转。
- [ ] 主手托住 + 副手 `PinchTap` 会解除跟手控制，并让行星悬浮在单颗行星画面中。
- [ ] 明确朝原轨道目标 pinch-and-throw 的手势会让当前行星回轨，并退出回太阳系画面。
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

说明（2026-06-22）：姿态追踪已实现，但通过 `src/tracking/config.ts` 中的 `ENABLE_POSE_TRACKING` 默认关闭，因为肩部/身体数据目前不参与任何交互判定，而姿态模型会抢占手部追踪算力。手部追踪不受影响，调试面板此时显示 `Pose: missing`。当 M4 及以后需要身体相对放置时再开启（开启后按 `POSE_DETECTION_INTERVAL_MS` 降频运行）。

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

目标：在添加可见太阳系 3D 内容之前，锁定并调试整体太阳系的交互语义。这个里程碑在 MediaPipe 关键点和未来太阳系控制器之间定义一层协议，用 debug-only 信号暴露松手、重新扶住、反向收起和历史缩放/旋转诊断，但不得渲染太阳、行星、轨道环、星云、粒子、奇点或任何 3D 模型。

任务：

- [x] 定义协议层：`MediaPipe landmarks -> HandFrame -> WholeSystemIntent -> future SolarSystemController`。
- [x] 定义整体太阳系生命周期状态：`Inactive`、`VirtualOpeningHandle`、`SolarHandleControl`、`ReleaseCandidate`、`SolarFreeHover`、`ReGripCandidate` 和 `SolarClosing`。
- [x] 定义主要松手判断：双手完全张开，手部 open-hand 分数足够高、伸展手指数量足够、grip-pose 分数足够低。
- [x] 一旦张开手松手被接受，立即锁存释放：冻结端点、撤手期间阻止重新扶住，并且只有双手明确离开后再回到冻结端点附近，才允许重新扶住。
- [x] 进入 `ReleaseCandidate` 前，要求张开手松手证据稳定持续一小段时间；单帧 release 抖动不能让控制脱手。
- [x] 当掌心朝上的微弯托举手仍在端点附近时，将其作为历史握持保护诊断，避免松手误抢状态。
- [x] 在冻结端点周围使用更宽容的重新扶住磁吸区，成功后把虚拟端点吸回当前双手。
- [x] 保留端点不匹配、双手完全丢失或整体控制置信度过低作为兜底松手信号。
- [x] 定义重新扶住判断：双手回到冻结的视觉左/右虚拟端点附近，不要求 pinch 单个行星。
- [x] 定义由手距速度驱动的历史缩放意图诊断；当双掌看起来朝向摄像头时，提高该诊断置信度。
- [x] 定义反向收起意图：整体控制状态下双手向内移动，并且手距接近闭合阈值。
- [x] 定义掌心朝上的轻微旋转和掌心法线变化作为历史旋转诊断信号，并在 debug 中区分 2D/3D 旋转意图。
- [x] 定义 MediaPipe 手部关键点中的掌心朝向基础量：手腕、食指掌指关节、中指掌指关节、小指掌指关节、掌心法线、朝向摄像头分数、朝上分数。
- [x] 掌心朝向只作为意图置信度加分，不作为硬性门槛。
- [x] 通过早期 pinch penalty，使整体太阳系控制与未来单个行星 pinch 激活意图区分。
- [x] 添加 debug-only 视觉左/视觉右虚拟端点和端点匹配状态；这些只是 2D 调试标记，不是 3D 太阳系内容。
- [x] 添加整体控制状态、控制/松手/重新扶住置信度、缩放/旋转/收起意图、掌心法线、掌心分数、open-hand/grip-pose 分数、松手锁、释放稳定时长、松手阻止原因、握持保护状态、重新扶住原因和虚拟端点的 debug 字段。
- [x] 在 Debug 按钮左侧添加简短中文交互状态说明，展示当前系统理解的意图、原因和核心参数。
- [x] 在验证这个交互合同时，AR 场景视觉上保持空场。

验收标准：

- [x] 文档状态模型区分 `SolarOpening`、`SolarFreeHover`、`SolarHandleControl` 和 `SolarClosing`。
- [x] 松手表示未来太阳系会保持最后稳定的位置、缩放和朝向，而不是吸回胸前锚点或屏幕中心。
- [x] 已接受的张开手松手会冻结端点，并防止用户慢慢撤手时立刻重新扶住。
- [x] 掌心朝上的托举保持诊断会保持 `SolarHandleControl`，不会被误判为松手。
- [x] 重新扶住可以通过更宽容的磁吸区恢复，不要求用户精确重新对齐身体或摄像头位置。
- [x] 重新扶住表示双手回到视觉左/右端点附近后，可以不 pinch 就继续整体控制。
- [x] 掌心朝前左右推拉只保留为历史 debug/协议诊断；它不是当前用户可见的太阳系缩放控制。
- [x] 已展开状态下，双手扶住端点向内合拢被定义并调试为反向收起，而不仅是普通缩小。
- [x] 反向收起完成后，回到初始空摄像头画面。
- [x] 掌心朝上轻轻旋转和掌心法线变化只保留为历史 debug/协议诊断；它们不是当前用户可见的整体太阳系旋转控制。
- [x] Debug 面板暴露整体太阳系协议值，且不渲染太阳系 3D 内容。
- [x] 右上角中文状态说明避免把已退役的缩放/旋转诊断显示成产品控制；可见太阳系行为应通过当前交互状态、松手/重新扶住/收起生命周期和 M5.5 观察意图解释。
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
- Separate whole-system control from individual planet pinch activation.
- Palm orientation should boost confidence, not act as a hard gate.
- Virtual endpoints may be shown only as debug-only 2D markers.

Done when:
- Release/re-grip/reverse-collapse values and legacy scale/rotation diagnostics are visible in the debug panel as debug-only historical signals, not current product controls.
- No sun, planet, orbit, nebula, particle, singularity, or 3D model appears.
- npm run typecheck and npm run build pass.
- TODO.md and TODO.zh-CN.md are updated.
```

## Milestone 3.6 — 手势诊断与会话自适应阈值

状态：`NEEDS_MANUAL_VERIFY`

目标：在 Milestone 4 之前继续打牢 3D 接入前的手势根基：新增统一手部基础特征层、当前会话内自适应阈值、结构化状态跳转原因，以及不记录视频的手势调试日志。

任务：

- [x] 新增统一 `HandPrimitives` 层，输出手距、中点、手轴方向、手轴角度、距离速度、平均手掌尺度、合拢意图分数、拉开意图分数和追踪置信度。
- [x] 新增仅当前会话有效的动态校准：合拢距离、自然拉开距离、手掌尺度、端点半径、重新扶住磁吸半径和收起阈值。
- [x] 将自适应阈值接入启动手势检测，不再只依赖固定归一化距离。
- [x] 将自适应端点和收起阈值接入整体控制、重新扶住和反向收起逻辑。
- [x] 为 startup 和整体控制协议添加结构化 `transitionReason`。
- [x] 在整体控制调试输出和评分中加入 `endpointHitScore` 与 `trackingConfidence`。
- [x] 新增 debug recorder，只在内存里记录结构化 landmarks、基础特征、校准值、意图分数、状态和跳转原因。
- [x] 新增 Debug UI 按钮，用于开始/停止记录、导出 JSON 日志和清空内存记录。
- [x] 确认 recorder 不采集原始摄像头视频，也不上传数据。
- [x] 保持 AR 场景视觉空场，不渲染任何太阳系 3D 内容。

验收标准：

- [x] Debug 面板显示手部基础特征：手轴角度、追踪置信度、合拢/拉开分数和基础原因。
- [x] Debug 面板显示会话校准值：手掌尺度、闭合/拉开校准值、闭合阈值、端点半径和收起阈值。
- [x] Debug 面板显示 startup 与整体控制的状态跳转原因。
- [x] 整体控制评分使用 tracking confidence，而不是只看双手 visible/missing。
- [x] 启动、端点重新扶住和收起阈值可以在当前摄像头会话中自适应，不依赖持久化历史。
- [x] Debug recorder 可以导出包含 landmarks 和计算值的结构化 JSON，但不包含原始摄像头画面。
- [x] `npm run typecheck` 通过。
- [x] `npm run build` 通过。
- [ ] 真实摄像头验证确认自适应阈值与跳转原因容易理解，且没有让 M3/M3.5 行为变得更不稳定。
- [x] 在 Milestone 4 开始前，`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md` 和 `AGENTS.md` 已对齐。

人工验证清单：

- [ ] 打开页面，开启摄像头，打开 Debug，确认双手可见后 `Calibration` 会从 defaults 变成 `session-adaptive`。
- [ ] 自然合拢双手，确认 `Closed / open calib` 记录闭合距离，并且 `Close thresholds` 接近这个值，而不是像完全固定的数字。
- [ ] 自然拉开双手，确认 `Closed / open calib` 记录拉开距离，同时 `PullArmed` 行为仍然正常。
- [ ] 测试松手和重新扶住，确认 `Endpoint hit`、`Whole tracking conf`、`Whole reason` 和 `Re-grip reason` 能解释结果。
- [ ] 点击 `Record`，做一小段成功或失败的手势，点击 `Stop`，导出 JSON，确认文件里是结构化数值而不是视频画面。

建议 Codex 提示词：

```text
Goal:
Implement or refine Milestone 3.6: gesture diagnostics and session-adaptive thresholds before adding 3D solar content.

Context:
Read @AGENTS.md, @TODO.md, and @ar_solar_system_prd.md.
Do not start Milestone 4 yet.

Constraints:
- Do not render solar-system 3D content.
- Keep startup hand-only.
- Do not persist personal gesture history unless explicitly requested.
- Record only structured debug data, not webcam video.

Done when:
- Hand primitives, adaptive thresholds, transition reasons, and recorder state are visible in Debug.
- npm run typecheck and npm run build pass.
- TODO.md and TODO.zh-CN.md are updated.
```

## Milestone 3.7 — 全代码占位太阳系视觉层

状态：`DONE`

目标：在 Milestone 4 之前新增一个数据驱动的全代码占位太阳系渲染层，用于测试球体、轨道、公转、自转等视觉效果，同时不改变正常启动空场。

任务：

- [x] 新增 `src/solar/` 层，包含数据、程序材质、天体节点和可复用太阳系控制器。
- [x] 为太阳、水星、金星、地球、月球、火星、木星、土星、天王星和海王星定义统一天体数据模型。
- [x] 包含激活命中半径、焦点默认 transform、父级天体和回轨/原轨道目标等占位元数据。
- [x] 使用带非对称标记的程序 `CanvasTexture` 材质，让自转肉眼可见。
- [x] 渲染轨道环、行星公转、自转、月球绕地球公转和清晰的土星环。
- [x] 在占位太阳系层暴露 `group`、`update`、`setVisible`、`setOpeningProgress`、`setTransform` 和 `dispose`。
- [x] 为 renderer 增加 `addObject3D` / `removeObject3D` 辅助方法和帧时间值，让视觉层可以在 render 前更新。
- [x] 新增开发专用 `?solarPreview=1` URL 入口，同时保持正常产品路径视觉空场。
- [x] 保持占位层独立于启动手势、hover、激活、焦点和甩回逻辑。

验收标准：

- [x] 默认页面加载时 Three.js 太阳系层保持隐藏。
- [x] `?solarPreview=1` 不需要摄像头权限即可显示完整代码占位太阳系。
- [x] 天体有明显程序花纹和可见自转。
- [x] 行星绕太阳公转，月球绕地球公转。
- [x] 土星有清晰环。
- [x] 后续贴图替换可以通过材质/数据来源完成，不改变交互逻辑。
- [x] `npm run typecheck` 通过。
- [x] `npm run build` 通过。
- [x] 浏览器预览确认 `?solarPreview=1` 的 3D canvas 非空，默认路由的 3D canvas 为空。

## Milestone 4 — 手部吸附拉开展开太阳系

状态：`IN_PROGRESS`

目标：实现第一个高光交互瞬间：用户从空场中用双手把太阳系拉开。

实现备注（2026-06-23）：M4-A/B/C/D 代码已接入。`PullArmed` 现在会进入 `SolarOpening`；代码占位太阳系由手距、中点、视觉手轴和 `openProgress` 驱动；完全拉开后进入 `SolarActive`。展开控制视觉是太阳系本地左右边缘的两个 3D 控制端点，不再使用中间连线式的操纵杆。展开完成后，`SolarActive` 默认保持最后稳定 transform；任意可见双手不再移动模型。只有双手稳定命中左右端点后，才会进入 `SolarHandleControl` 并恢复整体控制。松开端点控制会进入 `SolarFreeHover` 并保持最后稳定 transform；并且（2026-06-23 稳定性）当双手没有扶住左右端点时，`SolarActive` 自身也会在短暂宽限后落到 `SolarFreeHover`，使展开后无需再 re-grip 端点即可单手观察。控制态下双手向内合拢会进入 `SolarClosing`；达到收起阈值后隐藏全部太阳系内容并回到 `EmptyIdle`。当前暂不加入手型门槛，保证端点容易重新扶住。快速撤手或画面边缘误检造成的突变双手几何会被拒绝，避免模型突然缩小或跳位。这仍需要真实摄像头验证。

任务：

- [x] 添加 `SolarOpening` 和 `SolarActive` 状态。
- [x] 从 `PullArmed` 状态检测双手分离移动。
- [x] 根据手距计算 `openProgress`。
- [x] 限制并平滑 `openProgress`。
- [x] 防止手距停止增加后自动展开完成。
- [x] 支持已展开端点双手向内移动时的反向进度。
- [x] 将可复用的代码占位太阳系 group 接到 `SolarOpening` 进度和手势驱动 transform。
- [x] 在展开开始前，让所有太阳系 3D 物体保持不可见。
- [x] `HandsClosed` 保持视觉静止，不播放太阳系动画，也不显示 3D 内容。
- [x] 展开期间，将视觉左右端点绑定到左右手。
- [x] 将展开控制表现为太阳系边缘两个独立 3D 端点，而不是连接式操纵杆/杆状 overlay。
- [x] 拒绝突变的双手几何异常帧，使快速撤手或边缘误检时保持最后稳定的太阳系 transform，而不是突然缩小/跳位。
- [x] 完全展开后，`SolarActive` 保持最后稳定 transform；双手稳定命中端点会 re-grip 进入 `SolarHandleControl`，不扶住端点则落到 `SolarFreeHover`（2026-06-23），使无需再 re-grip 即可单手观察。
- [x] 使用 `SolarHandleControl` 作为展开后唯一可以恢复整体端点把手控制、松手或反向收起的状态。
- [x] 当前暂不要求手型门槛；张开的手从模型附近经过时，除非双手同时命中端点，否则不应获得控制。
- [x] 让用户可见状态说明与最新 M4 状态机保持一致；旧 `wholeSystemIntent` 松手/重新扶住数值只保留在 Debug 面板。
- [ ] 根据 `openProgress` 渐进显示太阳、轨道、天体、星尘和星云。
- [x] 展开完成后，将太阳系放置在双手拉开的当前位置，可选使用身体相对参考增强 AR 感。
- [x] 当反向收起达到闭合阈值时，隐藏全部太阳系内容并回到 `EmptyIdle`。
- [x] 整体双手控制松开后，保持最后稳定的太阳系 transform，不重新居中。
- [x] 添加 `openProgress`、起始距离、目标距离和状态的调试值。

验收标准：

- [ ] 有效拉开手势之前，没有可见 3D 太阳内容。
- [ ] 在 hand-only `PullArmed` 状态后拉开双手会开始展开。
- [ ] 展开宽度/进度明显跟随手距。
- [ ] 如果双手暂停，展开保持而不是自动播放到 100%。
- [ ] 展开端点明显跟随双手。
- [ ] 完成后，太阳系出现在双手拉开的位置，而不是被强制吸到胸前或屏幕中心。
- [ ] 完成后，任意可见双手从太阳系上方经过时不会移动它。
- [ ] 松开双手端点控制后，太阳系悬浮停留在松手位置。
- [ ] 双手扶住端点向内移动时，太阳系反向收起。
- [ ] 收起完成后，画面回到只有摄像头视频和 2D UI 的空场。
- [ ] 触发失败不会造成闪烁或随机出现部分太阳物体。
- [x] `npm run build` 通过。
- [ ] 行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

M4-A/B/C/D 人工验证清单：

| 项目 | 用户动作 | 观察位置 | 通过标准 |
|---|---|---|---|
| 空场仍成立 | 打开 `/`，开启摄像头，双手先不要入画，或双手分开但不要先合拢。 | 摄像头预览和 WebGL 叠加层。 | 不出现 3D 太阳、行星、轨道、土星环或任何占位太阳系内容。 |
| HandsClosed 保持静止 | 双手/双拳合拢并保持不动。 | 预览和 Debug 面板。 | `Startup state` 进入 `HandsClosed`；双手保持合拢时不出现任何 3D 太阳系内容。 |
| 拉开开始展开 | 从 `HandsClosed` 开始，把双手向两侧拉开。 | 预览、右上角状态说明、Debug 的 `Startup state`、`openProgress` 和 `Solar scale`。 | 状态进入 `SolarOpening`；占位太阳系出现在双手之间；手距增加时 `openProgress` 从接近 `0` 上升。 |
| 边缘控制端点 | 太阳系出现后继续拉开。 | 预览画面，尤其是占位太阳系的左右边缘。 | 太阳系左右边缘出现两个小控制端点，并随拉开的双手移动。太阳系上不再出现绿色连线/操纵杆。 |
| 展开跟随手距 | 在 `SolarOpening` 中暂停双手，再继续拉开。 | 预览和 Debug `openProgress`。 | 双手暂停时太阳系大小/进度保持；继续拉开时才继续增加。 |
| 中点和手轴跟随 | 拉开过程中，让双手整体向左/右/上/下或斜向移动。 | 预览。 | 太阳系中心接近双手中点，轨道平面大致跟随左右手轴方向旋转。 |
| 完全展开后保持 | 继续拉开到足够远，然后双手从太阳系附近或上方经过，但不要同时停在左右端点上。 | 状态说明、Debug 的 `Startup state` / `openProgress` 和预览画面。 | 交互状态进入 `SolarActive`，随后在双手不在左右端点上时落到 `SolarFreeHover`；`openProgress` 为 `1.00`；太阳系保持最后稳定 transform，不跟随任意双手移动。 |
| 端点重新扶住控制 | 在 `SolarActive` 下，让双手分别靠近左右 3D 控制端点并短暂保持，然后一起移动双手。 | 状态说明和预览画面。 | 状态进入 `SolarHandleControl`；只有这时太阳系才跟随双手中点、距离和视觉手轴。 |
| 离开端点后进入自由悬浮 | 在 `SolarHandleControl` 中，把一只手或双手离开端点/移出画面。 | 状态说明和预览画面。 | 状态进入 `SolarFreeHover`；太阳系冻结在最后稳定 transform。 |
| 快速撤手稳定性 | 模型大部分展开或完全展开后，快速把一只手或双手向屏幕边缘/画面外撤出。 | 预览和 Debug 的 `Solar scale`。 | 短暂追踪异常时模型保持最后稳定 transform；不得突然跳到一侧或缩成很小。 |
| 松手后自由悬浮 | 在 `SolarHandleControl` 中，让一只手或双手明显离开端点。 | 状态说明和预览画面。 | 交互状态进入 `SolarFreeHover`；太阳系停留在松手时的位置、大小和方向。 |
| 从自由悬浮重新扶住 | 在 `SolarFreeHover` 中，把双手重新靠近左右控制端点并短暂停住。 | 状态说明和预览画面。 | 交互状态回到 `SolarHandleControl`；此时移动双手会再次控制太阳系。 |
| 反向收起 | 在 `SolarHandleControl` 中，把双手端点向内合拢。 | 预览、状态说明和 Debug 的 `openProgress`。 | 交互状态进入 `SolarClosing`；`openProgress` 随手距减小而下降。 |
| 收起完成回空场 | 继续把两个端点向内合拢到双手接近。 | 预览和状态说明。 | 交互状态回到 `EmptyIdle`；所有 3D 太阳系内容消失，恢复初始空摄像头画面。 |

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
- Do not implement planet activation logic yet.

Done when:
- EmptyIdle -> HandsClosed -> PullArmed -> SolarOpening -> SolarActive -> SolarHandleControl -> SolarFreeHover -> SolarHandleControl -> SolarClosing -> EmptyIdle works.
- The status summary uses `interactionState` plus `solarReason`, not legacy `wholeSystemIntent` values.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 5 — 已退役的双手缩放/旋转语义

状态：`DONE`

目标：退役旧 M5 手势面，避免后续工作继续把它当成当前产品计划实现。

决策说明（2026-06-23）：最新经用户确认的太阳系观察控制在 Milestone 5.5 中。旧版“双手距离控制放大/缩小”“掌心朝前左右推拉像玻璃窗一样缩放”“掌心朝上扭动触发整体 3D 旋转”不再是当前产品验收标准。M3.5 中的缩放/旋转/掌心协议字段只作为历史 debug 诊断保留，直到后续代码清理。

任务：

- [x] 移除双手拉远放大、掌心朝前玻璃窗缩放、掌心朝上整体旋转的活跃 TODO 验收项。
- [x] 保留 M4 中的端点重新扶住、松手、自由悬浮和反向收起作为当前整体把手生命周期。
- [x] 将 M5.5 作为 `SolarFreeHover` 后太阳系放大、缩小、复位和平移的当前实现里程碑。

验收标准：

- [x] 后续实现提示应指向 M5.5 作为用户可见的太阳系观察控制。
- [x] 除非用户明确重新启用旧需求，否则不得把旧掌心朝前或掌心朝上 M5 语义扩展进 `SolarHandleControl`。
- [x] 文档明确区分历史协议 debug 字段和当前产品控制。

## Milestone 5.5 — 太阳系自由悬浮后的单手观察控制

状态：`NEEDS_MANUAL_VERIFY`

目标：当太阳系已释放到 `SolarFreeHover` 后，让用户用单手放大、缩小、恢复默认和平移太阳系画面。

当前控制基准（2026-06-23）：这是最新经用户确认的太阳系观察手势模型，并取代已退役的 M5 双手/掌心手势语义。

调优说明（2026-06-23）：缩放手势现在带相位锁。张开放大只消费手指张开的阶段；张开后的自然收手会被忽略，直到手回到稳定中性展开区。缩小从短暂稳定的开掌开始，只消费收拢阶段；收拢后的自然放松会被忽略。平移使用稳定展开程度的 clutch 和从锚点开始的平滑手掌位移，不再直接吃逐帧手掌 delta。

任务：

- [x] 增加单手意图层，输出 `fingerSpread`、`fingerSpreadVelocity`、`palmCenter`、`palmCenterVelocity`、握拳保持时长和 transition reason。
- [x] 单手太阳系观察只在 `SolarFreeHover` 生效；双手端点控制期间禁用。
- [x] 当手掌中心移动较小时，将五指张开映射为太阳系画面放大，并用回弹锁避免自然收手立刻触发缩小。
- [x] 当手掌中心移动较小时，将短暂稳定开掌后的五指收拢映射为太阳系画面缩小，并用回弹锁避免自然放松立刻触发放大。
- [x] 将收拢成拳并保持约 2 秒映射为恢复默认太阳系大小和位置。
- [x] 当手指展开程度稳定并进入 clutch 后，将左/右/上/下推动映射为太阳系画面平移，使用从 clutch 锚点开始的平滑手掌位移。
- [x] 限制 M5.5 观察缩放速度，并对平移偏移做低通，使慢速/快速手部动作都可恢复。
- [x] 允许放大后的太阳系部分移出屏幕，同时保留可恢复的默认重置路径。
- [x] 添加单手意图、spread 分数、pan 分数、reset hold time、太阳系观察缩放和偏移调试值。
- [x] 添加运行时 Debug checklist，记录当前浏览器 session 是否实际命中过 M5.5 自由悬浮、放大、缩小、平移、复位保持、复位、端点控制禁用和观察后重新扶住信号，并显示进度计数、剩余项目标签、下一个必测项目、下一步动作、观察位置和通过条件；缩放、平移和复位 checklist 项需要实际 inspection scale/offset 证据，而不能只依赖 intent 标签。
- [x] 添加仅 Debug 可见的 `Export M5.5` 控件，可下载一份不含原始摄像头视频的紧凑验收摘要 JSON，包含带稳定 id、用户动作、观察位置和通过条件的自描述 checklist 数组；该摘要由带类型的 report helper 构建，并由 `npm run verify:m5.5` 覆盖；即使当前进度是 0/8，导出也保持可用，方便失败或卡住的人工测试生成证据。
- [x] 添加仅 Debug 可见的 `Reset M5.5` 控件，使人工测试者可以不刷新页面就清空运行时 checklist。
- [x] 添加 `npm run verify:m5.5`，用合成手部关键点确定性验证 M5.5 控制器状态转换，包括慢动作稳定性和缩放边界。

验收标准：

- [x] `SolarFreeHover` 中，单手五指张开会放大太阳系，且自然回手不会立刻让它缩小，待人工摄像头验证。
- [x] 从短暂稳定开掌开始的单手五指收拢会缩小太阳系，且自然放松不会立刻让它放大，待人工摄像头验证。
- [x] 收拢成拳并保持约 2 秒会恢复默认大小和居中位置，端点仍可见，待人工摄像头验证。
- [x] 单手推动在 clutch 后可以平滑平移放大后的太阳系画面，无需双手端点控制，待人工摄像头验证。
- [x] 双手端点控制期间，单手太阳系观察不会触发，待人工摄像头验证。
- [x] M5.5 放大/平移后重新扶住使用视觉更新后的端点，而不是旧释放中心，待人工摄像头验证。
- [x] 慢速手势下，缩放/平移分类不会明显闪烁，待人工摄像头验证。
- [x] `npm run verify:m5.5` 通过。
- [x] `npm run build` 通过。
- [x] 行为保持 `NEEDS_MANUAL_VERIFY`，直到 Milestone 5.5 摄像头 checklist 通过。

## Milestone 6 — 天体数据模型和九个可交互目标

状态：`TODO`

目标：为所有 MVP 可交互天体创建统一的数据驱动模型，包含 hover、激活、焦点画面和回轨元数据。

任务：

- [ ] 为水星、金星、地球、火星、木星、土星、天王星、海王星和月球定义 `CelestialBodyId`。
- [ ] 定义天体元数据：名称、标签、近似视觉尺寸、轨道半径、轨道速度、自转速度、颜色/占位纹理、激活命中半径、焦点默认 transform、回轨/原轨道目标、父级天体（如有）。
- [ ] 为每个天体实现简化视觉模型。
- [ ] 添加可识别的土星环。
- [ ] 让月球默认围绕地球运行。
- [ ] 将所有天体保存在一个 registry 中，供渲染、hover、激活、焦点、悬浮和回轨逻辑使用。
- [ ] 添加可在 hover/激活/焦点状态显示的标签。
- [ ] 添加原始轨道 transform 数据，以支持返回行为。
- [ ] 确保没有为每个行星编写重复的一次性激活或焦点逻辑。

验收标准：

- [ ] 九个 MVP 天体都由同一个数据模型表示。
- [ ] 太阳系展开后，天体在简化轨道上渲染。
- [ ] 月球与地球视觉上可区分。
- [ ] 土星有明确的环。
- [ ] 返回轨道逻辑可获取原始轨道位置/层级数据。
- [ ] 后续手势管线可获取焦点默认大小/位置和激活热区半径。
- [ ] `npm run build` 通过。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 6: data-driven celestial body model for nine MVP interactive bodies.

Context:
Read @ar_solar_system_prd.md sections 7.7, 8.2, and 17.

Constraints:
- Use one shared celestial body model and registry.
- Include Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon.
- Keep visuals lightweight and MVP-friendly.
- Do not implement the full planet focus gesture pipeline yet unless needed for data hooks.

Done when:
- All nine bodies render after opening.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 7 — Hover、高亮和 Pinch 激活

状态：`TODO`

目标：让用户可以 hover 并 pinch 激活九个 MVP 天体中的任意一个，同时避免拖动太阳系，并确保激活不会冻结自转。

任务：

- [ ] 将每个可交互天体的 3D 位置投影到屏幕坐标。
- [ ] 计算手到天体的屏幕空间距离。
- [ ] 为水星和月球添加更大的命中区域。
- [ ] 使用迟滞选择最近的有效天体，避免闪烁。
- [ ] 添加 hover 视觉反馈：光环、标签和轨道高亮。
- [ ] 使用拇指/食指距离和手掌尺度检测 pinch start 与 pinch end。
- [ ] 使用不同的 pinch start 和 pinch end 阈值。
- [ ] 实现 `BodyHover` 和 `PlanetActivated` 转换。
- [ ] pinch 激活时，停止选中天体的原轨道公转，但保持自然自转。
- [ ] 所有未选中天体继续正常公转和自转。
- [ ] 天体 pinch 激活期间，禁止误触发太阳系缩放/平移/拖动。
- [ ] 添加清楚的激活反馈，并保留原轨道目标供回轨使用。
- [ ] pinch 激活保持期间，添加短暂追踪丢失容忍。

验收标准：

- [ ] 手靠近天体时，该天体清楚高亮。
- [ ] 高亮不会在相邻天体之间快速闪烁。
- [ ] 在高亮天体附近 pinch 可以激活该天体。
- [ ] 激活天体停止公转但保持自转。
- [ ] 未选中天体继续正常运动。
- [ ] 激活天体不会拖动或缩放整个太阳系。
- [ ] 九个天体都可以高亮并激活。
- [ ] `npm run build` 通过。
- [ ] 行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 7: hover, highlight, and pinch activation for all nine MVP bodies.

Context:
Read @ar_solar_system_prd.md sections 7.7, 7.8, 7.9, and 12.4.

Constraints:
- Use one unified hover/activation pipeline.
- Only one body can be activated at a time.
- Use pinch hysteresis.
- Do not freeze self-rotation on activation.
- Do not let activation drag the whole solar system.
- Do not make PinchTap place-down or ordinary pinch relaxation return to orbit.

Done when:
- All nine bodies can be hovered and activated.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 8 — 单颗行星画面和单体操控

状态：`TODO`

目标：从激活天体进入单颗行星画面，并让用户在当前行星持续自转的情况下进行观察、放大、平移、托住和默认恢复。

任务：

- [ ] 添加 `PlanetFocusView`、`PlanetFocusControlled` 和 `PlanetFocusFloating` 生命周期状态或等价子状态。
- [ ] 检测进入手势：主手 pinch 锁定激活天体 + 副手五指张开/扩张。
- [ ] 背景太阳系弱化并锁定交互，但保留基础动效。
- [ ] 当前行星在激活、焦点、缩放、平移、托住跟手、悬浮和观赏期间都保持自转。
- [ ] 将单手五指张开映射为当前行星放大。
- [ ] 将单手五指收拢映射为当前行星缩小。
- [ ] 将收拢成拳并保持约 2 秒映射为当前行星恢复默认大小和位置。
- [ ] 将单手推动映射为当前行星平移。
- [ ] 使用稳定条件检测托住跟手：手掌打开、手掌中心位于行星下方、靠近行星下缘、低速、停留 300-500ms。
- [ ] 托住跟手期间，当前行星限制在可见屏幕内。
- [ ] 确保当前行星控制不影响整个太阳系 transform。
- [ ] 为激活、焦点、受控、悬浮状态显示清楚反馈。

验收标准：

- [ ] 主手 pinch 锁定 + 副手张开/扩张进入 `PlanetFocusView`。
- [ ] 背景太阳系弱化、锁定交互，并保留基础动效。
- [ ] 当前行星在所有焦点交互中持续自转。
- [ ] 单手张开/收拢可以缩放当前行星。
- [ ] 握拳保持约 2 秒可以恢复焦点默认大小和位置。
- [ ] 单手推动可以平移当前行星，而不会移动太阳系。
- [ ] 托住跟手可以移动当前行星，并保持在屏幕内。
- [ ] `npm run build` 通过。
- [ ] 行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 8: planet focus view and single-planet controls.

Context:
Read @ar_solar_system_prd.md sections 5.5, 7.10, and 7.11.

Constraints:
- A focused body keeps self-rotating; do not freeze self-rotation.
- Background solar-system interaction is locked during PlanetFocusView.
- Single-body manipulation must not affect solar-system scale or rotation.
- Keep the focused body inside the visible screen during support-follow.
- Update docs if any interaction mapping changes.

Done when:
- Activation -> focus view -> zoom/pan/support works.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 9 — PinchTap 放下、焦点悬浮和甩回原轨道

状态：`TODO`

目标：让用户在单颗行星画面中放下当前行星，使其悬浮在当前位置，然后明确 pinch-and-throw 回原轨道。

任务：

- [ ] 主手托住当前行星时，检测副手在屏幕内完成的 `PinchTap`。
- [ ] 接受 `PinchTap` 放下前，要求主手托住速度较低。
- [ ] 接受 `PinchTap` 后，解除跟手控制，让当前行星悬浮在 `PlanetFocusView` 的当前位置。
- [ ] 悬浮的当前行星保持自转，并且不自动回轨。
- [ ] 在背景中显示原轨道目标或方向提示。
- [ ] 允许悬浮的当前行星再次被 pinch 选中。
- [ ] pinch 持有当前行星时追踪近期手部速度。
- [ ] 基于归一化屏幕/场景单位定义甩出速度阈值。
- [ ] 只在 pinch 释放前短时间内出现高速度时检测为甩出意图。
- [ ] 当手部运动方向指向原轨道目标时，提高甩出置信度。
- [ ] 添加 `BodyReturning` 状态。
- [ ] 将 returning 天体带可见尾迹/光 streak 动画回原轨道位置。
- [ ] 添加返回过程中的可见尾迹、光 streak 或光效反馈。
- [ ] 返回时恢复原始天体缩放和父子关系。
- [ ] 回轨后恢复原始公转，并保持自转。
- [ ] 回轨完成后退出 `PlanetFocusView`，回到太阳系画面并解锁太阳系交互。
- [ ] 确保低速释放仍保持在 `PlanetFocusView` 中悬浮。
- [ ] 添加 PinchTap、悬浮状态、甩出速度、甩出方向分数和甩出置信度调试值。

验收标准：

- [ ] 主手托住 + 副手 `PinchTap` 可以放下当前行星。
- [ ] 放下后的当前行星仍在 `PlanetFocusView` 中悬浮，并保持自转。
- [ ] 低速 pinch 释放不会让当前行星回轨。
- [ ] 明确朝原轨道目标 pinch-and-throw 会让当前行星回轨。
- [ ] 返回动画可见且平滑。
- [ ] 返回后天体恢复原始轨道关系。
- [ ] 返回后应用退出到太阳系画面并解锁太阳系交互。
- [ ] 月球能正确回到地月关系。
- [ ] 误触发足够低，可以支持 30-60 秒演示。
- [ ] `npm run build` 通过。
- [ ] 行为已人工测试，或标记为 `NEEDS_MANUAL_VERIFY`。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 9: PinchTap release, floating focus, and throw-return behavior.

Context:
Read @ar_solar_system_prd.md sections 7.11, 7.12, and 13.

Constraints:
- PinchTap release keeps the body floating in PlanetFocusView.
- Floating focus must not return to orbit automatically.
- Throw return requires clear velocity and direction near pinch release.
- Returning body should restore original scale, orbit layer, and motion, then exit back to the solar-system view.
- Update docs if thresholds or behavior are changed.

Done when:
- Focused body can be placed down, left floating, then thrown back to orbit.
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
- [ ] 激活、单颗行星画面、PinchTap 放下悬浮和甩回都在视觉上清楚。
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
- [x] 为手势阈值创建命名常量。已完成：整体太阳系的可调参数全部集中在 `src/interaction/intentTuning.ts`；不要再把魔法数字写回 `wholeSystemIntent.ts`。
- [x] 将归一化坐标→舞台像素/世界坐标的映射集中到 `src/interaction/coordinateMapping.ts`（M4 前置项）；`mapNormalizedToWorld` 通过 three 的 `Raycaster` 反投影，`src/rendering/scene.ts` 暴露 `getCamera()`。
- [x] 将视觉左/右双手分配统一到 `src/interaction/handPairing.ts`，使 startup、手部基础特征和整体控制保持一致。
- [x] 将共享的向量/标量数学合并到 `src/utils/math.ts`。
- [x] 默认关闭未使用的 `PoseLandmarker`（`ENABLE_POSE_TRACKING`），并移除关键点 overlay 每点调用 `getBoundingClientRect` 的重排，把算力让给手部追踪。
- [x] 将整体太阳系协议（`wholeSystemIntent.ts`）拆成"编排层 + 无状态模块"（`palmOrientation`、`handPose`、`intentScoring`、`handLandmarks`）；控制器现在只持有状态机、跨帧状态和有状态的旋转打分。状态机本身的拆分推迟到 M4 之后（Step 8）。
- [ ] 创建调试状态 store，使调试 UI 不直接依赖内部类。
- [ ] 保持帧循环性能稳定，避免不必要的逐帧分配。
- [ ] 添加摄像头权限错误 UI。
- [ ] 在 README 中添加人工测试清单。
- [ ] MVP 可用后，添加截图或短 GIF 说明。
- [x] 创建私有伴生仓库 `<private-companion-repo>`，用于 Codex 交互日志、TODO 更新记录和 agent 工作流上下文。
- [x] 添加 `npm run sync:agent:push` 和版本化 `post-commit` hook，使每次主仓库提交都能同步伴生仓库。

## 横切工作流 — Test & Replay Harness

状态：`TODO`

目标：通过先加入确定性的自动化测试，再逐步加入结构化手势回放和浏览器层回放，减少每次回归都需要人工打开摄像头挥手测试的成本。

参考文档：

- `docs/testing/test-and-replay-harness.md`

计划：

- [x] 整理最新测试策略，包括用户评估中强调的“叶子纯函数和控制器测试应先于 replay/E2E”的顺序。
- [ ] 添加 Vitest（`environment: 'node'`），但不修改 `main.ts` 或真实摄像头/运行时 bootstrap。
- [ ] 添加确定性护栏测试：`src/interaction/**` 一旦出现 `Math.random`/`Date.now`/`performance.now` 即失败。
- [ ] 把 `scripts/verify-m5_5-solar-inspection.ts` 的合成构造器抽进共享 `tests/helpers/`（单一来源，不重写）。
- [ ] 添加 Layer 0 纯模块测试：`math`、`coordinateMapping`、`handPairing`、`palmOrientation`、`handPose`、`intentScoring`。
- [ ] 添加 Layer 1 控制器序列测试：使用合成 `TrackingSnapshot` 和注入时间戳，覆盖启动、太阳系展开、自由悬浮/重新扶住基础路径和反向收起；可复用 `solarInspectionVerification` 当 oracle。
- [ ] 把 M5.5 验证用例吸收进 Vitest gesture 测试，并将 `npm run verify:m5.5` 降为 alias，而不是维护两套平行 harness。
- [ ] 添加 CI（GitHub Actions），在 push/PR 上跑 `typecheck` + unit + gesture + `build`。
- [ ] 在纯函数/控制器测试层有实际价值且 M5.5 稳定后，再加入 JSON fixture replay（多帧序列）。
- [ ] 在回放时间驱动要求明确后，再加入 Playwright/browser replay 以及任何 `main.ts`/`TrackingSource` 接缝。

约束：

- 不提交原始摄像头视频。
- 早期测试优先使用合成 landmarks。
- 区分单帧 fixture（Layer 0 纯函数输入）和多帧序列 fixture（Layer 3 回放）。
- 第一轮测试切片不添加 `src/testing/`，不改产品运行时接线。
- 后续引入 replay（序列）fixture 时，必须保留 fixture 自带时间戳。

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
9. 松开端点把手，确认太阳系保持在释放时的 transform，而不是跟随身体或回到屏幕中心。
10. 在 `SolarFreeHover` 中，用单手五指张开/收拢确认太阳系观察放大和缩小。
11. 在 `SolarFreeHover` 中，用单手推动平移，并收拢成拳保持约 2 秒确认太阳系观察复位。
12. 依次 hover 每个可交互天体，确认标签/光晕。
13. Pinch 激活天体，确认它停止公转但保持自转。
14. 主手保持 pinch 锁定，副手张开/扩张进入单颗行星画面。
15. 托住当前行星后，用副手 PinchTap 放下；确认它仍在单颗行星画面中悬浮并自转。
16. 再次 pinch 悬浮行星并朝原轨道目标甩回；确认它回轨并退出到太阳系画面。
17. 用月球和土星重复测试。
18. 运行录制模式，确认 debug UI 已隐藏。

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

备注（2026-06-23）：M4 可见太阳系内容接入后，用户可见的右上角状态说明以 `interactionState` + `solarReason` 为准。旧 `Whole control` / `wholeSystemIntent` 值只作为协议 Debug 行存在，不应再作为可见太阳系行为的主状态说明。其中缩放/旋转/掌心相关行只是历史协议诊断；M5.5 才是当前用户可见的太阳系观察控制模型。

| 项目 | 用户动作 | 观察位置 | 通过条件 |
|---|---|---|---|
| M3.5 空场 | 打开页面，点击 `开启摄像头`，打开 `Debug`，先不要把手放进画面。 | 摄像头预览、Debug 面板和 debug overlay。 | 摄像头预览不出现 3D 太阳、行星、轨道、星云、粒子、奇点或模型。`Whole control` 显示 `Inactive`。 |
| 旧协议 Debug 字段 | 保持 `Debug` 打开，执行任意 M3.5 手势动作。 | Debug 面板里的 `Whole control`、松手/重新扶住字段、意图分数和端点圆圈。 | 旧协议值仍可在 Debug 中检查。右上角状态卡不应在可见 M4 太阳系行为中显示 `Lock`、`Re-grip` 或 `Transition` 这类旧协议标签。 |
| 拉开后协议启动 | 双手在画面任意位置合拢，然后拉开，直到 `Startup state` 进入 `PullArmed`。 | Debug 面板里的 `Whole control`、`Control confidence` 和 2D 端点圆圈。 | `Whole control` 从 `Inactive` 变为 `VirtualOpeningHandle`，随后变为 `SolarHandleControl`。只有打开 `Debug` 时，双手附近会出现两个小的 2D 调试端点圆圈。 |
| 掌心朝向数值 | 保持双手可见，慢慢把掌心转向摄像头、转到侧面、再转成朝上。 | Debug 面板里的 `Visual L palm normal`、`Visual R palm normal`、`Visual L palm facing/up` 和 `Visual R palm facing/up`。 | 掌心法线数值持续更新。facing/up 分数保持在 `0.00-1.00` 范围，并且会随掌心方向变化而明显变化。 |
| 微弯手保持抓住 | 当 `Whole control` 为 `SolarHandleControl` 时，双手保持微微弯曲，像握住两个把手。 | Debug 面板里的 `Visual L open/grip`、`Visual R open/grip`、`Grip hold`、`Release stable`、`Release gesture` 和 `Whole control`。 | `Grip hold` 显示 `yes`，`Release stable` 基本保持在 `0ms` 附近，`Release gesture` 保持 `no`，`Whole control` 保持 `SolarHandleControl`。虚拟端点继续跟随双手。 |
| 历史掌心朝上保持诊断 | 当 `Whole control` 为 `SolarHandleControl` 时，把双掌转成大致朝上，手指微弯，像托住托盘一样，然后轻轻移动双手控制柄。 | Debug 面板里的 `Rotation intent`、`Release blocked`、`Grip hold`、`Release stable`、`Release gesture` 和 `Whole control`。 | 历史 `Rotation intent` 可能变化，`Release blocked` 可能显示 `rotationHold` 或 `cuppedGrip`；这只是协议/debug 诊断。`Grip hold` 应显示 `yes`，`Release stable` 不应攒到松手阈值，`Whole control` 应保持 `SolarHandleControl`。 |
| 张开手松手 | 当 `Whole control` 为 `SolarHandleControl` 时，双手五指完全张开并明显伸展，且先停止旋转。看到 `Release stable` 超过约 `280ms`、`Release gesture` 变成 `yes / lock on` 后，慢慢把手收回或放松手指。 | Debug 面板里的 `Visual L open/grip`、`Visual R open/grip`、`Release stable`、`Release blocked`、`Release gesture`、`Whole control` 和 2D 端点圆圈。 | open 分数升高，grip 分数降低，`Release blocked` 显示 `none`，`Release stable` 超过约 `280ms`，`Release gesture` 变成 `yes / lock on`，`Whole control` 进入 `ReleaseCandidate`，随后进入 `SolarFreeHover`。即使慢慢收手时手指放松，端点圆圈也应冻结；在双手先离开冻结端点、再主动回到端点前，`Whole control` 不能跳回 `SolarHandleControl`。 |
| 历史缩放意图诊断 | 当 `Whole control` 为 `SolarHandleControl` 时，双手向外拉远再靠近，但不要完全合拢。 | Debug 面板里的 `Scale intent`、`Hand distance`、`Distance velocity` 和 `Collapse intent`。 | 历史 `Scale intent` 可能随手距变化；这只是协议/debug 诊断。当前用户可见的太阳系观察缩放属于 M5.5 的 `SolarFreeHover` 后单手控制。 |
| 反向收起意图 | 从 `SolarHandleControl` 开始，继续让双手向内靠近，直到接近合拢。 | Debug 面板里的 `Whole control` 和 `Collapse intent`。 | `Collapse intent` 向 `1.00` 升高；`Whole control` 可以进入 `SolarClosing`，完全合拢后回到 `Inactive` 附近。画面不出现 3D 内容。 |
| 兜底松手 | 进入 `SolarHandleControl` 后，把双手移出画面或遮住几秒。 | Debug 面板里的 `Whole control`、`Release confidence` 和端点圆圈。 | `Whole control` 先变成 `ReleaseCandidate`，再变成 `SolarFreeHover`。虚拟端点圆圈冻结在最后稳定位置。 |
| 重新扶住冻结端点 | 进入 `SolarFreeHover` 后，先把双手明显移离冻结端点圆圈，再把双手重新放到两个圆圈附近。不应该需要非常精确地重新调整身体或摄像头距离。 | Debug 面板里的 `Release gesture`、`Whole control`、`Re-grip confidence`、`Re-grip reason` 和 `Visual endpoint matched`。 | 双手离开端点后，`Release gesture` 变成 `no / lock off`。双手回到圆圈附近时，`Re-grip reason` 应变成 `endpoint` 或 `wideMagnet`，`Re-grip confidence` 升高，`Whole control` 经过 `ReGripCandidate` 回到 `SolarHandleControl`。 |
| 历史旋转意图诊断 | 当 `Whole control` 为 `SolarHandleControl` 时，掌心大致朝上或明显不朝摄像头，轻轻旋转/扭动双手形成的控制柄。 | Debug 面板里的 `Rotation intent`、`Rotation intent score`、掌心 facing/up 分数和掌心法线。 | 历史 `Rotation intent` 可能从 `none` 变成 `rotate2d` 或 `rotate3d`；这只是协议/debug 输出，不是当前产品验收手势。 |
| 整体控制与 pinch 分离 | 当 `Whole control` 为 `SolarHandleControl` 时，用一只手做 pinch，像未来要激活某颗行星一样。 | Debug 面板里的 `Control confidence`。 | `Control confidence` 应下降，而不是把强 pinch 当成更强的整体太阳系控制。本里程碑不会激活任何行星。 |

### Milestone 5.5 人工验收清单

用这份清单验证整体太阳系释放到 `SolarFreeHover` 后的当前太阳系观察控制。

| 项目 | 用户动作 | 观察位置 | 通过条件 |
|---|---|---|---|
| 进入自由悬浮 | 打开摄像头，拉开太阳系，进入端点控制，然后松开端点把手，让太阳系悬浮。 | 摄像头预览、右上角状态说明和 Debug 面板。 | 太阳系内容保持在释放时的 transform。`Startup state` / interaction state 显示 `SolarFreeHover`，状态说明提示等待单手观察或重新扶住端点。 |
| 单手放大 | 在 `SolarFreeHover` 中，让一只手进入画面，尽量保持手掌中心不动，同时五指张开，然后自然把手放松收回。第二只手在边缘闪一下不应 reset 手势（主手锁定）。 | 摄像头预览，以及 Debug 的 `Solar inspect`、`Inspect spread`、`Inspect spread velocity`、`Inspect scale / offset`。 | 太阳系在张开阶段变大。`Solar inspect` 变为 `zoomIn / active`，`Inspect spread velocity` 为正，inspection scale 上升到 `1.00` 以上。自然回手不应立刻产生对应的 `zoomOut` 缩小跳变。 |
| 单手缩小 | 在 `SolarFreeHover` 中，只让一只开掌进入画面，短暂保持开掌，然后尽量保持手掌中心不动并五指收拢；缩小后自然放松手。 | 摄像头预览，以及 Debug 的 `Solar inspect`、`Inspect spread velocity`、`Inspect scale / offset`。 | 太阳系在收拢阶段变小。`Solar inspect` 变为 `zoomOut / active`，`Inspect spread velocity` 为负，inspection scale 相比前一刻下降。自然放松不应立刻产生对应的 `zoomIn` 放大跳变。 |
| 单手平移 | 放大后，保持单手足够张开，让展开程度稳定一下，然后在手指展开程度变化不大的情况下向左/右/上/下推动。 | 摄像头预览，以及 Debug 的 `Solar inspect`、`Inspect pan score`、`Inspect palm velocity`、`Inspect scale / offset`。 | 太阳系在 pan clutch 生效后顺滑地朝推动方向平移。`Solar inspect` 变为 `pan / active`，`Inspect pan score` 高于 `0.00`，inspection offset 发生变化，且没有明显逐帧跳动。 |
| 握拳复位保持 | 在 `SolarFreeHover` 中，将同一只手收拢成拳并保持约 2 秒。 | 摄像头预览、右上角状态说明，以及 Debug 的 `Solar inspect`、`Inspect reset hold`、`Inspect scale / offset`。 | 保持期间 `Solar inspect` 显示 `resetHold / active`，reset hold time 接近约 `2000ms`。完成后 `Solar inspect` 显示 `reset / active`，inspection scale 回到接近 `1.00`，offset 接近 `0, 0, 0`，端点可见或可恢复。 |
| 端点控制优先 | 处于或回到 `SolarHandleControl` 时，移动或张开单手，模拟 M5.5 控制动作。 | Debug 面板和摄像头预览。 | 端点控制期间单手观察不会移动太阳系。`Solar inspect` 显示 `inactive / idle`，或在 `SolarHandleControl` 拥有 transform 时保持非 active。 |
| 观察后重新扶住 | 在自由悬浮中平移或缩放太阳系，然后把双手放回可见左右端点附近。 | 摄像头预览，以及 Debug 的 `Startup state`、`Solar reason`、端点/重新扶住相关行。 | 重新扶住仍在视觉更新后的端点位置生效，状态可以回到 `SolarHandleControl`，不会跳回旧释放中心。 |
| 慢速手势稳定性 | 重复慢速张开、自然回手、稳定开掌后收拢、自然放松，以及慢速推动动作。 | 右上角状态说明，以及 Debug 的 `Solar inspect`、`Inspect spread velocity`、`Inspect pan score`。 | 分类结果可理解，不会在刻意慢动作中快速来回闪烁 zoom 与 pan。放大/缩小后的回弹动作应被忽略，而不是变成反向缩放。如果闪烁明显，Milestone 5.5 保持 `NEEDS_MANUAL_VERIFY` 并继续调阈值。 |

## 实现过程中待解决的问题

这些问题不应阻塞早期里程碑，但 Codex 应在解决时记录决策。

- [x] MediaPipe Tasks Vision 的具体包选择和加载策略。决策：使用 `@mediapipe/tasks-vision@0.10.35`，wasm 从匹配版本的 jsDelivr package 路径加载，MVP 阶段使用 Google 官方托管的 lite pose 和 float16 hand `.task` 模型。
- [x] 使用纯 TypeScript 模块还是添加 React。决策：初始 Web Demo 使用纯 TypeScript 模块。
- [x] MediaPipe 关键点坐标到 Three.js 场景坐标的具体映射。决策：集中在 `src/interaction/coordinateMapping.ts`（感知 object-fit: contain + 镜像）；`mapNormalizedToWorld` 通过 three 的 `Raycaster` 对真实相机 `scene.getCamera()` 和 `z = INTERACTION_PLANE_Z` 平面做反投影。Debug overlay 已经走这个映射；M4 的 3D 内容必须使用同一模块。最终世界平面深度仍待 M4 调试确定。
- [ ] 真实摄像头测试后的最终 pinch 阈值。
- [ ] 真实摄像头测试后的最终甩出速度阈值。
- [ ] 真实摄像头测试后的最终 PinchTap 时序阈值。
- [ ] 真实摄像头测试后的最终聚焦天体屏幕限制和回轨方向阈值。
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

### 2026-06-23 — 手势管线稳定性重构（8 个 Task）

- 在加新手势之前先稳定"手部追踪 → 手势"管线,针对真实摄像头下的抖动 / 过敏感 / 掉控。不加新产品手势;不做臆测性的阈值调参;初始空场和默认关闭的 pose 追踪保持不变。
- 新帧门控(`freshFrameGate.ts`):交互控制器只在 MediaPipe 有新检测(`TrackingSnapshot.lastUpdatedAt` 变化)时更新,并用检测时间戳,使重复渲染的旧帧不再往拉开/缩放/平移速度里掺假的 0 速度样本。录制也一并门控。`main.ts` 门控控制器;渲染仍每帧进行。
- 配对在平滑之前(`gestureInputFrame.ts`):`HandTracker` 先建原始手、按轨迹分配视觉左右,再按视觉槽位平滑——双手交叉时 MediaPipe handedness 翻转不再串平滑历史。
- 屏幕平面手距只用 2D x/y(startup、primitives、solar-opening),把噪声大的 image z 从"手有多近/多远"和拉开轴里去掉。
- `TrackedHand` 新增 `worldLandmarks`;手型(`handPose` 的张开/握拳、`intentScoring` 的 pinch)在有 world 时优先用米制 world 几何,无则回退 image。
- `SolarActive` 在双手不再扶住端点时释放到 `SolarFreeHover`,使展开后无需再 re-grip 一次端点即可单手观察。
- 单手观察锁定主手,而不是要求每帧恰好一只手,弱第二只手 blip 不再 reset 手势。
- 测试:85 → 97 通过。新增回归测试:新帧门控、展开→自由悬浮、第二只手 blip、2D 手距 vs z 抖动、视觉身份先于平滑、world 手型。
- 影响文件:`src/main.ts`、`src/tracking/handTracker.ts`、`src/utils/types.ts`、`src/interaction/{freshFrameGate,gestureInputFrame,handStartupGesture,handPrimitives,handPose,intentScoring,solarOpeningController,solarInspectionController}.ts`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`,以及新增的 `tests/` 文件。
- 剩余不明确项:仍需真实摄像头验证(handedness 翻转稳定性、手感、阈值);结构性修复有意避开了阈值调参。未改产品行为/验收,因此 `ar_solar_system_prd.md` 不变。

### 2026-06-23 — 复核后细化 Test & Replay Harness 方案

- 细化 `docs/testing/test-and-replay-harness.md`：新增确定性护栏（`src/interaction/**` 不得出现 `Math.random`/`Date.now`/`performance.now`，由护栏测试强制）；把 `scripts/verify-m5_5-solar-inspection.ts` 吸收进 Vitest gesture 测试（构造器抽进共享 `tests/helpers/`，`verify:m5.5` 降为 alias），而非维护两套 harness；区分单帧 fixture（Layer 0）与多帧回放 fixture（Layer 3）；新增 Continuous Integration 一节作为自动化终点。
- 将 AGENTS 与 TODO 的 harness 摘要对齐到细化后的文档，修正了 TODO 仍写"保留 `verify:m5.5` 作为独立脚本"的矛盾。
- 影响文件：`docs/testing/test-and-replay-harness.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：方案无；首个实现切片仍待动手。

### 2026-06-23 — M5.5 相位锁缩放与 clutch 平移调优

- 需求调优：用户反馈，张开放大后的自然收手会被旧的连续 spread velocity 模型解释成立刻缩小，造成画面跳动；缩小后的自然放松也有同类反向触发问题，左右推动平移也不够丝滑。
- 实现更新：`SolarInspectionController` 现在使用相位锁缩放。放大只消费手指张开阶段，然后锁住反向回弹，直到手回到稳定中性展开区。缩小要求短暂稳定开掌，只消费收拢阶段，并锁住放松回弹。
- 平移更新：单手推动平移现在使用稳定展开程度的 clutch、手掌锚点位移、小的世界空间死区和更低的低通 alpha，不再直接累积逐帧手掌 delta。
- 文档更新：PRD、AGENTS、TODO 和 TODO.zh-CN 现在都记录了带回弹保护的 M5.5 放大/缩小和 clutch 平滑平移。
- 影响文件：`src/interaction/solarInspectionController.ts`、`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：具体 spread 阈值、开掌保持时间、回弹解锁区间和平移平滑参数仍需人工摄像头验证。

### 2026-06-23 — Test & Replay Harness 工作流文档化

- 工作流更新：新增专门测试策略文档，明确先锁叶子纯函数和控制器序列测试，再做 JSON replay 和浏览器 E2E。
- 计划更新：在 TODO 中新增横切 `Test & Replay Harness` 工作流，而不是把测试专项插回过时的 `Milestone 3.7`。
- 长期规则更新：AGENTS 现在指向测试策略文档，并提醒未来会话在 M5.5 稳定前不要急着改 `main.ts` 或运行时 replay 接缝。
- 影响文件：`docs/testing/test-and-replay-harness.md`、`TODO.md`、`TODO.zh-CN.md`、`AGENTS.md`、`scripts/sync-agent-repo.mjs`。
- 剩余不明确项：具体 Vitest 测试文件和 fixture 格式留到第一轮实现切片再定。

### 2026-06-23 — 根据文档复核收紧 TODO 中旧 M5 措辞

- 需求/文档修正：用户指出 TODO 中“双手缩放、掌心朝前推拉玻璃窗缩放、掌心朝上整体旋转、以及是否不是 2D 旋转”等条目来自旧版手势语义；当前最新控制以 M5.5 的 `SolarFreeHover` 后单手观察控制为准。
- 文档更新：收紧 Milestone 3.5 验收措辞，使掌心朝前和掌心朝上信号明确只是 debug-only 历史诊断，不是当前用户可见产品控制，也不是未完成验收项。
- 历史日志更新：将 2026-06-21 的整体缩放/旋转语言标注为已被 2026-06-23 的 M5.5 决策取代，同时保留为项目历史。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：本次文档纠偏无剩余不明确项；M5.5 仍需真实摄像头调试，才能从 `NEEDS_MANUAL_VERIFY` 进入 `DONE`。

### 2026-06-23 — M5.5 观察后重新扶住纳入运行时验收

- 验证更新：运行时 M5.5 Debug checklist 现在有 8 项，新增 `re-grip-after-inspection`，让人工测试者可以看到缩放/平移观察改变自由悬浮 transform 后，重新扶住是否仍然命中更新后的端点。
- 实现更新：`updateSolarInspectionVerification` 只有在已经观测到 zoom-in、zoom-out 或 pan 之后，并且应用随后回到 `SolarHandleControl` 时，才点亮 `re-grip-after-inspection`；初次进入端点控制不会误算为该项通过。
- 报告/测试更新：导出的 M5.5 验收摘要 JSON 通过现有 checklist 数组包含新条目，`npm run verify:m5.5` 现在覆盖 8/8 完成以及防止过早计入 re-grip 的保护。
- 影响文件：`src/utils/types.ts`、`src/interaction/solarInspectionVerification.ts`、`scripts/verify-m5_5-solar-inspection.ts`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：运行时信号证明状态转换序列，但真实摄像头仍需验证缩放/平移后端点是否容易重新扶住。

### 2026-06-23 — M5.5 未完成进度也可导出人工证据

- 人工验收支持：`Export M5.5` 现在即使在没有任何 checklist 项完成前也可用，因此测试者在第一步失败或行为令人困惑时，也可以导出 0/8 或部分完成的报告。
- 报告/测试更新：`npm run verify:m5.5` 现在断言 pending report 保留全部 8 个 checklist 项、将 `free-hover` 暴露为下一个必测项目、保持 `passed: false`，并且不包含 landmark 数组。
- 影响文件：`src/main.ts`、`scripts/verify-m5_5-solar-inspection.ts`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：导出可用性无剩余不明确项；手势行为本身仍需真实摄像头验证。

### 2026-06-23 — M5.5 导出的 checklist 自描述增强

- 人工验收支持：导出的每个 M5.5 checklist 条目现在都包含用户动作、观察位置和通过条件，因此 JSON 报告可以独立说明验收证据，不必再回查 `TODO.md`。
- 报告/测试更新：`npm run verify:m5.5` 现在断言 completed report 和 pending report 都包含这些自描述 checklist 字段，并继续确认不含 landmark 数组。
- 影响文件：`src/interaction/solarInspectionVerification.ts`、`scripts/verify-m5_5-solar-inspection.ts`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：报告自描述无剩余不明确项；手势行为本身仍需真实摄像头验证。

### 2026-06-23 — M5.5 checklist 证据收紧且不新增测试

- 验证行为更新：运行时 M5.5 checklist 中的放大、缩小、平移和复位项，现在需要匹配 `inspectionScale` 或 `inspectionOffset` 证据，而不是只信任 `Solar inspect` intent 标签。
- 实现更新：`SolarInspectionVerificationSnapshot` 保留上一帧 inspection scale 和 offset，使 `updateSolarInspectionVerification` 可以确认 scale 增加、scale 减少、pan offset 变化，以及 reset 回到接近默认 transform。
- 工作流说明：用户会手动执行 M5.5 checklist 作为验收；本次收紧不新增测试脚本覆盖。
- 影响文件：`src/utils/types.ts`、`src/interaction/solarInspectionVerification.ts`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：手势行为本身仍需真实摄像头验证；自动 checklist 只是让记录到的证据更严格。

### 2026-06-23 — M5.5 Debug 面板显示下一步人工动作

- 人工验收支持：Debug 现在会从导出的 checklist 元数据里显示 `M5.5 next action`、`M5.5 observe` 和 `M5.5 pass`，用户可直接在浏览器里查看下一步动作、观察位置和通过条件，而不必频繁回查 `TODO.md`。
- 工作流说明：这只是应用侧人工测试辅助；M5.5 checklist 验收仍由用户手动执行。
- 影响文件：`src/rendering/debugOverlay.ts`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：手势行为本身仍需真实摄像头验证。

### 2026-06-23 — M5.5 单手太阳系观察实现

- 实现更新：新增仅在 `SolarFreeHover` 生效的 `SolarInspectionController`，支持单手张开放大、收拢缩小、握拳保持复位，以及手指展开稳定时的掌心推动平移。控制器会把观察后的自由悬浮 transform 同步回 `SolarOpeningController`，让后续端点重新扶住使用视觉上更新后的端点位置。
- Debug/状态更新：新增太阳系观察 debug 行，包含 intent、spread、spread velocity、pan score、palm velocity、reset hold、inspection scale 和 inspection offset；更新中文状态摘要和引导语，使用 M5.5 语义，不再使用已退役的 M5 缩放/旋转措辞。
- 平滑更新：M5.5 观察缩放现在有显式的每秒缩放变化上限，平移偏移使用按帧调整的低通滤波，同时保留复位路径。
- 文档更新：Milestone 5.5 现在标记为 `NEEDS_MANUAL_VERIFY`，代码层任务已勾选，并新增专门的 Milestone 5.5 人工验收清单。
- 人工验收支持：Debug 现在包含 `M5.5 checklist`、`M5.5 remaining`、`M5.5 next` 和 `M5.5 last hit` 行，显示 session 进度计数、剩余项目标签、下一个必测项目，以及最后一次命中的 M5.5 intent。
- 人工验收支持：Debug 现在会在 session checklist 首次达到 8/8 时记录 `completedAt`，并提供 `Export M5.5` 下载当前验收摘要 JSON，包括未完成或失败的 0/8 尝试。报告 schema 集中在 `solarInspectionReport.ts`，包含稳定的 checklist item id、动作/观察/通过条件文本和 `nextItem`，并由 `npm run verify:m5.5` 覆盖。
- 人工验收支持：Debug 控件现在包含 `Reset M5.5`，可清空当前 session checklist，便于连续多轮摄像头测试而无需刷新页面。
- 验证更新：新增 `npm run verify:m5.5`，编译并运行合成关键点控制器检查，覆盖 inactive 门槛、必须正好一只手、张开放大、收拢缩小、缩放限速、稳定推动平移、平移低通、慢速张开不误判平移、慢速推动不误判缩放、缩放边界、握拳保持复位和运行时 checklist 完成。npm 脚本现在委托给 `scripts/run-m5_5-verification.mjs`，不再内嵌很长的 shell 命令。
- 验证：`npm run verify:m5.5`、`npm run typecheck` 和 `npm run build` 通过。本地 Vite smoke 已确认 `/` 能返回入口 HTML，`/src/main.ts` 能返回接入了 `SolarInspectionController` 的应用模块。
- 影响文件：`src/interaction/solarInspectionController.ts`、`src/interaction/solarOpeningController.ts`、`src/main.ts`、`src/rendering/debugOverlay.ts`、`src/rendering/interactionStatusSummary.ts`、`src/utils/types.ts`、`scripts/verify-m5_5-solar-inspection.ts`、`package.json`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：单手张开/收拢速度阈值、平移分类、复位保持手感，以及缩放/偏移范围仍需真实摄像头调试；在 checklist 通过前，该里程碑保持 `NEEDS_MANUAL_VERIFY`。

### 2026-06-23 — M5.5 取代旧双手缩放/旋转控制

- 需求修正：用户明确指出旧 M5 手势（双手拉远/靠近缩放、掌心朝前“推拉玻璃窗”缩放、掌心朝上整体旋转，以及“是否不是 2D 旋转”的验收项）已经过时；M5.5 的 `SolarFreeHover` 后单手观察控制才是最新产品基准。
- 文档更新：将 Milestone 5 从活跃实现目标中退役，把旧手势语义标为历史/debug 协议上下文，并将 Milestone 5.5 提升为当前太阳系放大、缩小、复位和平移的实现里程碑。
- 已同步 PRD、AGENTS、TODO、TODO.zh-CN、人工测试脚本和 M3.5 协议清单措辞，使旧掌心/旋转/缩放字段明确为诊断信息，而不是当前产品控制。
- 影响文件：`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：M5.5 仍需要真实摄像头调试单手张开/收拢阈值、平移分类、复位保持时间，以及观察缩放/偏移范围。

### 2026-06-23 — M4 openProgress 平滑与 start/target 调试值

- 实现更新：`SolarOpeningController` 现在用按帧时长缩放的低通（`OPENING_PROGRESS_SMOOTHING`）加每帧上升上限（`MAX_OPENING_PROGRESS_RISE_PER_FRAME`），把显示的 `openProgress` 缓动追向原始手距驱动值，手距突跳时平滑展开而不是瞬间弹开。clamp 此前已具备，本次补的是上升平滑。真实反向收回仍可缓动下降；突降离群保护改为与原始上一帧 progress 比较，避免把平滑滞后误判为误检。
- 实现更新：在 Debug 面板暴露展开的 `start distance` / `target distance`（`Open start / target`），新增 `DebugSnapshot.solarStartDistance` / `solarTargetDistance` 字段。
- 影响文件：`src/interaction/solarOpeningController.ts`、`src/utils/types.ts`、`src/main.ts`、`src/rendering/debugOverlay.ts`、`TODO.md`、`TODO.zh-CN.md`。
- 剩余不明确项：平滑系数和上升上限需要真实摄像头调试，使展开既不抖动又保持跟手；M4 仍为 `IN_PROGRESS`，等待人工摄像头验证。

### 2026-06-23 — 对齐当前 M4 控制语义的文档同步

- 仅文档同步：明确 M4 人工验证清单现在覆盖 M4-A/B/C/D，并且端点释放后进入 `SolarFreeHover`，不是回到 `SolarActive`。
- 历史范围说明：当时 Milestone 5 仍围绕端点重握、缩放、视觉手轴控制、自由悬浮松手和反向收起表述；该说法已在 2026-06-23 稍后的 M5.5 澄清中被取代，旧缩放/旋转手势语义已退役。
- 协议澄清：M3.5 的 `Whole control` / `wholeSystemIntent` 只作为旧协议 Debug 值；可见 M4 太阳系行为的用户状态说明应使用 `interactionState` + `solarReason`。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md` 和 `AGENTS.md`。本次文档同步不修改应用代码。
- 已取代的不明确项：旧 M5 缩放/旋转调试已改为 M5.5 单手观察控制调试。

### 2026-06-23 — 用户可见状态说明对齐 M4 太阳系控制

- Bug 修复：状态说明仍可能显示旧 `wholeSystemIntent` 文案和参数，例如 `Lock`、`Re-grip`、`Transition=missing-hand-pair`，但当前可见太阳系已经由 `interactionState` + `SolarOpeningController` 驱动。
- 实现更新：状态说明现在只使用最新 M4 太阳系状态（`SolarActive`、`SolarHandleControl`、`SolarFreeHover`、`SolarClosing`）以及来自 `SolarOpeningController` 的真实 `solarReason`。旧整体协议值只保留在 Debug 面板中。
- 影响文件：`src/utils/types.ts`、`src/main.ts`、`src/rendering/debugOverlay.ts`、`src/rendering/interactionStatusSummary.ts`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`。
- 剩余不明确项：等旧 M4 前协议完全退场后，可以把 `wholeSystemIntent` debug 行重命名或放进高级 debug 区域。

### 2026-06-23 — M4C/D 自由悬浮松手与反向收起

- 实现更新：松开端点控制后现在进入 `SolarFreeHover`，并保持最后稳定 transform。双手回到左右端点后可以重新进入 `SolarHandleControl`。
- 实现更新：控制态下双手端点向内合拢会进入 `SolarClosing`；`openProgress` 随手距反向下降，达到收起完成阈值后隐藏占位太阳系并回到 `EmptyIdle`。
- 影响文件：`src/interaction/solarOpeningController.ts`、`src/interaction/stateMachine.ts`、`src/rendering/interactionStatusSummary.ts`、`src/main.ts`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`。
- 剩余不明确项：端点释放宽限、收起开始/完成阈值，以及收起中丢手时应取消回控制态还是进入自由悬浮，都需要真实摄像头调试。

### 2026-06-23 — M4-A/B 展开后控制改为端点门控

- 需求细化：初次拉开完成后，任意可见双手不应继续控制太阳系。展开后的整体控制需要双手稳定命中太阳系左右控制端点。
- 实现更新：`SolarActive` 现在默认保持最后稳定 transform，只有端点命中稳定后才进入 `SolarHandleControl`。历史说明：这里曾把 `SolarHandleControl` 描述为唯一移动/缩放/旋转状态；2026-06-23 稍后的文档已退役旧缩放/旋转产品语义，改以 M5.5 单手观察控制为准。手型门槛有意推迟，避免端点太难抓。
- 影响文件：`src/interaction/solarOpeningController.ts`、`src/rendering/interactionStatusSummary.ts`、`src/main.ts`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`AGENTS.md`。
- 剩余不明确项：端点进入/退出半径和稳定时间需要真实摄像头调试。

### 2026-06-23 — M4-A/B 快速撤手稳定性保护

- Bug 修复：快速撤手或画面边缘 MediaPipe 误检会产生一帧错误中点和明显变小的手距，导致占位太阳系突然横向跳位并缩小。
- 实现更新：`SolarOpeningController` 现在会在更新太阳系 transform 前拒绝突变的进度、距离、缩放和中点异常帧，并且只有候选双手几何通过稳定性检查后，才把该双手配对记录为新的参考。
- 影响文件：`src/interaction/solarOpeningController.ts`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`AGENTS.md`。
- 剩余不明确项：真实摄像头测试需要继续调试 outlier 阈值，确保未来有意的反向收起手势可用，同时不重新引入快速撤手跳变。

### 2026-06-22 — M4-A/B 视觉控制端点替代杆状 overlay

- 需求细化：整体展开不应使用操纵杆/杆状控制视觉。太阳系左右边缘应显示两个独立的 3D 控制端点。
- 实现更新：占位太阳系 group 现在自身包含两个端点标记，展开缩放也使用同一端点跨度。旧的 2D 虚拟端点标记在可见太阳系状态下隐藏。
- 影响文件：`src/solar/solarSystem.ts`、`src/solar/solarSystemData.ts`、`src/interaction/solarOpeningController.ts`、`src/rendering/landmarkOverlay.ts`、`src/main.ts`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`AGENTS.md`。
- 剩余不明确项：端点颜色、大小和手到边缘的精确贴合仍需摄像头实测调试。

### 2026-06-22 — M4-A/B 拉开占位太阳系已接入

- 实现更新：将 hand-only 启动流程接入代码占位太阳系层。`PullArmed` 现在进入 `SolarOpening`；手距驱动 `openProgress`；双手中点、跨度和视觉手轴驱动占位太阳系 transform；完全展开后进入 `SolarActive`。
- 范围边界：本次只实现 M4-A/B。M4-C 松手悬浮、M4-D 反向收起、逐元素显现时序和最终平滑/阈值调试仍未完成。
- 验证：`npm run typecheck`、`npm run build` 和 headless Chrome 桌面/移动视觉回归检查通过。真实摄像头手势行为仍需要用户验证。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`src/main.ts`、`src/rendering/interactionStatusSummary.ts`，以及新增 `src/interaction/solarOpeningController.ts`。
- 剩余不明确项：真实摄像头测试需要调试展开目标距离、视觉缩放、旋转手感，以及太阳系在 `PullArmed` 后是否出现过早或过晚。

### 2026-06-22 — 新增全代码占位太阳系视觉层

- 需求实现：在 Milestone 4 前新增开发专用全代码占位太阳系层。正常产品路径仍保持视觉空场；`?solarPreview=1` 不需要摄像头权限即可显示程序太阳系预览。
- 新增可复用的数据驱动太阳系层，包含程序纹理、轨道环、公转、自转、月球绕地球、土星环、未来交互元数据、renderer 对象挂载接口和帧时间。
- 将 Milestone 3.7 标记为 `DONE`，并调整 Milestone 4，使其后续连接可复用占位层，而不是重新构建初始太阳系 group。
- 验证：`npm run typecheck`、`npm run build` 和 headless Chrome 桌面/移动预览检查均通过。默认路由 WebGL canvas 为空；`?solarPreview=1` 非空且持续运动；控制台错误为空。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`index.html`、`src/main.ts`、`src/rendering/scene.ts`、`src/utils/types.ts`，以及新增 `src/solar/solarSystemData.ts`、`proceduralMaterials.ts`、`celestialBody.ts`、`solarSystem.ts`。
- 剩余不明确项：最终 M4 的手势驱动放置、展开显现曲线和正式贴图来源仍需要实现与调试。

### 2026-06-22 — 更新行星焦点手势模型和里程碑计划

- 需求细化：用新的行星交互模型替换旧的天体抓取/冻结/release 闭环：hover、pinch 激活、主手 pinch 锁定 + 副手张开进入 `PlanetFocusView`、始终保持自转、单颗行星缩放/平移/托住、副手 `PinchTap` 放下悬浮，以及 pinch-and-throw 甩回。
- 新增 Milestone 5.5，用于太阳系自由悬浮后的单手观察控制；重写 Milestone 6-9，使其围绕可交互天体元数据、pinch 激活、单颗行星画面、PinchTap 放下、焦点悬浮和甩回展开。
- 更新 PRD 和长期 agent 规则：被激活/聚焦天体停止原轨道公转但保持自转；普通放下不回轨，也不退出单颗行星画面。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md` 和 `~/CodeXProject/物理宇宙资料/手势操控语义整理.md`。
- 剩余不明确项：单手张开/收拢阈值、PinchTap 时序、托住停留时间、聚焦天体屏幕限制和甩回方向阈值都需要真实摄像头调试。

### 2026-06-22 — 规范更新：复用 vs 自写的权衡、死状态规则、变更日志范围

- 仅为文档/规范变更，不改变任何代码行为。修补的是"用变更日志里的真实坑去对照规范章节"后发现的缺口。
- 重写了 `Recommended Tech Stack` 里那条笼统的"用 Three.js vector math"：它既没被执行（我们手写过 `tan(fov/2)` 投影、抄过 `HAND_CONNECTIONS` 表），又和"刻意保留 `src/utils/math.ts`"的决定冲突。新增了一节平衡的 `Coding Rules → Reuse vs. Custom`——需求匹配优先，自写代码在更贴合我们数据/需求时是正当的，不要为了"用上依赖"而硬靠，并把已认可的自写例外（`utils/math.ts`、`landmarkOverlay` 绘制函数）记录下来，避免后续 session 去"纠正"。同时保留"先查库"的预期（如用 `Raycaster` 而非 `tan(fov/2)`）。
- 在 `Coding Rules` 加了一条禁止"只写不读的死状态"，因为 `pullTrendSince` 曾跨多个 session 残留后才被删除。
- 放宽了变更日志同步规则（`AGENTS.md` 同步协议第 6 条）：持久性的工程重构/规范变更也要记日志，不只是需求变更。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`。产品行为无变化，故 `ar_solar_system_prd.md` 不变。
- 仍存歧义：无。

### 2026-06-22 — M4 前重构：手部骨架与世界坐标反投影改用库自带能力

- 仅为工程重构，不改变任何产品行为或验收标准。移除了两处"重复造轮子"——它们重复实现了现有依赖已经提供的能力。
- `src/rendering/landmarkOverlay.ts` 现在从 MediaPipe 的 `HandLandmarker.HAND_CONNECTIONS` 获取 21 点手部骨架连接表，不再手抄一份。绘制本身（`drawLine` / `drawPoint`）仍保留自写，因为它必须经过 `coordinateMapping.mapNormalizedToStagePixel` 来做镜像 + `object-fit: contain` + 视网膜 DPR 对齐，而库自带的 `DrawingUtils`（直接 `x * canvas.width`，无镜像/contain 钩子）不支持这一点。
- `coordinateMapping.mapNormalizedToWorld` 现在用 three 的 `Raycaster` 对真实相机（`scene.getCamera()`）和 `z = INTERACTION_PLANE_Z` 平面做反投影，取代原先手写的 `tan(fov/2)` 投影——后者只在"相机固定且无旋转"时才正确。新实现零分配（复用 `Raycaster` / `Vector2` / `Vector3` / `Plane`），并在 layout 无尺寸或射线与平面平行时返回 `null`。
- 签名变更：`mapNormalizedToWorld(point, layout, camera, planeZ)`（原为 `(point, layout, viewport)`）。删除了不再使用的 `PerspectiveViewport` 类型与 `scene.getInteractionViewport()`，改由 `scene` 暴露 `getCamera()`。二者均为 M4 预留、当前无调用，故没有任何线上调用方受影响。
- 决策（维持原状）：`src/utils/math.ts` 的标量/向量工具**未**改用 `THREE.MathUtils` / `Vector3`——关键点数据是带 `visibility` 的普通 `{x,y,z}` 对象，换 Vector3 反而带来每帧分配/转换且无收益。平滑用的 One Euro Filter 同样推迟到 M4 直接操控让"抖动/延迟"权衡变得用户可感知时再考虑。
- 已验证：`npm run typecheck` 与 `npm run build` 均通过。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`src/rendering/landmarkOverlay.ts`、`src/interaction/coordinateMapping.ts` 和 `src/rendering/scene.ts`。产品行为无变化，故 `ar_solar_system_prd.md` 不变。
- 仍存歧义：M4 需在 3D 内容出现、相机可能移动后，确认 `mapNormalizedToWorld` 能让端点在视觉上贴合双手。

### 2026-06-22 — M4 前重构：将 wholeSystemIntent.ts 拆成聚焦模块（Steps 4–7）

- 将 ~1428 行的整体太阳系协议文件拆成"编排层 + 聚焦的无状态模块"，行为零变化。已验证为纯搬迁：把调参常量解析回数字后，每个被搬函数和控制器 class 与重构前逐字一致（每一步 typecheck + build 均通过）。
- 新增模块：`handLandmarks.ts`（共享 MediaPipe landmark 索引）、`palmOrientation.ts`（掌心法线/朝向/朝上）、`handPose.ts`（手型 open/grip/release 打分）、`intentScoring.ts`（纯算分：控制/松手/重新扶住置信度、缩放/旋转/收起意图、端点匹配、pinch 分离，以及共享类型 `HandPointPair`/`VirtualEndpoints`/`EndpointMatch`）。
- `wholeSystemIntent.ts` 现在只剩编排：`WholeSystemIntentController` 状态机、跨帧状态，以及有状态的旋转速度打分（因需要上一帧角度/法线，必须留下）。1428 → 792 行。
- Step 8（把状态机本身拆成 release/re-grip/collapse 控制器）有意推迟到 M4/M5 之后，避免同时承担 3D 工作和状态机重构两套不稳定。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`src/interaction/wholeSystemIntent.ts`，以及新增 `src/interaction/handLandmarks.ts`、`palmOrientation.ts`、`handPose.ts`、`intentScoring.ts`。未改动任何产品行为、交互规则或验收标准，因此 `ar_solar_system_prd.md` 不变。
- 剩余不明确项：本次重构无；搁置的录制/回放 + 单测方案留待下一步重聊。

### 2026-06-22 — M4 前重构收尾：完成数学收口并移除死状态

- 将剩余重复数学收进 `src/utils/math.ts`：新增 `averagePoints`（之前在 `handTracker.ts` 和 `wholeSystemIntent.ts` 各有一份），并让 `smoothing.ts`（`lerp`）、`gestureCalibration.ts`（`clamp`）、`handTracker.ts`（`distance3d`）改为从中导入。`utils/math.ts` 之外不再有共享数学的本地副本。
- 移除 `handStartupGesture.ts` 中只写不读的死状态 `pullTrendSince`；启动行为不变。
- 强化 AGENTS 的 "Single Sources of Truth" 规则，要求后续模块导入共享数学而不是各自重定义。
- 已验证：`npm run typecheck` 和 `npm run build` 通过。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`src/utils/math.ts`、`src/tracking/smoothing.ts`、`src/tracking/handTracker.ts`、`src/interaction/gestureCalibration.ts`、`src/interaction/wholeSystemIntent.ts` 和 `src/interaction/handStartupGesture.ts`。
- 剩余不明确项：无。

### 2026-06-22 — M4 前重构：坐标映射 SoT、集中调参、统一左右、关闭 pose

- 仅为工程重构，不改产品行为或验收标准。为 Milestone 4 做准备，并消除后续冲突隐患。
- 新增 `src/interaction/coordinateMapping.ts` 作为归一化坐标→舞台像素/世界坐标的单一映射源（感知 object-fit: contain + 镜像）。`src/rendering/scene.ts` 现在导出相机参数和 `getInteractionViewport()`。Debug 关键点 overlay 走这个映射；M4 的 3D 端点必须使用同一模块，以保证内容与双手像素对齐。
- 将整体太阳系的所有手势阈值和混合权重抽取到 `src/interaction/intentTuning.ts`。数值保持不变，因此手势行为完全一致；调手势请改这里，而不是改打分函数。
- 将视觉左/右双手分配统一到 `src/interaction/handPairing.ts`（视觉左 = 镜像预览中较大的相机 x）。startup 和手部基础特征模块之前用的是相反的原始相机约定；本次只修正了 debug 读数，因为整体控制本来就会重排为视觉顺序。
- 将重复的向量/标量数学合并到 `src/utils/math.ts`。
- 性能：`PoseLandmarker` 通过 `src/tracking/config.ts` 的 `ENABLE_POSE_TRACKING` 默认关闭（它不参与任何判定，却抢占手部追踪算力；开启时降频运行）。移除关键点 overlay 每点调用 `getBoundingClientRect` 的重排，并将预览调试指标门控在 debug 可见时才计算。
- 已验证：`npm run typecheck` 和 `npm run build` 通过；坐标映射数学已用数值自检。真实摄像头手势复测（M3/M3.5/M3.6 `NEEDS_MANUAL_VERIFY`）仍待进行。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`src/tracking/config.ts`、`src/tracking/mediapipe.ts`、`src/utils/math.ts`、`src/interaction/handPairing.ts`、`src/interaction/coordinateMapping.ts`、`src/interaction/intentTuning.ts`、`src/interaction/handStartupGesture.ts`、`src/interaction/handPrimitives.ts`、`src/interaction/wholeSystemIntent.ts`、`src/rendering/scene.ts`、`src/rendering/landmarkOverlay.ts` 和 `src/main.ts`。
- 剩余不明确项：M4 需要确认世界平面深度，以及用新映射时端点能在视觉上贴住双手。`handStartupGesture.ts` 中的 `pullTrendSince` 仍是待清理的死状态。

### 2026-06-22 — 新增 M3.6 手势诊断与自适应阈值

- 需求细化：Milestone 4 之前，新增统一手部基础特征层、会话自适应阈值、结构化状态跳转原因、追踪置信度和不记录视频的手势 debug recorder。
- 启动合拢/拉开阈值、整体端点半径、重新扶住半径和反向收起距离现在来自当前会话校准值，这些值由手掌尺度以及观察到的闭合/拉开手距推导。
- Debug 现在暴露基础特征分数、校准值、端点命中分数、追踪置信度、startup/whole 跳转原因和 recorder 状态；recorder 导出只包含结构化 JSON。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`index.html`、`src/main.ts`、`src/styles.css`、`src/utils/types.ts`、`src/interaction/handPrimitives.ts`、`src/interaction/gestureCalibration.ts`、`src/interaction/gestureDebugRecorder.ts`、`src/interaction/handStartupGesture.ts`、`src/interaction/wholeSystemIntent.ts`、`src/rendering/debugOverlay.ts` 和 `src/rendering/interactionStatusSummary.ts`。
- 剩余不明确项：需要真实摄像头验证自适应阈值是否提升稳定性，并确认导出的 debug 日志足够定位失败手势。

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

- 历史需求澄清，已在 2026-06-23 被取代：在添加太阳系 3D 内容之前，项目应先锁定整体太阳系交互合同，包括双手合拢不播放动画、双手吸附拉开展开、松手后自由悬浮、通过端点重新扶住、掌心朝前缩放、掌心朝上 3D 旋转。
- 新增 Milestone 3.5，作为 Milestone 4 前的接入 3D 前设计/debug 关口。
- 当时更新 Milestone 4 和 Milestone 5，使展开、松手、重新扶住、缩放和旋转语义匹配当时的长期交互模型。当前太阳系观察控制已改为 `SolarFreeHover` 后的 M5.5 单手控制；旧缩放/旋转信号只保留为 debug-only 历史信息，除非用户明确重新启用。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md` 和 `ar_solar_system_prd.md`。
- 已取代的不明确项：旧缩放/旋转控制的掌心朝向阈值不再是产品验收阻塞项；端点命中区域仍与把手重新扶住/松手相关。

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
