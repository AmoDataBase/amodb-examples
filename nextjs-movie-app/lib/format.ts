import type { MediaItem } from './types';

export const titleOf = (item: MediaItem) => item.title ?? item.name ?? 'Untitled';

export const yearOf = (date?: string) => date?.slice(0, 4) || 'n/a';

export const isId = (value: string) => /^\d+$/.test(value);
