/**
 * Chrome extension API type definitions for TypeScript
 * These types are used to provide proper typing for Chrome extension API calls
 */

declare namespace chrome {
  /**
   * Chrome runtime API
   */
  export namespace runtime {
    export const id: string | undefined;
    export const lastError: { message: string } | undefined;
    
    /**
     * Get extension manifest
     */
    export function getManifest(): {
      version: string;
      name: string;
      permissions: string[];
      [key: string]: any;
    };
    
    /**
     * Get URL for extension resource
     */
    export function getURL(path: string): string;
    
    /**
     * Send message to background script
     */
    export function sendMessage<T = any>(
      message: any,
      callback?: (response: T) => void
    ): void;
    
    /**
     * Add message listener
     */
    export function onMessage(
      listener: (
        message: any,
        sender: any,
        sendResponse: (response?: any) => void
      ) => void | boolean
    ): void;
  }
  
  /**
   * Chrome tabs API
   */
  export namespace tabs {
    export interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active: boolean;
      favIconUrl?: string;
      status?: 'loading' | 'complete';
      windowId?: number;
    }
    
    /**
     * Query tabs
     */
    export function query(
      queryInfo: {
        active?: boolean;
        currentWindow?: boolean;
        [key: string]: any;
      },
      callback: (tabs: Tab[]) => void
    ): void;
    
    /**
     * Create new tab
     */
    export function create(
      createProperties: {
        url?: string;
        active?: boolean;
        [key: string]: any;
      },
      callback?: (tab: Tab) => void
    ): void;
  }
  
  /**
   * Chrome storage API
   */
  export namespace storage {
    export interface StorageArea {
      get(
        keys: string | string[] | { [key: string]: any } | null,
        callback: (items: { [key: string]: any }) => void
      ): void;
      
      set(
        items: { [key: string]: any },
        callback?: () => void
      ): void;
      
      remove(
        keys: string | string[],
        callback?: () => void
      ): void;
      
      clear(callback?: () => void): void;
    }
    
    export const local: StorageArea;
    export const sync: StorageArea;
  }
}