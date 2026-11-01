import React, {useEffect, useRef, useState} from 'react';

interface PaletteList {
  selected: number;
  setSelected: (index: number) => void;
  listRef: React.RefObject<HTMLDivElement | null>;
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

export function usePaletteList<T>(
  rows: readonly T[],
  resetKey: string,
  onOpen: (row: T) => void,
  onClose: () => void,
): PaletteList {
  const [rawSelected, setSelected] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const selected = rawSelected < rows.length ? rawSelected : 0;

  const [appliedResetKey, setAppliedResetKey] = useState(resetKey);
  if (appliedResetKey !== resetKey) {
    setAppliedResetKey(resetKey);
    setSelected(0);
  }

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-row="${selected}"]`)?.scrollIntoView({block: 'nearest'});
  }, [selected]);

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (rows.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((selected + 1) % rows.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((selected - 1 + rows.length) % rows.length);
    } else if (event.key === 'Enter') {
      if (event.target instanceof HTMLButtonElement) {
        return;
      }
      event.preventDefault();
      onOpen(rows[selected]);
    }
  };

  return {selected, setSelected, listRef, handleKeyDown};
}
