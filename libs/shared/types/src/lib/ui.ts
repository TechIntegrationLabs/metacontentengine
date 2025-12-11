/**
 * UI Component Types
 */
import type { ReactNode } from 'react';

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  MAGIC_SETUP = 'MAGIC_SETUP',
  CONTENT_FORGE = 'CONTENT_FORGE',
  ARTICLES = 'ARTICLES',
  ARTICLE_EDITOR = 'ARTICLE_EDITOR',
  IDEAS = 'IDEAS',
  CLUSTERS = 'CLUSTERS',
  CONTRIBUTORS = 'CONTRIBUTORS',
  ANALYTICS = 'ANALYTICS',
  SETTINGS = 'SETTINGS',
  BRAND_PROFILE = 'BRAND_PROFILE',
  API_KEYS = 'API_KEYS',
  TEAM = 'TEAM',
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  view: AppView;
  badge?: string | number;
  children?: NavItem[];
}

export interface BrandProfile {
  name: string;
  url: string;
  industry: string;
  tone: number; // 1-10 (Formal to Casual)
  audience: string;
  keywords: string[];
  description: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  articlesThisWeek: number;
  articlesThisMonth: number;
  totalArticles: number;
  wordsGenerated: number;
  averageQualityScore: number;
  creditsRemaining: number;

  trends: {
    articles: number; // percentage change
    words: number;
    quality: number;
  };
}

export interface DashboardChartData {
  name: string;
  articles: number;
  score: number;
  words?: number;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  status: string;
  time: string;
  color: 'emerald' | 'amber' | 'indigo' | 'slate' | 'red';
  type: 'article' | 'generation' | 'publish' | 'error';
  articleId?: string;
}

// Table and list types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => ReactNode;
}

// Note: Use Pagination from api.ts for the full interface with hasNext/hasPrev
export interface UiPaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  key: string;
  value: string | string[] | boolean | number;
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
}

// Toast/notification types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
}

// Theme types
export interface ThemeConfig {
  mode: 'dark' | 'light';
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}
