import { Platform } from 'react-native';
import {
  User,
  VideoItem,
  VideoSummary,
  ConnectedAccount,
  TrackedSource,
  NotificationPreference,
  RedditPostItem,
  RedditSummary,
  ContentPostItem,
  SpaceType,
} from '../types/models.types';

// Default to localhost for iOS simulator, 10.0.2.2 for Android emulator
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api';
let API_BASE_URL = DEFAULT_HOST;
let authToken: string | null = null;

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url;
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (response.status !== 204 && contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const rawText = await response.text().catch(() => '');
      data = rawText ? { message: rawText } : {};
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || `HTTP Error ${response.status}`);
    }

    return (data || {}) as T;
  } catch (error: any) {
    console.warn(`[API] Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

// Authentication API
export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    const res = await request<{ data: { user: User; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAuthToken(res.data.token);
    return res.data;
  },

  register: async (credentials: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    const res = await request<{ data: { user: User; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAuthToken(res.data.token);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await request<{ data: User }>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },
};

// Integrations API
export const integrationsApi = {
  list: async (): Promise<ConnectedAccount[]> => {
    const res = await request<{ data: ConnectedAccount[] }>('/integrations');
    return res.data;
  },

  getYouTubeConnectUrl: async (): Promise<{ authUrl: string }> => {
    const res = await request<{ data: { authUrl: string } }>('/integrations/youtube/connect');
    return res.data;
  },

  syncYouTube: async (): Promise<{ syncedChannelsCount: number; sources: TrackedSource[] }> => {
    const res = await request<{ data: { syncedChannelsCount: number; sources: TrackedSource[] } }>(
      '/integrations/youtube/sync',
      { method: 'POST' }
    );
    return res.data;
  },

  disconnect: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/integrations/${id}`, {
      method: 'DELETE',
    });
  },

  backfillChannel: async (channelId?: string): Promise<{ channelsProcessed: number; videosUpserted: number }> => {
    const url = channelId
      ? `/integrations/youtube/backfill?channelId=${encodeURIComponent(channelId)}`
      : '/integrations/youtube/backfill';
    const res = await request<{ data: { channelsProcessed: number; videosUpserted: number } }>(url, {
      method: 'POST',
    });
    return res.data;
  },
};

// Tracked Sources API
export const sourcesApi = {
  list: async (): Promise<TrackedSource[]> => {
    const res = await request<{ data: TrackedSource[] }>('/sources');
    return res.data;
  },

  add: async (source: { platform: string; sourceId: string; sourceName: string }): Promise<TrackedSource> => {
    const res = await request<{ data: TrackedSource }>('/sources', {
      method: 'POST',
      body: JSON.stringify(source),
    });
    return res.data;
  },

  remove: async (id: string): Promise<{ success: boolean }> => {
    return request<{ success: boolean }>(`/sources/${id}`, {
      method: 'DELETE',
    });
  },
};

