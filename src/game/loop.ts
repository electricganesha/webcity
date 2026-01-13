export type SimCallbacks = {
  simulate: (dtMs: number) => void;
  render: () => void;
};

export function startLoop({ simulate, render }: SimCallbacks) {
  const TICK = 100; // 10 Hz simulation
  let acc = 0;
  let last = performance.now();
  let handle: number;

  function frame(now: number) {
    acc += now - last;
    last = now;
    while (acc >= TICK) {
      simulate(TICK);
      acc -= TICK;
    }
    render();
    handle = requestAnimationFrame(frame);
  }
  handle = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(handle);
  };
}
