/// <reference types="vite/client" />

declare module "*.yml?raw" {
  const content: string;
  export default content;
}

declare module "*.typstpkg?url" {
  const href: string;
  export default href;
}

declare module "*.otf?url" {
  const href: string;
  export default href;
}
