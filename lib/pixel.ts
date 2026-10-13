export type PixelDispatcher = ((...args: unknown[]) => void) & {
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push?: PixelDispatcher;
  callMethod?: (...args: unknown[]) => void;
};
export function createPixelDispatcher(): PixelDispatcher {
  const pixel = function (...args: unknown[]) {
    if (pixel.callMethod) pixel.callMethod(...args);
    else pixel.queue.push(args);
  } as PixelDispatcher;
  pixel.queue = [];
  pixel.loaded = true;
  pixel.version = "2.0";
  pixel.push = pixel;
  return pixel;
}
