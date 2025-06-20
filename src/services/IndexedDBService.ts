import RWSService from './_service';

class IndexedDBService extends RWSService {
    static _DEFAULT: boolean = true;
    openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getFromDB(db: IDBDatabase, store: string, key: string): Promise<{
        css: string,
        timestamp: number
    } | null> {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readonly');
            const request = tx.objectStore(store).get(key);

            request.onsuccess = () => resolve(request.result ?? null);
            request.onerror = () => reject(request.error);
        });
    }

    saveToDB(db: IDBDatabase, store: string, key: string, value: {
        css: string,
        timestamp: number
    }): Promise<void> {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(store, 'readwrite');
            const request = tx.objectStore(store).put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export default IndexedDBService.getSingleton();
export { IndexedDBService as IndexedDBServiceInstance }; 