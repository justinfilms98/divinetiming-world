export type LabelPublishStatus = 'draft' | 'published' | 'archived';

export interface LabelSettings {
  id: string;
  public_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LabelArtist {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  status: LabelPublishStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LabelRelease {
  id: string;
  artist_id: string | null;
  title: string;
  slug: string;
  release_date: string | null;
  status: LabelPublishStatus;
  display_order: number;
  created_at: string;
  updated_at: string;
}
