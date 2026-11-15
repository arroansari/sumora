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

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  SummaryDetail: {
    videoId: string;
    videoTitle?: string;
    isReddit?: boolean;
    redditItem?: any;
  };
  ChannelDetail: {
    channelId: string;
    channelName: string;
    thumbnailUrl?: string | null;
    trackedSince?: string;
  };
};
