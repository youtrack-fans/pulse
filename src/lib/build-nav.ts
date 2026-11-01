import type {Blog} from '../data/types';
import type {PulseNavItem} from './nav-item';

export const VISIBLE_CATEGORIES = 5;

interface BuiltNav {
  nav: readonly PulseNavItem[];
  categories: readonly PulseNavItem[] | undefined;
  allCategories: readonly PulseNavItem[];
}

export function buildNav(
  blogs: readonly Blog[],
  activeBlogId: string | null | undefined,
  allActive: boolean,
  onAll: () => void,
  onSelect: (blog: Blog) => void,
): BuiltNav {
  const sorted = blogs.filter(b => b.childCount > 0).sort((a, b) => b.childCount - a.childCount);
  const toItem = (blog: Blog): PulseNavItem => ({
    id: blog.id,
    label: blog.summary,
    count: blog.childCount,
    active: blog.id === activeBlogId,
    onClick: () => onSelect(blog),
  });
  const visible = sorted.slice(0, VISIBLE_CATEGORIES);
  const active = sorted.find(b => b.id === activeBlogId);
  if (active && !visible.includes(active)) {
    visible[visible.length - 1] = active;
  }
  return {
    nav: [{id: 'all', label: 'All', active: allActive, onClick: onAll}, ...visible.map(toItem)],
    categories: sorted.length > VISIBLE_CATEGORIES ? sorted.map(toItem) : undefined,
    allCategories: sorted.map(toItem),
  };
}
