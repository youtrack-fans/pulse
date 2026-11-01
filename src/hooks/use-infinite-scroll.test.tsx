import React, {useState} from 'react';
import {act, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {useInfiniteScroll} from './use-infinite-scroll';

interface FakeObserver {
  callback: IntersectionObserverCallback;
  observed: Element[];
  disconnected: boolean;
}

let observers: FakeObserver[] = [];

class RecordingObserver {
  record: FakeObserver;

  constructor(callback: IntersectionObserverCallback) {
    this.record = {callback, observed: [], disconnected: false};
    observers.push(this.record);
  }

  observe(element: Element): void {
    this.record.observed.push(element);
  }

  unobserve(): void {}

  disconnect(): void {
    this.record.disconnected = true;
  }

  takeRecords(): [] {
    return [];
  }
}

function intersect(record: FakeObserver) {
  record.callback([{isIntersecting: true}] as IntersectionObserverEntry[], {} as IntersectionObserver);
}

interface ListProps {
  enabled: boolean;
  onLoadMore: () => void;
  renderedCount: number;
  showSentinel: boolean;
}

function List({enabled, onLoadMore, renderedCount, showSentinel}: ListProps) {
  const sentinelRef = useInfiniteScroll(enabled, onLoadMore, renderedCount);
  return <div>{showSentinel && <div ref={sentinelRef} data-testid="sentinel"/>}</div>;
}

function LaterSentinel({onLoadMore}: {onLoadMore: () => void}) {
  const [ready, setReady] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setReady(true)}>show</button>
      <List enabled onLoadMore={onLoadMore} renderedCount={0} showSentinel={ready}/>
    </>
  );
}

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    observers = [];
    vi.stubGlobal('IntersectionObserver', RecordingObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('watches the sentinel and loads more when it comes into view', () => {
    const onLoadMore = vi.fn();
    render(<List enabled onLoadMore={onLoadMore} renderedCount={0} showSentinel/>);
    expect(observers).toHaveLength(1);
    expect(observers[0].observed).toEqual([screen.getByTestId('sentinel')]);
    intersect(observers[0]);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('starts watching a sentinel that appears after the first render', () => {
    const onLoadMore = vi.fn();
    render(<LaterSentinel onLoadMore={onLoadMore}/>);
    expect(observers).toHaveLength(0);
    act(() => screen.getByRole('button', {name: 'show'}).click());
    expect(observers).toHaveLength(1);
    intersect(observers[0]);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('watches nothing while disabled', () => {
    render(<List enabled={false} onLoadMore={vi.fn()} renderedCount={0} showSentinel/>);
    expect(observers).toHaveLength(0);
  });

  it('calls the latest callback without watching the sentinel again', () => {
    const first = vi.fn();
    const second = vi.fn();
    const {rerender} = render(<List enabled onLoadMore={first} renderedCount={0} showSentinel/>);
    rerender(<List enabled onLoadMore={second} renderedCount={0} showSentinel/>);
    expect(observers).toHaveLength(1);
    intersect(observers[0]);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('watches the sentinel again after more items were rendered, so a sentinel still in view loads the next batch', () => {
    const onLoadMore = vi.fn();
    const {rerender} = render(<List enabled onLoadMore={onLoadMore} renderedCount={10} showSentinel/>);
    rerender(<List enabled onLoadMore={onLoadMore} renderedCount={20} showSentinel/>);
    expect(observers).toHaveLength(2);
    expect(observers[0].disconnected).toBe(true);
    intersect(observers[1]);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
