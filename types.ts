export interface MemeCaption {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily: string;
  width?: number;
  height?: number;
  isDragging?: boolean;
  isSelected?: boolean;
}

export interface Template {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
}

export type MemeStyle = 'classic' | 'modern' | 'vintage';

export interface CommunityPost {
  id: string;
  imageUrl: string; // Base64
  title: string; // Usually the caption
  likes: number;
  author: string;
  timestamp: number;
  userVote: 'up' | 'down' | null; // Track user's vote locally
}

export interface EditState {
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}
