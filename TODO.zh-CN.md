# TODO.zh-CN.md

项目：AR Solar System Webcam Gesture Demo
当前规划基线：PRD v0.8，2026-06-25
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
- [ ] 太阳系只在画面处于 `EmptyIdle` 空场，用户双手/双拳在摄像头可见画面任意位置合拢进入 `HandsClosed`，再从该基线向两侧拉开进入 `PullArmed` 之后出现。
- [ ] 只合拢双手/双拳本身不会播放任何太阳系动画，也不会显示 3D 内容。
- [ ] 展开进度由手距驱动；如果手停住，不应自动展开完成。
- [ ] 展开端点需要视觉上跟随双手。
- [ ] 展开后的太阳系可以使用身体相对参考来增强 AR 感，但松手后可以悬停在用户选择的任意位置。
- [ ] 松开整体双手控制后，太阳系保持悬浮在最后稳定位置和缩放。
- [ ] 整体太阳系总览使用固定的 AE 等效强斜俯视角；运行时控制只更新位置和缩放，不再使用手势驱动整体旋转或 quaternion transform。
- [ ] 双手重新扶住左右端点后，可以继续进行整体把手控制，用于放置、松手和收起。
- [ ] 已展开状态下，双手扶住端点向内合拢会让太阳系反向收起，并在完全合拢后回到空摄像头画面。
- [ ] Milestone 5.5 单手太阳系观察控制已退役：进入 `SolarFreeHover` 后，单手五指张开不放大、收拢不缩小、握拳保持不复位、推动不平移。
- [ ] 掌心朝前“推拉玻璃窗”缩放和掌心朝上整体旋转属于已退役的 M5 旧手势语义；除非用户明确重新启用，否则只保留为历史/debug 协议上下文。
- [ ] MVP 中水星、金星、地月整体、火星、木星、土星、天王星和海王星均可 hover 并 pinch 激活；月球不再是总览独立激活入口，命中月球会映射到地月整体。
- [ ] 被 pinch 激活的入口停止原轨道公转但保持自然自转；当激活从 A 切换到 B 时，A 立即恢复原轨道公转，且只有当前激活入口可以暂停公转，地月整体除外。
- [ ] 地月激活特殊绑定：激活地月整体时，地球绕太阳公转暂停，月球仍可继续绕地球公转；地月焦点默认显示地球，只能通过左上角 0.5 秒长按切换按钮进入月球视角。
- [ ] Pinch 激活后，同一只激活手的拇指/食指 DoubleClose 进入单颗行星画面。
- [x] 第一阶段单颗行星画面中，当前行星以统一 overlay 明确显示，背景太阳系弱化并锁定交互，但保留基础动效。
- [ ] 当前行星在激活、焦点、热区跟手、放下悬浮和观赏期间都保持自转；单颗行星单手缩放/平移/复位已退役。
- [ ] 单手热区停留可让当前星球跟手，双手热区停留可跟手并按手距缩放，跟随手 `PinchTap` 会解除跟手控制并让行星悬浮在单颗行星画面中。
- [ ] 单颗行星焦点状态中，屏幕左上角显示透明玻璃质感按钮；用摄像头追踪到的食指尖按住“长按返回太阳系”1 秒填满进度条后，让当前行星回轨，播放 0.5 秒位置/大小调整动画，恢复背景不透明度、解锁太阳系交互，并退出回太阳系画面。鼠标/DOM pointer 点击不是产品路径，掌心朝屏幕开掌返回已退役。
- [ ] 仅在地月焦点中，返回按钮下方出现第二个左上角玻璃按钮。追踪到的食指尖按住“长按切换月球视角”或“长按切换地球视角”0.5 秒会切换当前焦点 overlay 和热区，不回到太阳系画面；其他焦点天体隐藏该按钮。
- [ ] 视觉效果工作必须保留已经测试通过的交互逻辑和既有展示控制逻辑；除非用户明确要求修改逻辑或展示控制行为。
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

目标：只在空场画面中基于双手检测启动手势：在 `EmptyIdle` 中双手合拢，然后从 `HandsClosed` 合拢基线向两侧拉开。该手势不得依赖胸前锚点、肩膀或身体姿态。只要双手在摄像头可见画面中，用户应能在胸前、头顶、身体侧边或其他任意可见位置触发拉开预备状态；但太阳系或天体交互内容已经激活后，同样的合拢/拉开动作不得重新进入启动链路。

任务：

- [x] 检测稳定的左手和右手中心点。
- [x] 计算双手中点、手距、手部方向向量和手距速度。
- [x] 使用低通滤波平滑双手位置和手距。
- [x] 当手部追踪短暂丢失时，短暂保持上一稳定手部位置。
- [x] 检测双手是否在摄像头可见画面的任意位置合拢。
- [x] 检测双手在合拢状态后是否持续向两侧拉开。
- [x] 将 `HandsClosed` 入口限制为 `EmptyIdle` 空场启动链路。
- [x] 要求 `PullArmed` 必须来自 `HandsClosed`；普通双手拉开动作不能直接启动。
- [x] 离开空场启动链路后清空启动手势记忆，避免后续场景继承旧的合拢证据。
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
- [x] 当应用处于 `EmptyIdle` 且画面为空场时，双手在摄像头可见画面的任意位置合拢可以进入 `HandsClosed`。
- [x] 当双手从 `HandsClosed` 合拢基线持续拉开时，应用可以进入 `PullArmed`。
- [x] 在 `SolarFreeHover`、`SolarHandleControl` 或天体交互等非空场状态下，同样的合拢到拉开动作不会进入 `HandsClosed` 或 `PullArmed`。
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
This is a requirement adjustment. The startup gesture must no longer depend on the chest anchor, shoulders, or body position. The core trigger is hand gesture only while the scene is empty: both hands close together in `EmptyIdle` to enter `HandsClosed`, then pull apart from that baseline to enter `PullArmed`.

Requirements:
1. Detect left-hand and right-hand centers.
2. Smooth both hand positions.
3. Compute hand midpoint, hand distance, hand distance velocity, and hand direction vector.
4. Detect when both hands are close together anywhere in the visible camera frame, but only while the current interaction state is `EmptyIdle`.
5. Detect when both hands continuously move apart after entering `HandsClosed`; generic two-hand pull-apart motion must not directly arm startup.
6. Add states: `CameraReady`, `EmptyIdle`, `HandsClosed`, and `PullArmed`.
7. Show debug values for left hand, right hand, hand midpoint, hand distance, distance velocity, current state, both-hands-visible, and lost-hand hold.
8. Keep the AR scene empty. Do not render the solar system yet.
9. Outside the empty startup chain, closed/pull hand motion must be interpreted by the active scene state or ignored; it must not re-enter `HandsClosed` or `PullArmed`.

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
- Pulling hands apart from any of those `HandsClosed` positions can enter `PullArmed`.
- After the solar system is open or free-hovering, ordinary two-hand close/pull motion away from endpoints does not re-enter `HandsClosed` or `PullArmed`.
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
- [x] 松手表示未来太阳系会保持最后稳定的位置和缩放，并使用固定总览角度，而不是吸回胸前锚点或屏幕中心。
- [x] 已接受的张开手松手会冻结端点，并防止用户慢慢撤手时立刻重新扶住。
- [x] 掌心朝上的托举保持诊断会保持 `SolarHandleControl`，不会被误判为松手。
- [x] 重新扶住可以通过更宽容的磁吸区恢复，不要求用户精确重新对齐身体或摄像头位置。
- [x] 重新扶住表示双手回到视觉左/右端点附近后，可以不 pinch 就继续整体控制。
- [x] 掌心朝前左右推拉只保留为历史 debug/协议诊断；它不是当前用户可见的太阳系缩放控制。
- [x] 已展开状态下，双手扶住端点向内合拢被定义并调试为反向收起，而不仅是普通缩小。
- [x] 反向收起完成后，回到初始空摄像头画面。
- [x] 掌心朝上轻轻旋转和掌心法线变化只保留为历史 debug/协议诊断；它们不是当前用户可见的整体太阳系旋转控制。
- [x] Debug 面板暴露整体太阳系协议值，且不渲染太阳系 3D 内容。
- [x] 右上角中文状态说明避免把已退役的缩放/旋转诊断或已退役的 M5.5 观察控制显示成产品控制；可见太阳系行为应通过当前交互状态和松手/重新扶住/收起生命周期解释。
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
- [x] 保持占位层独立于启动手势、hover、激活、焦点和返回逻辑。

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

实现备注（2026-06-23，2026-06-30 更新）：M4-A/B/C/D 代码已接入。`PullArmed` 现在会进入 `SolarOpening`；代码占位太阳系由手距、中点、缩放和 `openProgress` 驱动，整体 3D 视觉角度固定为 AE 等效强斜俯视总览角度；完全拉开后进入 `SolarActive`。展开控制视觉是太阳系本地左右边缘的两个 3D 控制端点，不再使用中间连线式的操纵杆。展开完成后，`SolarActive` 默认保持最后稳定位置和缩放；任意可见双手不再移动模型。只有双手稳定命中左右端点后，才会进入 `SolarHandleControl` 并恢复整体控制。松开端点控制会进入 `SolarFreeHover` 并保持最后稳定位置/缩放；当双手没有扶住左右端点时，`SolarActive` 自身也会在短暂宽限后落到 `SolarFreeHover`。已退役的 M5.5 单手观察控制不再在 `SolarFreeHover` 中运行；释放后的太阳系等待端点重新扶住或反向收起。控制态下双手向内合拢会进入 `SolarClosing`；达到收起阈值后隐藏全部太阳系内容并回到 `EmptyIdle`。当前暂不加入手型门槛，保证端点容易重新扶住。快速撤手或画面边缘误检造成的突变双手几何会被拒绝，避免模型突然缩小或跳位。2026-06-30 更新：整体旋转平滑和外部传入的 rotation/quaternion transform 已退役，运行时控制器只更新位置和缩放。这仍需要真实摄像头验证。

任务：

- [x] 添加 `SolarOpening` 和 `SolarActive` 状态。
- [x] 从 `PullArmed` 状态检测双手分离移动。
- [x] 根据手距计算 `openProgress`。
- [x] 限制并平滑 `openProgress`。
- [x] 防止手距停止增加后自动展开完成。
- [x] 支持已展开端点双手向内移动时的反向进度。
- [x] 将可复用的代码占位太阳系 group 接到 `SolarOpening` 进度和手势驱动的位置/缩放。
- [x] 在展开开始前，让所有太阳系 3D 物体保持不可见。
- [x] `HandsClosed` 保持视觉静止，不播放太阳系动画，也不显示 3D 内容。
- [x] 展开期间，将视觉左右端点绑定到左右手。
- [x] 将展开控制表现为太阳系边缘两个独立 3D 端点，而不是连接式操纵杆/杆状 overlay。
- [x] 拒绝突变的双手几何异常帧，使快速撤手或边缘误检时保持最后稳定的太阳系位置/缩放，而不是突然缩小/跳位。
- [x] 完全展开后，`SolarActive` 保持最后稳定位置/缩放；双手稳定命中端点会 re-grip 进入 `SolarHandleControl`，不扶住端点则落到 `SolarFreeHover`，但不会启用已退役的单手观察控制。
- [x] 使用 `SolarHandleControl` 作为展开后唯一可以恢复整体端点把手控制、松手或反向收起的状态。
- [x] 当前暂不要求手型门槛；张开的手从模型附近经过时，除非双手同时命中端点，否则不应获得控制。
- [x] 让用户可见状态说明与最新 M4 状态机保持一致；旧 `wholeSystemIntent` 松手/重新扶住数值只保留在 Debug 面板。
- [ ] 根据 `openProgress` 渐进显示太阳、轨道、天体、星尘和星云。
- [x] 展开完成后，将太阳系放置在双手拉开的当前位置，可选使用身体相对参考增强 AR 感。
- [x] 当反向收起达到闭合阈值时，隐藏全部太阳系内容并回到 `EmptyIdle`。
- [x] 整体双手控制松开后，保持最后稳定的太阳系位置/缩放，不重新居中；总览角度固定不变。
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
| 中点和缩放跟随 | 拉开过程中，让双手整体向左/右/上/下或斜向移动。 | 预览。 | 太阳系中心接近双手中点，大小跟随手距变化；已确认的斜俯视总览角度保持固定。 |
| 完全展开后保持 | 继续拉开到足够远，然后双手从太阳系附近或上方经过，但不要同时停在左右端点上。 | 状态说明、Debug 的 `Startup state` / `openProgress` 和预览画面。 | 交互状态进入 `SolarActive`，随后在双手不在左右端点上时落到 `SolarFreeHover`；`openProgress` 为 `1.00`；太阳系保持最后稳定位置/缩放，不跟随任意双手移动。 |
| 端点重新扶住控制 | 在 `SolarActive` 下，让双手分别靠近左右 3D 控制端点并短暂保持，然后一起移动双手。 | 状态说明和预览画面。 | 状态进入 `SolarHandleControl`；只有这时太阳系才跟随双手中点和距离，固定总览角度不变。 |
| 离开端点后进入自由悬浮 | 在 `SolarHandleControl` 中，把一只手或双手离开端点/移出画面。 | 状态说明和预览画面。 | 状态进入 `SolarFreeHover`；太阳系冻结在最后稳定位置/缩放。 |
| 快速撤手稳定性 | 模型大部分展开或完全展开后，快速把一只手或双手向屏幕边缘/画面外撤出。 | 预览和 Debug 的 `Solar scale`。 | 短暂追踪异常时模型保持最后稳定位置/缩放；不得突然跳到一侧或缩成很小。 |
| 松手后自由悬浮 | 在 `SolarHandleControl` 中，让一只手或双手明显离开端点。 | 状态说明和预览画面。 | 交互状态进入 `SolarFreeHover`；太阳系停留在松手时的位置和大小，固定总览角度不变。 |
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

决策说明（2026-06-24）：旧版“双手距离控制放大/缩小”“掌心朝前左右推拉像玻璃窗一样缩放”“掌心朝上扭动触发整体 3D 旋转”不再是当前产品验收标准。2026-06-23 曾引入的 M5.5 单手太阳系观察控制也已按用户最新要求退役并删除。M3.5 中的缩放/旋转/掌心协议字段只作为历史 debug 诊断保留。

任务：

- [x] 移除双手拉远放大、掌心朝前玻璃窗缩放、掌心朝上整体旋转的活跃 TODO 验收项。
- [x] 保留 M4 中的端点重新扶住、松手、自由悬浮和反向收起作为当前整体把手生命周期。
- [x] 不再把 M5.5 作为 `SolarFreeHover` 后太阳系放大、缩小、复位和平移的当前实现里程碑。

验收标准：

- [x] 后续实现提示不再指向 M5.5 作为用户可见的太阳系观察控制。
- [x] 除非用户明确重新启用旧需求，否则不得把旧掌心朝前或掌心朝上 M5 语义扩展进 `SolarHandleControl`。
- [x] 文档明确区分历史协议 debug 字段和当前产品控制。

## Milestone 5.5 — 已退役的太阳系自由悬浮单手观察控制

状态：`DONE`

目标：删除太阳系释放到 `SolarFreeHover` 后的单手放大、缩小、恢复默认和平移控制。

退役说明（2026-06-24，2026-06-30 更新）：用户移除了 M5.5 单手五指张开放大、单手收拢缩小、握拳保持复位和单手推动平移。`SolarFreeHover` 现在保持最后稳定位置/缩放和固定总览角度，并等待端点重新扶住或反向收起。

任务：

- [x] 删除 `SolarInspectionController` 及其单手张开/收拢/握拳/推动 transform 逻辑。
- [x] 删除运行时 M5.5 Debug checklist、`Export M5.5`、`Reset M5.5`、验收报告 helper 和验证累积器。
- [x] 删除 `npm run verify:m5.5` 和移植过来的 `solarInspectionController` gesture 测试。
- [x] 保留 `SolarFreeHover` 本身：它保存最后稳定太阳系 transform，并允许端点重新扶住/反向收起。
- [x] 更新状态说明和引导文案，使 `SolarFreeHover` 不再提示用户使用单手观察手势。

验收标准：

- [x] `SolarFreeHover` 中，单手五指张开不会放大太阳系。
- [x] `SolarFreeHover` 中，单手五指收拢不会缩小太阳系。
- [x] `SolarFreeHover` 中，握拳保持不会复位太阳系视图。
- [x] `SolarFreeHover` 中，单手推动不会平移太阳系。
- [x] 没有 M5.5 Debug checklist/export/reset UI，也没有 `verify:m5.5` npm 脚本。
- [x] `npm run build` 通过。
- [x] 运行时代码路径不再 import 或运行 solar-inspection controller 逻辑。

## Milestone 6 — 天体数据模型和地月整体入口

状态：`DONE`

目标：为所有 MVP 天体创建统一的数据驱动模型，包含 hover、激活、焦点画面和回轨元数据，同时把地球和月球作为一个总览激活入口。

任务：

- [x] 为水星、金星、地球、火星、木星、土星、天王星、海王星和月球定义 `CelestialBodyId` / `InteractiveCelestialBodyId`，并把月球作为地月总览入口的一部分处理。
- [x] 定义天体元数据：名称、标签、近似视觉尺寸、轨道半径、轨道速度、自转速度、颜色/占位纹理、激活命中半径、焦点默认 transform、回轨/原轨道目标、父级天体（如有）。
- [x] 为每个天体实现简化视觉模型。
- [x] 添加可识别的土星环。
- [x] 让月球默认围绕地球运行。
- [x] 将所有天体保存在一个 registry 中，供渲染、hover、激活、焦点、悬浮和回轨逻辑使用。
- [x] 添加可在 hover/激活/焦点状态显示的标签。
- [x] 添加原始轨道 transform 数据，以支持返回行为。
- [x] 确保没有为每个行星编写重复的一次性激活或焦点逻辑。

