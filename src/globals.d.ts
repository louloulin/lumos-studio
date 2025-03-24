import '@/shared/types'

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare interface Window {
  tauriAPI: any;
  __clearAllCache: () => Promise<void>;
  __clearLocalStorageCache: () => Promise<void>;
  __clearLocalForageCache: () => Promise<void>;
}

// CSS变量声明
interface CSSVariables {
  '--vh'?: string;
}

declare module 'react' {
  interface CSSProperties extends CSSVariables {}
}