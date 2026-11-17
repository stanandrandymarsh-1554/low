/** Fullscreen helpers. iPhones can't do this for web pages, so `canFullscreen` is false there. */
export function canFullscreen(): boolean {
  return Boolean(document.fullscreenEnabled) && !document.fullscreenElement;
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }
  const el = document.documentElement;
  void Promise.resolve(el.requestFullscreen?.())
    // Phones play best sideways; locking only works in fullscreen, and only on some browsers.
    .then(() =>
      (screen.orientation as { lock?: (o: string) => Promise<void> } | undefined)?.lock?.(
        'landscape',
      ),
    )
    .catch(() => undefined);
}
