const DB_NAME = 'renate-local';
const DB_VERSION = 2;
const STORE = 'conversations';
const SETTINGS = 'settings';

let databasePromise;

function openDatabase() {
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('IndexedDB não está disponível neste navegador.'));
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(SETTINGS)) db.createObjectStore(SETTINGS, { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          databasePromise = undefined;
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error ?? new Error('Falha ao abrir o histórico local.'));
      request.onblocked = () => reject(new Error('Feche outra versão do RENATE para abrir o histórico local.'));
    }).catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha na gravação local.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('A gravação local foi cancelada.'));
  });
}

export async function listLocalConversations() {
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readonly');
  const request = transaction.objectStore(STORE).getAll();
  const [rows] = await Promise.all([
    new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Falha ao ler o histórico local.'));
    }),
    transactionDone(transaction),
  ]);
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getLocalConversation(id) {
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readonly');
  const request = transaction.objectStore(STORE).get(id);
  const result = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir a conversa local.'));
  });
  await transactionDone(transaction);
  return result;
}

export async function saveLocalConversation(conversation) {
  if (!conversation?.id || !Array.isArray(conversation.messages)) {
    throw new TypeError('A conversa local precisa de id e lista de mensagens.');
  }
  const now = Date.now();
  const row = {
    ...conversation,
    title: conversation.title || conversation.messages.find((message) => message.role === 'user')?.text || 'Nova conversa',
    createdAt: conversation.createdAt || now,
    updatedAt: now,
  };
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readwrite');
  transaction.objectStore(STORE).put(row);
  await transactionDone(transaction);
  return row;
}

export async function deleteLocalConversation(id) {
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readwrite');
  transaction.objectStore(STORE).delete(id);
  await transactionDone(transaction);
}

export async function clearLocalHistory() {
  const db = await openDatabase();
  const transaction = db.transaction(STORE, 'readwrite');
  transaction.objectStore(STORE).clear();
  await transactionDone(transaction);
}

export async function requestPersistentLocalStorage() {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

async function getSetting(key) {
  const db = await openDatabase();
  const transaction = db.transaction(SETTINGS, 'readonly');
  const request = transaction.objectStore(SETTINGS).get(key);
  const row = await new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error ?? new Error('Falha ao ler configuração local.'));
  });
  await transactionDone(transaction);
  return row;
}

async function putSetting(row) {
  const db = await openDatabase();
  const transaction = db.transaction(SETTINGS, 'readwrite');
  transaction.objectStore(SETTINGS).put(row);
  await transactionDone(transaction);
}

export async function hasLocalPin() {
  return Boolean(await getSetting('pin'));
}

export async function hasLeadRegistration() {
  return Boolean(await getSetting('lead-registration'));
}

export async function setLeadRegistrationComplete() {
  await putSetting({ key: 'lead-registration', completed: true, completedAt: Date.now() });
}

async function derivePinHash(pin, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210_000 }, material, 256);
  return new Uint8Array(bits);
}

export async function setLocalPin(pin) {
  if (!/^\d{6,12}$/.test(pin)) throw new TypeError('O PIN deve ter de 6 a 12 algarismos.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePinHash(pin, salt);
  await putSetting({ key: 'pin', salt: Array.from(salt), hash: Array.from(hash), version: 1 });
}

export async function verifyLocalPin(pin) {
  const row = await getSetting('pin');
  if (!row || !/^\d{6,12}$/.test(pin)) return false;
  const actual = await derivePinHash(pin, new Uint8Array(row.salt));
  if (actual.length !== row.hash.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ row.hash[index];
  return difference === 0;
}