验收标准：

- [x] 九个 MVP 天体都由同一个数据模型表示。
- [x] 太阳系展开后，天体在简化轨道上渲染。
- [x] 月球与地球视觉上可区分。
- [x] 土星有明确的环。
- [x] 返回轨道逻辑可获取原始轨道位置/层级数据。
- [x] 后续手势管线可获取焦点默认大小/位置和激活热区半径；月球总览命中映射到地月整体入口，而不是独立月球激活。
- [x] `npm run build` 通过。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 6: data-driven celestial body model for nine rendered/focus-capable bodies and eight overview activation entries.

Context:
Read @ar_solar_system_prd.md sections 7.7, 8.2, and 17.

Constraints:
- Use one shared celestial body model and registry.
- Include Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Moon in the data model; expose Moon in the overview only as a hit point mapped to the Earth-Moon entry.
- Keep visuals lightweight and MVP-friendly.
- Do not implement the full planet focus gesture pipeline yet unless needed for data hooks.

Done when:
- All nine bodies render after opening.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 7 — Hover、高亮和 Pinch 激活

状态：`NEEDS_MANUAL_VERIFY`

目标：让用户可以 hover 并 pinch 激活八个 MVP 总览入口，同时避免拖动太阳系，并确保激活不会冻结自转。

任务：

- [x] 将每个可交互天体的 3D 位置投影到屏幕坐标。
- [x] 计算手到天体的屏幕空间距离。
- [x] 为水星添加更大的命中区域；月球保留总览命中点，但映射到地月整体入口，而不是独立月球激活。
- [x] 使用迟滞选择最近的有效天体，避免闪烁。
- [x] 添加 hover 视觉反馈：光环、标签和轨道高亮。
- [x] 使用拇指/食指距离和手掌尺度检测 pinch start 与 pinch end。
- [x] 使用不同的 pinch start 和 pinch end 阈值。
- [x] 实现 `BodyHover` 和 `PlanetActivated` 转换。
- [x] 允许从 `SolarActive` 和 `SolarFreeHover` 直接进入 `PlanetActivated`，让已释放的太阳系也能激活天体且不让渲染循环崩溃。
- [x] pinch 激活时，停止选中天体的原轨道公转，但保持自然自转。
- [x] 所有未选中天体继续正常公转和自转。
- [x] 通过统一 controller 支持从 A 激活切换到 B，并清除 A 的激活状态，使 A 恢复原轨道公转。
- [x] 添加地月绑定暂停语义：总览激活地月整体时冻结地球绕太阳公转但保留月球绕地运行；月球焦点通过地月焦点切换按钮进入，而不是总览独立激活。
- [x] 天体 pinch 激活期间，禁止误触发太阳系拖动、缩放、平移或其他整体 transform。
- [x] 添加清楚的激活反馈，并保留原轨道目标供回轨使用。
- [x] pinch 激活保持期间，添加短暂追踪丢失容忍。

验收标准：

- [x] 手靠近天体时，代码和 dev preview 中该天体会清楚高亮；仍需真实摄像头验证。
- [x] 高亮使用迟滞，controller 测试中不会在相邻天体之间快速闪烁；仍需真实摄像头验证。
- [x] 在高亮天体附近 pinch 可在 controller 测试中激活该天体；仍需真实摄像头验证。
- [x] 激活天体停止公转但保持自转。
- [x] 未选中天体继续正常运动。
- [x] 从 A 切换到 B 时，B 是唯一激活天体，A 恢复原轨道公转。
- [x] 地月激活绑定作为特殊情况生效，同时地球和月球都保持自转。
- [x] 激活天体不会拖动或缩放整个太阳系。
- [x] 八个总览入口都通过统一管线支持高亮和激活；月球有投影命中点并映射到地月整体，仍需真实摄像头验证。
- [x] `npm run build` 通过。
- [x] 行为已标记为 `NEEDS_MANUAL_VERIFY`，等待真实摄像头 hover/pinch 测试。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 7: hover, highlight, and pinch activation for all eight MVP overview entries.

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

## Milestone 8 — 单颗行星画面和热区跟随控制

状态：`NEEDS_MANUAL_VERIFY`

目标：从激活天体进入单颗行星画面，并让用户在当前行星持续自转的情况下进行观察、热区跟随、放下悬浮和后续左上角按钮返回。已退役的单手焦点缩放、平移和复位控制不得实现。

任务：

- [x] 添加第一阶段 `PlanetFocusView` 生命周期渲染：所有可交互天体共用一个统一焦点 overlay。
- [x] 检测进入手势：pinch 激活后，同一只激活手的拇指/食指 DoubleClose。
- [x] 第一阶段焦点画面中，背景太阳系弱化并锁定交互，但保留基础动效。
- [x] 添加约 0.3 秒的进入过渡动画：从天体在太阳系中的原位置和原尺寸移动/放大到居中焦点 overlay。
- [x] 第一阶段焦点星球 overlay 垂直居中，星球球体高度约占屏幕 1/2 到 2/3，并移除焦点星球上的聚光灯式光照。
- [x] 当前行星在激活、焦点、热区跟手、悬浮和观赏期间都保持自转；已有自动化覆盖，仍需真实摄像头验证。
- [x] 不将单手五指张开/收拢映射为当前行星缩放。
- [x] 不将收拢成拳保持映射为当前行星复位。
- [x] 不将单手推动映射为当前行星平移。
- [x] 添加焦点视觉居中冷却和热区清空门闸，避免焦点星球居中过渡时因手还在热区内直接跟手。
- [x] 单手触碰当前星球热区停留 1 秒后开始跟手；仍需真实摄像头调优。
- [x] 双手触碰当前星球热区停留 1 秒后进入双手跟随，并用两手距离调整星球大小；仍需真实摄像头调优。
- [x] 单手跟随中的跟随手、或双手跟随中的任意跟随手，完成拇指到任一手指的 close-open `PinchTap` 后放下星球。
- [x] 放下后等待所有可见手离开当前星球热区，再允许重新进入待选中/跟手停留。
- [x] 热区跟手期间，当前行星在 controller 逻辑中限制在可见屏幕内；仍需真实摄像头验证。
- [x] 确保当前行星控制不影响整个太阳系 transform；已有单元测试覆盖。
- [x] 为激活、焦点、受控、悬浮状态在引导文案、状态摘要和 Debug 行中显示清楚反馈。

验收标准：

- [x] 同一只激活手的拇指/食指 DoubleClose 可在 controller 测试中进入 `PlanetFocusView`；仍需真实摄像头验证。
- [x] 单元测试中确认背景太阳系弱化、锁定交互，并保留基础动效；仍需真实摄像头验证。
- [x] 单元测试中确认焦点星球从原位置/原尺寸开始，并在约 0.3 秒内过渡到居中的焦点 overlay；仍需真实摄像头验证。
- [x] 单元测试中确认焦点星球 overlay 垂直居中、尺寸落在 1/2 到 2/3 屏幕高度范围，并使用无光照材质；仍需真实摄像头验证。
- [x] 当前行星在所有焦点交互中持续自转；已有自动化覆盖，仍需真实摄像头验证。
- [x] 单手张开/收拢不会缩放当前行星。
- [x] 握拳保持不会复位当前行星大小或位置。
- [x] 单手推动不会平移当前行星。
- [x] 焦点视觉居中冷却和热区清空门闸可在 controller 测试中阻止居中动画期间/之后立即跟手；仍需真实摄像头验证。
- [x] 单手热区停留 1 秒可以移动当前行星，并保持在屏幕内；已有 controller 测试覆盖，仍需真实摄像头验证。
- [x] 双手热区停留 1 秒可以按手距缩放当前行星；已有 controller 测试覆盖，仍需真实摄像头验证。
- [x] 双手缩放只由两手之间的距离驱动（与手内捏合无关），所以收拢捏合既不缩放也不放下，两手收拢可把行星缩到比进入时更小；已有 controller 测试覆盖，仍需真实摄像头验证。
- [x] 单手跟随时副手仅出现在热区外不会导致行星被放下；已有 controller 测试覆盖，仍需真实摄像头验证。
- [x] 双手跟随时一只手离开热区、另一只仍在，会降级为留下那只手的单手移动控制；已有 controller 测试覆盖，仍需真实摄像头验证。
- [x] 1 秒热区停留对偶发单帧脱手有容错，仅在超过容错窗口后才重新计时；已有 controller 测试覆盖，仍需真实摄像头验证。
- [x] 跟随手 `PinchTap` 会将当前行星释放到 `PlanetFocusFloating`；已有 controller 测试覆盖，仍需真实摄像头验证。
- [x] 放下后 controller 会保持取消选中，直到当前星球热区清空；已有 controller 测试覆盖，仍需真实摄像头验证。
- [x] `npm run build` 通过。
- [x] 行为已标记为 `NEEDS_MANUAL_VERIFY`，等待真实摄像头测试。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 8: planet focus view and heat-zone follow controls.

Context:
Read @ar_solar_system_prd.md sections 5.5, 7.10, and 7.11.

Constraints:
- A focused body keeps self-rotating; do not freeze self-rotation.
- Background solar-system interaction is locked during PlanetFocusView.
- Retired one-hand focus zoom/pan/reset gestures must remain no-ops.
- Single-body manipulation must not affect solar-system scale, pan, or rotation.
- Keep the focused body inside the visible screen during heat-zone follow.
- Update docs if any interaction mapping changes.

Done when:
- Activation -> focus view -> heat-zone follow/floating works, and retired one-hand focus zoom/pan/reset gestures remain inactive.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 9 — PinchTap 放下、焦点悬浮和食指按钮返回

状态：`NEEDS_MANUAL_VERIFY`

目标：让用户在单颗行星画面中放下当前行星，使其悬浮在当前位置，然后用追踪到的食指尖按住左上角玻璃按钮 1 秒明确回到原轨道。旧的 pinch-and-throw 返回指令和掌心朝屏幕开掌返回指令都已弃用；鼠标/DOM pointer 点击按钮不是产品路径。

任务：

- [x] 单手或双手热区跟随期间，检测跟随手完成的 `PinchTap` 并释放到焦点悬浮；仍需真实摄像头验证。
- [x] 接受 `PinchTap` 后，解除热区跟手控制，让当前行星悬浮在 `PlanetFocusView` 的当前位置；仍需真实摄像头验证。
- [x] 悬浮的当前行星保持自转，并且不自动回轨；已有自动化覆盖，仍需真实摄像头验证。
- [x] 在文档和产品语义中弃用旧的 pinch-and-throw 返回指令。
- [x] 在文档和产品语义中弃用掌心朝屏幕开掌返回指令。
- [x] 在 `PlanetFocusView`、`PlanetFocusControlled` 和 `PlanetFocusFloating` 中显示左上角透明玻璃质感返回按钮。
- [x] 进入 `BodyReturning` 前要求追踪食指尖在左上角按钮上稳定停留 1 秒。
- [x] 食指停留蓄力时填充可见按钮进度条；食指尖离开按钮、手部丢失或退出焦点状态时重置进度。
- [x] 由长按返回按钮进入 `BodyReturning` 状态。
- [x] 用 0.5 秒动画把焦点 overlay 移回太阳系天体位置和大小。
- [x] 0.5 秒返回动画期间，背景太阳系保持弱化并锁定交互。
- [x] 返回动画结束后恢复原始天体缩放/关系、恢复公转、恢复背景不透明度、退出焦点界面并回到 `SolarFreeHover`。
- [x] 添加焦点 PinchTap、悬浮状态、当前跟随手、停留时间、触碰热区半径和焦点缩放调试值。
- [x] 从可见 Debug 面板移除开掌返回调试行，避免把旧手势呈现为当前控制。

验收标准：

- [x] 跟随手 `PinchTap` 可在 controller 测试中放下当前行星；仍需真实摄像头验证。
- [x] 放下后的当前行星仍在 `PlanetFocusView` 中悬浮，并保持自转；已有自动化覆盖，仍需真实摄像头验证。
- [x] Pinch 释放、低速手部移动、普通手势和开掌动作不会让当前行星回轨，因为手势返回已弃用。
- [x] 食指尖按住左上角返回按钮 1 秒可在应用逻辑和手势 helper 测试中进入 `BodyReturning`；仍需真实摄像头/浏览器验证。
- [x] 1 秒前食指尖移出按钮区域会在手势 helper 测试中重置返回进度；仍需真实摄像头/浏览器验证。
- [x] 当前星球放下并进入焦点悬浮后，返回按钮仍可使用；仍需真实摄像头/浏览器验证。
- [x] 返回动画可在单元覆盖中用 0.5 秒把焦点 overlay 移动并缩放回太阳系天体；仍需真实摄像头验证。
- [x] 返回后天体在单元覆盖中恢复原始轨道关系；仍需真实摄像头验证。
- [x] 返回后应用退出到太阳系画面、恢复背景不透明度并解锁太阳系交互；已有单元/应用逻辑覆盖，仍需真实摄像头验证。
- [x] 月球沿统一返回路径回到地月关系；已有元数据/单元覆盖，仍需真实摄像头验证。
- [ ] 误触发足够低，可以支持 30-60 秒演示。
- [x] `npm run typecheck`、`npm test` 和 `npm run build` 通过。
- [x] 行为已标记为 `NEEDS_MANUAL_VERIFY`，等待真实摄像头测试。

建议 Codex 提示词：

```text
Goal:
Implement Milestone 9: PinchTap release, floating focus, and top-left index-finger return button behavior.

Context:
Read @ar_solar_system_prd.md sections 7.11, 7.12, and 13.

Constraints:
- PinchTap release keeps the body floating in PlanetFocusView.
- Floating focus must not return to orbit automatically.
- The old pinch-and-throw return command is retired.
- The palm-facing open-hand return command is retired.
- Return requires the tracked index fingertip to stay on the top-left glass button for 1 second.
- The button shows a visible progress bar and cancels when the fingertip leaves the button, the hand is lost, or focus exits.
- Returning body should animate for 0.5 seconds, restore original scale, orbit layer, opacity, and motion, then exit back to the solar-system view.
- Update docs if thresholds or behavior are changed.

Done when:
- Focused body can be placed down, left floating, then returned to orbit by holding the tracked index fingertip on the top-left button.
- npm run build passes.
- TODO.md is updated.
```

## Milestone 10 — 视觉打磨、鲁棒性和录制模式

状态：`TODO`

目标：让 Demo 适合录制 30-60 秒演示视频。

任务：

- [ ] 在视觉打磨过程中保留当前已测试通过的交互逻辑，以及既有对象可见/隐藏生命周期。
- [x] 将太阳系总览调整到 AE 等效的强斜俯视裂口角度：X 约 `-79.58°`、约 Y `5°`，默认 Z `0°`。
- [x] 锁定太阳系总览为 AE 等效固定 pitch/yaw/Z，并让端点命中/参考计算对齐固定的水平左右端点。
- [x] 添加由 progress 驱动的椭圆宇宙裂口背景：80% 暗色星空内部、轻微蓝色/暖色星云层，以及 AE 导出的金/青/白动态边界光环。
- [x] 为电影感可读性重新平衡太阳系总览天体/轨道比例，不再按真实天文学比例；允许星球视觉上突破裂口边界。
- [x] 改进太阳光晕、轨道材质和天体可读性。
- [x] 只在展开开始后添加星尘和星云效果。
- [ ] 添加手部接近反馈，例如小型光环或粒子。
- [ ] 如果 0.5 秒返回调整需要更强反馈，添加可选返回高亮或尾迹效果。
- [ ] 调整身体参考、手、缩放、pinch 和返回动画的平滑参数。
- [ ] 针对常见笔记本摄像头构图调整触发阈值。
- [x] 在修改 tracking 节奏、平滑或视觉运行时格式之前，先把低延迟性能诊断基线接入 Debug 和 recorder 导出。
- [x] 修复 recorder session/export 覆盖范围：每次新录制从空帧开始，导出的 JSON 包含 `planetFocus` 焦点控制诊断。
- [x] 请求 30fps 摄像头流，并让 MediaPipe 手部追踪优先使用 GPU delegate，GPU 不可用时回退 CPU。
- [x] 修复 focus 跟随放下边界：PinchTap 必须是跟随开始后的新 close-open，且双手跟随在两只手都离开热区并超过保护窗口后不再继续粘连控制。
- [ ] 如果 FPS 不稳定，减少粒子数量或后处理。
- [ ] 添加隐藏调试 UI 的 presentation/recording mode。
- [ ] 添加弱光、姿态缺失或手部缺失时的 fallback 引导。
- [ ] 测试完整 30-60 秒流程。

验收标准：

