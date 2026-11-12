const DB_NAME = 'renate-target-reader';
const DB_VERSION = 1;
const STORE = 'rifle-sessions';

let databasePromise;

function openDatabase() {
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('O armazenamento local não está disponível neste navegador.'));
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('athleteName', 'athleteName', { unique: false });
          store.createIndex('eventName', 'eventName', { unique: false });
          store.createIndex('eventDateTime', 'eventDateTime', { unique: false });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => { db.close(); databasePromise = undefined; };
        resolve(db);
      };
      request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir os registros de alvos.'));
      request.onblocked = () => reject(new Error('Feche outra janela do RENATE para abrir os registros de alvos.'));
    }).catch((error) => { databasePromise = undefined; throw error; });
  }
  return databasePromise;
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha ao gravar o resultado local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('A gravação local foi cancelada.'));
  });
}

export async function saveTargetReaderSession(session) {
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readwrite');
  transaction.objectStore(STORE).put({ ...session, updatedAt: Date.now() });
  await transactionDone(transaction);
  return session;
}

export async function listTargetReaderSessions() {
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readonly');
  const request = transaction.objectStore(STORE).getAll();
  const rows = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error ?? new Error('Falha ao consultar os resultados locais.'));
  });
  await transactionDone(transaction);
  return rows.sort((a, b) => (b.eventDateTime || '').localeCompare(a.eventDateTime || ''));
}

export async function deleteTargetReaderSessions(sessionIds) {
  const ids = [...new Set((sessionIds ?? []).filter((id) => typeof id === 'string' && id.length))];
  if (!ids.length) return 0;
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readwrite');
  const objectStore = transaction.objectStore(STORE);
  for (const id of ids) objectStore.delete(id);
  await transactionDone(transaction);
  return ids.length;
}
