import {Article, type Project} from '@jetbrains/youtrack-scripting-api/entities';

export type LikesByReaction = Record<string, string[]>;

export type LikeItem = {
  postId: string;
  reaction: string;
  authorLogin: string;
};

export function parseLikes(raw: unknown): LikesByReaction {
  if (typeof raw !== 'string' || raw === '') {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const likes: LikesByReaction = {};
    Object.keys(parsed).forEach(reaction => {
      const logins = (parsed as Record<string, unknown>)[reaction];
      if (Array.isArray(logins)) {
        likes[reaction] = logins.filter((login): login is string => typeof login === 'string');
      }
    });
    return likes;
  } catch {
    return {};
  }
}

export function readLikes(article: Article): LikesByReaction {
  return parseLikes(article.extensionProperties.pulseLikes);
}

export function writeLikes(article: Article, likes: LikesByReaction): void {
  const nonEmpty: LikesByReaction = {};
  Object.keys(likes).forEach(reaction => {
    if (likes[reaction].length > 0) {
      nonEmpty[reaction] = likes[reaction];
    }
  });
  article.extensionProperties.pulseLikes = Object.keys(nonEmpty).length > 0 ? JSON.stringify(nonEmpty) : '';
}

export function likeItems(postId: string, likes: LikesByReaction): LikeItem[] {
  const items: LikeItem[] = [];
  Object.keys(likes).forEach(reaction => {
    likes[reaction].forEach(authorLogin => items.push({postId, reaction, authorLogin}));
  });
  return items;
}

const POST_ID = /^[a-z0-9_]+-a-\d+$/i;

function isBlogPost(project: Project, article: Article): boolean {
  return article.project.key === project.key && Boolean(article.parentArticle);
}

function searchVisibleArticles(postIds: readonly string[]): Article[] | null {
  try {
    const found: Article[] = [];
    Article.search(`article id: ${postIds.join(', ')}`).forEach(article => found.push(article));
    return found;
  } catch {
    return null;
  }
}

export function findBlogPost(project: Project, postId: string): Article | null {
  if (!POST_ID.test(postId)) {
    return null;
  }
  const wanted = postId.toLowerCase();
  const article = searchVisibleArticles([postId])?.find(found => found.id.toLowerCase() === wanted);
  return article && isBlogPost(project, article) ? article : null;
}

export function findBlogPosts(project: Project, postIds: readonly string[]): Map<string, Article> {
  const posts = new Map<string, Article>();
  const validIds = postIds.filter(postId => POST_ID.test(postId));
  if (validIds.length === 0) {
    return posts;
  }
  const batch = searchVisibleArticles(validIds);
  if (!batch) {
    validIds.forEach(postId => {
      const article = findBlogPost(project, postId);
      if (article) {
        posts.set(postId, article);
      }
    });
    return posts;
  }
  const byId = new Map(batch.map(article => [article.id.toLowerCase(), article]));
  validIds.forEach(postId => {
    const article = byId.get(postId.toLowerCase());
    if (article && isBlogPost(project, article)) {
      posts.set(postId, article);
    }
  });
  return posts;
}
