import { Platform } from 'react-native';

/**
 * Top padding for screens presented with `presentation: 'modal'`. On iOS that is a page sheet
 * that already sits below the status bar; on Android it is a full-screen page, so it needs the
 * status-bar inset. Chosen in JS because UniWind's `android:` variant also matches on iOS here.
 */
export const MODAL_TOP_CLASS = Platform.OS === 'android' ? 'pt-safe-offset-5' : 'pt-5';

/** Same for full-screen modals, which need the inset on both platforms. */
export const FULLSCREEN_TOP_CLASS = 'pt-safe';
