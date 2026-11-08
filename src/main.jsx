import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let applyingUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (applyingUpdate) window.location.reload();
  });
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then((registration) => {
    window.renateServiceWorkerRegistration = registration;
    const signalState = (worker) => {
      if (worker.state !== 'installed') return;
      if (navigator.serviceWorker.controller) window.dispatchEvent(new CustomEvent('renate:pwa-update-ready'));
      else window.dispatchEvent(new CustomEvent('renate:pwa-offline-ready'));
    };
    if (registration.waiting) window.dispatchEvent(new CustomEvent('renate:pwa-update-ready'));
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => signalState(worker));
    });
    window.renateUpdateSW = async () => {
      if (!registration.waiting) return;
      applyingUpdate = true;
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    };
  }).catch(() => {});
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