- [ ] 除非用户明确要求，否则视觉打磨不修改已测试通过的交互逻辑、手势阈值、状态流转或对象展示控制生命周期。
- [ ] 观众能理解太阳系是从双手之间被拉出来的。
- [ ] 观众能理解太阳系是一个可由双手控制并停在松手位置的自由悬浮物体。
- [x] 太阳系总览盘面读起来是强斜俯视的空间平面，而不是平行屏幕的平面图。
- [x] 展开后的太阳系读起来像椭圆形撕开的宇宙空间：椭圆外仍可见摄像头画面，内部是暗色半透明星系场和沙粒感边界。
- [ ] 缩放和固定斜俯视总览角度看起来具有空间感。
- [ ] 激活、单颗行星画面、PinchTap 放下悬浮和左上角食指按钮返回都在视觉上清楚。
- [x] Debug 暴露用于延迟诊断的性能指标：render delta/render cost、tracking update/detect cost、hand/pose detect cost、trackingHz、fresh/stale frame 计数、重复视频帧计数、controller/recorder cost、solar/VFX update cost；recorder JSON 导出同样的结构化数据且不包含原始摄像头视频。
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
- Do not modify previously tested interaction logic, gesture thresholds, state transitions, or existing object show/hide control unless the user explicitly asks for that change.
- Do not show 3D content in initial empty scene.
- Tune performance before adding heavy effects.
- Keep debug mode available but hidden for recording.

