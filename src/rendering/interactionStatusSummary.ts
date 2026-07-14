import type { DebugSnapshot } from '../utils/types';
import {
  getCelestialBodyDisplayName,
  isInteractiveCelestialBodyId,
} from '../solar/solarSystemData';

const UPDATE_INTERVAL_MS = 150;

interface StatusSummary {
  title: string;
  operationTitle?: string;
  state: string;
  reason: string;
  params: string[];
}

export type InteractionStatusSummaryMode = 'full' | 'operation-only';

export class InteractionStatusSummary {
  private lastRenderTime = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly mode: InteractionStatusSummaryMode = 'full',
  ) {}

  update(snapshot: DebugSnapshot): void {
    if (this.container.hidden) {
      return;
    }

    const now = performance.now();

    if (now - this.lastRenderTime < UPDATE_INTERVAL_MS) {
      return;
    }

    this.lastRenderTime = now;
    this.render(buildStatusSummary(snapshot));
  }

  private render(summary: StatusSummary): void {
    if (this.mode === 'operation-only') {
      const corners = document.createElement('span');
      corners.className = 'planet-focus-action-card-corners';
      corners.setAttribute('aria-hidden', 'true');

      const edge = document.createElement('span');
      edge.className = 'planet-focus-action-card-edge';
      edge.setAttribute('aria-hidden', 'true');

      const label = document.createElement('p');
      label.className = 'demo-operation-label';
      label.textContent = 'CURRENT OPERATION // LIVE';

      const operation = document.createElement('p');
      operation.className = 'demo-operation-title';
      operation.textContent = summary.operationTitle ?? summary.title;

      this.container.replaceChildren(corners, edge, label, operation);
      return;
    }

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
    return {
      title: '太阳系悬浮中',
      state: '等待重新扶住左右端点',
      reason: '太阳系保持最后稳定 transform；单手张开、收拢或推动不再控制太阳系，双手回到端点可重新控制或向内合拢收起',
      params: [
        `openProgress=${snapshot.openProgress.toFixed(2)}`,
        `Solar scale=${snapshot.solarScale.toFixed(2)}`,
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

  if (snapshot.interactionState === 'BodyHover') {
    return {
      title: '已靠近天体',
      state: `${snapshot.hoveredBody ?? '目标天体'} 可 pinch 激活`,
      reason: '手部靠近某个可交互天体的屏幕热区，当前只高亮目标，不移动或缩放太阳系',
      params: [
        `Hover=${snapshot.hoveredBody ?? 'none'}`,
        `Distance=${nullable(snapshot.planetActivation.hoverDistancePx)}`,
        `Radius=${nullable(snapshot.planetActivation.hoverHitRadiusPx)}`,
        `Reason=${snapshot.planetActivation.transitionReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'PlanetActivated') {
    return {
      title: '天体已激活',
      state: `${snapshot.activatedBody ?? '目标天体'} 等待双指双击并松开`,
      reason: '选中天体停止原轨道公转但保持自转；用选中这只手的拇指和食指连续点捏两次，第二次稳定松开后进入单颗星球界面',
      params: [
        `Activated=${snapshot.activatedBody ?? 'none'}`,
        `Pinch ratio=${nullable(snapshot.planetActivation.pinchRatio)}`,
        `Pinch=${snapshot.pinchState}`,
        `DoubleClose=${snapshot.planetActivation.doubleCloseCount}`,
        `Reason=${snapshot.planetActivation.transitionReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'PlanetFocusView') {
    return {
      title: '单颗星球界面',
      operationTitle: focusedBodyOperationTitle(snapshot),
      state: `${snapshot.activatedBody ?? '目标天体'} 等待热区触碰`,
      reason: `${focusViewReason(snapshot)}；手从星球命中区外朝左上角或右上角快速甩出，也可直接返回太阳系`,
      params: [
        `Activated=${snapshot.activatedBody ?? 'none'}`,
        `Focus=${snapshot.planetFocus.controlState}`,
        `Touch=${snapshot.planetFocus.touchHandCount}`,
        `Dwell=${Math.round(snapshot.planetFocus.dwellMs)}ms`,
        `Wave=${snapshot.planetReturnWave.state}/${snapshot.planetReturnWave.reason}`,
        `Reason=${snapshot.planetFocus.transitionReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'PlanetFocusControlled') {
    return {
      title: '正在控制星球',
      state:
        snapshot.planetFocus.controlMode === 'two'
          ? '双手跟随，手距调整大小'
          : '单手跟随移动',
      reason: '触碰热区停留已成立；捏合拇指和任一手指后张开会放下当前星球并转为悬浮；跟手控制期间返回手势禁用',
      params: [
        `Activated=${snapshot.activatedBody ?? 'none'}`,
        `Mode=${snapshot.planetFocus.controlMode}`,
        `Scale=${snapshot.planetFocus.scaleMultiplier.toFixed(2)}`,
        `Pinch=${snapshot.planetFocus.pinchState}`,
        `Reason=${snapshot.planetFocus.transitionReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'PlanetFocusFloating') {
    return {
      title: '星球已放下',
      operationTitle: '星球悬浮中',
      state: `${snapshot.activatedBody ?? '目标天体'} 悬浮在当前位置`,
      reason:
        snapshot.planetFocus.controlState === 'DeselectedWaitForClear'
          ? '跟手选中已取消；需要所有手离开当前星球热区后，才会重新进入待选中状态；放下后等待 250ms，再从星球命中区外朝左上角或右上角快速甩出可返回太阳系'
          : '跟手控制已解除；当前星球仍留在单颗星球界面并持续自转；放下后等待 250ms，再从星球命中区外朝左上角或右上角快速甩出可返回太阳系',
      params: [
        `Activated=${snapshot.activatedBody ?? 'none'}`,
        `Scale=${snapshot.planetFocus.scaleMultiplier.toFixed(2)}`,
        `Focus=${snapshot.planetFocus.controlState}`,
        `Wave=${snapshot.planetReturnWave.state}/${snapshot.planetReturnWave.reason}`,
        `Reason=${snapshot.planetFocus.transitionReason}`,
      ],
    };
  }

  if (snapshot.interactionState === 'BodyReturning') {
    return {
      title: '正在返回太阳系',
      state: `${snapshot.activatedBody ?? snapshot.planetFocus.focusedBody ?? '当前星球'} 回到原轨道`,
      reason: '已确认从星球命中区外朝左上角或右上角的快速甩出；焦点星球正在用 0.5 秒调整回太阳系位置和大小，完成后恢复太阳系交互与不透明度',
      params: [
        `Activated=${snapshot.activatedBody ?? 'none'}`,
        `Scale=${snapshot.planetFocus.scaleMultiplier.toFixed(2)}`,
        `Reason=${snapshot.planetFocus.transitionReason}`,
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

function focusedBodyOperationTitle(snapshot: DebugSnapshot): string {
  const focusedBody =
    snapshot.planetFocus.focusedBody ?? snapshot.activatedBody;

  return focusedBody && isInteractiveCelestialBodyId(focusedBody)
    ? getCelestialBodyDisplayName(focusedBody)
    : '单颗星球界面';
}

function focusViewReason(snapshot: DebugSnapshot): string {
  if (snapshot.planetFocus.controlState === 'IntroCooldown') {
    return '焦点星球还在进入居中动画中；到达屏幕中心并且热区清空前，不会开始停留计时';
  }

  if (snapshot.planetFocus.controlState === 'WaitingForHeatZoneClear') {
    return '进入焦点后检测到手仍在热区内；需要先离开热区，再重新触碰并停留 1 秒';
  }

  return '当前行星保持自转；单手或双手重新碰触当前星球热区并停留 1 秒后进入跟手控制；放下悬浮稳定后朝左上角或右上角快速张手挥出可返回太阳系';
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
