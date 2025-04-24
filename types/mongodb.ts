export interface FacebookPost {
  url: string;
  author: string;
  text: string;
  images: string[];
  videos: string[];
  timestamp: string;
  processed_at: string;
  tags: string[];
  media_counts: {
    images: number;
    videos: number;
  }
}

export interface ActivismPost extends FacebookPost {
  activism_categories: string[];
}

export interface ActivismInitiative {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  categories: string;
  author: string;
  imageUrl: string;
  videoUrl?: string;
  url: string;
  text?: string;
  images?: string[];
  videos?: string[];
  activism_categories?: string[];
}

export interface ActivismStat {
  id: number;
  label: string;
  value: string;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface ActivismApiResponse {
  success: boolean;
  initiatives?: ActivismInitiative[];
  stats?: ActivismStat[];
  categoryStats?: CategoryStat[];
  error?: string;
} 