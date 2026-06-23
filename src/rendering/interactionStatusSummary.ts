import type { DebugSnapshot } from '../utils/types';

const UPDATE_INTERVAL_MS = 150;

interface StatusSummary {
  title: string;
  state: string;
  reason: string;
  params: string[];
}

export class InteractionStatusSummary {
  private lastRenderTime = 0;

  constructor(private readonly container: HTMLElement) {}

  update(snapshot: DebugSnapshot): void {
    const now = performance.now();

    if (now - this.lastRenderTime < UPDATE_INTERVAL_MS) {
      return;
    }

    this.lastRenderTime = now;
    this.render(buildStatusSummary(snapshot));
  }

  private render(summary: StatusSummary): void {
    const title = document.createElement('p');
    title.className = 'interaction-summary-title';
    title.textContent = summary.title;

    const state = document.createElement('p');
    state.className = 'interaction-summary-state';
    state.textContent = summary.state;

    const reason = document.createElement('p');
    reason.className = 'interaction-summary-reason';
    reason.textContent = `原因：${summary.reason}`;

    const params = document.createElement('p');
    params.className = 'interaction-summary-params';
    params.textContent = `核心参数：${summary.params.join('；')}`;

    this.container.replaceChildren(title, state, reason, params);
  }
}

function buildStatusSummary(snapshot: DebugSnapshot): StatusSummary {
  if (snapshot.cameraStatus !== 'granted') {
    return {
      title: '等待摄像头',
      state: cameraStateText(snapshot.cameraStatus),
      reason: '摄像头还没有进入可追踪状态',
      params: [
        `Camera=${snapshot.cameraStatus}`,
        `Tracking=${snapshot.trackingStatus}`,
      ],
    };
  }

  if (snapshot.trackingStatus !== 'ready') {
    return {
      title: '正在加载识别',
      state: '手势判断暂未开始',
      reason: 'MediaPipe 姿态与手部模型还没有准备好',
      params: [
        `Tracking=${snapshot.trackingStatus}`,
        `Both hands=${visibleText(snapshot.bothHandsVisible)}`,
      ],
    };
  }

  if (snapshot.interactionState === 'SolarOpening') {
    return {
      title: '正在拉开太阳系',
      state: '占位太阳系跟随双手展开',
      reason: '启动手势已成立，当前手距正在驱动 openProgress 和太阳系 transform',
      params: [
        `openProgress=${snapshot.openProgress.toFixed(2)}`,
        `Solar scale=${snapshot.solarScale.toFixed(2)}`,
        `Distance=${nullable(snapshot.handDistance)}`,
        `Solar reason=${snapshot.solarReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'SolarActive') {
    return {
      title: '太阳系已展开',
      state: '等待双手扶住左右端点',
      reason: '太阳系处于悬浮保持状态；只有双手分别靠近左右控制端点后才会重新获得整体控制',
      params: [
        `openProgress=${snapshot.openProgress.toFixed(2)}`,
        `Solar scale=${snapshot.solarScale.toFixed(2)}`,
        `Solar reason=${snapshot.solarReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'SolarHandleControl') {
    return {
      title: '正在控制太阳系',
      state: '双手已命中左右端点',
      reason: '左右控制端点被双手稳定扶住，太阳系跟随端点移动；松手后保持悬浮，向内合拢可反向收起',
      params: [
        `openProgress=${snapshot.openProgress.toFixed(2)}`,
        `Solar scale=${snapshot.solarScale.toFixed(2)}`,
        `Solar reason=${snapshot.solarReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'SolarFreeHover') {
    if (
      snapshot.solarInspection.intent !== 'inactive' &&
      snapshot.solarInspection.intent !== 'idle'
    ) {
      return {
        title: '正在单手观察太阳系',
        state: solarInspectionState(snapshot.solarInspection.intent),
        reason: solarInspectionReason(snapshot.solarInspection.intent),
        params: [
          `Inspect scale=${snapshot.solarInspection.inspectionScale.toFixed(2)}`,
          `Offset=${offsetText(snapshot.solarInspection.inspectionOffset)}`,
          `Reset hold=${Math.round(snapshot.solarInspection.resetHoldMs)}ms`,
          `Solar reason=${snapshot.solarReason}`,
        ],
      };
    }

    return {
      title: '太阳系悬浮中',
      state: '等待单手观察或重新扶住左右端点',
      reason: '太阳系保持最后稳定 transform；单手张开/收拢可观察缩放，推动可平移，双手回到端点可重新控制',
      params: [
        `openProgress=${snapshot.openProgress.toFixed(2)}`,
        `Solar scale=${snapshot.solarScale.toFixed(2)}`,
        `Inspect=${snapshot.solarInspection.reason}`,
        `Solar reason=${snapshot.solarReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'SolarClosing') {
    return {
      title: '正在收起太阳系',
      state: '双手向内合拢端点',
      reason: '已进入反向收起，openProgress 随双手距离下降；达到闭合阈值后回到空场',
      params: [
        `openProgress=${snapshot.openProgress.toFixed(2)}`,
        `Solar scale=${snapshot.solarScale.toFixed(2)}`,
        `Distance=${nullable(snapshot.handDistance)}`,
        `Solar reason=${snapshot.solarReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'HandsClosed') {
    return {
      title: '双手已合拢',
      state: '等待向两侧拉开',
      reason: '双手距离足够近，但还没有形成持续拉开趋势',
      params: [
        `Distance=${nullable(snapshot.handDistance)}`,
        `Velocity=${nullable(snapshot.handDistanceVelocity)}`,
        `Both hands=${visibleText(snapshot.bothHandsVisible)}`,
        `Reason=${snapshot.startupTransitionReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'PullArmed') {
    return {
      title: '已识别拉开准备',
      state: '等待整体控制接管',
      reason: '双手从合拢状态持续拉开，启动手势已成立',
      params: [
        `Distance=${nullable(snapshot.handDistance)}`,
        `Velocity=${nullable(snapshot.handDistanceVelocity)}`,
        `Both hands=${visibleText(snapshot.bothHandsVisible)}`,
        `Reason=${snapshot.startupTransitionReason}`,
      ],
    };
  }

  return {
    title: '等待启动手势',
    state: '空场待机',
    reason: '还没有检测到稳定的双手合拢再拉开',
    params: [
      `Startup=${snapshot.interactionState}`,
      `Both hands=${visibleText(snapshot.bothHandsVisible)}`,
      `Lost hold=${snapshot.lostHandHoldActive ? 'active' : 'inactive'}`,
      `Reason=${snapshot.startupTransitionReason}`,
    ],
  };
}

function cameraStateText(status: DebugSnapshot['cameraStatus']): string {
  if (status === 'idle') {
    return '等待点击开启摄像头';
  }

  if (status === 'requesting') {
    return '正在请求摄像头权限';
  }

  return `摄像头状态：${status}`;
}

function visibleText(visible: boolean): string {
  return visible ? 'visible' : 'missing';
}

function nullable(value: number | null): string {
  return value === null ? 'n/a' : value.toFixed(3);
}

function solarInspectionState(intent: DebugSnapshot['solarInspection']['intent']): string {
  if (intent === 'zoomIn') {
    return '单手张开放大';
  }

  if (intent === 'zoomOut') {
    return '单手收拢缩小';
  }

  if (intent === 'pan') {
    return '单手推动平移';
  }

  if (intent === 'resetHold') {
    return '握拳复位保持中';
  }

  if (intent === 'reset') {
    return '已恢复默认观察';
  }

  return '单手观察待机';
}

function solarInspectionReason(
  intent: DebugSnapshot['solarInspection']['intent'],
): string {
  if (intent === 'zoomIn') {
    return '检测到单手手指展开速度，正在放大自由悬浮的太阳系视图';
  }

  if (intent === 'zoomOut') {
    return '检测到单手手指收拢速度，正在缩小自由悬浮的太阳系视图';
  }

  if (intent === 'pan') {
    return '检测到单手掌心中心移动，正在平移自由悬浮的太阳系视图';
  }

  if (intent === 'resetHold') {
    return '检测到握拳保持，达到约 2 秒后会恢复默认观察位置和大小';
  }

  if (intent === 'reset') {
    return '握拳保持已达到复位时间，太阳系回到释放时的默认观察位置和大小';
  }

  return '等待明确的 M5.5 单手观察动作';
}

function offsetText(offset: { x: number; y: number; z: number }): string {
  return `${offset.x.toFixed(2)}, ${offset.y.toFixed(2)}, ${offset.z.toFixed(2)}`;
}
