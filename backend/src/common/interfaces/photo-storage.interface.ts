export interface StoredObject {
  storageKey: string;
  publicUrl: string;
}

/**
 * Object storage contract (S3/MinIO/local).
 * Never returns raw bytes for DB persistence — only storageKey + publicUrl.
 */
export interface IObjectStorage {
  upload(input: {
    buffer: Buffer;
    mimeType: string;
    folder: string;
    fileName: string;
  }): Promise<StoredObject>;

  delete(storageKey: string): Promise<void>;
}

/** @deprecated alias kept for photo upload call sites */
export type StoredPhoto = StoredObject;
export type IPhotoStorage = IObjectStorage;
