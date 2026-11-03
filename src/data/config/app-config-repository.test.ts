import {describe, expect, it, vi} from 'vitest';

import type {HostAPI} from '../../api/host';
import {fetchSettings} from '../../api/index';
import {AppConfigRepository} from './app-config-repository';

vi.mock('../../api/index', () => ({fetchSettings: vi.fn()}));

const host = {fetchYouTrack: async () => ({contextPath: '/youtrack'})} as unknown as HostAPI;

describe('AppConfigRepository', () => {
  it('maps the configured project and the blog name', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({project: {id: '1', name: 'Pulse', shortName: 'PULSE'}, blogName: 'Our blog'});
    expect(await new AppConfigRepository(host).getConfig()).toEqual({projectName: 'Pulse', projectShortName: 'PULSE', blogName: 'Our blog', contextPath: '/youtrack'});
  });

  it('falls back to the root context path when the YouTrack config cannot be read', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({project: {id: '1', name: 'Pulse', shortName: 'PULSE'}});
    const failing = {fetchYouTrack: async () => {
      throw new Error('config failed');
    }} as unknown as HostAPI;
    expect((await new AppConfigRepository(failing).getConfig())?.contextPath).toBe('');
  });

  it('returns null when no project is configured', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({project: null});
    expect(await new AppConfigRepository(host).getConfig()).toBeNull();
  });

  it('throws instead of reporting a backend failure as a missing project', async () => {
    vi.mocked(fetchSettings).mockResolvedValue({project: null, error: 'The app settings could not be read.'});
    await expect(new AppConfigRepository(host).getConfig()).rejects.toThrow('The app settings could not be read.');
  });
});