// Videos & Summaries API
export const videosApi = {
  getFeed: async (
    page = 1,
    limit = 20,
    opts: { channelId?: string; from?: string; to?: string; search?: string } = {}
  ): Promise<{ videos: VideoItem[]; totalPages: number }> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (opts.channelId) params.set('channelId', opts.channelId);
    if (opts.from)      params.set('from', opts.from);
    if (opts.to)        params.set('to', opts.to);
    if (opts.search)    params.set('search', opts.search);

    const res = await request<{ data: VideoItem[]; pagination: { totalPages: number } }>(
      `/videos?${params.toString()}`
    );
    return {
      videos: res.data,
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  getVideo: async (videoId: string): Promise<VideoItem> => {
    const res = await request<{ data: VideoItem }>(`/videos/${videoId}`);
    return res.data;
  },

  getSummary: async (videoId: string): Promise<{ summary: VideoSummary; summaryStatus: string }> => {
    const res = await request<{ data: { summary: VideoSummary; summaryStatus: string } }>(
      `/videos/${videoId}/summary`
    );
    return res.data;
  },

  getSummaryStatus: async (videoId: string): Promise<{ status: string; message: string }> => {
    const res = await request<{ data: { status: string; message: string } }>(
      `/videos/${videoId}/summary/status`
    );
    return res.data;
  },

  triggerSummarize: async (videoId: string): Promise<{ status: string; message: string }> => {
    return request<{ status: string; message: string }>(`/videos/${videoId}/summarize`, {
      method: 'POST',
    });
  },

  importByUrl: async (url: string, channelId?: string): Promise<VideoItem> => {
    const res = await request<{ data: VideoItem }>('/videos/import', {
      method: 'POST',
      body: JSON.stringify({ url, channelId }),
    });
    return res.data;
  },

  syncFeed: async (
    priorityChannelIds: string[] = []
  ): Promise<{ channelsSynced: number; totalChannels: number; newVideosCount: number }> => {
    const res = await request<{
      data: { channelsSynced: number; totalChannels: number; newVideosCount: number };
    }>('/videos/sync-feed', {
      method: 'POST',
      body: JSON.stringify({ priorityChannelIds }),
    });
    return res.data;
  },
};

// Preferences & Notifications API
export const preferencesApi = {
  get: async (): Promise<NotificationPreference[]> => {
    const res = await request<{ data: NotificationPreference[] }>('/preferences');
    return res.data;
  },

  update: async (pref: { platform: string; enabled: boolean }): Promise<NotificationPreference> => {
    const res = await request<{ data: NotificationPreference }>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(pref),
    });
    return res.data;
  },

  registerDevice: async (deviceToken: string, platform: 'ios' | 'android'): Promise<void> => {
    await request('/devices', {
      method: 'POST',
      body: JSON.stringify({ deviceToken, platform }),
    });
  },
};

// Reddit Discussions & Sources API
export const redditApi = {
  getFeed: async (
    page = 1,
    limit = 20,
    opts: { subreddit?: string; filter?: string; search?: string } = {}
  ): Promise<{ posts: RedditPostItem[]; totalPages: number }> => {
    const params = new URLSearchParams({
      platform: 'REDDIT',
      page: String(page),
      limit: String(limit),
    });
    if (opts.subreddit) params.set('subreddit', opts.subreddit);
    if (opts.filter)    params.set('filter', opts.filter);
    if (opts.search)    params.set('search', opts.search);

    const res = await request<{ data: RedditPostItem[]; pagination: { totalPages: number } }>(
      `/feed?${params.toString()}`
    );
    return {
      posts: res.data,
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  listSources: async (): Promise<TrackedSource[]> => {
    const res = await request<{ data: TrackedSource[] }>('/sources/reddit');
    return res.data;
  },

  addSource: async (subreddit: string): Promise<TrackedSource> => {
    const res = await request<{ data: TrackedSource }>('/sources/reddit', {
      method: 'POST',
      body: JSON.stringify({ subreddit }),
    });
    return res.data;
  },

  toggleSource: async (id: string): Promise<TrackedSource> => {
    const res = await request<{ data: TrackedSource }>(`/sources/reddit/${id}/toggle`, {
      method: 'POST',
    });
    return res.data;
  },

  removeSource: async (id: string): Promise<void> => {
    await request(`/sources/reddit/${id}`, {
      method: 'DELETE',
    });
  },

  getPostSummary: async (postId: string): Promise<RedditSummary> => {
    const res = await request<{ data: RedditSummary }>(`/reddit/posts/${postId}/summary`);
    return res.data;
  },
};

// Universal Space API (TMDB Cinema & Open Library Books)
export const contentApi = {
  getFeed: async (
    space: SpaceType,
    page = 1,
    limit = 20,
    opts: { filter?: string; search?: string } = {}
  ): Promise<{ posts: ContentPostItem[]; totalPages: number }> => {
    const params = new URLSearchParams({
      space,
      page: String(page),
      limit: String(limit),
    });
    if (opts.filter) params.set('filter', opts.filter);
    if (opts.search) params.set('search', opts.search);

    const res = await request<{ data: ContentPostItem[]; pagination: { totalPages: number } }>(
      `/feed?${params.toString()}`
    );
    return {
      posts: res.data || [],
      totalPages: res.pagination?.totalPages || 1,
    };
  },

  getFilters: async (space: SpaceType): Promise<string[]> => {
    const res = await request<{ data: string[] }>(`/feed/filters?space=${space}`);
    return res.data || [];
  },
};



