/**
 * Fake implementation of {@link chrome.storage.StorageArea}, this implementation is backed by a
 * Map
 */
export class FakeStorageArea implements chrome.storage.StorageArea {
  private readonly data = new Map<string, unknown>();

  getBytesInUse(callback: (bytesInUse: number) => void): void;
  getBytesInUse(keys?: string | string[] | null): Promise<number>;
  getBytesInUse(
    keys: string | string[] | null,
    callback: (bytesInUse: number) => void,
  ): void;
  getBytesInUse(): Promise<number> | void {
    throw new Error('Method not implemented.');
  }

  clear(): Promise<void>;
  clear(callback: () => void): void;
  clear(callback?: () => void): Promise<void> | void {
    this.data.clear();
    if (callback) {
      callback();
      return;
    }
    return Promise.resolve();
  }

  set(items: Record<string, unknown>): Promise<void>;
  set(items: Record<string, unknown>, callback: () => void): void;
  set(
    items: Record<string, unknown>,
    callback?: () => void,
  ): Promise<void> | void {
    for (const [key, value] of Object.entries(items)) {
      this.data.set(key, value);
    }
    if (callback) {
      callback();
      return;
    }
    return Promise.resolve();
  }

  remove(keys: string | string[]): Promise<void>;
  remove(keys: string | string[], callback: () => void): void;
  remove(keys: string | string[], callback?: () => void): Promise<void> | void {
    if (Array.isArray(keys)) {
      for (const key of keys) {
        this.data.delete(key);
      }
    } else {
      this.data.delete(keys);
    }
    if (callback) {
      callback();
      return;
    }
    return Promise.resolve();
  }

  get(callback: (items: Record<string, unknown>) => void): void;
  get(
    keys?: string | string[] | Record<string, unknown> | null,
  ): Promise<Record<string, unknown>>;
  get(
    keys: string | string[] | Record<string, unknown> | null,
    callback: (items: Record<string, unknown>) => void,
  ): void;
  get(
    callbackOrKeys?:
      | ((items: Record<string, unknown>) => void)
      | string
      | string[]
      | Record<string, unknown>
      | null,
    callback?: (items: Record<string, unknown>) => void,
  ): Promise<Record<string, unknown>> | void {
    if (callbackOrKeys === undefined) {
      return Promise.resolve({});
    }
    if (typeof callbackOrKeys === 'function') {
      callbackOrKeys(Object.fromEntries(this.data));
      return;
    }
    if (callback) {
      if (callbackOrKeys === null) {
        callback(Object.fromEntries(this.data));
        return;
      }

      const result: Record<string, unknown> = {};

      if (typeof callbackOrKeys === 'string') {
        if (this.data.has(callbackOrKeys)) {
          result[callbackOrKeys] = this.data.get(callbackOrKeys);
        }
      } else if (Array.isArray(callbackOrKeys)) {
        for (const key of callbackOrKeys) {
          if (this.data.has(key)) {
            result[key] = this.data.get(key);
          }
        }
      } else {
        for (const [key, defaultValue] of Object.entries(callbackOrKeys)) {
          if (this.data.has(key)) {
            result[key] = this.data.get(key);
          } else {
            result[key] = defaultValue;
          }
        }
      }
      callback(result);
      return;
    }
    if (callbackOrKeys === null) {
      return Promise.resolve(Object.fromEntries(this.data));
    }

    const result: Record<string, unknown> = {};

    if (typeof callbackOrKeys === 'string') {
      if (this.data.has(callbackOrKeys)) {
        result[callbackOrKeys] = this.data.get(callbackOrKeys);
      }
    } else if (Array.isArray(callbackOrKeys)) {
      for (const key of callbackOrKeys) {
        if (this.data.has(key)) {
          result[key] = this.data.get(key);
        }
      }
    } else {
      for (const [key, defaultValue] of Object.entries(callbackOrKeys)) {
        if (this.data.has(key)) {
          result[key] = this.data.get(key);
        } else {
          result[key] = defaultValue;
        }
      }
    }
    return Promise.resolve(result);
  }

  /**
   * Sets the desired access level for the storage area. The default will be only trusted contexts.
   * @param accessOptions An object containing an accessLevel key which contains the access level of the storage area.
   * @return A void Promise.
   * @since Chrome 102
   */
  setAccessLevel(accessOptions: {
    accessLevel: chrome.storage.AccessLevel;
  }): Promise<void>;
  /**
   * Sets the desired access level for the storage area. The default will be only trusted contexts.
   * @param accessOptions An object containing an accessLevel key which contains the access level of the storage area.
   * @param callback Optional.
   * @since Chrome 102
   */
  setAccessLevel(
    accessOptions: {accessLevel: chrome.storage.AccessLevel},
    callback: () => void,
  ): void;

  setAccessLevel(): Promise<void> | void {
    throw new Error('Method not implemented.');
  }

  get onChanged(): chrome.storage.StorageAreaChangedEvent {
    throw new Error('Property not implemented.');
  }
}

class FakeSyncStorageArea extends FakeStorageArea {
  MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE = Number.POSITIVE_INFINITY;
  QUOTA_BYTES = Number.POSITIVE_INFINITY;
  QUOTA_BYTES_PER_ITEM = Number.POSITIVE_INFINITY;
  MAX_ITEMS = Number.POSITIVE_INFINITY;
  MAX_WRITE_OPERATIONS_PER_HOUR = Number.POSITIVE_INFINITY;
  MAX_WRITE_OPERATIONS_PER_MINUTE = Number.POSITIVE_INFINITY;
}

class FakeLocalStorageArea extends FakeStorageArea {
  QUOTA_BYTES = Number.POSITIVE_INFINITY;
}

class FakeSessionStorageArea extends FakeStorageArea {
  QUOTA_BYTES = Number.POSITIVE_INFINITY;
}

enum FakeAccessLevel {
  TRUSTED_AND_UNTRUSTED_CONTEXTS = 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
  TRUSTED_CONTEXTS = 'TRUSTED_CONTEXTS',
}

class FakeStorage {
  readonly sync = new FakeSyncStorageArea();
  readonly local = new FakeLocalStorageArea();
  readonly managed = new FakeStorageArea();
  readonly session = new FakeSessionStorageArea();
  readonly AccessLevel = FakeAccessLevel;

  get onChanged(): chrome.storage.StorageChangedEvent {
    throw new Error('Property not implemented.');
  }
}

class FakeRuntime
  implements Pick<typeof chrome.runtime, 'getURL' | 'getManifest'>
{
  getURL(path: string): string {
    return `chrome-extension://fake-extension-id/${path}`;
  }

  getManifest(): chrome.runtime.Manifest {
    return {
      manifest_version: 3,
      name: 'Fake Extension',
      version: '1.0.0',
    };
  }
}

const fakeChrome: Pick<typeof chrome, 'storage' | 'runtime'> = {
  storage: new FakeStorage(),
  runtime: new FakeRuntime() as unknown as typeof chrome.runtime,
};

globalThis.chrome = fakeChrome as unknown as typeof chrome;
