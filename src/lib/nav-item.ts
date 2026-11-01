export interface PulseNavItem {
  id: string;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}