Done when:
- Full demo flow can be recorded cleanly.
- npm run build passes.
- TODO.md is updated.
```

## VFX Asset Pipeline

状态：`IN_PROGRESS`

目标：为后续太阳系材质、地球 focus 视觉、HUD 元素和粒子效果建立稳定的素材路径与贴图加载层，同时不改变现有交互或展示控制生命周期。

任务：

- [x] 在 `src/solar/solarAssetManifest.ts` 中定义 medium 质量的 NASA 运行时贴图路径；high 分辨率贴图虽然存在于磁盘，但不是默认运行时来源。
- [x] 定义来自 `/assets/solar/nasa/runtime/medium/earth/` 的地球 day/cloud/night-light 贴图路径。
- [x] 定义水星、金星、月球、火星、木星、土星、天王星和海王星的可用行星 albedo 贴图路径。
- [x] 将用户提供的 NASA 水星和天王星 albedo 源文件整理进 NASA 素材结构；水星有 2K 和 4K runtime 输出，天王星源文件为 2048x1024，因此只生成 2K。
- [x] 将用户提供的 NASA 土星环源文件整理进 NASA 素材结构，并生成 2K 和 4K runtime 条带贴图。
- [x] 定义 medium starfield 贴图路径。
- [x] 定义当前所有 `/assets/solar/fx/*.png` 路径，包括 rift、shockwave、HUD、手部锚点光效、土星环、lens flare、粒子和星云素材。
- [x] 新增 `src/solar/textureAssets.ts`，作为带缓存的 `TextureLoader` 封装：为 color/albedo 贴图设置 sRGB color space，设置安全 anisotropy，并在加载失败时 warning 后返回 `null`。
- [x] 通过 asset manifest 升级太阳系总览行星材质：Earth、Mercury、Venus、Moon、Mars、Jupiter、Saturn、Uranus 和 Neptune 在贴图加载成功时使用 NASA medium albedo，现有程序材质仍作为 fallback。
- [x] 调整太阳系总览贴图可读性：加载成功的 NASA albedo 贴图也作为适度的 per-body emissive map 使用，让 AR 小尺寸预览中的 Earth、Neptune 等深色行星不会被总览光照压成黑块。
- [x] 升级太阳系总览 Saturn ring 材质优先级：优先 NASA runtime ring PNG，其次 AI `saturn-ring-texture.png`，最后保留现有程序 ring；PNG alpha 保持透明，depth write 保持关闭。
- [x] 仅升级单颗行星 focus overlay 中的 Earth：使用 day 地表基底、亮度抠像云层 shell、轻微 additive 夜景灯光 shell 和蓝色 Fresnel 大气 shell。
- [x] 根据真实录屏复查继续调优 Earth focus：新增柔和昼夜分界 shadow shell，将城市灯限制在假夜侧，提高云层可读性，并收窄大气边缘光。
- [x] 根据第二条录屏继续调优 Earth focus：让夜景城市灯更暖、更可读，把夜景灯渲染到云层之上，并压暗夜侧云层，避免白色云纹理盖住城市灯。
- [x] 按反馈将 Earth focus 回到 surface shader 之前的视觉版本：恢复普通 loaded day texture base，同时保留暖色夜景灯 shell、夜侧云层压暗和柔和 shadow shell。
- [x] 将 Planet Focus View 升级为 profile-driven 多层结构，覆盖 Mercury、Venus、Earth、Moon、Mars、Jupiter、Saturn、Uranus 和 Neptune；Sun focus 仍不在本轮范围内。
- [x] 添加 profile-driven focus 视觉层时，保持已有 focused-body public API 和行星 focus/return 交互规则不变。
- [x] Earth focus 使用 day 地表基底、亮度抠像云层 shell、暖色夜景灯 shell、柔和 shadow 和蓝色 Fresnel 大气。
- [x] Venus focus 使用 NASA albedo，并增加金色 haze shell 和厚重大气暖色边缘光。
- [x] Mercury focus 优先 NASA albedo，否则使用岩石程序 fallback，只加非常轻的冷色 rim。
- [x] Moon focus 使用月面坑纹 albedo 和轻微冷色 rim，不加厚重大气。
- [x] Mars focus 使用红色 albedo，并增加很薄的程序沙尘 haze 和橙红 rim。
- [x] Jupiter focus 使用气体行星条纹 albedo，并增加轻量程序云带 shell 和浅暖色 rim。
- [x] Saturn focus 使用 NASA albedo，并增加透明 ring：优先 NASA ring PNG，其次 AI PNG，最后程序 fallback。
- [x] Uranus focus 保持干净的青蓝色 albedo/fallback 和浅蓝 rim，不强行显示低质量 ring。
- [x] Neptune focus 使用深蓝 albedo，并增加很薄的风带 overlay 和电蓝色 rim。
- [x] 将太阳系总览里的 Sun 升级为只依赖材质的 plasma VFX core：time-driven inner shader sphere、additive Fresnel corona shell 和可选 FX lens-flare sprite。
- [x] Sun VFX 仍挂在现有 `CelestialBody` 可见性生命周期内，因此 pull-open 前的初始空场不会出现任何太阳系 3D 内容。
- [x] Sun pass 不使用全屏 postprocessing；未新增 `EffectComposer`、`UnrealBloomPass` 或覆盖摄像头画面的 bloom layer。
- [x] 升级太阳系总览 hover/activated HUD 视觉：优先使用 `target-lock-ring.png` target-lock sprite，加载失败时保留程序 ring fallback；idle 轨道更细更暗，hover/activated 轨道更亮，行星 label 改为玻璃 HUD 风格。
- [x] 保持 `setInteractionVisualState` API 不变，同时让 hover、activated、label、orbit 和 target-lock HUD 视觉继续响应 focus background dimming。
- [x] 升级太阳系 opening 视觉：新增 progress-driven opening VFX group，开始阶段显示 thin crack，中段显示 blue/gold rift，接近完成时显示 burst/shockwave，并在左右 control endpoint 附近显示蓝/金 hand anchor glow。
- [x] Opening VFX 完全由现有 `openingProgress` 驱动；未新增 timer、自动播放完成、controller 阈值、状态机或 `SolarOpeningController` 行为变化。
- [x] Opening VFX 只在 `visibleRequested` 为 true 且 `openingProgress > 0` 时显示，且所有 sprite opacity 都从 progress 派生，从而保持初始空场不显示特效。
- [x] 新增轻量 `SolarParticleField`，使用总计 420 个 `Points` 粒子表现星尘、轨道拖尾点缀和 micro flare；粒子只在太阳系可见且 `openingProgress > 0.25` 时出现。
- [x] 粒子 opacity 在 opening 期间由 progress 驱动淡入，并在 planet focus 中压暗，避免背景星尘/拖尾抢主角。
- [x] 新增 `UniverseRiftBackdrop`：椭圆裂口层包含代码生成的 80% 暗色透明星空内部，以及 AE 导出的金/青/白边界光环 PNG 序列。
- [x] 宇宙裂口背景在初始空场保持隐藏，只从既有 `openingProgress` 显示；未添加 timer、自动播放或新的展示控制生命周期。
- [x] 将代码生成的星空内部对齐到和 PNG 光环相同的 AE 全帧平面及烘焙角度，让暗色星系场嵌在边界内，而不是按旧 3D 盘面投影成另一个椭圆。
- [x] 将星空内部缩进到外层光环内侧，并作为星球后方的底层宇宙背景渲染，而不是盖在星球上的半透明蒙版。
- [x] 将星空内部移到专用 background render layer；`TransparentSceneRenderer` 现在先渲染该 layer，清除深度，再渲染主太阳系和 AE 光环。
- [x] 在 `src/solar/solarVisualConfig.ts` 中集中管理已确认的总览倾角和裂口尺寸。
- [x] 为电影感可读性重新平衡总览天体尺寸、轨道位置、总览光照和 Saturn 总览环倾角。
- [x] 新增 After Effects look-dev 生成脚本 `scripts/after-effects/create-ar-solar-rift-vfx.jsx`，用于生成可循环的 `rift_border_loop` 边界光环合成，并在 `BREATH_CONTROL` 上提供 `Vertical Tilt Degrees` 滑块；脚本在效果确认前不自动导出、不保存工程、不加入渲染队列。
- [x] 新增独立 After Effects 导出 helper `scripts/after-effects/export-ar-solar-rift-border-png-sequence.jsx`，不覆盖 look-dev 生成脚本，并将 `rift_border_loop` 导出/排队为适合项目使用的透明 PNG 序列母版。
- [x] 修正 AE 边界光环生成脚本：移动弧线漂移和 Turbulent Displace evolution 改用周期表达式，不再使用非整数线性漂移，确保未来导出的 4 秒循环首尾闭合。
- [x] 将已确认的 AE PNG 序列注册到太阳系素材 manifest，并用单个动态 `CanvasTexture` 作为当前运行时边界光环渲染。
- [x] 将 AE 边界光环用同一个动态 `CanvasTexture` 渲染成双层：底层普通透明混合的暗色支撑层提升真实摄像头可读性，顶层保留 additive 金/青能量线。
- [x] 运行时 AE 边界光环保持已确认的双层结构；移除额外 runtime glow 强化，因为它和当前摄像头/构图观感不协调。
- [ ] 等新的视觉特效方案确认后，再把 manifest 和 loader 接入剩余 HUD frame 和后续获批的视觉系统。
- [ ] 如果之后 Chrome/Three.js `VideoTexture` 兼容性、alpha 质量和文件体积都可接受，再把 PNG 序列母版转成透明 WebM VP9。

验收标准：

- [x] 未修改手势逻辑、状态机、`main.ts` 交互流或对象可见性生命周期。
- [x] 太阳系总览 `CelestialBody` 材质升级不改变 hover ring、label、activated 视觉、focus 入口逻辑、hot zone、hit test、背景 dimming 或对象可见性生命周期。
- [x] 初始空场保持不变；未在 pull-open 前新增 starfield、nebula、particles、opening rift、HUD 装饰、bloom、太阳 plasma 或额外 3D 内容。
- [x] 素材缺失或贴图加载失败不会导致页面崩溃；loader 返回 `null`，调用方可继续使用现有程序材质 fallback。
- [x] Planet focus 继续使用原有 focus root、placement、scale、intro、follow、floating 和 return API；新增层只是视觉子对象。
- [x] Focus 层级已有单元测试结构断言覆盖，包括 Earth 云层/夜景灯/昼夜分界/大气 shell、各行星 profile shell 和 Saturn focus ring。
- [x] Sun plasma 层级已有单元测试结构断言覆盖，包括 plasma core、corona shell、lens flare sprite 和 time uniform 更新。
- [x] Hover/activated HUD 视觉已有单元测试结构断言覆盖，包括 target-lock 对象创建、label 可见性、orbit 变亮、activation 变亮和 focus dimming。
- [x] Opening VFX 已有单元测试结构断言覆盖，包括初始隐藏状态、由 progress 驱动的 crack/rift/burst/shockwave 可见性、endpoint anchor 附着和 full progress fade-out。
- [x] Solar particles 已有单元测试结构断言覆盖，包括总 point count、初始隐藏状态、opening-progress 阈值和 focus dimming。
- [x] Universe-rift backdrop 已有单元测试结构断言覆盖，包括初始隐藏状态、opening-progress 显示、AE 边界可见性和 focus dimming。
- [x] Universe-rift backdrop 测试会断言生成的星空内部和 AE 边界共用同一平面尺寸和本地姿态。
- [x] Universe-rift backdrop 测试会断言生成的星空内部被隔离到 background render layer，确保星球视觉上仍显示在上层。
- [x] Universe-rift backdrop 测试会断言 AE 光环同时具备 normal-blend 暗色支撑层和 additive 能量层。
- [x] Universe-rift backdrop 测试会断言额外 runtime glow 层不存在，当前 AE 光环保持已确认的双层结构。
- [x] AE 生成脚本仅用于源合成/look-dev：它创建带轻微呼吸、小幅 2D 角度漂移和可调垂直俯仰滑块的可预览循环边界光环合成，但不决定最终导出格式，也不添加 Render Queue 项。
- [x] AE 导出 helper 是独立脚本，目标是 `public/assets/solar/fx/rift-border-loop/png-sequence/` 下的 PNG 序列源帧，不覆盖 look-dev 生成脚本。
- [x] 后续 AE 导出通过周期运动表达式避免边界弧线漂移和扰动在循环首尾产生跳变。
- [x] `npm run typecheck`、`npm test` 和 `npm run build` 通过。

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

目标：继续以确定性自动化测试优先，再在当前活跃的启动、展开、端点和行星焦点交互面稳定后逐步加入结构化手势回放和浏览器层回放，减少每次回归都需要人工打开摄像头挥手测试的成本。

参考文档：

- `docs/testing/test-and-replay-harness.md`

计划：

- [x] 整理最新测试策略，包括用户评估中强调的“叶子纯函数和控制器测试应先于 replay/E2E”的顺序。
- [x] 添加 Vitest（`environment: 'node'`），但不修改 `main.ts` 或真实摄像头/运行时 bootstrap。
- [x] 添加确定性护栏测试：`src/interaction/**` 一旦出现 `Math.random`/`Date.now`/`performance.now` 即失败。
- [x] 在 `tests/helpers/` 中维护合成手部、tracking snapshot、测试相机和固定阈值构造器。
- [x] 添加 Layer 0 纯模块测试：`math`、`coordinateMapping`、`handPairing`、`palmOrientation`、`handPose`、`intentScoring`。
- [x] 添加 Layer 1 控制器序列测试：使用合成 `TrackingSnapshot` 和注入时间戳，覆盖启动、太阳系展开、whole-system release/re-grip 基础路径和反向收起。
- [x] 删除已退役的 M5.5 太阳系观察验证 harness，不保留 `solarInspectionVerification` 或 `npm run verify:m5.5`。
- [ ] 添加 CI（GitHub Actions），在 push/PR 上跑 `typecheck` + unit + gesture + `build`。
- [ ] 在纯函数/控制器测试层有实际价值且当前活跃交互面稳定后，再加入 JSON fixture replay（多帧序列）。
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
10. 在 `SolarFreeHover` 中，用单手五指张开/收拢/握拳/推动，确认这些已退役 M5.5 动作不会放大、缩小、复位或平移太阳系画面。
11. 将双手重新靠近左右端点，确认尝试过这些单手 no-op 动作后端点重握仍然有效。
12. 依次 hover 每个可交互天体，确认标签/光晕。
13. Pinch 激活天体，确认它停止公转但保持自转。
14. Pinch 激活天体后，用同一只激活手的拇指/食指闭合、张开、再闭合，确认进入单颗行星画面。
15. 在单颗行星画面中，确认单手张开/收拢/握拳/推动不会缩放、平移或复位当前行星。
16. 进入单颗星球界面后，先保持手在热区内观察，再撤出热区并重新触碰；确认星球先完成约 0.3 秒放大居中过渡，居中过渡期间不会直接跟手，重新触碰停留 1 秒后才开始跟手。
17. 单手触碰当前星球热区 1 秒后移动它，再用同一只手完成 close-open PinchTap 放下；确认它进入取消选中/等待撤出热区状态，手离开热区后才可再次触碰选中。
18. 双手触碰当前星球热区 1 秒后移动双手并改变两手之间的距离；确认星球跟随两手中点、并按两手之间的距离缩放，再用任意一只跟随手完成 close-open PinchTap 放下，确认两只手都离开热区后才可再次选中。
19. 双手跟随时把两只手收拢（或各自捏合）以缩小星球；确认星球能缩到比进入时明显更小，且不会仅因为手或手指靠拢就被放下。
20. 单手跟随时，让另一只（副）手进入画面但停留在星球热区之外；确认控制仍保留在原来那只手，星球不被放下。
21. 双手跟随时，把一只手撤出星球热区、另一只仍留在热区；确认控制切换为留下那只手的单手移动（缩放冻结），星球不会被撤出的那只手拽走。
22. 在单颗星球界面中，确认屏幕左上角出现透明玻璃质感矩形按钮，按钮包含返回 icon 和“长按返回太阳系”。
23. 用摄像头追踪到的食指尖按住左上角返回按钮，但在 1 秒前移开；确认按钮进度重置，状态不会进入 `BodyReturning`，焦点星球仍留在单颗星球界面。这个测试不依赖鼠标点击。
24. 用食指尖按住左上角返回按钮 1 秒；确认进度条填满，应用进入 `BodyReturning`，焦点星球约 0.5 秒内调整回太阳系天体位置和大小，背景不透明度恢复，状态回到 `SolarFreeHover`。
25. 用月球和土星重复测试。
26. 运行录制模式，确认 debug UI 已隐藏。

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
| 展开后不重启 | 把太阳系打开到 `SolarFreeHover`，然后在远离端点的位置双手/双拳合拢再拉开。 | 摄像头预览、状态说明和 Debug 的 `Startup state`。 | 应用不会重新进入 `HandsClosed` 或 `PullArmed`；可见太阳系继续保持当前激活/悬浮流程，除非双手明确重新扶住左右端点。 |

### Milestone 3.5 人工验收清单

用这份清单验证 Milestone 4 之前的 debug-only 整体太阳系交互协议。

备注（2026-06-24）：M4 可见太阳系内容接入后，用户可见的右上角状态说明以 `interactionState` + `solarReason` 为准。旧 `Whole control` / `wholeSystemIntent` 值只作为协议 Debug 行存在，不应再作为可见太阳系行为的主状态说明。其中缩放/旋转/掌心相关行只是历史协议诊断，已退役的 M5.5 单手太阳系观察行也不应作为当前产品控制出现。

| 项目 | 用户动作 | 观察位置 | 通过条件 |
|---|---|---|---|
| M3.5 空场 | 打开页面，点击 `开启摄像头`，打开 `Debug`，先不要把手放进画面。 | 摄像头预览、Debug 面板和 debug overlay。 | 摄像头预览不出现 3D 太阳、行星、轨道、星云、粒子、奇点或模型。`Whole control` 显示 `Inactive`。 |
| 旧协议 Debug 字段 | 保持 `Debug` 打开，执行任意 M3.5 手势动作。 | Debug 面板里的 `Whole control`、松手/重新扶住字段、意图分数和端点圆圈。 | 旧协议值仍可在 Debug 中检查。右上角状态卡不应在可见 M4 太阳系行为中显示 `Lock`、`Re-grip` 或 `Transition` 这类旧协议标签。 |
| 拉开后协议启动 | 从 `EmptyIdle` 开始，双手在画面任意位置合拢直到 `Startup state` 进入 `HandsClosed`，然后拉开直到 `Startup state` 进入 `PullArmed`。 | Debug 面板里的 `Whole control`、`Control confidence` 和 2D 端点圆圈。 | `Whole control` 从 `Inactive` 变为 `VirtualOpeningHandle`，随后变为 `SolarHandleControl`。只有打开 `Debug` 时，双手附近会出现两个小的 2D 调试端点圆圈。 |
| 掌心朝向数值 | 保持双手可见，慢慢把掌心转向摄像头、转到侧面、再转成朝上。 | Debug 面板里的 `Visual L palm normal`、`Visual R palm normal`、`Visual L palm facing/up` 和 `Visual R palm facing/up`。 | 掌心法线数值持续更新。facing/up 分数保持在 `0.00-1.00` 范围，并且会随掌心方向变化而明显变化。 |
| 微弯手保持抓住 | 当 `Whole control` 为 `SolarHandleControl` 时，双手保持微微弯曲，像握住两个把手。 | Debug 面板里的 `Visual L open/grip`、`Visual R open/grip`、`Grip hold`、`Release stable`、`Release gesture` 和 `Whole control`。 | `Grip hold` 显示 `yes`，`Release stable` 基本保持在 `0ms` 附近，`Release gesture` 保持 `no`，`Whole control` 保持 `SolarHandleControl`。虚拟端点继续跟随双手。 |
| 历史掌心朝上保持诊断 | 当 `Whole control` 为 `SolarHandleControl` 时，把双掌转成大致朝上，手指微弯，像托住托盘一样，然后轻轻移动双手控制柄。 | Debug 面板里的 `Rotation intent`、`Release blocked`、`Grip hold`、`Release stable`、`Release gesture` 和 `Whole control`。 | 历史 `Rotation intent` 可能变化，`Release blocked` 可能显示 `rotationHold` 或 `cuppedGrip`；这只是协议/debug 诊断。`Grip hold` 应显示 `yes`，`Release stable` 不应攒到松手阈值，`Whole control` 应保持 `SolarHandleControl`。 |
| 张开手松手 | 当 `Whole control` 为 `SolarHandleControl` 时，双手五指完全张开并明显伸展，且先停止旋转。看到 `Release stable` 超过约 `280ms`、`Release gesture` 变成 `yes / lock on` 后，慢慢把手收回或放松手指。 | Debug 面板里的 `Visual L open/grip`、`Visual R open/grip`、`Release stable`、`Release blocked`、`Release gesture`、`Whole control` 和 2D 端点圆圈。 | open 分数升高，grip 分数降低，`Release blocked` 显示 `none`，`Release stable` 超过约 `280ms`，`Release gesture` 变成 `yes / lock on`，`Whole control` 进入 `ReleaseCandidate`，随后进入 `SolarFreeHover`。即使慢慢收手时手指放松，端点圆圈也应冻结；在双手先离开冻结端点、再主动回到端点前，`Whole control` 不能跳回 `SolarHandleControl`。 |
| 历史缩放意图诊断 | 当 `Whole control` 为 `SolarHandleControl` 时，双手向外拉远再靠近，但不要完全合拢。 | Debug 面板里的 `Scale intent`、`Hand distance`、`Distance velocity` 和 `Collapse intent`。 | 历史 `Scale intent` 可能随手距变化；这只是协议/debug 诊断。`SolarFreeHover` 不再有单手太阳系观察缩放；它等待端点重新扶住或反向收起。 |
| 反向收起意图 | 从 `SolarHandleControl` 开始，继续让双手向内靠近，直到接近合拢。 | Debug 面板里的 `Whole control` 和 `Collapse intent`。 | `Collapse intent` 向 `1.00` 升高；`Whole control` 可以进入 `SolarClosing`，完全合拢后回到 `Inactive` 附近。画面不出现 3D 内容。 |
| 兜底松手 | 进入 `SolarHandleControl` 后，把双手移出画面或遮住几秒。 | Debug 面板里的 `Whole control`、`Release confidence` 和端点圆圈。 | `Whole control` 先变成 `ReleaseCandidate`，再变成 `SolarFreeHover`。虚拟端点圆圈冻结在最后稳定位置。 |
| 重新扶住冻结端点 | 进入 `SolarFreeHover` 后，先把双手明显移离冻结端点圆圈，再把双手重新放到两个圆圈附近。不应该需要非常精确地重新调整身体或摄像头距离。 | Debug 面板里的 `Release gesture`、`Whole control`、`Re-grip confidence`、`Re-grip reason` 和 `Visual endpoint matched`。 | 双手离开端点后，`Release gesture` 变成 `no / lock off`。双手回到圆圈附近时，`Re-grip reason` 应变成 `endpoint` 或 `wideMagnet`，`Re-grip confidence` 升高，`Whole control` 经过 `ReGripCandidate` 回到 `SolarHandleControl`。 |
| 历史旋转意图诊断 | 当 `Whole control` 为 `SolarHandleControl` 时，掌心大致朝上或明显不朝摄像头，轻轻旋转/扭动双手形成的控制柄。 | Debug 面板里的 `Rotation intent`、`Rotation intent score`、掌心 facing/up 分数和掌心法线。 | 历史 `Rotation intent` 可能从 `none` 变成 `rotate2d` 或 `rotate3d`；这只是协议/debug 输出，不是当前产品验收手势。 |
| 整体控制与 pinch 分离 | 当 `Whole control` 为 `SolarHandleControl` 时，用一只手做 pinch，像未来要激活某颗行星一样。 | Debug 面板里的 `Control confidence`。 | `Control confidence` 应下降，而不是把强 pinch 当成更强的整体太阳系控制。本里程碑不会激活任何行星。 |

### 已退役 M5.5 人工验收清单

用这份清单验证整体太阳系释放到 `SolarFreeHover` 后，已退役的单手太阳系观察控制不会再移动太阳系。

| 项目 | 用户动作 | 观察位置 | 通过条件 |
|---|---|---|---|
| 进入自由悬浮 | 打开摄像头，拉开太阳系，进入端点控制，然后松开端点把手，让太阳系悬浮。 | 摄像头预览、右上角状态说明和 Debug 面板。 | 太阳系内容保持在释放时的 transform。`Startup state` / interaction state 显示 `SolarFreeHover`，状态说明提示等待端点重新扶住或反向收起，而不是等待单手观察。 |
| 单手张开 no-op | 在 `SolarFreeHover` 中，让一只手进入画面并五指张开。 | 摄像头预览、右上角状态说明和 Debug 面板。 | 太阳系缩放和位置保持释放时的 transform。Debug 不出现 `Solar inspect`、M5.5 checklist、inspection scale 或 inspection offset 行。 |
| 单手收拢 no-op | 在 `SolarFreeHover` 中，让一只开掌进入画面，然后五指收拢。 | 摄像头预览、右上角状态说明和 Debug 面板。 | 太阳系不会缩小，也不会进入单手观察状态。端点/重新扶住相关行仍是唯一相关的整体控制。 |
| 握拳保持 no-op | 在 `SolarFreeHover` 中，将一只手收拢成拳并保持约 2 秒。 | 摄像头预览、右上角状态说明和 Debug 面板。 | 太阳系视图不会复位，也不会出现复位计时器/checklist。 |
| 单手推动 no-op | 在 `SolarFreeHover` 中，用一只手向左/右/上/下推动。 | 摄像头预览、右上角状态说明和 Debug 面板。 | 太阳系不会平移。任何可见 transform 变化都只能来自有效的双手端点控制，而不是单手推动。 |
| 端点重新扶住仍有效 | 尝试上述 no-op 单手动作后，将双手放回可见左右端点附近。 | 摄像头预览，以及 Debug 的 `Startup state`、`Solar reason`、端点/重新扶住相关行。 | 重新扶住仍在释放时的端点位置生效，状态可以回到 `SolarHandleControl`，不需要也不会暴露 M5.5 观察状态。 |

## 实现过程中待解决的问题

这些问题不应阻塞早期里程碑，但 Codex 应在解决时记录决策。

- [x] MediaPipe Tasks Vision 的具体包选择和加载策略。决策：使用 `@mediapipe/tasks-vision@0.10.35`，wasm 从匹配版本的 jsDelivr package 路径加载，MVP 阶段使用 Google 官方托管的 lite pose 和 float16 hand `.task` 模型。
- [x] 使用纯 TypeScript 模块还是添加 React。决策：初始 Web Demo 使用纯 TypeScript 模块。
- [x] MediaPipe 关键点坐标到 Three.js 场景坐标的具体映射。决策：集中在 `src/interaction/coordinateMapping.ts`（感知 object-fit: contain + 镜像）；`mapNormalizedToWorld` 通过 three 的 `Raycaster` 对真实相机 `scene.getCamera()` 和 `z = INTERACTION_PLANE_Z` 平面做反投影。Debug overlay 已经走这个映射；M4 的 3D 内容必须使用同一模块。最终世界平面深度仍待 M4 调试确定。
- [ ] 真实摄像头测试后的最终 pinch 阈值。
- [ ] 真实摄像头测试后最终确定返回按钮尺寸、左上角位置、进度手感和 1 秒长按舒适度。
- [ ] 真实摄像头测试后的最终 PinchTap 时序阈值。
- [ ] 真实摄像头测试后的最终聚焦天体屏幕限制。
- [ ] 按钮返回动画是否需要额外的轻微尾迹或高亮。
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

### 2026-07-01 — 收紧 focus 跟随延迟与放下边界

- 需求细化：focus 跟随的 `PinchTap` 放下必须是跟随控制开始后的新 close-open；如果手在 dwell 阶段已经闭合，进入跟随后第一次张开不能直接放下星球。双手跟随中，如果两只 active 手都明显离开焦点星球热区，控制器会先短暂冻结以容忍追踪/边缘误差，随后释放到 `PlanetFocusFloating`，而不是在热区外继续粘连双手控制。
- 运行时延迟更新：摄像头启动现在请求 30fps 视频流，MediaPipe 手部追踪优先尝试 GPU delegate；如果 GPU 初始化不可用，则回退 CPU。
- Focus 更新：为每只 active 跟随手加入 PinchTap arming，在 active hand rebind 时保留 arming，并为双手跟随加入热区丢失路径。
- 保护边界：保持 1 秒 dwell、1 秒返回长按、端点重新扶住时间、focus 缩放限制、产品状态名和视觉资产不变。
- 验证更新：`tests/gesture/planetFocusController.test.ts` 现在覆盖跟随进入后的新 PinchTap arming，以及双手热区丢失后的释放；`npm run typecheck`、`npm test`（24 个文件 / 150 个测试）和 `npm run build` 通过。
- 影响文件：`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/camera/camera.ts`、`src/tracking/handTracker.ts`、`src/interaction/planetFocusController.ts` 和 `tests/gesture/planetFocusController.test.ts`。
- 剩余不明确项：真实摄像头测试仍需确认浏览器是否实际满足 30fps 请求、目标机器是否可用 GPU delegate，以及双手热区丢失窗口是否足够严格但不误切有意缩小动作。

### 2026-07-01 — 修复焦点 recorder 导出

- 需求细化：导出的手势 JSON 必须包含 `planetFocus` 焦点控制快照，使单颗行星热区 dwell、单/双手跟随、PinchTap 放下、焦点位置/缩放和返回按钮计时都能从用户测试日志中分析。
- Recorder 更新：开始一次新录制时现在会清空旧的内存帧，避免多个测试片段被拼接进同一个导出 JSON。导出 schema version 现在为 `2`。
- 保护边界：本次只改变 debug recording/export 行为。未修改 MediaPipe 节奏、摄像头 constraints、平滑、手势阈值、状态机、重新扶住/dwell/返回长按时间、对象可见性生命周期或视觉素材。
- 验证更新：新增 `tests/gesture/gestureDebugRecorder.test.ts`；`npm run typecheck`、`npm test`（24 个文件 / 148 个测试）和 `npm run build` 通过。
- 影响文件：`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/interaction/gestureDebugRecorder.ts` 和 `tests/gesture/gestureDebugRecorder.test.ts`。
- 剩余不明确项：修复后需要重新录制真实摄像头 focus-follow 测试，使下一轮延迟/调参分析可以使用干净的 `planetFocus` 数据。

### 2026-07-01 — 新增低延迟性能诊断基线

- 需求细化：在修改 tracking 节奏、平滑、delegate 选择、摄像头分辨率或 AE 裂口运行时格式之前，先新增客观延迟/性能诊断，使真实摄像头测试能区分模型耗时、重复视频帧、controller 耗时、render 耗时和 VFX 上传耗时。
- Debug 更新：`DebugSnapshot.performance` 现在记录 render delta/render cost、tracking update/detect cost、hand/pose detect cost、trackingHz、fresh/stale tracking frame 计数、重复视频帧计数、controller/recorder cost、solar/VFX update cost。Debug 面板会把这些值显示在靠前位置。
- Recorder 更新：导出的手势 JSON 现在为每个 fresh tracking frame 带上同样的 `performance` 快照，同时仍不包含原始摄像头视频。
- 保护边界：本次只是 instrumentation。未修改 MediaPipe 节奏、手部 delegate、摄像头 constraints、平滑、手势阈值、状态机、重新扶住/dwell/返回长按时间、对象可见性生命周期或视觉素材。
- 验证更新：`npm run typecheck`、`npm test`（23 个文件 / 146 个测试）和 `npm run build` 通过。
- 影响文件：`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/utils/types.ts`、`src/tracking/mediapipe.ts`、`src/rendering/scene.ts`、`src/main.ts`、`src/rendering/debugOverlay.ts`、`src/interaction/gestureDebugRecorder.ts`、`src/solar/solarSystem.ts` 和 `src/solar/universeRiftBackdrop.ts`。
- 剩余不明确项：需要真实摄像头测试分别导出 idle camera、pull-open、端点重新扶住/控制、focus follow 的短 recorder JSON，下一步优化才能基于数据而不是体感选择。

### 2026-07-01 — 移除额外 runtime AE 裂口 glow

- 需求反转：预览后确认新增 runtime glow 视觉不协调，应移除；当前构图里之前的双层 AE PNG 光环更合适。
- 视觉更新：从 `UniverseRiftBackdrop` 移除程序化柔和椭圆 glow mesh、放大的 additive AE 纹理 glow mesh、对应材质/贴图和生命周期透明度逻辑。
- 测试更新：Universe-rift backdrop 回归测试现在断言额外 glow mesh 不存在，同时保留已有 normal-blend 暗色支撑层和 additive AE 边界层。
- 保护边界：未修改手势逻辑、状态机、pinch/focus 入口、太阳系展开/释放/重抓/收起语义、坐标映射、对象显隐生命周期、AE 素材文件或全局后期处理。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/solar/universeRiftBackdrop.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：还需要真实摄像头预览确认回到双层光环后，现场画面观感更好。

### 2026-07-01 — AE 裂口光环发光可读性增强

- 需求细化：之前接入的 AE 裂口光环在真实摄像头画面里偏像淡淡灰尘，因此运行时需要补更明确的发光感，但不替换已确认的 AE PNG 序列，也不改变裂口角度和位置。
- 视觉更新：`UniverseRiftBackdrop` 现在在同一个裂口生命周期下增加轻量 glow 强化：底部程序化柔和椭圆 glow 贴图、轻微放大的 additive AE 纹理 glow pass、已有普通透明混合暗色支撑层，以及最上方原始 additive AE 能量层。
- 保护边界：这只是材质/层级变化。未修改手势逻辑、状态机、pinch/focus 入口、太阳系展开/释放/重抓/收起语义、坐标映射、对象显隐生命周期或全局后期处理。
- 验证更新：`npm run typecheck` 通过，`npm test -- tests/unit/solarSystemInteraction.test.ts` 通过，并新增结构断言覆盖 glow 层、additive blending、共享姿态、随 opening reveal 和 focus dimming。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/solar/universeRiftBackdrop.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：还需要真实摄像头预览确认 glow 在明亮背景下足够明显，同时不会把裂口边界变成一圈实心涂抹。

### 2026-06-30 — 地月焦点改为一个总览入口并支持焦点内切换

- 需求更新：地球和月球不再作为两个总览可独立选择的星球。总览将地球和月球视为一个地月整体入口；命中月球会映射到地月整体，进入焦点后默认显示地球。
- 交互更新：只有地月焦点显示第二个左上角玻璃按钮，位于返回按钮下方。追踪食指尖按住该按钮 0.5 秒可在地球和月球 focus overlay 之间切换；触发后必须先离开按钮区域，才能再次触发，避免持续按住导致来回跳变。
- 实现更新：`CodePlaceholderSolarSystem.getInteractiveBodyScreenTargets()` 现在把月球投影命中点映射为 `earth`，`main.ts` 保留一个轻量的地球/月球当前焦点显示状态，现有食指长按 helper 同时驱动 1 秒返回按钮和 0.5 秒地月切换按钮。
- 验证更新：新增月球总览目标映射和 0.5 秒长按阈值复用的回归测试；focus 跟随/返回 controller 复用现有逻辑，没有重写。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`index.html`、`src/styles.css`、`src/main.ts`、`src/solar/solarSystem.ts`、`tests/gesture/planetReturnButton.test.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：仍需真实摄像头验证第二个左上角按钮是否容易触达、是否和返回按钮冲突，以及从地球切到月球的画面节奏是否自然。

### 2026-06-30 — 太阳系总览天体尺寸压缩为摄像头可读比例

- 需求细化：太阳系总览天体不遵守真实天文学比例。裂口总览里过小、难以看清的天体需要适当放大；气态巨行星仍然读起来更大，但不按真实比例压倒其他星球，只保留适度的大小层级。
- 实现更新：在 `solarSystemData.ts` 中调整 `CELESTIAL_BODY_DEFINITIONS` 的半径和匹配的激活命中半径：水星、月球、火星、金星、地球放大，天王星/海王星略微放大，木星/土星轻微收敛，土星环半径保持比例，月球本地轨道加宽以避免和地球重叠。
- 验证更新：新增单元回归，确认压缩后的演示比例让水星/月球可读、气态巨行星仍大于地球，并将木星/地球比例控制在 2 倍以内。
- 范围说明：这只是视觉数据调优。没有修改手势状态机、拉开/重抓/松手/收起语义、固定总览角度、focus 返回流程或贴图/材质系统。
- 影响文件：`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/solar/solarSystemData.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：还需要浏览器/摄像头预览确认新尺寸与 AE 光环整体平衡，行星绕到太阳后方时不会让中心区域过挤。

### 2026-06-30 — 整体太阳系总览角度锁定为固定位置/缩放控制

- 需求更新：用户确认当前 `?solarPreview=1` 的太阳系总览角度就是目标基线，不再需要整体太阳系 3D 操控。可见太阳系控制器应保持 AE 等效斜俯视总览角度固定，只更新位置和缩放。
- 实现更新：从 `SolarOpeningSnapshot` / `SolarOpeningGeometry` 移除 `rotationZ`，删除未再使用的整体 Z 旋转平滑路径，并将端点参考计算改为固定水平左右位置。
- API 简化：`CodePlaceholderSolarSystem.setTransform()` 不再接受外部 `rotation` 或 `quaternion`；太阳系 group 通过 `solarVisualConfig.ts` 在视觉层内部持有固定旋转。
- 范围说明：行星自转、公转、土星环倾角、焦点星球补偿、粒子，以及 AE 裂口反倾角补偿仍属于视觉/模拟行为，本次没有移除。
- 验证：`npm run typecheck`、`npm test`（143 个）和 `npm run build` 通过；浏览器预览 `http://127.0.0.1:5173/?solarPreview=1` 重新加载后没有 console warning/error，固定斜俯视总览仍正常渲染。
- 影响文件：`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`src/interaction/solarOpeningController.ts`、`src/solar/solarSystem.ts`、`src/solar/solarVisualConfig.ts`、`src/main.ts`、`src/tracking/config.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：真实摄像头 pull-open 仍需确认固定水平端点参考下，端点重新扶住手感是否自然。

### 2026-06-30 — AE PNG 裂口边界序列接入运行时

- 需求更新：AE 导出的透明 PNG 序列现在就是太阳系裂口边界光环的当前运行时格式。透明 WebM VP9 仍保留为未来优化项，不再是本次接入必须完成的步骤。
- 实现更新：`UniverseRiftBackdrop` 继续保留代码生成的 80% 暗色星空内部，但把程序化边界粒子层替换为 `public/assets/solar/fx/rift-border-loop/png-sequence/` 下的 AE PNG 序列，并通过单个动态 `CanvasTexture` 渲染，避免为 120 帧创建 120 个 GPU texture。
- 视觉对齐修复：根据用户截图复查后，生成的暗色星空内部现在使用和 PNG 光环相同的 AE 全帧平面、中心点和烘焙角度补偿，并裁剪到光环可见边界椭圆内。这样星空不会再像另一个大号倾斜椭圆一样跑到已确认的光环位置之外。
- 视觉层级修复：星空内部现在缩进到光环内侧，并隔离到专用 background render layer。`TransparentSceneRenderer` 会先渲染该 layer，清除深度，再渲染主太阳系 layer 和 AE 光环，使暗色星系场作为底层背景存在，而不是像半透明蒙版一样盖住太阳和行星。
- 真实摄像头可读性修复：AE 光环现在用两个 mesh 共用同一个动态 `CanvasTexture` 渲染：下方是普通透明混合的暗色支撑 pass，上方保留原有 additive 金/青能量光环 pass。这样不改变 AE 动作和角度，但外圈不容易在明亮摄像头画面里消失。
- 护栏：裂口仍只从既有 `openingProgress` 淡入，并继续响应已有 planet-focus 背景 dimming；初始空场仍隐藏。未修改手势逻辑、状态流转、controller 阈值、坐标映射或对象显示/隐藏生命周期。
- 验证：`npm run typecheck`、`npm test`（143）和 `npm run build` 通过。
- 影响文件：`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/solar/solarAssetManifest.ts`、`src/solar/universeRiftBackdrop.ts`、`src/solar/solarSystem.ts`、`tests/unit/solarSystemInteraction.test.ts` 和 `public/assets/solar/fx/rift-border-loop/png-sequence/`。
- 剩余不确定性：还需要浏览器/摄像头预览确认 AE 光环在真实 pull-open 中的可见宽度和烘焙角度是否仍与双手端点贴合。

### 2026-06-26 — 裂口背景共用太阳系变换（端点对齐修复）

- Bug 修复：宇宙裂口背景自己跑了两套控制端点没有的动画——缓慢的 `root.rotation.z` 自转，和独立的 `root.scale` 揭示缩放（缓动曲线还和太阳系组的 open scale 不一样）。所以展开（或任何 `openingProgress` 变化）时，椭圆和端点各缩放各自转、步调不一致：端点一会儿在椭圆里、一会儿在椭圆外，从来不在左右最宽点。
- 修复：在 `universeRiftBackdrop.ts` 去掉裂口自己的自转和缩放；它现在和端点、行星完全一样共用太阳系组的 transform，左右最宽点永远锁在控制端点上。出现改由原有的透明度淡入完成，整体变大由太阳系组的 open scale 带动。`solarSystem.ts` 现在调用无参的 `riftBackdrop.update()`。
- 验证：`npm run typecheck`、`npm test`（143）、`npm run build` 通过。
- 影响文件：`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/solar/universeRiftBackdrop.ts`、`src/solar/solarSystem.ts`。
- 遗留模糊：真机录屏需确认端点在展开/控制/收起全程都跟住椭圆边缘、不再漂移。

### 2026-06-26 — 控制端点对齐到宇宙裂口椭圆边缘

- 视觉/交互修复：整体控制端点之前在最外天体范围（约 3.79 local），落在裂口椭圆内约 72% 处。现在端点位于宇宙裂口背景的左右最宽点：`SOLAR_SYSTEM_CONTROL_ENDPOINT_LOCAL_X = UNIVERSE_RIFT_WIDTH / 2`（5.25），可见把手落在发光椭圆边缘。
- 接受的连带影响：因为端点吸附双手，这让椭圆宽度等于双手跨度；follow scale（`worldDistance / SOLAR_SYSTEM_CONTROL_ENDPOINT_SPAN`，跨距 7.58 → 10.5）会让展开后的整体（行星+椭圆）在交互态缩小约 28%。按用户选择，不放大行星数据补偿，行星在椭圆内留更多边距。
- `solarSystemData.ts` 现在从 `solarVisualConfig.ts`（叶子模块，无循环）import `UNIVERSE_RIFT_WIDTH`；删除了旧的"最外天体范围 + `CONTROL_ENDPOINT_PADDING`"推导。
- 验证：`npm run typecheck`、`npm test`（143）、`npm run build` 通过；`?solarPreview=1` 浏览器预览确认裂口正常渲染、天体在椭圆内。
- 影响文件：`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/solar/solarSystemData.ts`。
- 遗留模糊：真机录屏需确认缩小后的交互态在摄像头背景下仍清晰；若行星太小，可同比放大天体 `orbitRadius`/`radius`（约 ×1.385）重新填满椭圆。

### 2026-06-26 — 太阳系把手放下改为双手握拳→张开 + 超宽自动

- 需求变更：`SolarHandleControl` 中太阳系吸附双手，离开端点不再表示放下。放下改为：(a) 双手明确"握拳→再张开一次"手势；或 (b) 双手屏幕 x 跨距（吸附端点的视觉宽度）超过 `MAX_VISUAL_WIDTH_SCREEN_FRACTION`（约 0.72 屏宽）时自动放下，冻结在放下前的稳定 transform。双手长时间完全丢失仍作为兜底放下，偶发单帧丢手不放下。
- 需求变更：重新扶住端点的稳定停留时间提高到约 0.5 秒（`ENDPOINT_ENTER_STABLE_MS` 140 → 500），`SolarActive`→`SolarHandleControl` 与 `SolarFreeHover` 重新扶住共用；双手向内合拢的反向收起路径不变。
- 说明：旧的张开手松手 / 掌心朝上握持保护 / `wholeSystemIntent` 释放-重抓置信度本来就是 debug-only、没有驱动可见太阳系，它们仍只作诊断，不是当前放下/重抓路径。
- 实现：`solarOpeningController.ts` 的 `updateHandleControl` 现在跑 `updatePlaceDownGesture`（握拳→张开状态机：握拳 armed 时冻结 transform，张开确认，`PLACE_DOWN_ARMED_TIMEOUT_MS` 超时恢复跟手）、`isBeyondMaxVisualWidth` 超宽判定和 `HANDLE_HAND_LOSS_RELEASE_MS` 兜底；删除了旧的"离开端点 exit 半径放下"分支。放下手型阈值加到 `intentTuning.ts`（`SOLAR_PLACE_DOWN_*`）。
- 测试：新增 `tests/gesture/solarHandlePlaceDown.test.ts`（握拳→张开放下、超宽自动放下、持续控制不误放下、约 0.5 秒重新扶住）。`npm run typecheck`、`npm test`（143 个）、`npm run build` 通过。
- 影响文件：`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`src/interaction/solarOpeningController.ts`、`src/interaction/intentTuning.ts`、`tests/gesture/solarHandlePlaceDown.test.ts`。
- 遗留模糊：真机录屏需微调 `SOLAR_PLACE_DOWN_*` 和 `MAX_VISUAL_WIDTH_SCREEN_FRACTION`。用户要"最大宽度约半屏"，但开启目标宽度本身已约 0.5 屏，所以自动放下设在约 0.72 屏宽以免一展开就触发；真机确认手感，若同时缩小开启目标再调低。

### 2026-06-25 — 收敛 AE 边界光环 look-dev 生成脚本

- 导出决策：当前 AE 裂口边界母版导出采用透明 PNG 序列，因为它能稳定保留 alpha、便于逐帧检查，并且符合当前项目静态资源结构；透明 WebM VP9 作为未来运行时派生格式，而不是 AE 源导出格式。
- 工具更新：新增 `scripts/after-effects/export-ar-solar-rift-border-png-sequence.jsx` 独立导出 helper，用于查找 `rift_border_loop`、写入 `public/assets/solar/fx/rift-border-loop/png-sequence/` 帧序列，并生成 `rift_border_loop.sequence.json`；它不覆盖也不修改 look-dev 生成脚本。
- 循环质检更新：检查第一版导出的 PNG 序列后确认格式是正确的 RGBA PNG，但发现旧生成脚本里的移动弧线漂移和 Turbulent Displace evolution 不是数学无缝循环；已将生成脚本改为周期表达式，供后续重新导出使用。
- 需求更新：AE 边界光环的垂直俯仰已确认 look-dev 数值为 `66.66°`，但该角度作用在已预先压扁的 `1500 x 600` 椭圆上；运行时太阳系总览盘面同步为当前 `10.5 x 9.2` 裂口基础尺寸下的等效 Three.js `-79.58°` / `-1.38893 rad`。
- 修正说明：直接把 AE 滑块值照抄为运行时 `rotation.x = -66.66°` 是错的，因为漏算了 AE 源椭圆的宽高比；现在运行时配置按公式推导等效 pitch，并用单元测试锁住。
- 坐标澄清：屏幕空间的位置 Y 仍然是上下轴，但已确认的圆盘垂直俯仰/椭圆压扁效果在 Three.js 中实现为 X 旋转；Y 旋转只保留很小的左右 yaw。
- 需求更新：AE 源素材只需要沙粒感裂口边界光环，并带轻微呼吸和小幅 2D 角度漂移；蓝金能量丝和强透视角度预览不属于这个脚本范围。
- 工具更新：将 `scripts/after-effects/create-ar-solar-rift-vfx.jsx` 收敛为一键 AE JSX，只创建可循环的 `rift_border_loop` 边界光环合成和 README 指引合成；`BREATH_CONTROL` 现在带有默认值为 `66.66` 的 `Vertical Tilt Degrees` Slider Control，并接到 AE 的 X Rotation，用于调节光环上下方向的俯仰，而不是左右水平旋转。
- 性能更新：为 AE look-dev 预览优化生成脚本，关闭 comp motion blur，将生成的矢量沙粒 group 从约 1,140 个降到 326 个，移除逐粒 opacity 表达式，并移除沙粒层上的 Glow 效果。
- 范围澄清：根据用户要求，AE 脚本不导出文件、不保存工程、不加入 Render Queue；运行时导出格式和 Three.js 接入等 AE 效果确认后再决定。
- 护栏：这是源素材工具，不改变 app 运行时代码、手势逻辑、展示控制生命周期、初始空场行为或已有视觉显示时机。
- 影响文件：`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/solar/solarVisualConfig.ts`、`scripts/after-effects/create-ar-solar-rift-vfx.jsx` 和 `scripts/after-effects/export-ar-solar-rift-border-png-sequence.jsx`。
- 剩余不确定性：最终运行时交付格式需要等边界光环合成效果看过后再定。

### 2026-06-25 — 实现椭圆宇宙裂口总览视觉方向

- 需求更新：太阳系总览应接近用户参考图，采用强斜俯视盘面角度、默认视觉 Z 旋转 `0°`、放大的非真实天体比例，以及椭圆形撕裂宇宙空间。
- 视觉更新：新增生成式 `UniverseRiftBackdrop`，包含 80% 暗色透明的星空内部、轻微蓝色/暖色星云层、沙粒感金/青/白边界粒子，并由既有 `openingProgress` 驱动显示。
- 视觉更新：在 `src/solar/solarVisualConfig.ts` 中集中管理总览倾角/裂口常量；调优总览天体半径、轨道相位、命中半径、整体光照可读性、Saturn 总览环倾角，并把星尘/拖尾粒子增加到总计 420 个 points。
- 展示控制更新：视觉 Z 和端点参考计算都使用相同的默认 `0°` Z 旋转，使可见水平裂口/端点与重新扶住参考保持一致。这是本次视觉角度调整中用户明确要求的改动；未修改启动、松手、重新扶住、收起阈值或状态流转。
- 护栏：裂口背景和粒子在 pull-open 前保持隐藏，只从既有太阳系可见性和 `openingProgress` 显示；未新增 timer、自动播放，也未修改手势识别、状态机、行星激活/focus/follow/return 语义或初始空场生命周期。
- 验证：`npm test` 通过，22 个文件 / 138 个测试；`npm run build` 通过。已在 Chrome 预览 `http://127.0.0.1:5175/?solarPreview=1` 做视觉检查。
- 影响文件：`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`src/main.ts`、`src/interaction/solarOpeningController.ts`、`src/solar/celestialBody.ts`、`src/solar/solarParticles.ts`、`src/solar/solarSystem.ts`、`src/solar/solarSystemData.ts`、`src/solar/solarVisualConfig.ts`、`src/solar/universeRiftBackdrop.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：还需要真实摄像头拉开录屏确认扩大后的裂口宽度和放大星球在实时摄像头构图中是否仍然贴合双手。

### 2026-06-25 — 根据录屏调优 Solar particle pass

- 视觉调优：复查 `~/Documents/录屏2026-06-25 17.34.25.mov` 后，第一版粒子的生命周期和性能形态是对的，但视觉上太像彩色 UI 点，而不是细腻星尘。
- 视觉调优：粒子总数从 264 降到 200，整体 size 和 opacity 下调；micro flare 减到 4 个非常弱的、贴近拖尾的点；cyan/gold trail points 更贴近轨道平面，减少 z/垂直方向散布。
- Focus 调优：粒子在 focus view 中的 dimming 更强，使背景星尘/拖尾在单颗行星 focus 时更明显退后。
- 护栏：这仍然只是 `SolarParticleField` 的视觉调优，使用 5 个 `Points` 对象；未修改手势识别、状态机、controller、`main.ts`、opening progress 来源或初始空场生命周期。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md` 和 `src/solar/solarParticles.ts`。
- 剩余不明确项：还需要再录一版真实画面，确认粒子现在读作细空气尘和轻微拖尾，而不是可交互 UI 标记。

### 2026-06-25 — 新增轻量星尘和行星拖尾粒子

- 视觉更新：新增 `SolarParticleField`，作为轻量粒子层，使用总计 264 个 `Points` 粒子，覆盖 white stardust、soft stardust、cyan trail accents、gold trail accents 和 micro flares，并使用现有 FX particle 贴图。
- 生命周期更新：粒子挂在太阳系 group 下的 `solar-particles-root`，初始空场保持隐藏；只有 `visibleRequested` 为 true 且 `openingProgress > 0.25` 时才显示。
- Opacity 更新：粒子 opacity 从 opening progress 0.25 到 0.72 淡入，保持较低强度以适配 AR 可读性；进入单颗行星 focus view 后会乘以 focus dim scale 变暗。
- 性能护栏：本轮使用 5 个 `Points` 对象，而不是数百个 mesh；未引入 GPU simulation、postprocessing，也未修改手势识别、状态机、controller 或 `main.ts` 交互流。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`src/solar/solarParticles.ts`、`src/solar/solarSystem.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：还需要真实浏览器/摄像头预览，根据是否抢手部识别视觉或行星 label 来微调粒子 opacity/size。

### 2026-06-25 — 根据真实录屏调优太阳系 opening VFX

- 视觉调优：复查 `~/Documents/录屏2026-06-25 17.17.22.mov` 后，早期 crack/rift sprites 因继承较小的 opening group scale 而很难看清；后期 shockwave 则读成了人物脸前突然出现的大圆形 portal。
- 视觉调优：opening crack 和 blue/gold rift sprites 现在使用有上限的 scale compensation，让早期由手撕开的裂缝更可读；burst/shockwave sprites 被后移、缩小并降低 opacity；hand-anchor glows 仍保持 endpoint 位置，但使用更强的补偿尺寸。
- 护栏：VFX 仍然只从 `openingProgress` 派生；未新增 timer、自动播放，也未修改 `SolarOpeningController`、状态机、手势阈值、endpoint-control、`main.ts`、focus/return 或初始空场行为。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md` 和 `src/solar/solarSystem.ts`。
- 剩余不明确项：还需要再录一次真实画面，确认 opening 现在读作横向手撕裂缝，而不是突然出现的圆形 portal。

### 2026-06-25 — 新增太阳系 opening 裂缝 VFX

- 视觉更新：`CodePlaceholderSolarSystem` 现在拥有 `solar-opening-vfx` group，用于显示由 progress 驱动的 opening sprites：早期 `thin-space-crack.png`，中段 `blue-gold-energy-rift.png`，接近完成时 `burst-rift.png` 与 cyan/blue-gold shockwave rings，并在左右 control endpoint 附近显示蓝色/金色 hand-anchor glow sprites。
- Progress 更新：sprite opacity 和 scale 直接由 `openingProgress` 映射；VFX 不运行 timer，也不能自动把 opening 播放完成。
- 护栏：VFX group 只在 `visibleRequested` 为 true 且 `openingProgress > 0` 时可见；`openingProgress = 0` 时太阳系 group 仍隐藏，保持初始空场。到 `openingProgress = 1` 时，opening crack/rift/burst/anchor sprites 会淡出。
- 交互护栏：未修改 `SolarOpeningController`、状态机、手势阈值、endpoint-control 语义、`main.ts` 交互流、hover/activation/focus/return 规则或全局 postprocessing。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`src/solar/solarSystem.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：还需要真实摄像头预览，根据手距和摄像头曝光调整 sprite scale/opacity。

### 2026-06-25 — 行星 hover 与 activated HUD 升级

- 视觉更新：行星 hover 和 activated 现在使用 HUD 风格 target lock 对象。优先视觉是通过 asset manifest 加载的 `target-lock-ring.png`；PNG 尚未加载或加载失败时，现有程序 ring 会作为 fallback 保留。
- 视觉更新：轨道 ring 在 idle 状态更细更暗，hover 状态更亮，activated 状态最亮。行星 label 保留 canvas 文字路径，但底框改成深色玻璃 HUD 面板，带 cyan 边线和 gold 角标。
- Dimming 更新：`setFocusBackgroundDimmed` 仍然控制背景弱化；focus view 激活时，body opacity、target-lock/fallback hover ring、orbit、label 和 planet ring opacity 都会变暗。
- 护栏：`setInteractionVisualState` API 不变，未修改 `planetActivationController`，也未修改任何手势/状态机/focus 入口/返回按钮逻辑。未新增启动前可见 3D 内容、全局 starfield、nebula、particles、bloom 或 postprocessing。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`src/solar/celestialBody.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：还需要浏览器预览确认 target-lock sprite 尺寸和 label 在摄像头曝光下的可读性。

### 2026-06-25 — 太阳系总览 Sun 升级为 plasma core VFX

- 视觉更新：太阳系总览里的 Sun 现在使用专用的材质型 VFX 结构，包括 time-driven inner plasma shader sphere、additive Fresnel corona shell，以及从 asset manifest 加载的可选横向 FX lens-flare sprite。
- Fallback 更新：lens flare 贴图通过安全缓存 texture loader 加载。如果 FX PNG 缺失或加载失败，sprite 保持隐藏，plasma/corona core 仍正常渲染且不抛错。
- 护栏：本次仅作用于现有 `CelestialBody` 的 Sun 分支；没有新增 Sun focus、全屏 postprocessing、`EffectComposer`、`UnrealBloomPass`、global bloom、starfield、nebula、particles、opening rift 或 HUD 装饰。初始空场仍由现有太阳系可见性生命周期控制。
- 交互护栏：未修改手势逻辑、状态机、交互 controller、`main.ts` 流程、hover/activation/focus 入口、返回按钮 hold 规则或行星 focus 规则。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`src/solar/celestialBody.ts`、`src/solar/solarVfxMaterials.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：还需要真实浏览器/摄像头预览，根据录屏观察调整 corona 和 lens flare 强度。

### 2026-06-25 — 全部行星 focus view 升级为 profile-driven 多层视觉

- 视觉更新：`FocusedCelestialBody` 现在通过可复用 focus profile 构建单颗行星主角画面：base sphere、可选贴图/程序 overlay shell、可选 shadow shell、可选 Fresnel atmosphere shell 和可选 ring mesh。
- 行星更新：Earth 保留 day/cloud/night-light/blue atmosphere 多层；Venus 增加金色 haze；Mercury 和 Moon 强调岩石/坑纹 albedo 与轻微冷色 rim；Mars 增加薄红色沙尘；Jupiter 增加气体云带 overlay；Saturn 增加 NASA/AI/程序三段 fallback 的透明 ring；Uranus 保持干净青蓝与浅色 rim；Neptune 增加薄风带和深蓝大气边缘光。
- Fallback 更新：focus albedo、Earth overlay textures 和 Saturn ring textures 都通过安全缓存 loader 加载。素材缺失或加载失败时 warning，并继续使用现有程序 focus 材质或 ring fallback，不抛错，也不让 focus view 黑屏。
- 护栏：未修改手势逻辑、状态机、交互 controller、`main.ts` 流程、hover/activation/focus 入口、返回按钮 hold 规则、背景 dimming 或初始空场生命周期。未新增 opening rift、全局 starfield、nebula、particles、bloom、HUD 装饰或 Sun focus。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`src/solar/focusPlanetProfiles.ts`、`src/solar/focusedCelestialBody.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：还需要真实浏览器/摄像头预览逐个检查各 focus 行星后，再微调每颗行星的大气/overlay 强度。

### 2026-06-25 — 太阳系总览行星升级为 NASA 贴图

- 视觉更新：太阳系总览的天体材质现在从 asset manifest 读取 albedo 贴图路径。Earth 使用 NASA medium day texture；Mercury、Venus、Moon、Mars、Jupiter、Saturn、Uranus 和 Neptune 在加载成功时使用各自 NASA medium planet albedo。
- 可读性更新：加载成功的 NASA 总览贴图也会作为适度的 `emissiveMap` 使用，并按天体设置不同强度，让小尺寸预览行星在 AR 总览光照下更清楚；不改变 focus Earth，也不新增灯光或特效。
- Fallback 更新：每个总览天体仍先创建现有程序材质，NASA 贴图成功加载后才替换 map；素材缺失或加载失败时由 `textureAssets.ts` warning，并继续使用程序 fallback，不抛错。
- Ring 更新：太阳系总览 Saturn ring 现在先尝试 NASA runtime ring PNG，再尝试 AI `saturn-ring-texture.png`，最后保留现有程序 ring 材质。ring 材质保持 transparent，PNG alpha 生效，`depthWrite` 保持关闭。
- 护栏：未修改手势逻辑、状态机、tracking、坐标映射、交互 controller、`main.ts` 交互流、focus/follow/return 语义、label、hover ring、hit test、背景 dimming 或初始空场生命周期。未新增 starfield、nebula、particles、rift、HUD 装饰、bloom、太阳 plasma、corona 或 lens flare。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`src/solar/celestialBody.ts` 和 `src/solar/planetTextureMaterials.ts`。
- 剩余不明确项：还需要真实浏览器预览确认每个 NASA 贴图的视觉亮度/朝向，以及 AR 画面里 Saturn ring alpha 的实际观感。

### 2026-06-25 — 导入水星、天王星和土星环 NASA 素材

- 素材更新：把用户提供的 NASA 源文件从 `inbox/` 复制到 `public/assets/solar/nasa/masters/`，并在 `public/assets/solar/nasa/runtime/` 下生成可支持的 runtime 文件。
- Runtime 更新：水星现在有 2048x1024 和 4096x2048 albedo runtime 文件；天王星只有 2048x1024 albedo runtime，没有强行放大生成 4K；土星环现在有 2048x125 和 4096x250 条带 runtime 贴图。
- Manifest 更新：`public/assets/solar/manifests/nasa-assets.json` 将水星、天王星和土星环从 `missing` 替换为具体素材元数据；`src/solar/solarAssetManifest.ts` 将水星和天王星标记为可用 medium runtime 贴图，并新增 `NASA_RING_TEXTURES.saturn`。
- 护栏：未修改手势逻辑、状态机、追踪、坐标映射、控制器行为、`main.ts` 交互流或对象可见性生命周期。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`public/assets/solar/manifests/nasa-assets.json`、`src/solar/solarAssetManifest.ts`，以及 `public/assets/solar/nasa/masters/` 和 `public/assets/solar/nasa/runtime/` 下的新文件。
- 剩余不明确项：用户提供的源文件没有附原始 NASA 网页 URL，因此 manifest 记录为来自 `inbox/` 的用户提供 NASA 源文件。

### 2026-06-25 — Earth focus 回退到 surface shader 之前的版本

- 视觉修正：根据用户反馈，Earth focus 已恢复到 day/night surface shader 实验之前的版本。加载成功的 day texture 重新直接应用到 base material；现有 shadow、cloud、night-light 和 atmosphere 层保留。
- 被替代调优：这次有意撤回前两条记录中的 surface-shader 压暗方案，因为它在真实摄像头预览中让地球读成过黑。
- 护栏：这仍然是 `FocusedCelestialBody` 内的纯视觉调参；未修改手势逻辑、行星 focus controller 规则、返回按钮 hold 规则、状态机、`main.ts` 流程或初始空场生命周期。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md` 和 `src/solar/focusedCelestialBody.ts`。
- 剩余不明确项：下一步夜侧可读性改进应避免重新引入过黑的 surface-shader 方案。

### 2026-06-25 — Earth focus 夜侧从过黑状态回调

- 视觉调优：复查 `~/Documents/录屏2026-06-25 14.49.55.mov` 后，上一版 Earth focus 夜侧过暗，读起来像黑盘，而不是电影感夜侧。
- 视觉调优：Earth surface shader 现在保留更多夜侧地形/海洋细节，云层 shell 在夜侧不再过黑，shadow shell 不透明度降低，使它只作为柔和昼夜分界，而不是第二层重度压暗。
- 护栏：这仍然是 `FocusedCelestialBody` 内的纯视觉调参；未修改手势逻辑、行星 focus controller 规则、返回按钮 hold 规则、状态机、`main.ts` 流程或初始空场生命周期。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md` 和 `src/solar/focusedCelestialBody.ts`。
- 剩余不明确项：还需要再做一次真实浏览器/摄像头预览，确认夜侧细节可读和城市灯可见之间的平衡。

### 2026-06-25 — Earth focus 地表 shader 加深夜侧

- 视觉调优：复查 `~/Documents/录屏2026-06-25 14.34.40.mov` 后，加载成功的 Earth day base 现在会切换到昼夜地表 shader，在假夜侧直接压暗地形和海洋，而不是只依赖外层 shadow shell。
- 视觉调优：夜侧云层的不透明度和颜色再次降低，同时暖色城市灯层继续以 additive 方式渲染在云层之上，让它能在更暗的地表上更清楚地读出来。
- 护栏：如果 Earth day 贴图缺失或加载失败，现有程序 focus 材质仍然作为 fallback；未修改手势逻辑、行星 focus controller 规则、返回按钮 hold 规则、状态机、`main.ts` 流程或初始空场生命周期。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md` 和 `src/solar/focusedCelestialBody.ts`。
- 剩余不明确项：还需要再做一次真实浏览器/摄像头预览，确认更深的夜侧是否有电影感，同时不会丢失过多地球轮廓细节。

### 2026-06-25 — 根据第二条录屏调优 Earth focus 夜侧灯光

- 视觉调优：复查 `~/Documents/录屏2026-06-25 14.28.36.mov` 后，Earth focus 的夜景灯光 shell 现在使用更暖的城市灯调色、更收紧的亮度 mask 和更强的假夜侧 mask；同时夜景灯层渲染在云层之上，以提高可读性。
- 视觉调优：云层 shell 现在使用与昼夜分界一致的假光照方向，并在夜侧降低亮度和透明度，避免云层在暗面读成白色纹理噪点、盖住城市灯。
- 护栏：改动仍局限在 `FocusedCelestialBody` 的 Earth shader/render-order 调优和 TODO 文档；未修改手势逻辑、行星 focus controller 规则、返回按钮 hold 规则、状态机、`main.ts` 流程或初始空场生命周期。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md` 和 `src/solar/focusedCelestialBody.ts`。
- 剩余不明确项：还需要再做一次真实浏览器/摄像头预览，确认新的城市灯暖色和夜侧云层压暗是否足够明显且不过于人工。

### 2026-06-25 — 根据真实录屏调优 Earth focus 可读性

- 视觉调优：复查 `~/Documents/录屏2026-06-25 14.22.21.mov` 后，Earth focus 现在有更柔和但可读的昼夜分界、只出现在假夜侧的城市灯、更亮的亮度抠像云层、更快的独立云层漂移，以及更薄的大气边缘光。
- 护栏：改动仍局限在 `FocusedCelestialBody` 的 Earth 视觉和单元测试结构断言；未修改手势逻辑、行星 focus controller 规则、返回按钮 hold 规则、状态机、`main.ts` 流程或初始空场生命周期。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`src/solar/focusedCelestialBody.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：还需要再做一次真实浏览器/摄像头预览，确认昼夜分界方向、城市灯强度、云层透明度和大气厚度在镜头里是否合适。

### 2026-06-25 — Earth focus 升级为多层电影感地球

- 视觉更新：单颗行星 focus overlay 中的 Earth 现在使用多层结构，包括 day 地表基底、独立亮度抠像云层 shell、轻微 additive 夜景灯光 shell 和蓝色 Fresnel 大气 shell。
- 护栏：变更仅作用于 `definition.id === 'earth'`；其他 focus 天体保持现有 focus 材质路径/fallback，`FocusedCelestialBody` public API 以及行星 focus、follow、放下和返回规则均未改变。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`src/solar/focusedCelestialBody.ts`、`src/solar/textureAssets.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：后续应在真实浏览器/摄像头预览中，根据新的视觉方案微调云层 alpha 阈值、夜景灯光不透明度和大气强度。

### 2026-06-25 — 新增 VFX 素材 manifest 和安全贴图加载器

- 工程更新：新增 VFX 素材管线基础，包含默认 medium 的 NASA 运行时路径、FX PNG 路径、水星和天王星的显式 missing 标记，以及带缓存的 Three.js 贴图加载器。
- 护栏：贴图缺失或加载失败时，loader warning 后返回 `null`，让现有程序材质继续作为 fallback；未改变 `CelestialBody` 画面、手势逻辑、状态机、`main.ts` 交互流或启动可见性生命周期。
- 验证：`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`src/solar/solarAssetManifest.ts` 和 `src/solar/textureAssets.ts`。
- 剩余不明确项：实际视觉风格，以及每个材质/特效具体接入哪些素材，等新的视觉特效方案提供后再确定。

### 2026-06-25 — 视觉效果阶段保留已测试通过的交互逻辑

- 需求澄清：从视觉效果工作开始，Codex 必须把已经测试通过的交互逻辑和既有展示控制逻辑视为锁定状态；除非用户明确要求修改逻辑或展示控制行为。
- 工作流更新：视觉工作可以改进材质、程序纹理、光照、辉光、粒子、星云、尾迹、标签、UI 质感、录屏模式和渲染性能，但不得在未获明确许可时修改手势状态机、阈值、手部配对、新帧门闸、坐标映射、整体太阳系把手生命周期或行星激活/焦点/跟随/返回语义。
- 计划更新：Milestone 10 已将这条保护规则加入任务、验收标准和建议提示词约束。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md` 和 `TODO.zh-CN.md`。
- 剩余不明确项：无；如果后续某个视觉目标确实需要修改逻辑或展示控制，Codex 必须先暂停并询问。

### 2026-06-24 — M9 返回从开掌手势改为左上角食指按钮

- 需求变更：掌心朝屏幕、五指伸直的开掌返回指令因在焦点/控制状态切换中不够可靠而退役。单颗行星返回入口改为屏幕左上角透明玻璃质感矩形按钮，按钮包含返回 icon 和“长按返回太阳系”；用户用追踪食指尖按住按钮触发返回，不是鼠标点击按钮。
- 交互更新：食指尖按住左上角按钮 1 秒会填满按钮进度条并进入 `BodyReturning`；如果在阈值前食指尖移出按钮区域、手部丢失或退出焦点状态，则进度重置，星球继续留在焦点画面。
- 实现更新：`main.ts` 负责食指返回按钮停留计时并启动已有的 0.5 秒焦点星球返回动画；`PlanetFocusController` 不再检测开掌返回手势。
- 验证更新：已移除开掌手势测试，保留返回动画单元覆盖；手势 helper 测试覆盖食指按钮命中/停留/重置；手动浏览器/摄像头验收现在覆盖左上角按钮可见性、进度重置和 1 秒食指返回。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`index.html`、`src/main.ts`、`src/interaction/planetReturnButton.ts`、`src/interaction/planetFocusController.ts`、`src/rendering/debugOverlay.ts`、`src/rendering/interactionStatusSummary.ts`、`src/styles.css`、`tests/gesture/planetReturnButton.test.ts` 和 `tests/gesture/planetFocusController.test.ts`。
- 待定：仍需真实摄像头/浏览器验证按钮位置、尺寸、玻璃质感可读性、食指命中容差、进度手感，以及 1 秒停留在演示中是否舒服。

### 2026-06-24 — BodyReturning 返回动画不再被焦点清理打断

- Bug 修复：`BodyReturning` 开始后，后续 activation/focus 更新可能在 0.5 秒返回动画尚未完成时清空 `focusedBody`。界面状态会显示“正在返回”并带有当时的开掌返回 reason，但大号焦点星球视觉上卡住，没有动画回到太阳系。随后在 2026-06-24，该触发入口已被左上角食指按钮取代。
- 实现更新：`main.ts` 现在把 `BodyReturning` 作为专属返回阶段处理，返回动画激活期间跳过行星激活/焦点输入更新。`CodePlaceholderSolarSystem` 也会在返回动画进行中保护 focused overlay，即使收到中途的 `focusedBody: null` 清理，或同一帧还有跟手 placement 写入，也不会隐藏/取消返回动画；只在返回转场完成后才允许真正清空。
- 验证更新：新增/扩展 `tests/unit/solarSystemInteraction.test.ts` 覆盖：返回中途清空 focus 或同帧跟手 placement 写入都不会隐藏/取消 overlay，返回动画仍会完成。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/main.ts`、`src/solar/focusedCelestialBody.ts`、`src/solar/solarSystem.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 待定：仍需真实摄像头验证可见 0.5 秒返回动画结束后，状态会立即从 `BodyReturning` 回到 `SolarFreeHover`。

### 2026-06-24 — M9 开掌返回保持时间缩短，并容忍控制状态切换

- 需求变更：单颗星球开掌返回的保持阈值从原先更长的等待调整为 2 秒。
- 需求澄清：如果尚未满 2 秒的开掌手触碰当前星球热区并导致 `PlanetFocusControlled` / `SingleHandFollow`，该状态切换允许发生，但不能重置返回计时；计时继续累计到 2 秒阈值。
- 实现更新：`PlanetFocusController` 现在把未完成的开掌返回识别作为并行计时，不再用早期 holding 更新拦截热区停留/操控状态。
- 验证更新：`tests/gesture/planetFocusController.test.ts` 覆盖 2 秒阈值、移动重置，以及进入单手跟随后继续累计返回计时。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/planetFocusController.ts`、`src/main.ts`、`src/rendering/interactionStatusSummary.ts` 和 `tests/gesture/planetFocusController.test.ts`。
- 待定：真实摄像头测试仍需确认 2 秒加当前稳定半径是否既有意图感，又不会在正常焦点操控时误触发。

### 2026-06-24 — M9 开掌返回替代甩回

- 需求变更：旧的单颗星球返回指令（朝原轨道目标 pinch-and-throw）已弃用。当前返回指令是一只手掌心朝向屏幕、五指伸直，并稳定保持 2 秒。
- 实现更新：`PlanetFocusController` 现在只在焦点状态中检测开掌返回保持，在 debug 中记录保持时间、分数和手部 key；当姿态丢失或手移动过远时重置计时，只有完整稳定保持 2 秒才进入 `BodyReturning`。
- 返回动画：焦点 overlay 现在用 0.5 秒移动并缩放回太阳系天体位置和大小。动画期间背景太阳系保持弱化并锁定交互；完成后清除焦点状态、恢复不透明度、天体恢复原轨道关系，并回到 `SolarFreeHover`。
- 验证更新：新增/扩展 `tests/gesture/planetFocusController.test.ts` 和 `tests/unit/solarSystemInteraction.test.ts`，覆盖 2 秒保持触发、移动重置、0.5 秒回归动画和不透明度/交互恢复。`npm run typecheck`、`npm test` 和 `npm run build` 通过。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/planetActivationController.ts`、`src/interaction/planetFocusController.ts`、`src/main.ts`、`src/rendering/debugOverlay.ts`、`src/rendering/interactionStatusSummary.ts`、`src/solar/focusedCelestialBody.ts`、`src/solar/solarSystem.ts`、`src/utils/types.ts`、`tests/gesture/planetFocusController.test.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 待定：真实摄像头测试仍需确认掌心朝向分数、五指开掌评分、稳定手半径和 2 秒保持手感是否足够支持 30-60 秒演示。

### 2026-06-24 — M8 焦点居中修复、停留稳定性与解耦捏合的双手缩放

- Bug 修复：进入 `PlanetFocusView` 后焦点星球可能停在偏离中心的位置且无法开始跟手。`main.ts` 的 `applyPlanetFocusSnapshot` 在进场/居中/停留期间每帧都在驱动星球位置，导致约 0.3 秒的进场动画被取消、星球被钉在源屏幕位置，从而把“居中后才放行”的门闸卡死。现在 `main.ts` 只在控制器处于 `SingleHandFollow` / `TwoHandFollow` 时才用手部输入驱动星球 transform；其余焦点状态下由进场动画和跟手后的保持逻辑掌控 transform。
- 稳定性：1 秒热区停留现在对短暂追踪丢失和边界抖动有容错。偶发单帧脱手不再清零停留计时（短暂宽限窗口），正在停留的手在明显离开热区前仍按“仍在触碰”计（超出严格触碰半径的滞回）。
- 跟手锚点：单手跟随改为以该手拇指+食指中点驱动（此前为掌心）；双手跟随以两手各自捏合中点之间的中点驱动位置。跟手位置与缩放都做了低通平滑。
- 双手缩放与捏合解耦：缩放只由两手之间（两手捏合中点之间）的距离驱动，与任一手自身拇指食指捏合无关，因此缩小动作不再被误判为 `PinchTap` 而放下星球。同时放宽了缩放上下限（控制器与 `FocusedCelestialBody` 的 clamp），两手收拢可把星球缩到比此前下限更小。
- 副手鲁棒性：单手跟随时副手进入或离开画面会改变激活手的内部编号；控制器现在按空间连续性重新锁定激活手，因此副手仅出现在热区外不再导致跟手被放下。
- 双手降级为单手：双手跟随时若一只手明显离开焦点星球热区而另一只仍在，控制降级为留下那只手的单手移动（缩放冻结），而不是把星球拽向撤出的那只手；要重新进入双手跟随需把第二只手放回热区重新停留 1 秒。
- 验证更新：扩展 `tests/gesture/planetFocusController.test.ts`，覆盖停留在短暂脱手时不清零、超过宽限窗口才重置、双手缩小到旧下限以下、仅闭合捏合时缩放不变、单手跟随在副手出现在热区外时不掉控、以及一只手离开热区时双手降级为单手。全量测试通过。
- 待定：跟手位置/缩放平滑、停留宽限窗口、双手保持/撤出热区阈值的真实手感仍需真实摄像头验证。

### 2026-06-24 — M8 焦点跟随改为视觉居中冷却和热区重入门闸

- 需求变更：同手 DoubleClose 进入 `PlanetFocusView` 后，焦点居中动画期间不能开始跟手。上一版固定 400ms 冷却仍然太敏感，因此控制器现在会一直保持进场冷却，直到焦点星球实际接近屏幕居中位置。
- 需求变更：进入焦点后必须发生真正的热区重入才允许跟随激活。已经在热区内的手必须先离开热区，再重新进入并停留，才开始跟随计时。
- 需求变更：单手和双手触碰焦点星球热区后，必须停留 1 秒才进入跟随，取代上一版 300-600ms 停留。
- 需求变更：跟随手 `PinchTap` 放下焦点星球后，控制器先进入取消选中/等待热区清空状态；必须等所有可见手都离开当前星球热区后，才重新进入待选中/待跟手状态。
- 实现更新：`PlanetFocusController` 新增 `IntroCooldown`、`WaitingForHeatZoneClear` 和 `DeselectedWaitForClear` debug 状态；状态摘要和引导文案会解释当前是在等视觉居中、等热区清空，还是等 1 秒停留。
- 验证更新：扩展 `tests/gesture/planetFocusController.test.ts`，覆盖视觉居中阻止、初始热区清空后才开始 dwell、1 秒 dwell、放下后进入取消选中状态，以及放下后热区清空才可重新选中。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/planetFocusController.ts`、`src/main.ts`、`src/rendering/debugOverlay.ts`、`src/rendering/interactionStatusSummary.ts`、`src/utils/types.ts` 和 `tests/gesture/planetFocusController.test.ts`。
- 剩余不确定性：仍需真实摄像头确认居中位置阈值和 1 秒停留在焦点动画后是否足够自然。

### 2026-06-24 — M8 焦点热区跟随与跟随手 PinchTap 放下

- 需求变更：用当前焦点星球热区停留替换旧的“手掌打开、掌心在行星下方、低速、停留 300-500ms”托住判断。单手触碰焦点星球热区约 300-600ms 后进入单手跟随；双手触碰热区约 300-600ms 后进入双手跟随，并用两手距离调整焦点星球大小。
- 需求变更：放下焦点星球现在使用跟随手 close-open `PinchTap`。单手跟随中由该跟随手完成；双手跟随中任意一只跟随手完成即可放下。在这个语境里，“取消选中”表示解除跟随控制并进入 `PlanetFocusFloating`，不表示退出焦点画面或回轨。
- 实现更新：新增 `PlanetFocusController`、焦点 debug 快照行、焦点状态摘要/引导文案、焦点星球位置/缩放接口、屏幕像素到世界坐标映射和焦点星球热区目标。焦点跟随只更新 focus overlay，不改变整个太阳系 transform。
- 验证更新：新增 `tests/gesture/planetFocusController.test.ts`，覆盖单手停留/跟手/放下、双手停留/跟手/缩放/放下，以及热区外不触发；扩展 `tests/unit/solarSystemInteraction.test.ts`，断言焦点位置/缩放不会改变太阳系 group。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/coordinateMapping.ts`、`src/interaction/planetFocusController.ts`、`src/main.ts`、`src/rendering/debugOverlay.ts`、`src/rendering/interactionStatusSummary.ts`、`src/solar/focusedCelestialBody.ts`、`src/solar/solarSystem.ts`、`src/utils/types.ts`、`tests/gesture/planetFocusController.test.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：仍需真实摄像头调优 1 秒停留手感、焦点星球热区半径、close-open PinchTap 阈值和双手缩放范围。

### 2026-06-24 — M8 焦点行星进入过渡动画

- 需求变更：进入单颗行星焦点画面时不应再瞬间跳变；焦点天体应从其在太阳系中的原始位置和当前尺寸出发，在约 0.3 秒内动画过渡到居中的焦点 overlay。
- 实现更新：`FocusedCelestialBody` 现在会记录进入动画的源世界位置/缩放，使用 smoothstep 过渡到居中目标，并在过渡期间继续补偿太阳系父级 transform。
- 验证更新：扩展 `tests/unit/solarSystemInteraction.test.ts`，断言焦点天体从原世界位置开始、0.3 秒动画中点仍在路上、动画完成后到达居中焦点布局。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/solar/focusedCelestialBody.ts`、`src/solar/solarSystem.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：仍需真实摄像头验证 0.3 秒是否足够顺滑且不显慢，尤其是从当前太阳系视图边缘激活小天体时。

### 2026-06-24 — M8 焦点行星居中、放大并移除光照

- 需求变更：`PlanetFocusView` 中，单个焦点行星球体应垂直居中；焦点球体高度大约占屏幕高度 1/2 到 2/3；不应出现聚光灯式强光斑。
- 实现更新：焦点星球现在会补偿太阳系父级 transform，保持屏幕中心位置；根据天体半径和摄像机高度占比计算世界缩放；焦点球体使用无光照材质，并移除旋转标记造成的聚光灯式亮斑。
- 验证更新：收紧 `tests/unit/solarSystemInteraction.test.ts`，断言焦点世界位置居中、月球接近 1/2 屏幕高度、木星接近 2/3 屏幕高度，以及焦点球体使用 `MeshBasicMaterial`。
- 影响文件：`AGENTS.md`、`ar_solar_system_prd.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/solar/focusedCelestialBody.ts`、`src/solar/proceduralMaterials.ts`、`src/solar/solarSystem.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：仍需真实摄像头验证更大且居中的星球是否观感合适，以及是否遮挡用户脸/身体过多。

### 2026-06-24 — M8 焦点背景球体透明度改为真正视觉生效

- 根据用户截图修复 bug：`/var/folders/cw/d9jps_sj2gd8j6tvg92z2c3m0000gn/T/codex-clipboard-5b1d2c6b-1f93-4552-a79a-d40253944987.png` 显示 `PlanetFocusView` 中背景原始球体仍然看起来过实，不像预期的 `0.18` 透明度。
- 实现更新：焦点背景球体材质现在会明确切换到透明渲染，设置 `opacity=0.18` 且 `depthWrite=false`；离开焦点后恢复为不透明 `opacity=1` / `depthWrite=true`。
- 验证更新：收紧 `tests/unit/solarSystemInteraction.test.ts`，改为断言精确的背景球体渲染状态，而不是只检查 opacity 小于 `1`。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/solar/celestialBody.ts`、`src/solar/solarSystem.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：仍需真实摄像头验证原始背景球体在焦点 overlay 后方是否已经明显变淡。

### 2026-06-24 — M8 DoubleClose 真实摄像头小幅张开调优

- 根据用户证据修复 bug：`~/ChromeDownload/ar-solar-gesture-log-2026-06-24T04-40-45-494Z.json` 和 `~/Documents/录屏2026-06-24 12.39.35.mov` 显示 `doubleCloseCount` 多次到 `1` 但从未到 `2`；第一次闭合后的真实拇指/食指重新张开只有约 8-10px，低于之前的绝对 reopen 阈值。
- 实现更新：`PlanetActivationController` 现在记录第一次闭合指标，允许相对该闭合基线稳定张开一小段，并要求从观测到的张开峰值再次回落闭合后才进入 `PlanetFocusView`；长按闭合仍不会被重复计为两次。
- 验证更新：在 `tests/gesture/planetActivationController.test.ts` 中新增回归，覆盖本次日志里的真实模式（`52px` 闭合 → `61px` 小幅张开 → `52px` 闭合）。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/planetActivationController.ts` 和 `tests/gesture/planetActivationController.test.ts`。
- 剩余不确定性：M8 焦点入口仍需再次真实摄像头测试，确认小幅张开调优在不同星球和手型下都自然。

### 2026-06-24 — M8 焦点背景弱化改为透明度，不使用蒙版

- 需求澄清：`PlanetFocusView` 的背景弱化必须直接降低背景太阳系对象透明度，不能添加覆盖摄像头画面的蒙版或暗幕。
- 实现更新：移除 `planet-focus-backdrop` mesh，改为降低背景天体、光环、hover 标记和标签透明度，同时保持焦点 overlay 完全不透明。
- 验证更新：更新 `tests/unit/solarSystemInteraction.test.ts`，断言不存在 backdrop 对象、focus 中背景天体透明度降低、离开 focus 后透明度恢复。
- 影响文件：`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/solar/celestialBody.ts`、`src/solar/solarSystem.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：仍需真实摄像头验证当前透明度是否既保留背景太阳系参照，又不会压暗摄像头画面。

### 2026-06-24 — M8 第一阶段 PlanetFocusView 可见 overlay

- 需求澄清：`PlanetFocusView` 必须在视觉上明显区别于 `PlanetActivated`；第一阶段为所有可交互天体使用一套由天体元数据驱动的焦点 overlay，而不是每颗星球单独写页面。
- 交互调优：选中天体后，同一只激活手短暂离开热区仍保持激活，以便完成 close-open-close；张开状态下离开热区约 1 秒才取消选中。
- 根据手势日志 `ar-solar-gesture-log-2026-06-23T20-51-22-909Z.json` 继续调优：DoubleClose 的张开改为识别拇指/食指小幅重新张开，不再要求达到完整 pinch 结束阈值；双击间隔放宽到 1.6 秒；张开经过其它天体时不切换 active body。
- 实现更新：新增焦点星球渲染，背景太阳系通过直接降低对象透明度弱化，不添加蒙版/暗幕；焦点状态下隐藏整体端点，并从 `main.ts` 把焦点状态传给太阳系渲染层；背景太阳系保持基础运动，焦点 overlay 保持自转。
- 验证更新：扩展 `tests/unit/solarSystemInteraction.test.ts` 覆盖焦点 overlay、背景透明度和背景运动；扩展 `tests/gesture/planetActivationController.test.ts` 覆盖离开热区容错、小幅张开的 DoubleClose 和张开经过其它天体时保持选中。
- 影响文件：`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/planetActivationController.ts`、`src/main.ts`、`src/solar/focusedCelestialBody.ts`、`src/solar/solarSystem.ts`、`tests/gesture/planetActivationController.test.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不确定性：仍需真实摄像头测试 DoubleClose 时机是否自然，以及焦点 overlay 在摄像头预览中是否足够明确；确认后再继续托住跟手和 PinchTap 放下。

### 2026-06-24 — M8 焦点入口改为激活手 DoubleClose

- 需求变更：进入单颗行星画面不再使用副手张开/扩张。天体被 pinch 激活后，同一只激活手的拇指/食指完成两次 closeDown，进入 `PlanetFocusView`。
- 实现更新：`PlanetActivationController` 现在会在同一只手靠近激活天体张开时保持激活，忽略初始激活 pinch，识别 closeDown → reopen → closeDown，拒绝长按闭合重复计数，并在进入 `PlanetFocusView` 后保留 active body。
- 验证更新：扩展 `tests/gesture/planetActivationController.test.ts`，覆盖 DoubleClose 进入、长按闭合不误触发和焦点视图快照保持。
- 影响文件：`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/planetActivationController.ts`、`src/main.ts`、`src/rendering/debugOverlay.ts`、`src/rendering/interactionStatusSummary.ts`、`src/utils/types.ts` 和 `tests/gesture/planetActivationController.test.ts`。
- 剩余不明确项：M8 入口仍需真实摄像头验证时序和手感。

### 2026-06-24 — 地月激活绑定

- 需求澄清：M7 激活中，地球和月球是特殊绑定组。激活地球时，地球绕太阳公转暂停，月球仍可继续绕地球公转；激活月球时，地球绕太阳公转和月球绕地球公转都暂停；两种情况下地球和月球都保持自转。
- 实现更新：将特殊暂停规则放在太阳系运动层，pinch controller 仍然只报告一个 active body，由渲染/运动层决定哪些 orbit pivot 暂停。
- 验证更新：扩展 `tests/unit/solarSystemInteraction.test.ts`，覆盖激活地球、激活月球，以及两者自转持续。
- 已被后续行为取代说明：截至 2026-06-30，月球不再作为总览独立激活入口；这里的历史月球激活路径只保留为内部/焦点能力覆盖。
- 影响文件：`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/solar/solarSystem.ts` 和 `tests/unit/solarSystemInteraction.test.ts`。
- 剩余不明确项：M7 仍需真实摄像头确认浏览器中选中地球和月球时的视觉行为符合预期。

### 2026-06-24 — Milestone 7 卡死与激活切换修复

- 根据用户证据修复 bug：`/var/folders/cw/d9jps_sj2gd8j6tvg92z2c3m0000gn/T/codex-clipboard-e493c513-12bc-4ed7-ab54-13648310e106.png` 显示 `Invalid interaction transition: SolarFreeHover -> PlanetActivated`，这会在已释放太阳系尝试激活天体时停止渲染循环。
- 实现更新：状态机现在允许从 `SolarActive` / `SolarFreeHover` 直接进入 `PlanetActivated`；激活可通过统一 controller 从 A 切到 B；清除或切换 A 后，A 会恢复原轨道公转，当前激活天体才是唯一暂停公转的天体。
- 产品澄清：激活天体只暂停原轨道/位置移动，必须保持自然自转。用户从 A 转到 B 时，A 立即恢复原轨道公转。
- 验证更新：新增回归覆盖自由悬浮后直接激活、A 到 B 的激活切换，以及占位太阳系中“暂停公转不停止自转，切换激活后前一个天体恢复公转”的规则。
- 影响文件：`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/stateMachine.ts`、`src/interaction/planetActivationController.ts`、`tests/unit/stateMachine.test.ts`、`tests/unit/solarSystemInteraction.test.ts` 和 `tests/gesture/planetActivationController.test.ts`。
- 剩余不明确项：M7 仍保持 `NEEDS_MANUAL_VERIFY`，直到用户确认真实摄像头流程不再卡死，且 A/B 激活行为在浏览器里符合预期。

### 2026-06-24 — Milestone 7 真实摄像头证据修复

- 根据用户证据修复 bug：`~/ChromeDownload/ar-solar-gesture-log-2026-06-23T17-54-45-833Z.json` 显示只有 12 帧 `BodyHover`，没有任何 `PlanetActivated`；hover 是由手掌中心靠近触发的，但用户实际意图是用 pinch 指尖命中目标。靠近 hover 时最低激活 ratio 约为 `0.42`，旧的 synthetic-only `0.18` start 阈值会全部拒绝。
- 实现更新：M7 hover/activation 现在会在拇指/食指中点、拇指尖、食指尖和手掌中心之间选择离天体最近的交互点；pinch start/end 阈值调整为 `0.48 / 0.62`，并加入屏幕像素距离保护；通用命中半径也放大，使真实指尖瞄准不那么脆弱。
- 调试更新：Debug 面板和 recorder 现在包含 `pinchDistancePx` 和 `hoverPointKind`，后续录制可以区分手掌中心命中和指尖/捏合中点命中。
- 验证更新：新增回归测试，覆盖“手掌中心远离土星，但 pinch 中点落在土星上时必须进入 `PlanetActivated`”。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/planetActivationController.ts`、`src/rendering/debugOverlay.ts`、`src/solar/solarSystem.ts`、`src/utils/types.ts` 和 `tests/gesture/planetActivationController.test.ts`。
- 剩余不明确项：需要用户重新跑真实摄像头 checklist，确认新阈值和热区在当前总览入口上的手感是否合适。

### 2026-06-24 — Milestone 7 hover 和 pinch 激活已实现

- 实现更新：新增统一的 `PlanetActivationController`，负责屏幕空间天体 hover、最近目标迟滞、pinch start/end 迟滞、`BodyHover` / `PlanetActivated` 转换，以及 pinch 激活保持期间的短暂追踪丢失容忍。
- 渲染更新：可交互天体现在暴露投影后的屏幕目标、水星/月球扩展热区、hover/activated 光环、标签、轨道高亮；被激活天体会暂停原轨道公转，同时继续自转。
- 状态/调试更新：将旧的代码态 `BodyGrabbed` / `BodyDetached` 替换为产品一致的 `PlanetActivated` 和后续 focus 状态；Debug/status/recorder 输出现在包含 hover 距离、pinch ratio、active hand、激活原因和原轨道数据。
- 验证：新增 `tests/gesture/planetActivationController.test.ts`，扩展 `tests/gesture/solarOpeningLifecycle.test.ts` 和 `tests/unit/coordinateMapping.test.ts`。`npm run typecheck`、`npm test`、`npm run build`、`npm run lint --if-present` 和 `git diff --check` 通过。本地 Chrome CDP 检查确认 `/` 的 WebGL canvas 保持透明空场，而 `/?solarPreview=1` 在桌面和移动视口都会渲染非空太阳系内容。真实摄像头 hover/pinch 手感仍需人工验证后，M7 才能从 `NEEDS_MANUAL_VERIFY` 推进到 `DONE`。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/interaction/coordinateMapping.ts`、`src/interaction/gestureDebugRecorder.ts`、`src/interaction/planetActivationController.ts`、`src/interaction/solarOpeningController.ts`、`src/interaction/stateMachine.ts`、`src/main.ts`、`src/rendering/debugOverlay.ts`、`src/rendering/interactionStatusSummary.ts`、`src/rendering/landmarkOverlay.ts`、`src/solar/celestialBody.ts`、`src/solar/solarSystem.ts`、`src/utils/types.ts`、`tests/gesture/planetActivationController.test.ts`、`tests/gesture/solarOpeningLifecycle.test.ts` 和 `tests/unit/coordinateMapping.test.ts`。
- 剩余不明确项：真实摄像头测试需要调优有效热区、hover 迟滞手感，以及不同光线、手型和摄像头距离下的 pinch 阈值。

### 2026-06-24 — Milestone 6 天体 registry 完成

- 实现更新：完成 M6，将天体 registry 收紧到九个 MVP 渲染/焦点能力天体，新增明确的 body id、天体名称、激活/焦点元数据、原始轨道 transform helper，以及后续 hover/激活/焦点可显示的 label sprite。截至 2026-06-30，月球仍保留在 registry 中，但总览命中会映射到地月整体入口。
- 渲染/数据更新：placeholder 太阳系 facade 现在暴露可复用的天体定义、world position、label 显隐和原始轨道 transform，供 M7-M9 使用，同时没有添加按行星分叉的一次性激活或焦点逻辑。
- 验证：新增 `tests/unit/solarSystemData.test.ts`，覆盖 registry 唯一性、九个 MVP 目标、月球父级、土星环元数据，以及激活/焦点/回轨元数据。`npm run typecheck`、`npm test`、`npm run build` 和 `git diff --check` 通过。本地 Chrome CDP 检查也确认 `/` 的 WebGL canvas 保持透明空场，而 `/?solarPreview=1` 在桌面和移动视口都会渲染非空且持续运动的太阳系内容。
- 影响文件：`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`src/solar/solarSystemData.ts`、`src/solar/celestialBody.ts`、`src/solar/solarSystem.ts` 和 `tests/unit/solarSystemData.test.ts`。
- 剩余不明确项：M6 数据/模型范围内无；真实 hover/highlight/pinch 激活仍属于 M7。

### 2026-06-24 — M5.5 单手观察和焦点行星单手控制退役

- 需求调整：用户移除了 free-hovered 太阳系的 M5.5 单手五指张开放大、单手收拢缩小、握拳保持复位和单手推动平移。
- 需求调整：用户也移除了单颗行星焦点里的单手缩放、平移和复位控制；当前行星保持自转，托住/悬浮/返回仍在范围内。后续 2026-06-24 已将当时的甩回返回改为开掌返回。
- 实现更新：删除太阳系单手观察 controller 路径、运行时 M5.5 checklist/export/reset/report/verification helper、`verify:m5.5` 和专门的太阳系观察 gesture 测试。`SolarFreeHover` 现在保持最后稳定 transform，并等待端点重新扶住或反向收起。
- 文档更新：本条记录取代下面 2026-06-23 的 M5.5 实现、调优和 checklist 记录；那些内容仅保留为项目历史。
- 验证：`npm run typecheck`、`npm run test:gesture`、`npm test`、`npm run build` 和 `git diff --check` 通过。`npm run lint` 不可用，因为当前仓库没有 `lint` 脚本。
- 影响文件：`ar_solar_system_prd.md`、`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`docs/testing/testing-todo.md`、`docs/testing/test-and-replay-harness.md`、`index.html`、`package.json`、`src/main.ts`、`src/interaction/solarOpeningController.ts`、`src/rendering/debugOverlay.ts`、`src/rendering/interactionStatusSummary.ts`、`src/utils/types.ts`，以及删除的 `src/interaction/solarInspection*.ts` 和 `tests/gesture/solarInspectionController.test.ts`。
- 剩余不明确项：真实摄像头验证应确认已退役的 free-hover 单手手势都是 no-op；等单颗行星焦点 controller 实现后，还需要人工验证焦点行星单手 no-op 行为。

### 2026-06-24 — 将启动合拢到拉开链路限制为空场

- 需求变更：`HandsClosed` 只能从 `EmptyIdle` 空场摄像头画面进入，`PullArmed` 只能从前置 `HandsClosed` 合拢基线进入。
- 实现启动 controller 护栏：离开空场启动链路后清空启动手势记忆，包括 `CameraReady`，避免空场前或后续场景中的手势姿态被继承为启动证据。
- 新增 gesture 测试，覆盖 `CameraReady` 证据隔离，以及非空场状态下忽略合拢到拉开动作。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md`、`docs/testing/testing-todo.md`、`docs/testing/test-and-replay-harness.md`、`src/interaction/handStartupGesture.ts` 和 `tests/gesture/handStartupGesture.test.ts`。
- 人工验证：用户已确认，打开/自由悬浮后，远离端点的普通双手合拢拉开不会表现为重新启动。
- 剩余不明确项：空场启动门禁本身无；更广泛的真实摄像头阈值调优继续由里程碑级人工验证备注跟踪。

### 2026-06-23 — 手势管线稳定性重构（8 个 Task）

- 在加新手势之前先稳定"手部追踪 → 手势"管线,针对真实摄像头下的抖动 / 过敏感 / 掉控。不加新产品手势;不做臆测性的阈值调参;初始空场和默认关闭的 pose 追踪保持不变。
- 新帧门控(`freshFrameGate.ts`):交互控制器只在 MediaPipe 有新检测(`TrackingSnapshot.lastUpdatedAt` 变化)时更新,并用检测时间戳,使重复渲染的旧帧不再往拉开/缩放/平移速度里掺假的 0 速度样本。录制也一并门控。`main.ts` 门控控制器;渲染仍每帧进行。
- 配对在平滑之前(`gestureInputFrame.ts`):`HandTracker` 先建原始手、按轨迹分配视觉左右,再按视觉槽位平滑——双手交叉时 MediaPipe handedness 翻转不再串平滑历史。
- 屏幕平面手距只用 2D x/y(startup、primitives、solar-opening),把噪声大的 image z 从"手有多近/多远"和拉开轴里去掉。
- `TrackedHand` 新增 `worldLandmarks`;手型(`handPose` 的张开/握拳、`intentScoring` 的 pinch)在有 world 时优先用米制 world 几何,无则回退 image。
- `SolarActive` 在双手不再扶住端点时释放到 `SolarFreeHover`,使释放后的 transform 无需再 re-grip 一次端点即可保持。历史说明：这里原本描述的单手观察行为已在 2026-06-24 随 M5.5 退役而删除。
- 历史说明：本次重构中的单手观察主手锁定，已在 2026-06-24 随已退役的 M5.5 太阳系观察 controller 一起删除。
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
- 长期规则更新：AGENTS 当时指向测试策略文档，并提醒未来会话在当时活跃的 M5.5 面稳定前不要急着改 `main.ts` 或运行时 replay 接缝。已取代说明：M5.5 单手观察已在 2026-06-24 删除，当前 replay 门禁以活跃交互面稳定为准。
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

- 需求细化：用新的行星交互模型替换旧的天体抓取/冻结/release 闭环：hover、pinch 激活、主手 pinch 锁定 + 副手张开进入 `PlanetFocusView`、始终保持自转、当时规划的单颗行星缩放/平移/托住、副手 `PinchTap` 放下悬浮，以及当时规划的 pinch-and-throw 返回。已取代说明：单颗行星单手缩放/平移/复位已在 2026-06-24 删除，pinch-and-throw 返回先在 2026-06-24 被开掌返回取代，随后又被左上角食指按钮取代。
- 新增 Milestone 5.5，用于太阳系自由悬浮后的单手观察控制；重写 Milestone 6-9，使其围绕可交互天体元数据、pinch 激活、单颗行星画面、PinchTap 放下、焦点悬浮和当时规划的返回行为展开。
- 更新 PRD 和长期 agent 规则：被激活/聚焦天体停止原轨道公转但保持自转；普通放下不回轨，也不退出单颗行星画面。
- 影响文件：`AGENTS.md`、`TODO.md`、`TODO.zh-CN.md`、`ar_solar_system_prd.md` 和 `~/CodeXProject/物理宇宙资料/手势操控语义整理.md`。
- 剩余不明确项：单手张开/收拢阈值、PinchTap 时序、托住停留时间和聚焦天体屏幕限制需要真实摄像头调试；旧的甩回方向阈值已在 2026-06-24 被返回按钮调参取代。

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
