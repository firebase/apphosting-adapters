export type WpPostType = 'posts' | 'pages';

export type GeneratedContent = {
  title: string;
  body: string;
  tags: string[];
  postId?: string;
  postType?: WpPostType;
};

export type WpPost = {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
};

export type WpTag = {
    id: number;
    name: string;
};

export type WpConnection = {
    id?: string;
    wpUrl: string;
    wpUsername: string;
    lastUsed: any; // Firestore Timestamp
};

export type HistoryEventDetails = {
  postUrl?: string;
  postTitle?: string;
  wpUrl?: string;
  postType?: WpPostType;
  wpUsername?: string;
  postId?: number;
};

export type HistoryEvent = {
  id?: string;
  type: 'creation' | 'edition' | 'connection';
  timestamp: any; // Firestore Timestamp
  details: HistoryEventDetails;
};
