import {describe, expect, it} from 'vitest';

import type {HostAPI} from '../../api/host';
import {YtUsersRepository} from './yt-users-repository';

describe('YtUsersRepository', () => {
  it('falls back to the login when the current user has no full name or picture', async () => {
    const host = {fetchYouTrack: async () => ({login: 'zed', fullName: '', avatarUrl: '', ringId: ''})} as unknown as HostAPI;
    expect(await new YtUsersRepository(host).getCurrentUser()).toEqual({login: 'zed', fullName: 'zed', avatarUrl: '', ringId: ''});
  });
});
