import type {Author} from '../types';

export interface YTAuthorRef {
  login: string;
  fullName: string;
  avatarUrl: string;
  ringId: string;
}

export function mapAuthor(reporter: YTAuthorRef): Author {
  return {
    login: reporter.login,
    fullName: reporter.fullName || reporter.login,
    avatarUrl: reporter.avatarUrl || '',
    ringId: reporter.ringId || '',
  };
}
