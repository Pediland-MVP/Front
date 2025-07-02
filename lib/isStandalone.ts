export function isStandalone(): boolean {
  // iOS Safari
  if ((window.navigator as any).standalone !== undefined) {
    return (window.navigator as any).standalone;
  }

  // all other browsers: Chrome, Edge, Firefox, etc.
  return window.matchMedia("(display-mode: standalone)").matches;
}
