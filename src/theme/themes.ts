export type ThemeId = 'veriel' | 'dusk' | 'koala' | 'industrial' | 'claude' | 'eink';
export type Mode = 'light' | 'dark';

export interface Palette {
  paper: string;
  surface: string;
  surfaceHi: string;
  line: string;
  thin: string;
  thick: string;
  ink: string;
  muted: string;
  fur: string;
  accent: string;
  soft: string;
  onAccent: string;
  alarm: string;
}

export type DisplayWeight = 300 | 400 | 500;
export type BodyWeight = 400 | 500 | 600;

export interface ThemeDef {
  id: ThemeId;
  name: string;
  /** Font family names as registered by @expo-google-fonts (one per weight). */
  display: Record<DisplayWeight, string>;
  body: Record<BodyWeight, string>;
  /** Default weight for display text (headings, times, digits). */
  displayWeight: DisplayWeight;
  caption?: string;
  heroSize?: number;
  heroWeight?: DisplayWeight;
  radius: number;
  radiusSmall: number;
  /** Width of the 3×3 box lines on the sudoku board. */
  boxLineWidth: number;
  /** Outlined (true) or filled (false) number keys. */
  outlinedKeys: boolean;
  swatches: string[];
  light: Palette;
  dark: Palette;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  veriel: {
    id: 'veriel',
    name: 'Veriel',
    display: { 300: 'BricolageGrotesque_400Regular', 400: 'BricolageGrotesque_700Bold', 500: 'BricolageGrotesque_800ExtraBold' },
    body: { 400: 'BricolageGrotesque_400Regular', 500: 'BricolageGrotesque_500Medium', 600: 'BricolageGrotesque_600SemiBold' },
    displayWeight: 400,
    caption: 'IBMPlexMono_500Medium',
    heroSize: 64,
    heroWeight: 500,
    radius: 12,
    radiusSmall: 6,
    boxLineWidth: 1,
    outlinedKeys: false,
    swatches: ['#0a0c0b', '#121513', '#272c28', '#949b95', '#e9ede8', '#5bd684'],
    dark: { paper: '#0a0c0b', surface: '#121513', surfaceHi: '#e9ede8', line: '#272c28', thin: '#1a1e1b', thick: '#434a45', ink: '#e9ede8', muted: '#949b95', fur: '#434a45', accent: '#5bd684', soft: '#10271a', onAccent: '#07130c', alarm: '#fbbf24' },
    light: { paper: '#f1f3ee', surface: '#ffffff', surfaceHi: '#ffffff', line: '#d0d6cd', thin: '#e4e8e1', thick: '#9fa89f', ink: '#101311', muted: '#566058', fur: '#9fa89f', accent: '#137a3f', soft: '#dff5e6', onAccent: '#ffffff', alarm: '#a16207' },
  },
  dusk: {
    id: 'dusk',
    name: 'Dusk',
    display: { 300: 'Fraunces_300Light', 400: 'Fraunces_400Regular', 500: 'Fraunces_500Medium' },
    body: { 400: 'DMSans_400Regular', 500: 'DMSans_500Medium', 600: 'DMSans_600SemiBold' },
    displayWeight: 400,
    radius: 14,
    radiusSmall: 8,
    boxLineWidth: 1,
    outlinedKeys: false,
    swatches: ['#1D1A39', '#451952', '#662549', '#AE445A', '#F39F5A', '#E8BCB9'],
    dark: { paper: '#1D1A39', surface: '#241F47', surfaceHi: '#F3E4E2', line: '#3B2F5E', thin: '#2D2752', thick: '#5A3D6E', ink: '#F3E4E2', muted: '#C9A9B0', fur: '#662549', accent: '#F39F5A', soft: '#3A1D4E', onAccent: '#1D1A39', alarm: '#F07A8C' },
    light: { paper: '#F7EDEB', surface: '#FDF7F5', surfaceHi: '#FFFFFF', line: '#E8CFCB', thin: '#F0E0DD', thick: '#C9A3A6', ink: '#1D1A39', muted: '#662549', fur: '#D7B3B1', accent: '#AE445A', soft: '#F3DAD6', onAccent: '#FDF7F5', alarm: '#9A3412' },
  },
  koala: {
    id: 'koala',
    name: 'Koala',
    display: { 300: 'Newsreader_300Light', 400: 'Newsreader_400Regular', 500: 'Newsreader_500Medium' },
    body: { 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold' },
    displayWeight: 400,
    radius: 12,
    radiusSmall: 6,
    boxLineWidth: 1,
    outlinedKeys: false,
    swatches: ['#131312', '#1c1c1a', '#2f5d4a', '#8fbfa5', '#f4f1ea', '#a8361f'],
    dark: { paper: '#131312', surface: '#1c1c1a', surfaceHi: '#ece8de', line: '#33322e', thin: '#2a2926', thick: '#57544e', ink: '#ece8de', muted: '#a39e93', fur: '#57544e', accent: '#8fbfa5', soft: '#1d2a23', onAccent: '#131312', alarm: '#e8805f' },
    light: { paper: '#f4f1ea', surface: '#fbfaf6', surfaceHi: '#ffffff', line: '#ddd8cc', thin: '#e9e5dc', thick: '#a29d93', ink: '#1b1a17', muted: '#5f5a51', fur: '#a29d93', accent: '#2f5d4a', soft: '#e3ebe4', onAccent: '#fbfaf6', alarm: '#a8361f' },
  },
  industrial: {
    id: 'industrial',
    name: 'Industrial',
    display: { 300: 'IBMPlexMono_300Light', 400: 'IBMPlexMono_400Regular', 500: 'IBMPlexMono_500Medium' },
    body: { 400: 'IBMPlexSans_400Regular', 500: 'IBMPlexSans_500Medium', 600: 'IBMPlexSans_600SemiBold' },
    displayWeight: 500,
    radius: 2,
    radiusSmall: 2,
    boxLineWidth: 2,
    outlinedKeys: true,
    swatches: ['#121314', '#34383C', '#6B7177', '#B9BDC1', '#E4E5E6', '#FF6A13'],
    dark: { paper: '#121314', surface: '#1A1C1E', surfaceHi: '#E6E7E8', line: '#34383C', thin: '#26292C', thick: '#6B7177', ink: '#E6E7E8', muted: '#9BA1A6', fur: '#4A4F54', accent: '#FF6A13', soft: '#2B1D14', onAccent: '#121314', alarm: '#FFD23F' },
    light: { paper: '#E4E5E6', surface: '#F2F2F2', surfaceHi: '#FFFFFF', line: '#B9BDC1', thin: '#D5D8DA', thick: '#2B2E31', ink: '#111213', muted: '#474C51', fur: '#9AA0A6', accent: '#C2410C', soft: '#F3DCCD', onAccent: '#FFFFFF', alarm: '#B91C1C' },
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    display: { 300: 'SourceSerif4_300Light', 400: 'SourceSerif4_400Regular', 500: 'SourceSerif4_500Medium' },
    body: { 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold' },
    displayWeight: 400,
    radius: 10,
    radiusSmall: 6,
    boxLineWidth: 1,
    outlinedKeys: false,
    swatches: ['#141413', '#3D3D3A', '#B0AEA5', '#E8E6DC', '#FAF9F5', '#D97757'],
    dark: { paper: '#141413', surface: '#1F1E1D', surfaceHi: '#FAF9F5', line: '#3D3D3A', thin: '#2A2927', thick: '#5E5D59', ink: '#FAF9F5', muted: '#B0AEA5', fur: '#4A4945', accent: '#D97757', soft: '#33241E', onAccent: '#141413', alarm: '#F28B82' },
    light: { paper: '#FAF9F5', surface: '#FFFFFF', surfaceHi: '#FFFFFF', line: '#E8E6DC', thin: '#F0EEE6', thick: '#B0AEA5', ink: '#141413', muted: '#5E5D59', fur: '#C2C0B6', accent: '#C15F3C', soft: '#F6E6DD', onAccent: '#FFFFFF', alarm: '#B3261E' },
  },
  eink: {
    id: 'eink',
    name: 'E-ink',
    display: { 300: 'Literata_300Light', 400: 'Literata_400Regular', 500: 'Literata_500Medium' },
    body: { 400: 'Literata_400Regular', 500: 'Literata_500Medium', 600: 'Literata_600SemiBold' },
    displayWeight: 400,
    radius: 0,
    radiusSmall: 0,
    boxLineWidth: 1.5,
    outlinedKeys: true,
    swatches: ['#111111', '#3D3D3B', '#8E8E8A', '#C9C8C3', '#E2E1DC', '#F2F1EC'],
    dark: { paper: '#0E0E0E', surface: '#0E0E0E', surfaceHi: '#E6E5E0', line: '#6A6A68', thin: '#333333', thick: '#E6E5E0', ink: '#E6E5E0', muted: '#B8B7B2', fur: '#5A5A58', accent: '#E6E5E0', soft: '#2A2A2A', onAccent: '#0E0E0E', alarm: '#E6E5E0' },
    light: { paper: '#F2F1EC', surface: '#F2F1EC', surfaceHi: '#FFFFFF', line: '#9A9A96', thin: '#C9C8C3', thick: '#1A1A1A', ink: '#111111', muted: '#3D3D3B', fur: '#8E8E8A', accent: '#111111', soft: '#DAD9D4', onAccent: '#F2F1EC', alarm: '#111111' },
  },
};

export const THEME_ORDER: ThemeId[] = ['veriel', 'dusk', 'koala', 'industrial', 'claude', 'eink'];

/** Monospace face used for the "Excuses excuses..." link regardless of theme. */
export const MONO_FONT = 'IBMPlexMono_400Regular';

export interface Theme extends Palette {
  def: ThemeDef;
  mode: Mode;
}

export function resolveTheme(id: ThemeId, mode: Mode): Theme {
  const def = THEMES[id];
  return { ...def[mode], def, mode };
}
