import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let applyingUpdate = false;
  const handleWorkerMessage = ({ data }) => {
    if (data?.source !== 'renate-service-worker') return;
    if (data.type === 'PRECACHE_STARTED' || data.type === 'PRECACHE_PROGRESS') {
      window.renateOfflineReady = null;
      window.renateOfflineProgress = data;
      window.renateOfflineFailure = null;
      window.dispatchEvent(new CustomEvent('renate:pwa-offline-progress', { detail: data }));
    } else if (data.type === 'PRECACHE_READY') {
      window.renateOfflineReady = data;
      window.renateOfflineProgress = null;
      window.renateOfflineFailure = null;
      window.dispatchEvent(new CustomEvent('renate:pwa-offline-ready', { detail: data }));
    } else if (data.type === 'PRECACHE_FAILED') {
      window.renateOfflineReady = null;
      window.renateOfflineProgress = null;
      window.renateOfflineFailure = data;
      window.dispatchEvent(new CustomEvent('renate:pwa-offline-failed', { detail: data }));
    }
  };
  navigator.serviceWorker.addEventListener('message', handleWorkerMessage);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (applyingUpdate) window.location.reload();
  });
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then((registration) => {
    window.renateServiceWorkerRegistration = registration;
    const signalState = (worker) => {
      if (worker.state !== 'installed') return;
      if (navigator.serviceWorker.controller) window.dispatchEvent(new CustomEvent('renate:pwa-update-ready'));
    };
    if (registration.waiting) window.dispatchEvent(new CustomEvent('renate:pwa-update-ready'));
    if (registration.active) registration.active.postMessage({ type: 'CHECK_PRECACHE' });
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        signalState(worker);
        if (worker.state === 'redundant') window.dispatchEvent(new CustomEvent('renate:pwa-offline-failed', { detail: { message: 'O download offline falhou. Verifique a conexão e o espaço disponível no aparelho e recarregue o RENATE para tentar novamente.' } }));
      });
    });
    window.renateUpdateSW = async () => {
      if (!registration.waiting) return;
      applyingUpdate = true;
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    };
  }).catch((error) => {
    const detail = { message: `Não foi possível iniciar o armazenamento offline: ${error?.message || 'falha do Service Worker'}` };
    window.renateOfflineFailure = detail;
    window.dispatchEvent(new CustomEvent('renate:pwa-offline-failed', { detail }));
  });
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
