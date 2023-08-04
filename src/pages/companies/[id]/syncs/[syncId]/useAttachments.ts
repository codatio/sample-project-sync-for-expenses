import { useCallback } from "react";

interface Attachment {
  file: File;
  transactionId: string;
}
const dbName = "expenseDb";
const storeName = "attachments";

function useAttachments() {
  const getAttachmentCount = useCallback(async () => {
    return new Promise<number>((resolve, reject) => {
      const openRequest: IDBOpenDBRequest = indexedDB.open(dbName, 1);
      openRequest.onsuccess = () => {
        const db: IDBDatabase = openRequest.result;
        const transaction: IDBTransaction = db.transaction(
          storeName,
          "readonly"
        );
        const attachmentsStore: IDBObjectStore =
          transaction.objectStore(storeName);
        const countRequest: IDBRequest = attachmentsStore.count();

        countRequest.onsuccess = () => {
          resolve(countRequest.result);
        };

        countRequest.onerror = () => {
          reject(countRequest.error);
        };
      };

      openRequest.onerror = () => {
        reject(openRequest.error);
      };
    });
  }, []);

  const popAttachment = useCallback(async (): Promise<
    Attachment | undefined
  > => {
    return new Promise<Attachment | undefined>((resolve, reject) => {
      const openRequest: IDBOpenDBRequest = indexedDB.open(dbName, 1);

      openRequest.onsuccess = () => {
        const db: IDBDatabase = openRequest.result;
        const transaction: IDBTransaction = db.transaction(
          storeName,
          "readwrite"
        );
        const attachmentsStore: IDBObjectStore =
          transaction.objectStore(storeName);
        const cursorRequest = attachmentsStore.openCursor();

        cursorRequest.onsuccess = () => {
          const cursor: IDBCursorWithValue | null = cursorRequest.result;

          if (cursor) {
            const attachment: { file: File } = cursor.value;
            attachmentsStore.delete(cursor.primaryKey);
            resolve({
              file: attachment.file,
              transactionId: cursor.primaryKey.toString(),
            });
          } else {
            resolve(undefined);
          }
        };

        cursorRequest.onerror = () => {
          reject(cursorRequest.error);
        };
      };
    });
  }, []);

  return { popAttachment, getAttachmentCount };
}

export default useAttachments;
