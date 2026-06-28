// ===== FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPTrqE_xS1JNtcNV19GtVxS4K99h6ZkLU",
  authDomain: "luigi-s-cafe.firebaseapp.com",
  databaseURL: "https://luigi-s-cafe-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "luigi-s-cafe",
  storageBucket: "luigi-s-cafe.firebasestorage.app",
  messagingSenderId: "708853192485",
  appId: "1:708853192485:web:30d9746ccbc89e0abcaccc"
};

const VAPID_KEY = "BOTG4M56pbLbt_UhqK1K2a7wfB9rdjq2UzUD7uDXWGD1wUQXjPa4stdGTP3KOWjfUx_GpS6HIxfd1ZQvbNW5fiQ";

// ===== INIT =====
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let messaging = null;
try { messaging = getMessaging(app); } catch (e) { console.log("FCM non configuré"); }



// ===== ÉCOUTER LES COMMANDES (mode barista) =====
function listenOrders(callback) {
    const ordersRef = ref(db, 'orders');
    onValue(ordersRef, (snapshot) => {
        const data = snapshot.val();
        const orders = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
        callback(orders);
    });
}

// ===== METTRE À JOUR LE STATUT D'UNE COMMANDE =====
async function updateOrderStatus(orderId, status) {
    try {
        await update(ref(db, `orders/${orderId}`), { status });
        console.log(`Commande ${orderId} mise à jour: ${status}`);
    } catch (err) {
        console.error('Erreur mise à jour:', err);
    }
}

function listenCafeStatus(callback) {
    const statusRef = ref(db, 'cafe/status');
    onValue(statusRef, (snapshot) => {
        const status = snapshot.val();
        callback(status || 'open');
    });
}

// ===== ENREGISTRER LE TOKEN FCM (avec ID unique par appareil) =====
async function registerForNotifications() {
    if (!messaging) {
        console.warn('FCM non disponible');
        return;
    }
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Permission notification refusée');
            return;
        }
        const swReg = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
        if (token) {
            const deviceId = getDeviceId();
            await update(ref(db, `tokens/${deviceId}`), { token, updatedAt: Date.now() });
            console.log('Notification token enregistré:', token.slice(0, 20) + '...');
        } else {
            console.warn('getToken a retourné null');
        }
    } catch (err) {
        console.error('Erreur enregistrement notification:', err);
    }
}

// ===== NOTIFICATION REÇUE EN PREMIER PLAN =====
if (messaging) {
    onMessage(messaging, (payload) => {
        console.log('Message reçu:', payload);
        const n = payload.notification || {};
        const title = n.title || "☕ Luigi's Café";
        const body = n.body || '';
        showBanner(title, body);
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.png' });
        }
    });
}

// ===== BANNER =====
function showBanner(title, body) {
    const banner = document.getElementById('notifBanner');
    const t = document.getElementById('notifTitle');
    const b = document.getElementById('notifBody');
    if (banner && t && b) {
        t.textContent = title;
        b.textContent = body;
        banner.style.display = 'block';
        setTimeout(() => { banner.style.display = 'none'; }, 5000);
    }
}

function getDeviceId() {
    let id = localStorage.getItem('fcm_device_id');
    if (!id) {
        id = 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem('fcm_device_id', id);
    }
    return id;
}

export { app, db, ref, push, onValue, update, remove, listenCafeStatus, registerForNotifications, showBanner, getDeviceId };


