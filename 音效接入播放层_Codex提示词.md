# 任务：接入音效播放层（AudioManager + 交互事件挂钩）

音效资产已就绪（`public/assets/solar/sfx/` 22 个文件 + `public/assets/solar/manifests/sfx-assets.json` 清单，含逐条 `suggested_gain`）。本任务把它们接入运行时：状态机转换触发一击音、循环音随交互启停、拉开过程随手距映射音量音高。

---

## 一、边界（先读这节）

1. **音频层是纯观察者**：只"读"交互层的状态与快照，不改任何交互判定逻辑。`src/interaction/`、`src/solar/`、`src/tracking/`、`stateMachine.ts` 的现有行为一律不动（允许为暴露只读信息做最小改动，如导出已有类型）。
2. 新代码放 `src/audio/` 下；`app.ts` 只做挂钩接线。
3. **不加任何第三方依赖**（不用 howler 之类），原生 Web Audio API。
4. 不修改 `public/assets/solar/sfx/` 里的音频文件和 manifest 的既有字段。
5. 完成后必须通过：`npm run typecheck`、`npm run test`、`npm run build`。

## 二、文件结构

```
src/audio/
  sfxManifest.ts            # 加载并解析 sfx-assets.json，类型定义
  audioEngine.ts            # AudioContext、总线、buffer 缓存、播放原语
  interactionAudioDirector.ts  # 核心：交互状态/快照 → 音频动作（纯逻辑，可单测）
tests/unit/
  interactionAudioDirector.test.ts
```

**关键设计：director 必须是纯函数核心。** 形如 `deriveAudioActions(prevState, nextState, frameContext) => AudioAction[]`，返回 `{type:'play',id,...} | {type:'startLoop',id,...} | {type:'stopLoop',id,...} | {type:'setLoopParams',...}` 动作数组，由薄薄的执行层调 engine。这样 vitest 可以完全不碰 Web Audio 测转换表。

## 三、初始化与自动播放策略

1. **AudioContext 必须在用户手势里创建**：在 `app.ts` 开启摄像头的 start 按钮 click 处理器内创建（浏览器自动播放策略要求）。若 `state === 'suspended'` 则 `resume()`。
2. **加载**：manifest 用 `withPublicBasePath('/assets/solar/manifests/sfx-assets.json')`（见 `src/utils/publicAssetPath.ts`）fetch；音频文件同理 `withPublicBasePath('/assets/solar/sfx/<file>')`。全部 fetch + `decodeAudioData`，与 tracking 初始化并行，不阻塞首帧。
3. **逐文件容错**：单个文件 decode 失败只 `console.warn` 并跳过该音效，绝不让音频层报错影响主流程。特别是 `ambient-solar-loop.ogg`——Safari 不支持 ogg/vorbis 解码，失败就静默跳过 ambient。
4. manifest 里 `reuse_of` 条目（focus-dwell-loop / focus-control-loop / focus-release）不重复下载 buffer：共享基础条目的 buffer，但用自己的 `suggested_gain`。
5. **静音开关**：URL 参数 `?mute=1` 初始静音 + 键盘 `M` 切换（master gain 0/1，短淡化 50ms 防爆音）。demo 模式（`?demo=1`）默认有声。

## 四、总线与音量

```
master ─┬─ sfxBus      (一击音)
        ├─ loopBus     (交互循环音)
        └─ ambientBus  (氛围底噪)
```

- 每个音效的基础音量 = manifest 的 `suggested_gain`。
- 代码里放一个 `GAIN_OVERRIDES: Record<string, number>` 乘数表（对 suggested_gain 再乘），预置两条并注明原因：`planet-hover: 2.5`、`ui-hold-cancel: 2.0`（这两个文件在第二轮已按"轻柔类"做过文件级压低，manifest 的旧 gain 会二次衰减到听不见）。其余默认 1，试听阶段在此表微调，不改 manifest。
- **闪避（ducking）**：播放 `summon-open-impact` 或 `planet-focus-enter` 时，ambientBus 压低 6dB，1.5 秒内用 `setTargetAtTime` 恢复。
- 所有循环音停止一律带淡出（默认 150–200ms），任何情况下不允许硬 stop 产生咔哒声。

## 五、事件映射表（核心交付，必须逐条实现）

### 5.1 状态转换 → 音频动作

在 `app.ts` 每个 `interaction.transition(next)` 调用点之后接一个 `audioLayer.onStateChange(prev, next)`（共 7 处调用点：`updateGestureControllers` 内 4 处、摄像头启动 1 处、`triggerPlanetReturn` 路径 1 处、回轨完成 1 处。建议在 app.ts 里包一个小函数统一走，避免漏）。

