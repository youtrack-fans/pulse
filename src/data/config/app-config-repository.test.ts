import {describe, expect, it, vi} from 'vitest';

import type {HostAPI} from '../../api/host';
import {fetchSettings} from '../../api/index';
import {AppConfigRepository} from './app-config-repository';

vi.mock('../../api/index', () => ({fetchSettings: vi.fn()}));

const host = {fetchYouTrack: async () => ({contextPath: '/youtrack'})} as unknown as HostAPI;
const project = {id: '1', name: 'Pulse', shortName: 'PULSE'};

describe('AppConfigRepository', () => {
  it('maps the configured project, the blog name and the permissions', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({
      configured: true,
      project,
      blogName: 'Our blog',
      permissions: {createArticle: true, createComment: false},
    });
    expect(await new AppConfigRepository(host).getConfig()).toEqual({
      status: 'ready',
      config: {projectName: 'Pulse', projectShortName: 'PULSE', blogName: 'Our blog', contextPath: '/youtrack', canWrite: true, canComment: false},
    });
  });

  it('treats missing permissions as read-only', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({configured: true, project});
    const access = await new AppConfigRepository(host).getConfig();
    expect(access.status === 'ready' && [access.config.canWrite, access.config.canComment]).toEqual([false, false]);
  });

  it('falls back to the root context path when the YouTrack config cannot be read', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({configured: true, project});
    const failing = {fetchYouTrack: async () => {
      throw new Error('config failed');
    }} as unknown as HostAPI;
    const access = await new AppConfigRepository(failing).getConfig();
    expect(access.status === 'ready' && access.config.contextPath).toBe('');
  });

  it('reports an unconfigured blog when no project is chosen', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({configured: false, project: null});
    expect(await new AppConfigRepository(host).getConfig()).toEqual({status: 'unconfigured'});
  });

  it('reports forbidden access when the project is configured but hidden from the user', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({configured: true, project: null});
    expect(await new AppConfigRepository(host).getConfig()).toEqual({status: 'forbidden'});
  });

  it('throws instead of reporting a backend failure as a missing project', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({configured: false, project: null, error: 'The app settings could not be read.'});
    await expect(new AppConfigRepository(host).getConfig()).rejects.toThrow('The app settings could not be read.');
  });
});
