import {describe, expect, it} from 'vitest';

import {blog, createArticlesFake, post} from '../../test/fake-host';
import {loadProjectIndex} from './project-index';

let projectCounter = 0;
const nextProject = () => `IDX${projectCounter++}`;

describe('loadProjectIndex', () => {
  const general = blog('b1', 'General', 1);
  const kotlin = blog('b2', 'Kotlin', 2);

  it('builds blogs and newest-first stubs and counts posts per blog', async () => {
    const {host} = createArticlesFake([general, kotlin, post('p1', general, 10), post('p2', kotlin, 30), post('p3', general, 20)]);

    const index = await loadProjectIndex(host, nextProject());

    expect(index.blogs.map(item => [item.id, item.childCount])).toEqual([['b1', 2], ['b2', 1]]);
    expect(index.stubs.map(stub => stub.id)).toEqual(['p2', 'p3', 'p1']);
  });

  it('leaves grandchildren out of the stubs', async () => {
    const child = post('p1', general, 10);
    const grandchild = post('g1', blog('p1', 'Post p1', 10), 20, {parent: {id: 'p1', summary: 'Post p1', parentId: 'b1'}});
    const {host} = createArticlesFake([general, child, grandchild]);

    const index = await loadProjectIndex(host, nextProject());

    expect(index.stubs.map(stub => stub.id)).toEqual(['p1']);
  });

  it('serves the second call from the cache and refetches when asked to', async () => {
    const {host, calls} = createArticlesFake([general, post('p1', general, 10)]);
    const project = nextProject();

    await loadProjectIndex(host, project);
    const afterFirst = calls.length;
    await loadProjectIndex(host, project);
    const afterSecond = calls.length;
    await loadProjectIndex(host, project, true);

    expect(afterSecond).toBe(afterFirst);
    expect(calls.length).toBeGreaterThan(afterSecond);
  });
});
