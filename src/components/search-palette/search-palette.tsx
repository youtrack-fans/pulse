import React, {useEffect, useId, useRef, useState, Fragment} from 'react';
import Button from '@jetbrains/ring-ui-built/components/button/button';

import type {BlogConfig, BookmarkedPost, SearchIndexPost} from '../../data/types';
import {useBookmarkedPosts} from '../../data/bookmarks/use-bookmarked-posts';
import {formatFullDate} from '../../lib/date';
import {useDebouncedValue} from '../../hooks/use-debounced-value';
import {useMinDuration} from '../../hooks/use-min-duration';
import {Avatar} from '../avatar/avatar';
import {SearchGlyph, ArrowUpGlyph, ArrowDownGlyph, ReturnGlyph} from '../../icons/icons';
import type {PersonEntry, CommentEntry} from './search-types';
import type {Scope, SearchRow} from './search-results';
import type {PulseNavItem} from '../../lib/nav-item';
import {SCOPES, SCOPE_LABELS, matchBookmarks, matchCategories, toRows, withLocalEntries} from './search-results';
import {PaletteRow} from './palette-row';
import {trapTab} from './focus-trap';
import {usePaletteList} from './use-palette-list';
import {useSearch} from './use-search';
import {Highlight, snippetAround} from './highlight';

import styles from './search-palette.module.css';

interface SearchPaletteProps {
  config: BlogConfig;
  initialScope: Scope;
  categories: readonly PulseNavItem[];
  onClose: () => void;
  onOpenPost: (post: SearchIndexPost) => void;
  onOpenComment: (comment: CommentEntry) => void;
  onOpenPerson: (person: PersonEntry) => void;
  onOpenBookmark: (post: BookmarkedPost) => void;
  onOpenCategory: (category: PulseNavItem) => void;
}

interface ScopeChipProps {
  scope: Scope;
  active: boolean;
  count?: number;
  onSelect: (scope: Scope) => void;
}

const ScopeChip: React.FunctionComponent<ScopeChipProps> = ({scope, active, count, onSelect}) => {
  const handleClick = () => onSelect(scope);
  return (
    <button type="button" className={active ? `${styles.chip} ${styles.chipActive}` : styles.chip} onClick={handleClick}>
      {SCOPE_LABELS[scope]}
      {count !== undefined && <span className={styles.chipCount}>{count}</span>}
    </button>
  );
};

interface SeeAllButtonProps {
  scope: Scope;
  total: number;
  onSelect: (scope: Scope) => void;
}

const SeeAllButton: React.FunctionComponent<SeeAllButtonProps> = ({scope, total, onSelect}) => {
  const handleClick = () => onSelect(scope);
  return (
    <button type="button" className={styles.seeAll} onClick={handleClick}>
      See all {total}
    </button>
  );
};

const BAR_MIN_MS = 700;
const SEARCH_DEBOUNCE_MS = 150;

const PLACEHOLDERS: Readonly<Record<Scope, string>> = {
  all: 'Search posts, people, comments, bookmarks, and categories…',
  posts: 'Search posts…',
  people: 'Search people…',
  comments: 'Search comments…',
  bookmarks: 'Search bookmarks…',
  categories: 'Find a category…',
};

const GROUP_LABEL: Readonly<Record<SearchRow['kind'], string>> = {
  post: 'Posts',
  person: 'People',
  comment: 'Comments',
  bookmark: 'Bookmarks',
  category: 'Categories',
};

const GROUP_SCOPE: Readonly<Record<SearchRow['kind'], Scope>> = {
  post: 'posts',
  person: 'people',
  comment: 'comments',
  bookmark: 'bookmarks',
  category: 'categories',
};

