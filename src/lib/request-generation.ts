export interface RequestGeneration {
  current: () => number;
  next: () => number;
  isCurrent: (token: number) => boolean;
}

export function createRequestGeneration(): RequestGeneration {
  let value = 0;
  return {
    current: () => value,
    next: () => {
      value += 1;
      return value;
    },
    isCurrent: token => token === value,
  };
}
