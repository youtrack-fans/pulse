import React, {createContext, useContext, useEffect, useState} from 'react';

import type {BlogConfig, BookmarkedPost, SearchIndexPost} from '../../data/types';
import {useNavigation} from '../../routing/navigation';
import type {PersonEntry, CommentEntry} from './search-types';
import type {Scope} from './search-results';
import type {Route} from '../../routing/routing';
import {useBlogs} from '../../data/articles/use-blogs';
import {buildHeaderState} from '../../lib/header-state';
import type {PulseNavItem} from '../../lib/nav-item';
import {SearchPalette} from './search-palette';

interface SearchPaletteApi {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  openBookmarks: () => void;
  isBookmarksOpen: boolean;
  openCategories: () => void;
}

const SearchPaletteContext = createContext<SearchPaletteApi>({
  open: () => {},
  close: () => {},
  isOpen: false,
  openBookmarks: () => {},
  isBookmarksOpen: false,
  openCategories: () => {},
});

export const useSearchPalette = (): SearchPaletteApi => useContext(SearchPaletteContext);

interface SearchPaletteProviderProps {
  config: BlogConfig;
  route: Route;
  children: React.ReactNode;
}

export const SearchPaletteProvider: React.FunctionComponent<SearchPaletteProviderProps> = ({config, route, children}) => {
  const {goToPost, goToAuthor, goToBlogList, goToFeed} = useNavigation();
  const {blogs, stubs} = useBlogs(config);
  const categories = buildHeaderState(route, blogs, stubs, {goToBlogList, goToFeed}).allCategories ?? [];
  const [openScope, setOpenScope] = useState<Scope | null>(null);

  const isOpen = openScope !== null;
  const open = () => setOpenScope('all');
  const close = () => setOpenScope(null);
  const openBookmarks = () => setOpenScope('bookmarks');
  const openCategories = () => setOpenScope('categories');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpenScope(prev => prev === null ? 'all' : null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const {body} = document;
    const hadTabIndex = body.hasAttribute('tabindex');
    if (!hadTabIndex) {
      body.setAttribute('tabindex', '-1');
    }
    window.focus();
    body.focus({preventScroll: true});
    return () => {
      if (!hadTabIndex) {
        body.removeAttribute('tabindex');
      }
    };
  }, []);

  const onOpenPost = (post: SearchIndexPost) => {
    setOpenScope(null);
    goToPost(post.id, undefined, post.summary);
  };

  const onOpenComment = (comment: CommentEntry) => {
    setOpenScope(null);
    goToPost(comment.postId, undefined, comment.postSummary, comment.id);
  };

  const onOpenBookmark = (post: BookmarkedPost) => {
    setOpenScope(null);
    goToPost(post.id, undefined, post.summary);
  };

  const onOpenCategory = (category: PulseNavItem) => {
    setOpenScope(null);
    category.onClick();
  };

  const onOpenPerson = (person: PersonEntry) => {
    setOpenScope(null);
    goToAuthor(person.login);
  };

  return (
    <SearchPaletteContext.Provider value={{open, close, isOpen, openBookmarks, isBookmarksOpen: openScope === 'bookmarks', openCategories}}>
      {children}
      {openScope !== null && (
        <SearchPalette
          config={config}
          initialScope={openScope}
          categories={categories}
          onClose={close}
          onOpenPost={onOpenPost}
          onOpenComment={onOpenComment}
          onOpenPerson={onOpenPerson}
          onOpenBookmark={onOpenBookmark}
          onOpenCategory={onOpenCategory}
        />
      )}
    </SearchPaletteContext.Provider>
  );
};