export const SearchPalette: React.FunctionComponent<SearchPaletteProps> = ({
  config,
  initialScope,
  categories,
  onClose,
  onOpenPost,
  onOpenComment,
  onOpenPerson,
  onOpenBookmark,
  onOpenCategory,
}) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>(initialScope);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    inputRef.current?.focus();
    return () => {
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const {results: searchResults, loading, error} = useSearch(config, debouncedQuery);
  const bookmarks = useBookmarkedPosts(config, scope === 'bookmarks' || debouncedQuery.trim() !== '');
  const needle = debouncedQuery.trim().toLowerCase();
  const results = withLocalEntries(searchResults, matchBookmarks(bookmarks.posts ?? [], needle), matchCategories(categories, needle));
  const rows = toRows(results, scope);

  const activate = (row: SearchRow): void => {
    switch (row.kind) {
      case 'post':
        onOpenPost(row.post);
        break;
      case 'person':
        onOpenPerson(row.person);
        break;
      case 'comment':
        onOpenComment(row.comment);
        break;
      case 'bookmark':
        onOpenBookmark(row.bookmark);
        break;
      default:
        onOpenCategory(row.category);
    }
  };

  const {selected, setSelected, listRef, handleKeyDown} = usePaletteList(rows, `${debouncedQuery}|${scope}`, activate, onClose);

  const hasQuery = needle.length > 0;
  const isBookmarksScope = scope === 'bookmarks';
  const isBrowseScope = isBookmarksScope || scope === 'categories';
  const isLoading = loading && hasQuery && !isBrowseScope;

  const showLoadingBar = useMinDuration(isLoading, BAR_MIN_MS);

  const failure = isBookmarksScope ? bookmarks.error : error;
  const showList = rows.length > 0 && (hasQuery || isBrowseScope) && !(failure && !isBrowseScope);

  const renderStatus = (): React.ReactNode => {
    if (failure && (isBookmarksScope || !isBrowseScope)) {
      return (
        <div className={styles.stateMsg}>
          {failure} {isBookmarksScope && <Button inline onClick={bookmarks.retry}>Retry</Button>}
        </div>
      );
    }
    if (isBookmarksScope && bookmarks.posts === null) {
      return <div className={styles.hint}>Loading…</div>;
    }
    if (isBookmarksScope && bookmarks.posts?.length === 0) {
      return <div className={styles.hint}>No bookmarks yet. Use the bookmark button on a post to save it here.</div>;
    }
    if (scope === 'categories' && categories.length === 0) {
      return <div className={styles.hint}>No categories yet.</div>;
    }
    if (!hasQuery && !isBrowseScope) {
      return <div className={styles.hint}>Type to search across posts, people, and comments.</div>;
    }
    if (rows.length === 0 && hasQuery && !showLoadingBar) {
      return <div className={styles.stateMsg}>No matches for &ldquo;{debouncedQuery.trim()}&rdquo;.</div>;
    }
    return null;
  };
  const footerCount = isBrowseScope ? results.counts[scope] : results.counts.all;
  const footerText = hasQuery || (isBookmarksScope && bookmarks.posts) || scope === 'categories'
    ? `${footerCount} ${footerCount === 1 ? 'result' : 'results'}`
    : null;
  const statusMessage = showList ? null : renderStatus();

  const renderRow = (row: SearchRow, index: number): React.ReactNode => {
    const rowProps = {id: `${listId}-row-${index}`, index, row, selected: index === selected, onSelect: setSelected, onActivate: activate};
    switch (row.kind) {
      case 'post':
        return (
          <PaletteRow {...rowProps}>
            <div className={styles.postTitle}><Highlight text={row.post.summary} query={debouncedQuery}/></div>
            <div className={styles.postMeta}>
              {row.post.author.fullName} · {row.post.blogName} · {formatFullDate(row.post.created)}
            </div>
          </PaletteRow>
        );
      case 'person':
        return (
          <PaletteRow {...rowProps} person>
            <Avatar name={row.person.fullName} avatarUrl={row.person.avatarUrl} size={36}/>
            <div className={styles.personBody}>
              <div className={styles.personName}><Highlight text={row.person.fullName} query={debouncedQuery}/></div>
              <div className={styles.postMeta}>Contributor</div>
            </div>
          </PaletteRow>
        );
      case 'bookmark':
        return (
          <PaletteRow {...rowProps}>
            <div className={styles.postTitle}><Highlight text={row.bookmark.summary} query={debouncedQuery}/></div>
            <div className={styles.postMeta}>
              {row.bookmark.author} · {row.bookmark.blogName} · {formatFullDate(row.bookmark.created)}
            </div>
          </PaletteRow>
        );
      case 'category':
        return (
          <PaletteRow {...rowProps}>
            <div className={styles.postTitle}><Highlight text={row.category.label} query={debouncedQuery}/></div>
            <div className={styles.postMeta}>
              {row.category.count ?? 0} {row.category.count === 1 ? 'post' : 'posts'}{row.category.active ? ' · current' : ''}
            </div>
          </PaletteRow>
        );
      default:
        return (
          <PaletteRow {...rowProps}>
            <div className={styles.postMeta}>
              {row.comment.authorFullName} · on &ldquo;{row.comment.postSummary}&rdquo;
            </div>
            <div className={styles.commentText}>
              <Highlight text={snippetAround(row.comment.text, debouncedQuery)} query={debouncedQuery}/>
            </div>
          </PaletteRow>
        );
    }
  };

  const displayedByKind: Record<SearchRow['kind'], number> = {post: 0, person: 0, comment: 0, bookmark: 0, category: 0};
  rows.forEach(row => {
    displayedByKind[row.kind] += 1;
  });

  const handleOverlayMouseDown = (event: React.MouseEvent) => {
    if (!(event.target instanceof Element && event.target.closest('[role="dialog"]'))) {
      onClose();
    }
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value);

  const handleOverlayKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      trapTab(event, dialogRef.current);
      return;
    }
    handleKeyDown(event);
  };

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
      onKeyDown={handleOverlayKeyDown}
    >
      <div
        className={styles.scrim}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={styles.palette}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className={styles.inputRow}>
          <span className={hasQuery ? `${styles.inputIcon} ${styles.inputIconActive}` : styles.inputIcon}>
            <SearchGlyph size={18}/>
          </span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${listId}-row-${selected}` : undefined}
            className={styles.input}
            aria-label="Search"
            value={query}
            placeholder={PLACEHOLDERS[scope]}
            onChange={handleQueryChange}
          />
          <button type="button" className={styles.escChip} onClick={onClose}>ESC</button>
          {showLoadingBar && (
            <div className={styles.loadingBar} aria-hidden="true">
              <div className={styles.loadingBarFill}/>
            </div>
          )}
        </div>

        <div className={styles.scopeRow}>
          <div className={styles.chips}>
            {SCOPES.map(item => (
              <ScopeChip
                key={item}
                scope={item}
                active={item === scope}
                count={hasQuery ? results.counts[item] : undefined}
                onSelect={setScope}
              />
            ))}
          </div>
        </div>

        {statusMessage && <div role="status">{statusMessage}</div>}
        {showList && (
          <div className={styles.list} ref={listRef} id={listId} role="listbox" aria-label="Results">
            {rows.map((row, i) => {
              const prev = rows[i - 1];
              const showHeader = !prev || prev.kind !== row.kind;
              const total = results.counts[GROUP_SCOPE[row.kind]];
              const hasMore = scope === 'all' && total > displayedByKind[row.kind];
              return (
                <Fragment key={row.key}>
                  {showHeader && (
                    <div className={styles.groupHeader}>
                      <span className={styles.groupTitle}>{GROUP_LABEL[row.kind]}</span>
                      {hasMore && <SeeAllButton scope={GROUP_SCOPE[row.kind]} total={total} onSelect={setScope}/>}
                    </div>
                  )}
                  {renderRow(row, i)}
                </Fragment>
              );
            })}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.footerHint}>
            <span className={styles.keyGroup}>
              <span className={styles.keyCap}><ArrowUpGlyph/></span>
              <span className={styles.keyCap}><ArrowDownGlyph/></span>
            </span>
            Navigate
          </span>
          <span className={styles.footerHint}>
            <span className={styles.keyCap}><ReturnGlyph/></span>
            Open
          </span>
          <span className={styles.footerRight}>
            {footerText}
          </span>
        </div>
      </div>
    </div>
  );
};
