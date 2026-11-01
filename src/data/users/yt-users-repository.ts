import type {HostAPI} from '../../api/host';
import type {Author} from '../types';
import type {UsersRepository} from './users-repository';
import {mapAuthor} from './map-author';
import type {YTAuthorRef} from './map-author';

export class YtUsersRepository implements UsersRepository {
  private readonly host: HostAPI;

  constructor(host: HostAPI) {
    this.host = host;
  }

  async getCurrentUser(): Promise<Author> {
    const user = await this.host.fetchYouTrack<YTAuthorRef>(
      'users/me?fields=login,fullName,avatarUrl,ringId'
    );

    return mapAuthor(user);
  }
}
