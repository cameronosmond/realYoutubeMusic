// src/types/google.d.ts

export {}; // ensure this file is treated as a module

declare global {
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
