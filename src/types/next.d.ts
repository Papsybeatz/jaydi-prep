declare module 'next';
declare module 'next/font/google';
declare module 'next/dist/lib/metadata/types/metadata-interface.js' {
  export type Metadata = any;
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}
declare module 'next/dist/build/segment-config/app/app-segment-config.js' {
  export type AppConfig = any;
  export type Config = any;
  export type InstantConfigForTypeCheckInternal = any;
  export type Prefetch = any;
  export type EnsureStatic = any;
}
declare module 'next/types.js' {
  export type NextConfig = any;
  export type PageConfig = any;
  export type LayoutConfig = any;
  export type NextApiHandler<T = any> = (req: any, res: any) => any;
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}