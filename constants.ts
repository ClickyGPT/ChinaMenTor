import { Template, CommunityPost } from './types';

export const FONT_OPTIONS = [
  'Impact',
  'Arial',
  'Verdana',
  'Comic Sans MS',
  'Courier New',
];

export const COLOR_OPTIONS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
];

export const MEME_STYLES = {
  classic: {
    name: 'Classic',
    font: 'Impact',
    color: '#FFFFFF',
    stroke: '#000000',
    strokeWidth: 2,
    filter: 'none',
    description: 'Traditional top/bottom impact text',
  },
  modern: {
    name: 'Modern',
    font: 'Arial',
    color: '#FFFFFF',
    stroke: 'none',
    strokeWidth: 0,
    filter: 'contrast(1.1)',
    description: 'Clean sans-serif look',
  },
  vintage: {
    name: 'Vintage',
    font: 'Courier New',
    color: '#FDF5E6', // Old lace
    stroke: '#3E2723', // Dark brown
    strokeWidth: 1,
    filter: 'sepia(0.8) contrast(1.2)',
    description: 'Retro aesthetic',
  },
};

export const CHINA_MENTOR_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABDgAAASwCAYAAAAnYAfEAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGgAAP+6SURBVHhe7J0HoFzVde8/s/vObLIZC4JsCAiIBgqiZkTEvqh4xGOPPbb3XnvssePxeB4/f49H4/E8Hq/xeB577LHHHntUVFFUREAUBRNEGwgCsm02u5nd/Z95p/vObJIZCAbJ2O4n5546deqcOnd3p86dOnV13n//+3u8Xi8AYIzv+z93/fXXA/v+/v79+/e/37Rp0y/XrFlzXbdu3adbt249/v3vf/+T69evv3TixIm/Xb58+fdbt279/Isvvvj/DzzwwP+88847n7z99tv//vrrr//l22+//SIAAACAGWNjY388efLk52+//fZ/v/322//yzTff/M/333//r1u3br359ddf//eZM2f+tnnz5j8eP37825/+9KcDAEwCAAAAzE4//fQ/br/99m+//vrr//7iiy/+9bvvvvvP58+f/9viiy/+6aWXXvrlxx9//D8//PDD/wCgEgAAAGB2//jHP7711ltvfe+DDz74xx/+8IcDALwBAAAAzM6fP//pBx988Msvv/zyJ//85z/fePPNN//z9ddf/8vSpUu/eOONN34CAPwCAAAAzPL555//9ttvv/23d+/eT548efJv165dv/nkk09+99133w0A8AsAAABgluXLl3/x2muv/fADDzwwAADDgAEAAGCW5s2b95vPP//8y5/+9KcDAHyRAAAAMEvx4sVfPPjgg389efLknw4ceH9+3QUAAAAgghxY1s58Xvbi1/24uBMAwD2RAAAAMFvmzJlz/Pbbbz/5xhtvDAAAyLw+PwAAAEALL7zwP7///e9/uXbt2s9/8skn37z33nu/vPzyyy9+9dVXDwAAfIIAAAAsrLW1tXP37t13r1q16o/33nvv/3vvvfe/e/TRR78+cODAZwAAfIIAAAAsfOedd/7+8ssv//aZZ575xx133PH/Xbly5a979+79AwD8AgAAABYWLlz49TvvvPMf77vvvj8AuL/++usDANwEAACAV1133XX/+c9//u3dd9/95zvvvPM/AwB8kQAAAOCVV1555QceeODpRx999M8777zzTwcAvEcAAABe1qxZs/6zn/3s3//9738/+/TTT//zySef/GcAgDciAQAAeFWzZs363XfffX/06NEjABz4BAAAwD1+5Stf+X/44YcfPvPMMz8dOPA+PXgGAACcCQAAwD3W1tZOt95663tPPvnkn15++eU/3bNnz59ffvnlm5/85Cd/AwD2TQIAAHAX/O9//3tXV1f/+4477vj/7du3/6o3bWtr+wcAzCYAAAC31dbW9r9//etf//zRRx/985///OfvDAA4kQAAAHAfX3zxhZdeemn25JNP/ueZZ5758wAAZg8SAADw8o4dO/7PfvazP3z77bef3Llz568HAPiIAAAAeLldd911//Of//zbr7766p8OAHjPCQAAeLmrq+s/fOADH/zm2muv/esBAE5hAgAAXn7ppZc+vfTSS//02muv/csBAM9JAgAAXt6yZctf9+/f/5cDAJ7bBAAA7rC2traurq7+11133fX/Xbhw4a/Pnj37NwAwf5AAAOAO2rRp0/7KK698euzYsT9+5Stf+c9VV131jwMAXuIEAADcoHHjxn3x6quvfvLNN9/85x/+8IcvAMC9SgIAgLu0d+/eT/7xj3/c+fDDD386AMD7nAQAAG61vr7+3//+97//f2tr61cA8J4SAADwiiZNmvQfeOCBpz/88MN/uvHGG/+6Z8+ePx0A8B4jAQCAVyVLlnwBwPscAQCAVyRLlnzx+OOP/+1VV131TwUAeM8SAAC418qVK//65JNP/u0ZZ5zxx2efffbTwQGAdwQBAAC3+Pjjj//l17/+9Z8+9alPfep//etfTwA4zQkAAHBr3/3ud/+jvb39f/7yl79s7evr+9UDAJ5jBAAA3Opf/vKX/3/++ee//eijj/75rbfeeu8PDwA4SRAAALg';

// FIX: Add and export INITIAL_COMMUNITY_POSTS to resolve import error in App.tsx
export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: '1',
    imageUrl: CHINA_MENTOR_IMAGE,
    title: 'That feeling when your code runs first try',
    likes: 1024,
    author: 'CodeWizard',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    userVote: null,
  },
  {
    id: '2',
    imageUrl: CHINA_MENTOR_IMAGE,
    title: 'Me explaining to the junior dev...',
    likes: 512,
    author: 'SeniorStruggles',
    timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    userVote: 'up',
  },
  {
    id: '3',
    imageUrl: CHINA_MENTOR_IMAGE,
    title: 'One does not simply walk into Mordor',
    likes: 2048,
    author: 'LOTR_Fan',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    userVote: null,
  }
];
