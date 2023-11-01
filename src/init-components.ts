// @ts-check

interface WindowWithGlobals {
  readonly mdc: {
    readonly autoInit: () => void;
  };
}

(window as unknown as WindowWithGlobals).mdc.autoInit();
