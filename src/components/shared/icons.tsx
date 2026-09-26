import { createIcon, Svg } from '@gluestack-ui/core/icon/creator';
import { Circle, Path, Rect } from 'react-native-svg';

/*
 * App icons recreated from the FanSuite Figma (Messages Creator /Mobile/), 24×24 stroke icons
 * built exactly like gluestack's own icons: render them through `<Icon as={…} className="text-…" />`.
 */

const stroke = { strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const AnalyticsIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  path: (
    <>
      <Rect x="3" y="3" width="18" height="18" rx="5" {...stroke} />
      <Path d="M7.5 15l3-3 2.5 2 3.5-4.5" {...stroke} />
    </>
  ),
});

export const WalletIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  path: (
    <>
      <Path
        d="M19 7V5.5A1.5 1.5 0 0017.5 4H6a3 3 0 00-3 3v10a3 3 0 003 3h13a2 2 0 002-2v-9a2 2 0 00-2-2H6"
        {...stroke}
      />
      <Circle cx="16.5" cy="13.5" r="1.25" {...stroke} />
    </>
  ),
});

export const GridIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  path: (
    <>
      <Circle cx="7" cy="7" r="2.5" {...stroke} />
      <Circle cx="17" cy="7" r="2.5" {...stroke} />
      <Circle cx="7" cy="17" r="2.5" {...stroke} />
      <Circle cx="17" cy="17" r="2.5" {...stroke} />
    </>
  ),
});

/** Default sort (newest → oldest). */
export const SortDescendingIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  // Single paths must sit in a fragment: gluestack only forwards the stroke color to fragment children.
  path: (
    <>
      <Path d="M4 7h16M7 12h10M10 17h4" {...stroke} />
    </>
  ),
});

/** Reversed sort (oldest → newest): triangle with one corner up. */
export const SortAscendingIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  // Single paths must sit in a fragment: gluestack only forwards the stroke color to fragment children.
  path: (
    <>
      <Path d="M12 5l8 14H4z" fill="none" {...stroke} />
    </>
  ),
});

export const GiftIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  path: (
    <>
      <Rect x="3" y="8" width="18" height="4" rx="1" {...stroke} />
      <Path d="M19 12v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8M12 8v13" {...stroke} />
      <Path d="M12 8S10.5 3 8 3a2.5 2.5 0 000 5M12 8s1.5-5 4-5a2.5 2.5 0 010 5" {...stroke} />
    </>
  ),
});

export const SendIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  // Single paths must sit in a fragment: gluestack only forwards the stroke color to fragment children.
  path: (
    <>
      <Path d="M21 3L10 14M21 3l-6.5 18-4.5-7-7-4.5z" {...stroke} />
    </>
  ),
});

export const MapPinIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  path: (
    <>
      <Path d="M19 10c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 0114 0z" {...stroke} />
      <Circle cx="12" cy="10" r="2.5" {...stroke} />
    </>
  ),
});

export const SparklesIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  // Single paths must sit in a fragment: gluestack only forwards the stroke color to fragment children.
  path: (
    <>
      <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" {...stroke} />
    </>
  ),
});

export const FanSuiteLogoIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  // Single paths must sit in a fragment: gluestack only forwards the stroke color to fragment children.
  path: (
    <>
      <Path d="M7 3h10v4h-6v3h5v4h-5v7H7z" {...stroke} />
    </>
  ),
});

export const KeyboardIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  path: (
    <>
      <Rect x="2" y="6" width="20" height="12" rx="2" {...stroke} />
      <Path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" {...stroke} />
    </>
  ),
});

export const PlusCircleIcon = createIcon({
  Root: Svg,
  viewBox: '0 0 24 24',
  path: (
    <>
      <Circle cx="12" cy="12" r="9" {...stroke} />
      <Path d="M12 8v8M8 12h8" {...stroke} />
    </>
  ),
});
