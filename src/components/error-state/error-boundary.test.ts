import {describe, expect, it} from 'vitest';

import {ErrorBoundary} from './error-boundary';

function createBoundary() {
  const resets: Array<() => void> = [];
  const boundary = new ErrorBoundary({
    fallback: reset => {
      resets.push(reset);
      return 'fallback';
    },
    children: 'content',
  });
  return {boundary, resets};
}

describe('ErrorBoundary', () => {
  it('moves to the failed state when a child throws while rendering', () => {
    expect(ErrorBoundary.getDerivedStateFromError()).toEqual({failed: true});
  });

  it('renders the children while nothing failed', () => {
    const {boundary, resets} = createBoundary();
    expect(boundary.render()).toBe('content');
    expect(resets).toEqual([]);
  });

  it('renders the fallback and hands it the reset callback after a failure', () => {
    const {boundary, resets} = createBoundary();
    boundary.state = {failed: true};
    expect(boundary.render()).toBe('fallback');
    expect(resets).toEqual([boundary.reset]);
  });
});
