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

import { SpaceType, VideoSummary } from './models.types';

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
    summary?: Partial<VideoSummary>;
  };
  ChannelDetail: {
    channelId: string;
    channelName: string;
    thumbnailUrl?: string | null;
    trackedSince?: string;
  };
};
