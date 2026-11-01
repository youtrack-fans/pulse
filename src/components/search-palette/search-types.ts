export interface PersonEntry {
  login: string;
  fullName: string;
  avatarUrl: string;
}

export interface CommentEntry {
  id: string;
  postId: string;
  postSummary: string;
  text: string;
  created: number;
  authorLogin: string;
  authorFullName: string;
  authorAvatarUrl: string;
}
