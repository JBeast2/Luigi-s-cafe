importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCPTrqE_xS1JNtcNV19GtVxS4K99h6ZkLU",
  authDomain: "luigi-s-cafe.firebaseapp.com",
  databaseURL: "https://luigi-s-cafe-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "luigi-s-cafe",
  storageBucket: "luigi-s-cafe.firebasestorage.app",
  messagingSenderId: "708853192485",
  appId: "1:708853192485:web:30d9746ccbc89e0abcaccc"
});

const messaging = firebase.messaging();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const notificationTitle = n.title || "☕ Luigi's Café";
  const notificationOptions = {
    body: n.body || "",
    icon: "/favicon.png",
    vibrate: [200, 100, 200]
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const matchingClient = windowClients.find((c) => c.url.includes("/"));
      if (matchingClient) return matchingClient.focus();
      return clients.openWindow("/");
    })
  );
});