| prev → next | 动作 |
|---|---|
| EmptyIdle → HandsClosed | play `summon-charge` |
| HandsClosed → EmptyIdle | play `summon-cancel` |
| HandsClosed → PullArmed | startLoop `summon-pull-loop`（淡入 120ms，参数取 progress=0） |
| PullArmed → HandsClosed | stopLoop `summon-pull-loop`（150ms），不播 cancel |
| PullArmed → EmptyIdle | play `summon-cancel` + stopLoop `summon-pull-loop` |
| PullArmed → SolarOpening | 无新动作（循环继续，进入 progress 映射，见 5.2） |
| SolarOpening → SolarActive | play `summon-open-impact` + stopLoop `summon-pull-loop`（80ms 快淡出）+ startLoop `ambient-solar-loop`（淡入 1.5s）+ duck ambient |
| SolarOpening → EmptyIdle | play `summon-cancel` + stopLoop `summon-pull-loop` |
| SolarOpening → SolarClosing | stopLoop `summon-pull-loop` + startLoop `system-close-loop` |
| SolarActive/SolarFreeHover → SolarHandleControl | play `system-grab` + startLoop `system-control-loop`（淡入 150ms） |
| SolarHandleControl → SolarActive/SolarFreeHover | play `system-release` + stopLoop `system-control-loop`（200ms） |
| 任意 → SolarClosing | stopLoop `system-control-loop`（若在放）+ startLoop `system-close-loop` |
| SolarClosing → EmptyIdle | play `system-close-end` + stopLoop `system-close-loop`（100ms）+ stopLoop `ambient-solar-loop`（淡出 800ms） |
| SolarClosing → SolarActive/SolarFreeHover | stopLoop `system-close-loop`，无一击音（收起被中止） |
| SolarClosing → SolarHandleControl | stopLoop `system-close-loop` + play `system-grab` + startLoop `system-control-loop` |
| SolarActive/SolarFreeHover → BodyHover | hover 音走 5.3 帧级规则（这里不直接播，避免与 hoveredBody 变化重复） |
| BodyHover → SolarActive/SolarFreeHover | 无 |
| BodyHover/SolarActive/SolarFreeHover → PlanetActivated | play `pinch-click` + play `planet-select` |
| PlanetActivated → BodyHover/SolarActive/SolarFreeHover | 无（取消选中保持安静） |
| PlanetActivated → PlanetFocusView | play `pinch-click` + play `planet-focus-enter` + duck ambient |
| PlanetFocusView/PlanetFocusFloating → PlanetFocusControlled | play `focus-grab` + stopLoop `focus-dwell-loop` + startLoop `focus-control-loop` |
| PlanetFocusControlled → PlanetFocusFloating | play `focus-release` + stopLoop `focus-control-loop` |
| PlanetFocusView/PlanetFocusFloating → BodyReturning | play `focus-return-wave` + stopLoop 所有 focus 循环 |
| BodyReturning → SolarActive/SolarFreeHover | play `planet-return-land` |
| CameraReady → EmptyIdle | 无（system-ready 走 5.4） |

约束：director 内部维护"当前应有的循环集合"，每次状态变化对账（应开未开→start，应停未停→stop），保证任何转换路径下循环不悬挂。**为防御未来状态图变化，凡进入 EmptyIdle 一律强制停掉全部循环。**

### 5.2 帧级连续参数（每帧调 `audioLayer.onFrame(ctx)`，在 `updateGestureControllers` 尾部接入）

只对 `summon-pull-loop` 做参数映射（其余循环恒定音量，降低风险）：

- 输入：`solarOpeningUpdate.snapshot.progress`（0..1，字段已确认存在于 `SolarOpeningSnapshot`）。
- 公式：`gain = base × (0.55 + 0.45 × progress)`，`playbackRate = 0.92 + 0.22 × progress`。
- 平滑：`gain.setTargetAtTime(v, currentTime, 0.08)`、`playbackRate.setTargetAtTime(...)` 同理。禁止每帧直接赋 `.value`（会有拉链噪声）。

可选加分项（P1，做不稳就跳过）：`system-control-loop` 用 `SolarOpeningSnapshot.normalizedDistance` 做 ±10% 的 rate 映射。

### 5.3 帧级离散事件（同在 `onFrame` 里，从各控制器 snapshot 提取边沿）

