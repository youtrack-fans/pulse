import {useEffect, useState} from 'react';

import type {BlogConfig, SearchIndexPost} from '../../data/types';
import {useHost} from '../../api/host-context';
import {YtSearchRepository} from '../../data/search/yt-search-repository';
import type {CommentEntry, PersonEntry} from './search-types';
import type {SearchResults} from './search-results';

interface UseSearchResult {
  results: SearchResults;
  loading: boolean;
  error: string | null;
}

const POSTS_TOP = 15;
const COMMENTED_TOP = 50;
const PEOPLE_TOP = 8;

const EMPTY_RESULTS: SearchResults = {
  posts: [],
  people: [],
  comments: [],
  bookmarks: [],
  categories: [],
  counts: {all: 0, posts: 0, people: 0, comments: 0, bookmarks: 0, categories: 0},
};

function buildResults(
  articles: readonly SearchIndexPost[],
  commented: readonly SearchIndexPost[],
  people: readonly PersonEntry[],
  needle: string,
): SearchResults {
  const posts: SearchIndexPost[] = [];
  const comments: CommentEntry[] = [];
  const seenComments = new Set<string>();

  articles.forEach(article => {
    const inTitle = article.summary.toLowerCase().includes(needle);
    const hasMatchedComment = article.comments.some(comment => comment.text.toLowerCase().includes(needle));
    if (inTitle || !hasMatchedComment) {
      posts.push(article);
    }
  });

  [...articles, ...commented].forEach(article => {
    const matchedComments = article.comments.filter(comment => comment.text.toLowerCase().includes(needle));

    matchedComments.forEach(comment => {
      if (seenComments.has(comment.id)) {return;}
      seenComments.add(comment.id);
      comments.push({
        id: comment.id,
        postId: article.id,
        postSummary: article.summary,
        text: comment.text,
        created: comment.created,
        authorLogin: comment.author.login,
        authorFullName: comment.author.fullName,
        authorAvatarUrl: comment.author.avatarUrl,
      });
    });
  });

  return {
    posts,
    people,
    comments,
    bookmarks: [],
    categories: [],
    counts: {
      all: posts.length + people.length + comments.length,
      posts: posts.length,
      people: people.length,
      comments: comments.length,
      bookmarks: 0,
      categories: 0,
    },
  };
}

export function useSearch(config: BlogConfig, query: string): UseSearchResult {
  const host = useHost();
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();

  useEffect(() => {
    if (!needle) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const repo = new YtSearchRepository(host);
    const run = async () => {
      const [postsResult, commentedResult, peopleResult] = await Promise.allSettled([
        repo.searchPosts(config.projectShortName, trimmed, POSTS_TOP),
        repo.searchCommented(config.projectShortName, trimmed, COMMENTED_TOP),
        repo.searchPeople(trimmed, PEOPLE_TOP),
      ]);
      if (cancelled) {return;}
      if (postsResult.status === 'rejected') {
        setError('Search is unavailable right now.');
        setLoading(false);
        return;
      }
      const people = peopleResult.status === 'fulfilled' ? peopleResult.value : [];
      const commented = commentedResult.status === 'fulfilled' ? commentedResult.value : [];
      setResults(buildResults(postsResult.value, commented, people, needle));
      setLoading(false);
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [host, config.projectShortName, trimmed, needle]);

  return {results, loading, error};
}
