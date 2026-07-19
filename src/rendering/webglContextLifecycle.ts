export interface WebGLContextLifecycleHandlers {
  readonly onLost: () => void;
  readonly onRestored: () => void;
}

export class WebGLContextLifecycle {
  private disposed = false;
  private readonly handleLost = (event: Event): void => {
    event.preventDefault();
    this.handlers.onLost();
  };
  private readonly handleRestored = (): void => {
    this.handlers.onRestored();
  };

  constructor(
    private readonly target: EventTarget,
    private readonly handlers: WebGLContextLifecycleHandlers,
  ) {
    target.addEventListener('webglcontextlost', this.handleLost);
    target.addEventListener('webglcontextrestored', this.handleRestored);
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.target.removeEventListener('webglcontextlost', this.handleLost);
    this.target.removeEventListener(
      'webglcontextrestored',
      this.handleRestored,
    );
  }
}