| 事件 | 来源 | 动作与防抖 |
|---|---|---|
| hover 进入/切换 | `planetActivationUpdate.snapshot.hoveredBody` 非空且与上帧不同 | play `planet-hover`；同一 body 重复进入 400ms 内不重播；全局 hover 音最小间隔 250ms；每次随机 playbackRate 0.97–1.03（防机枪感） |
| 通用捏合 click | `planetActivationUpdate.snapshot.pinchState` 出现 idle→pinching 上升沿 | play `pinch-click`，最小间隔 120ms。注意：5.1 中 select/focus-enter 的转换帧已含 click，同帧去重（同一帧最多一次 pinch-click） |
| UI 卡长按 | `app.ts` 两处：`updateDemoHandModelButtonHandHold`、`updateEarthMoonSwitchButtonHandHold`，其内部用 `IndexFingerUiHoldUpdate`（字段：`reason: 'charging'/'charged'...`、`progress`、`triggered`） | reason 进入 charging 上升沿 → startLoop `ui-hold-loop`；`triggered === true` → play `ui-hold-success` + stopLoop；从 charging 掉回非 charging 且未 triggered → play `ui-hold-cancel` + stopLoop。两处按钮共用一个循环实例即可（引用计数或"最后写入者"皆可，不允许双实例叠放） |
| 焦点热区 dwell | `planetFocusUpdate.snapshot`（`PlanetFocusDebugSnapshot` 内有 dwell 进度/原因字段，接入时自查确切字段名） | dwell 计时开始 → startLoop `focus-dwell-loop`；中断 → stopLoop（不播 cancel 音）；完成→ 由 5.1 的 PlanetFocusControlled 转换处理 |
| 彗星飞掠 | `src/solar/cometFlyby.ts` 的 `CometFlyby`，在其一次飞掠开始（进入可见段）处暴露一个只读回调或在 app 层轮询其状态 | play `comet-flyby`，每次飞掠只播一次 |

### 5.4 系统事件

- `initializeTracking()`（app.ts:828）成功完成、追踪就绪时：play `system-ready`（整个会话只播一次）。
- 页面 `visibilitychange` 隐藏时暂停 ambientBus（gain→0，300ms），回来恢复——防止后台空放。

## 六、播放原语要求（audioEngine）

- `playOneShot(id, {rate?, gainMul?})`：每次新建 `AudioBufferSourceNode` → 专属 GainNode → sfxBus，允许同 id 重叠；同 id 50ms 内重复触发直接忽略。
- `startLoop(id, {fadeMs})` / `stopLoop(id, {fadeMs})`：每个 id 全局单实例；start 已在放→幂等；stop 未在放→幂等。`loop=true`（ambient 的循环接缝已在资产侧重构为采样级连续，直接 loop 即可，不需要运行时交叉淡化）。
- `setLoopParams(id, {gain?, rate?})`：内部用 `setTargetAtTime`。
- 所有 `id` 与 manifest 的 `id` 一一对应，启动时校验：manifest 里存在但 buffer 缺失的 id 调用时静默跳过。

## 七、单元测试（vitest，放 `tests/unit/interactionAudioDirector.test.ts`）

至少覆盖：

1. 5.1 表中每一行转换产生且仅产生表中动作（逐行断言）。
2. 循环不悬挂：构造转换序列 `EmptyIdle→HandsClosed→PullArmed→SolarOpening→SolarActive→SolarHandleControl→SolarClosing→EmptyIdle`，断言结束时 director 认为活跃循环集合为空、每个 startLoop 都有配对 stopLoop。
3. hover 防抖：同 body 400ms 内重复进入不重播、不同 body 立即换播、250ms 全局间隔生效（用假时间戳）。
4. pinch-click 同帧去重与 120ms 间隔。
5. UI hold 三分支（成功/中断/重复 charging 不重复 start）。
6. 进入 EmptyIdle 强制清空所有循环。

## 八、手动验收清单（完成后在总结里逐条报告）

1. `npm run dev` 起服务，浏览器无控制台报错；点开始按钮后无自动播放警告。
2. 完整流程音效链：合拢（charge）→ 拉开（loop 随手距变响变高）→ 展开（boom+ambient 淡入）→ 扶住（grab+hum）→ 松手（release）→ 悬停（hover 轻）→ 捏合选中（click+select）→ 捏两下进焦点（click+whoosh）→ 热区停留（dwell loop）→ 跟手（focus-grab+hum）→ 释放（release）→ 挥手甩回（wave）→ 落定（land）→ 收起（close loop）→ 收完（close-end+ambient 淡出）。
3. 中断路径不留循环音：拉开一半放弃、长按中途移开、收起中途反悔，各验证一次后场景内无残留声音。
4. `M` 键静音/恢复，`?mute=1` 生效。
5. 快速反复 hover 各行星不出现机枪音。
6. 刷新页面后重复第 2 条一次（防一次性状态残留）。
7. 试听后若个别音效响度不合适，只调 `GAIN_OVERRIDES`，在总结里列出最终值。

## 九、总结要求

交付总结包含：新增文件列表、app.ts 改动点（逐处一句话）、测试结果（typecheck/test/build 三个命令的输出结论）、手动验收 7 条逐条结果、GAIN_OVERRIDES 最终表。
