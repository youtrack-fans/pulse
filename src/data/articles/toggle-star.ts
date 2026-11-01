interface StarRepository {
  toggleStar(articleId: string, hasStar: boolean): Promise<void>;
}

export async function toggleStarOptimistic(
  repo: StarRepository,
  postId: string,
  hasStar: boolean,
  apply: (hasStar: boolean) => void,
): Promise<void> {
  apply(hasStar);
  try {
    await repo.toggleStar(postId, hasStar);
  } catch {
    apply(!hasStar);
  }
}
