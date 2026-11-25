/** Platform & device detection helpers (including iPadOS desktop-mode UA detection). */

export function isIpadDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isIphoneDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPod/i.test(navigator.userAgent);
}

export function isIosDevice(): boolean {
  return isIphoneDevice() || isIpadDevice();
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

/** True for phone/tablet browsers that cannot install desktop Chrome/Firefox extensions. */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (isIosDevice()) return true;
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (typeof uaData?.mobile === 'boolean') return uaData.mobile;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/** True on phones (excludes iPad/tablets, which use the full tablet/desktop shell). */
export function isPhoneBrowser(): boolean {
  if (isIpadDevice()) return false;
  return isMobileBrowser();
}
