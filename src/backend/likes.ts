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

export function findBlogPost(project: Project, postId: string): Article | null {
  try {
    const article = Article.findById(postId);
    return article && article.project.key === project.key && article.parentArticle ? article : null;
  } catch {
    return null;
  }
}
