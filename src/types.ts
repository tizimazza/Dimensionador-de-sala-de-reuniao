export type RoomSize = 'small' | 'medium' | 'large' | 'very_large';

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: 'camera' | 'speaker' | 'speakerphone' | 'docking_station' | 'cable_hdmi' | 'cable_audio' | 'cable_usb' | 'wireless_system';
  description: string;
  recommendedFor: RoomSize[];
}

export interface ConfigurableRules {
  version: string;
  lastUpdated: string;
  catalog: ProductOption[];
  adminEmail: string;
}

export interface WPSettings {
  hubspotKey: string;
  copyEmail: string;
  productSkus: Record<string, string>;
  colors?: { selection: string; action: string; };
}

export interface ProjectInputs {
  userEmail?: string;
  roomWidthMeters: number;
  roomLengthMeters: number;
  tableWidthMeters: number;
  tableLengthMeters: number;
  tableAttachedToWall: boolean;
  peopleCount: number;
  displayCount: number;
  wirelessSystem: boolean;
  roomSize: RoomSize; // Derived from width x length usually
}

export interface BomItem {
  id: string;
  category: string;
  name: string;
  sku: string;
  brand: string;
  quantity: number;
  unit: string;
  notes: string;
}

export interface DiagramData {
  roomW: number;
  roomL: number;
  tableW: number;
  tableL: number;
  tableAttachedToWall: boolean;
  people: number;
  displays: number;
  wireless: boolean;
  audio: string;
  bm35Count: number;
}

export interface SizingResult {
  roomTypeLabel: string;
  description: string;
  bom: BomItem[];
  bestPractices: string[];
  diagramData?: DiagramData;
}


export interface BrandThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  headerBgColor: string;
  accentColor: string;
  themeName: string;
}

