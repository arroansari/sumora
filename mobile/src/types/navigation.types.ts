export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Following: undefined;
  ConnectedAccounts: undefined;
  Notifications: undefined;
  Profile: undefined;
};

import { SpaceType } from './models.types';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  SummaryDetail: {
    videoId: string;
    videoTitle?: string;
    space?: SpaceType;
    channelName?: string;
    thumbnailUrl?: string | null;
    publishedAt?: string;
    url?: string;
    readTime?: string;
    isReddit?: boolean;
    redditItem?: any;
    summary?: {
      overview?: string;
      keyPoints?: string[];
      importantConcepts?: Array<{ concept: string; explanation: string }>;
      detailedSummary?: string;
      conclusion?: string;
      topicsCovered?: string[];
      aiProvider?: string;
    };
  };
  ChannelDetail: {
    channelId: string;
    channelName: string;
    thumbnailUrl?: string | null;
    trackedSince?: string;
  };
};
