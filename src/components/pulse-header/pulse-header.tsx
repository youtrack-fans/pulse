import React from 'react';

import {SignalGlyph, SearchGlyph, ComposeGlyph, BookmarkGlyph} from '../../icons/icons';
import {BlogNameContext} from './blog-name-context';
import {useSearchPalette} from '../search-palette/search-palette-context';

import shimmerStyles from '../skeleton/shimmer.module.css';
import {VISIBLE_CATEGORIES} from '../../lib/build-nav';
import type {PulseNavItem} from '../../lib/nav-item';
import {useMinDuration} from '../../hooks/use-min-duration';
import {useScrolled} from '../../hooks/use-scrolled';
import {MIN_PLACEHOLDER_MS} from '../../config/constants';

import styles from './pulse-header.module.css';

interface PulseHeaderProps {
  nav?: readonly PulseNavItem[];
  moreNav?: readonly PulseNavItem[];
  navLoading?: boolean;
  navError?: boolean;
  onNavRetry?: () => void;
  onBrandClick?: () => void;
  writeHref?: string;
  canWrite?: boolean;
}

const HeaderNav: React.FunctionComponent<{nav: readonly PulseNavItem[]; moreCount?: number; onMore?: () => void}> = ({nav, moreCount, onMore}) => (
  <nav className={styles.nav}>
    {nav.map(item => (
      <button
        key={item.id}
        type="button"
        className={item.active ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem}
        onClick={item.onClick}
      >
        {item.label}
      </button>
    ))}
    {onMore && (
      <button type="button" className={styles.navItem} onClick={onMore}>
        More{moreCount ? ` · ${moreCount}` : ''}
      </button>
    )}
  </nav>
);

const NAV_SKELETON_ITEMS = ['all', 'first', 'second', 'third', 'fourth', 'fifth'];

const HeaderNavSkeleton: React.FunctionComponent = () => (
  <nav className={styles.nav} aria-hidden="true">
    {NAV_SKELETON_ITEMS.map(id => (
      <span key={id} className={styles.navSkeletonItem}>
        <span className={`${shimmerStyles.shimmer} ${styles.navSkeletonBar}`}/>
      </span>
    ))}
  </nav>
);

const HeaderActions: React.FunctionComponent<{writeHref?: string; writePending?: boolean; canWrite: boolean}> = ({writeHref, writePending, canWrite}) => {
  const {open, isOpen, openBookmarks, isBookmarksOpen} = useSearchPalette();
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={isBookmarksOpen ? `${styles.iconBtn} ${styles.iconBtnActive}` : styles.iconBtn}
        aria-label="Bookmarks"
        aria-pressed={isBookmarksOpen}
        title="Bookmarks"
        onClick={openBookmarks}
      >
        <BookmarkGlyph on={false} strokeWidth={1.7}/>
      </button>
      <button
        type="button"
        className={isOpen ? `${styles.iconBtn} ${styles.iconBtnActive}` : styles.iconBtn}
        aria-label="Search"
        aria-pressed={isOpen}
        onClick={open}
      >
        <SearchGlyph/>
      </button>
      {canWrite && writeHref && (
        <a className={styles.writeBtn} href={writeHref} target="_top" title="Write a post" aria-label="Write a post">
          <ComposeGlyph/>
        </a>
      )}
      {canWrite && !writeHref && writePending && (
        <span className={`${styles.writeBtn} ${styles.writeBtnPending}`} role="link" aria-disabled="true" aria-label="Write a post">
          <ComposeGlyph/>
        </span>
      )}
    </div>
  );
};

export const PulseHeader: React.FunctionComponent<PulseHeaderProps> = ({nav, moreNav, navLoading, navError, onNavRetry, onBrandClick, writeHref, canWrite = true}) => {
  const blogName = React.useContext(BlogNameContext);
  const {openCategories} = useSearchPalette();
  const showPlaceholders = useMinDuration(Boolean(navLoading), MIN_PLACEHOLDER_MS);
  const scrolled = useScrolled();
  return (
    <header className={scrolled ? `${styles.header} ${styles.headerScrolled}` : styles.header}>
      <button
        type="button"
        className={styles.brand}
        onClick={onBrandClick}
      >
        <span className={styles.brandMark} aria-hidden="true">
          <span className={`${styles.brandLayer} ${styles.brandLayerPink}`}/>
          <span className={`${styles.brandLayer} ${styles.brandLayerOrange}`}/>
          <span className={styles.brandCore}><SignalGlyph size={12}/></span>
        </span>
        <span className={styles.brandName}>{blogName}</span>
      </button>
      {showPlaceholders && <HeaderNavSkeleton/>}
      {!showPlaceholders && navError && (
        <nav className={styles.nav}>
          <button type="button" className={styles.navItem} onClick={onNavRetry}>Categories could not be loaded · Retry</button>
        </nav>
      )}
      {!showPlaceholders && nav && nav.length > 0 && <HeaderNav nav={nav} moreCount={moreNav ? moreNav.length - VISIBLE_CATEGORIES : undefined} onMore={moreNav ? openCategories : undefined}/>}
      <HeaderActions writeHref={writeHref} writePending={showPlaceholders} canWrite={canWrite}/>
    </header>
  );
};
