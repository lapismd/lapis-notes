interface PlatformSpec {
  /**
   * The UI is in desktop mode.
   *
   * @public
   */
  isDesktop: boolean;
  /**
   * The UI is in mobile mode.
   *
   * @public
   */
  isMobile: boolean;
  /**
   * We're running the electron-based desktop app.
   *
   * @public
   */
  isDesktopApp: boolean;
  /**
   * We're running the capacitor-js mobile app.
   *
   * @public
   */
  isMobileApp: boolean;
  /**
   * We're running the iOS app.
   *
   * @public
   */
  isIosApp: boolean;
  /**
   * We're running the Android app.
   *
   * @public
   */
  isAndroidApp: boolean;
  /**
   * We're in a mobile app that has very limited screen space.
   *
   * @public
   */
  isPhone: boolean;
  /**
   * We're in a mobile app that has sufficiently large screen space.
   *
   * @public
   */
  isTablet: boolean;
  /**
   * We're on a macOS device, or a device that pretends to be one (like iPhones
   * and iPads). Typically used to detect whether to use command-based hotkeys
   * vs ctrl-based hotkeys.
   *
   * @public
   */
  isMacOS: boolean;
  /**
   * We're on a Windows device.
   *
   * @public
   */
  isWin: boolean;
  /**
   * We're on a Linux device.
   *
   * @public
   */
  isLinux: boolean;
  /**
   * We're running in Safari. Typically used to provide workarounds for Safari
   * bugs.
   *
   * @public
   */
  isSafari: boolean;
  /**
   * The path prefix for resolving local files on this platform. This returns:
   *
   * - `file:///` on mobile
   * - `app://random-id/` on desktop (Replaces the old format of `app://local/`)
   *
   * @public
   */
  resourcePathPrefix: string;
}

export const Platform = {
  /**
   * The UI is in desktop mode.
   *
   * @public
   */
  isDesktop: true,
  /**
   * The UI is in mobile mode.
   *
   * @public
   */
  isMobile: false,
  /**
   * We're running the electron-based desktop app.
   *
   * @public
   */
  isDesktopApp: true,
  /**
   * We're running the capacitor-js mobile app.
   *
   * @public
   */
  isMobileApp: false,
  /**
   * We're running the iOS app.
   *
   * @public
   */
  isIosApp: false,
  /**
   * We're running the Android app.
   *
   * @public
   */
  isAndroidApp: false,
  /**
   * We're in a mobile app that has very limited screen space.
   *
   * @public
   */
  isPhone: false,
  /**
   * We're in a mobile app that has sufficiently large screen space.
   *
   * @public
   */
  isTablet: false,
  /**
   * We're on a macOS device, or a device that pretends to be one (like iPhones
   * and iPads). Typically used to detect whether to use command-based hotkeys
   * vs ctrl-based hotkeys.
   *
   * @public
   */
  isMacOS: true,
  /**
   * We're on a Windows device.
   *
   * @public
   */
  isWin: false,
  /**
   * We're on a Linux device.
   *
   * @public
   */
  isLinux: false,
  /**
   * We're running in Safari. Typically used to provide workarounds for Safari
   * bugs.
   *
   * @public
   */
  isSafari: false,
  /**
   * The path prefix for resolving local files on this platform. This returns:
   *
   * - `file:///` on mobile
   * - `app://random-id/` on desktop (Replaces the old format of `app://local/`)
   *
   * @public
   */
  resourcePathPrefix: "/",
};
