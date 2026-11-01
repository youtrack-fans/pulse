import {createContext, useContext} from 'react';

export interface NavigationState {
  goToFeed: (blogId: string) => void;
  goToPost: (postId: string, replyToCommentId?: string, title?: string, focusCommentId?: string) => void;
  goToComments: (postId: string, title?: string) => void;
  goToBlogList: (rubricId?: string, rubricName?: string, authorLogin?: string) => void;
  goToAuthor: (authorLogin: string) => void;
}

const NavigationContext = createContext<NavigationState | null>(null);

export const NavigationProvider = NavigationContext.Provider;

export const useNavigation = (): NavigationState => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('Navigation context is missing');
  }
  return context;
};
