module.exports = {
  appId: "notes.lapis.desktop",
  productName: "Lapis Notes",
  artifactName: "Lapis-Notes-${version}-${os}-${arch}.${ext}",
  executableName: "lapis-notes",
  directories: {
    output: "release",
    buildResources: "build",
  },
  files: ["dist/**/*", "dist-electron/**/*", "package.json"],
  extraMetadata: {
    main: "dist-electron/main.js",
  },
  protocols: [
    {
      name: "Lapis Notes",
      schemes: ["lapis", "lapis-notes"],
    },
  ],
  generateUpdatesFilesForAllChannels: true,
  mac: {
    category: "public.app-category.productivity",
    target: ["dmg", "zip"],
    icon: "build/icon.icns",
    hardenedRuntime: true,
    entitlements: "build/entitlements.mac.plist",
    entitlementsInherit: "build/entitlements.mac.plist",
  },
  linux: {
    category: "Utility",
    target: ["tar.gz", "AppImage"],
    icon: "build/icon.png",
  },
  afterSign: "scripts/notarize.cjs",
};
