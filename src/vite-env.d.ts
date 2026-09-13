/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Explicitly handle standard CSS imports
declare module '*.css' {
  const content: string;
  export default content;
}

// Handle CSS Modules (e.g., styles.module.css)
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Handle SCSS Modules if you decide to use Sass later
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Handle image asset imports so TS knows they resolve to string URLs
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

// Handle SVG files as both standard URLs and React components (if using vite-plugin-svgr)
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  const src: string;
  export default src;
}