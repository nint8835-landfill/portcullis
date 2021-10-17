import { KV, read, write } from 'worktop/kv';

type KVObjectMeta<T> = {
  new (data: any): T;
  prefix: string;
};

/**
 * Base class for objects to be stored in Workers KV.
 */
export class KVObject {
  /**
   * Key prefix for objects of this type.
   */
  static prefix: string;

  /**
   * Gets an instance of this object with a given key.
   */
  static async get<T extends KVObject>(
    this: KVObjectMeta<T>,
    key: string,
  ): Promise<T | null> {
    const data = await read<{ [key: string]: any }>(
      PORTCULLIS_DATA as KV.Namespace,
      `${this.prefix}:${key}`,
    );
    if (data === null) {
      return null;
    }
    return new this(data);
  }

  /**
   * Save this instance to KV.
   */
  async save<T extends KVObject>(this: T, key: string): Promise<boolean> {
    return write(
      PORTCULLIS_DATA as KV.Namespace,
      `${(this.constructor as KVObjectMeta<T>).prefix}:${key}`,
      this,
    );
  }
}
