import type React from 'react';

const FOCUSABLE = 'button:not([disabled]):not([tabindex="-1"]), input:not([disabled])';

export function nextTrapIndex(current: number, count: number, backwards: boolean): number | null {
  if (count === 0) {
    return null;
  }
  if (backwards) {
    return current <= 0 ? count - 1 : null;
  }
  return current === count - 1 ? 0 : null;
}

export function trapTab(event: React.KeyboardEvent, container: HTMLElement | null): void {
  if (!container) {
    return;
  }
  const focusable = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const active = document.activeElement;
  const current = active instanceof HTMLElement ? focusable.indexOf(active) : -1;
  const target = nextTrapIndex(current, focusable.length, event.shiftKey);
  if (target !== null) {
    event.preventDefault();
    focusable[target].focus();
  }
}
