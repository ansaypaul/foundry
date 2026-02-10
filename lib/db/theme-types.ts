// Types pour la configuration des modules de thème

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  border?: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface ModuleConfig {
  [key: string]: any;
}

export interface ThemeModule {
  type: string;
  enabled: boolean;
  config?: ModuleConfig;
}

export interface SidebarConfig {
  enabled: boolean;
  position?: 'left' | 'right';
  modules?: ThemeModule[];
}

export interface PageModulesConfig {
  layout: 'default' | 'centered' | 'with_sidebar' | 'full_width';
  modules: ThemeModule[];
  sidebar?: SidebarConfig;
}

export interface ThemeModulesConfig {
  homepage?: PageModulesConfig;
  post?: PageModulesConfig;
  category?: PageModulesConfig;
  tag?: PageModulesConfig;
}

export interface Theme {
  id: string;
  key: string;
  name: string;
  description?: string;
  layout_type: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
  modules_config?: ThemeModulesConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Types spécifiques pour différents modules

export interface HeroModuleConfig extends ModuleConfig {
  showTitle?: boolean;
  showTagline?: boolean;
  centered?: boolean;
  backgroundImage?: string;
}

export interface PostsGridModuleConfig extends ModuleConfig {
  columns?: number;
  showExcerpt?: boolean;
  showDate?: boolean;
  showCategories?: boolean;
  showImage?: boolean;
  limit?: number;
}

export interface PostsListModuleConfig extends ModuleConfig {
  showExcerpt?: boolean;
  showDate?: boolean;
  showImage?: boolean;
  style?: 'default' | 'minimal' | 'compact';
}

export interface RecentPostsModuleConfig extends ModuleConfig {
  limit?: number;
  showThumbnail?: boolean;
  showDate?: boolean;
}

export interface CategoriesModuleConfig extends ModuleConfig {
  showCount?: boolean;
  limit?: number;
}

export interface FeaturedPostModuleConfig extends ModuleConfig {
  showImage?: boolean;
  size?: 'small' | 'medium' | 'large';
}
