/* eslint-disable @typescript-eslint/no-explicit-any */
export { };

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: any;
      meshLineMaterial: any;
    }
  }
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initCodeClient: (options: {
            client_id: string;
            scope: string;
            ux_mode?: 'popup' | 'redirect';
            callback: (response: { code: string }) => void;
          }) => {
            requestCode: () => void;
          };
        };
      };
    };
  }
}

declare module '*.glb';
declare module '*.png';

declare module 'meshline' {
  export const MeshLineGeometry: any;
  export const MeshLineMaterial: any;
}