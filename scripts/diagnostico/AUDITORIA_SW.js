// SCRIPT DE AUDITORIA DE SERVICE WORKER E CACHE
// Cole este script no console do navegador (F12)

console.group('🛠️ AUDITORIA DE SERVICE WORKER E CACHE');

// 1. Desregistrar todos os Service Workers encontrados
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    if (registrations.length) {
      console.warn('⚠️ Service Workers encontrados:', registrations.length);
      for (let registration of registrations) {
        console.log('🗑️ Removendo SW:', registration.scope);
        registration.unregister();
      }
      console.log('✅ Service Workers removidos com sucesso.');
    } else {
      console.log('✅ Nenhum Service Worker encontrado (OK).');
    }
  });
}

// 2. Limpar todos os caches do navegador
if ('caches' in window) {
  caches.keys().then(function (names) {
    if (names.length) {
      console.warn('⚠️ Caches encontrados:', names);
      for (let name of names) {
        console.log('🗑️ Apagando Cache:', name);
        caches.delete(name);
      }
      console.log('✅ Caches locais removidos.');
    } else {
      console.log('✅ Nenhum Cache Storage encontrado (OK).');
    }
  });
}

// 3. Limpar localStorage e sessionStorage
localStorage.clear();
sessionStorage.clear();
console.log('✅ LocalStorage e SessionStorage limpos.');

console.log('🔄 Reiniciando a página em 3 segundos...');
setTimeout(() => window.location.reload(true), 3000);

console.groupEnd();
