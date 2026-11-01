import React from 'react';

import {useNavigation} from '../../routing/navigation';
import {PostCardSkeletons} from '../post-card/post-card-skeleton';
import {TrendingSidebar} from '../trending-sidebar/trending-sidebar';
import {ListLayout} from './list-layout';

export const ListSkeleton: React.FunctionComponent = () => {
  const {goToPost} = useNavigation();
  return (
    <ListLayout sidebar={<TrendingSidebar loading posts={[]} reactionsByPost={{}} onPostClick={goToPost}/>}>
      <PostCardSkeletons/>
    </ListLayout>
  );
};
