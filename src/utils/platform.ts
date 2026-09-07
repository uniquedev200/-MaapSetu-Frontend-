import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities.
 * 
 * Use these to conditionally render mobile-specific UI
 * (e.g. native back buttons, camera triggers) without
 * breaking the web version.
 * 
 * On the web, Capacitor.isNativePlatform() returns false
 * and adds zero overhead — it's a simple boolean check.
 */

/** True when running inside the Capacitor native shell (Android/iOS) */
export const isNative = Capacitor.isNativePlatform();

/** True when running in a standard browser */
export const isWeb = !isNative;

/** Returns 'web' | 'android' | 'ios' */
export const platform = Capacitor.getPlatform();
