import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const databaseDeleted = new Promise((resolve, reject) => {
  const request = indexedDB.deleteDatabase('renate-local');
  request.onsuccess = () => resolve();
  request.onerror = () => reject(request.error);
});
await databaseDeleted;

const history = await import('../src/localHistory.js');

test('salva e recupera pergunta original e esclarecimento localmente', async () => {
  await history.saveLocalConversation({
    id: 'conversation-a',
    messages: [
      { role: 'user', text: 'Quanto tempo dura?' },
      { role: 'assistant', text: 'Você deseja saber sobre o tempo da prova?' },
      { role: 'user', text: 'Sim, o tempo da prova.' },
    ],
  });
  const reopened = await history.getLocalConversation('conversation-a');
  assert.equal(reopened.messages[0].text, 'Quanto tempo dura?');
  assert.equal(reopened.messages[1].text, 'Você deseja saber sobre o tempo da prova?');
  assert.equal(reopened.messages[2].text, 'Sim, o tempo da prova.');
});

test('apaga conversa individual sem afetar as demais', async () => {
  await history.saveLocalConversation({ id: 'conversation-b', messages: [{ role: 'user', text: 'Outra pergunta' }] });
  await history.deleteLocalConversation('conversation-a');
  assert.equal(await history.getLocalConversation('conversation-a'), null);
  assert.deepEqual((await history.listLocalConversations()).map((row) => row.id), ['conversation-b']);
});

test('limpa todo o histórico', async () => {
  await history.clearLocalHistory();
  assert.deepEqual(await history.listLocalConversations(), []);
});

test('protege o desbloqueio local com hash PBKDF2 e não grava o PIN em texto', async () => {
  assert.equal(await history.hasLocalPin(), false);
  await history.setLocalPin('123456');
  assert.equal(await history.hasLocalPin(), true);
  assert.equal(await history.verifyLocalPin('000000'), false);
  assert.equal(await history.verifyLocalPin('123456'), true);
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('renate-local', 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const row = await new Promise((resolve, reject) => {
    const request = db.transaction('settings', 'readonly').objectStore('settings').get('pin');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  assert.equal(JSON.stringify(row).includes('123456'), false);
  assert.equal(await history.hasLocalPin(), true);
});

