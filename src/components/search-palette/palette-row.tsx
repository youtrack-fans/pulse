import React from 'react';

import type {SearchRow} from './search-results';

import styles from './search-palette.module.css';

interface PaletteRowProps {
  id: string;
  index: number;
  row: SearchRow;
  selected: boolean;
  person?: boolean;
  onSelect: (index: number) => void;
  onActivate: (row: SearchRow) => void;
  children: React.ReactNode;
}

export const PaletteRow: React.FunctionComponent<PaletteRowProps> = ({id, index, row, selected, person = false, onSelect, onActivate, children}) => {
  const classNames = [styles.rowButton, styles.row];
  if (selected) {classNames.push(styles.rowSelected);}
  if (person) {classNames.push(styles.rowPerson);}
  const handleMouseMove = () => onSelect(index);
  const handleClick = () => onActivate(row);
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      data-row={index}
      className={classNames.join(' ')}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};
