import { addons } from './addons.js';
import { app, db, ref, onValue, update, remove, registerForNotifications, showBanner } from './firebase.js';
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

const functions = getFunctions(app, "europe-west1");
const sendQuickNotifFn = httpsCallable(functions, "sendQuickNotification");

// ===== STATUT DU CAFE =====
function renderCafeStatus() {
  const container = document.getElementById('cafeStatusBtns');
  if (!container) return;

  const statuses = [
    { id: 'open', label: 'Ouvert', icon: '🟢' },
    { id: 'closed', label: 'Fermé', icon: '🔴' },
    { id: 'drive', label: 'Drive Seulement', icon: '🚗' }
  ];

  container.innerHTML = '';
  statuses.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'status-btn';
    btn.innerHTML = `${s.icon} ${s.label}`;
    btn.onclick = () => {
      update(ref(db, 'cafe'), { status: s.id });
      document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    container.appendChild(btn);
  });

  // Lire le statut actuel
  onValue(ref(db, 'cafe/status'), (snap) => {
    const current = snap.val();
    container.querySelectorAll('.status-btn').forEach((btn, i) => {
      btn.classList.toggle('active', statuses[i].id === current);
    });
  });
}

// ===== NOTIFICATION BACKGROUND =====
let knownOrderIds = new Set();

function notifyNewOrder(order) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(`☕ Nouvelle commande de ${order.who || 'quelqu\'un'}`, {
      body: `${order.coffeeIcon || '☕'} ${order.coffee || ''} — préparé par ${order.barista || '?'}`,
      icon: '/favicon.png',
      vibrate: [200, 100, 200]
    });
  }
}

// ===== SUPPRIMER UNE COMMANDE =====
function deleteOrder(orderId) {
  if (confirm('Supprimer cette commande ?')) {
    remove(ref(db, `orders/${orderId}`));
  }
}

function clearAllOrders() {
  if (confirm('Supprimer TOUTES les commandes (en cours + historique) ?')) {
    remove(ref(db, 'orders'));
  }
}

// ===== AFFICHER LES COMMANDES =====
function renderOrders() {
  const container = document.getElementById('ordersList');
  if (!container) return;

  onValue(ref(db, 'orders'), (snap) => {
    const data = snap.val();
    container.innerHTML = '';

    if (!data) {
      container.innerHTML = '<p class="empty">Aucune commande pour le moment ☕</p>';
      renderStatsAndHistory([]);
      return;
    }

    // Trier par date
    const orders = Object.entries(data)
      .map(([id, order]) => ({ id, ...order }))
      .sort((a, b) => b.createdAt - a.createdAt);

    // Notifier les nouvelles commandes
    orders.forEach(order => {
      if (!knownOrderIds.has(order.id) && order.status === 'en_attente') {
        notifyNewOrder(order);
      }
      knownOrderIds.add(order.id);
    });

    renderStatsAndHistory(orders);

    const actives = orders.filter(o => o.status !== 'termine');

    // Bouton tout supprimer
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn-clear-all';
    clearBtn.textContent = '🗑️ Supprimer toutes les commandes';
    clearBtn.onclick = clearAllOrders;
    clearBtn.style.cssText = 'display:block;width:100%;padding:10px;margin-bottom:16px;background:#e53935;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;';
    container.appendChild(clearBtn);

    if (actives.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Aucune commande en cours ☕';
      container.appendChild(empty);
    }

    actives.forEach(order => {
      const card = document.createElement('div');
      card.className = `order-card status-${order.status}`;

      // Header
      const header = document.createElement('div');
      header.className = 'order-header';
      header.innerHTML = `
        <span class="order-who">${order.whoEmoji} ${order.who}</span>
        <span class="order-barista">par ${order.baristaEmoji} ${order.barista}</span>
        <span class="order-status ${order.status}">${getStatusLabel(order.status)}</span>
      `;

      // Corps
      const body = document.createElement('div');
      body.className = 'order-body';
      body.innerHTML = `<p class="order-coffee">${order.coffeeIcon} ${order.coffee}</p>`;

      // Addons
      if (order.addons) {
        const addonsList = document.createElement('ul');
        addonsList.className = 'order-addons';
        Object.keys(order.addons).forEach(groupId => {
          const group = addons[groupId];
          if (!group) return;
          const val = order.addons[groupId];
          if (!val || val.length === 0) return;
          const li = document.createElement('li');
          if (group.type === 'single') {
            const item = group.items.find(i => i.id === val);
            li.textContent = `${group.icon} ${item ? item.label : val}`;
          } else {
            const labels = val.map(id => {
              const item = group.items.find(i => i.id === id);
              return item ? item.label : id;
            });
            li.textContent = `${group.icon} ${labels.join(', ')}`;
          }
          addonsList.appendChild(li);
        });
        body.appendChild(addonsList);
      }

      // Notes
      if (order.notes) {
        const notes = document.createElement('p');
        notes.className = 'order-notes';
        notes.textContent = `📝 ${order.notes}`;
        body.appendChild(notes);
      }

      // Heure
      const time = document.createElement('p');
      time.className = 'order-time';
      time.textContent = `🕐 ${new Date(order.createdAt).toLocaleTimeString('fr-FR')}`;
      body.appendChild(time);

      // Boutons action
      const actions = document.createElement('div');
      actions.className = 'order-actions';

      if (order.status === 'en_attente') {
        const btnPrepare = document.createElement('button');
        btnPrepare.className = 'btn-prepare';
        btnPrepare.textContent = '☕ En préparation';
        btnPrepare.onclick = () => updateOrderStatus(order.id, 'en_preparation');
        actions.appendChild(btnPrepare);
      }

      if (order.status === 'en_preparation') {
        const btnReady = document.createElement('button');
        btnReady.className = 'btn-ready';
        btnReady.textContent = '✅ Prêt !';
        btnReady.onclick = () => updateOrderStatus(order.id, 'pret');
        actions.appendChild(btnReady);
      }

      if (order.status === 'pret') {
        const btnDone = document.createElement('button');
        btnDone.className = 'btn-done';
        btnDone.textContent = '🗑️ Terminer';
        btnDone.onclick = () => updateOrderStatus(order.id, 'termine');
        actions.appendChild(btnDone);
      }

      // Bouton supprimer
      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-delete';
      btnDelete.textContent = '❌ Supprimer';
      btnDelete.style.cssText = 'padding:6px 12px;background:#e53935;color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;';
      btnDelete.onclick = () => deleteOrder(order.id);
      actions.appendChild(btnDelete);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(actions);
      container.appendChild(card);
    });
  });
}

// ===== STATUT LABEL =====
function getStatusLabel(status) {
  const labels = {
    en_attente: '⏳ En attente',
    en_preparation: '☕ En préparation',
    pret: '✅ Prêt !',
    termine: '✔️ Terminé'
  };
  return labels[status] || status;
}

// ===== METTRE A JOUR STATUT =====
function updateOrderStatus(orderId, newStatus) {
  update(ref(db, `orders/${orderId}`), { status: newStatus });
}

// ===== NOTIFICATIONS RAPIDES =====
async function sendQuickNotif(btn, message) {
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Envoi...';
  try {
    const result = await sendQuickNotifFn({ message });
    showBanner('📢 Envoyé', `Notification envoyée à ${result.data.sent} appareil(s)`);
  } catch (err) {
    showBanner('❌ Erreur', "Échec de l'envoi de la notification");
    console.error('sendQuickNotif error:', err);
  }
  btn.disabled = false;
  btn.textContent = originalText;
}

window.sendQuickNotif = sendQuickNotif;
window.toggleQuickNotifs = function toggleQuickNotifs() {
  const el = document.getElementById('quickNotifContent');
  const toggle = document.getElementById('quickNotifToggle');
  if (!el || !toggle) return;
  const isHidden = el.style.display === 'none';
  el.style.display = isHidden ? 'block' : 'none';
  toggle.textContent = isHidden ? '▲' : '▼';
};

window.sendQuickNotifFromInput = function sendQuickNotifFromInput(btn, inputId, template) {
  const input = document.getElementById(inputId);
  if (!input || !input.value) return;
  const message = template.replace('{{v}}', input.value);
  sendQuickNotif(btn, message);
  input.value = '';
};

// ===== STATISTIQUES & HISTORIQUE =====
function renderStatsAndHistory(allOrders) {
  const statsContainer = document.getElementById('statsContent');
  const historyContainer = document.getElementById('historyContent');
  if (!statsContainer || !historyContainer) return;

  const termines = allOrders.filter(o => o.status === 'termine');
  const enCours = allOrders.filter(o => o.status !== 'termine');

  // Stats
  const whoCount = {};
  const baristaCount = {};
  const coffeeCount = {};
  termines.forEach(o => {
    whoCount[o.who] = (whoCount[o.who] || 0) + 1;
    baristaCount[o.barista] = (baristaCount[o.barista] || 0) + 1;
    coffeeCount[o.coffee] = (coffeeCount[o.coffee] || 0) + 1;
  });

  const sortedWho = Object.entries(whoCount).sort((a, b) => b[1] - a[1]);
  const sortedBarista = Object.entries(baristaCount).sort((a, b) => b[1] - a[1]);
  const sortedCoffee = Object.entries(coffeeCount).sort((a, b) => b[1] - a[1]);

  statsContainer.innerHTML = `
    <div class="stat-card">
      <span class="stat-number">${termines.length + enCours.length}</span>
      <span class="stat-label">Total commandes</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">${termines.length}</span>
      <span class="stat-label">Servies</span>
    </div>
    <div class="stat-card">
      <span class="stat-number">${enCours.length}</span>
      <span class="stat-label">En cours</span>
    </div>
    <div class="stat-card stat-wide">
      <span class="stat-label">Top commandes par personne</span>
      <div class="stat-list">${
        sortedWho.length
          ? sortedWho.map(([name, count]) =>
              `<span class="stat-bar"><span class="stat-bar-label">${name}</span><span class="stat-bar-value">${count}x</span></span>`
            ).join('')
          : '<span style="color:#aaa;">Aucune donnée</span>'
      }</div>
    </div>
    <div class="stat-card stat-wide">
      <span class="stat-label">Préparations par barista</span>
      <div class="stat-list">${
        sortedBarista.length
          ? sortedBarista.map(([name, count]) =>
              `<span class="stat-bar"><span class="stat-bar-label">${name}</span><span class="stat-bar-value">${count}x</span></span>`
            ).join('')
          : '<span style="color:#aaa;">Aucune donnée</span>'
      }</div>
    </div>
    <div class="stat-card stat-wide">
      <span class="stat-label">Boissons populaires</span>
      <div class="stat-list">${
        sortedCoffee.length
          ? sortedCoffee.slice(0, 5).map(([name, count]) =>
              `<span class="stat-bar"><span class="stat-bar-label">${name}</span><span class="stat-bar-value">${count}x</span></span>`
            ).join('')
          : '<span style="color:#aaa;">Aucune donnée</span>'
      }</div>
    </div>
  `;

  // Historique
  if (termines.length === 0) {
    historyContainer.innerHTML = '<p class="empty" style="padding:20px;">Aucune commande terminée</p>';
    return;
  }

  historyContainer.innerHTML = termines
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50)
    .map(o => `
      <div class="history-item">
        <span class="history-who">${o.whoEmoji || '👤'} ${o.who || '?'}</span>
        <span class="history-coffee">${o.coffeeIcon || '☕'} ${o.coffee || ''}</span>
        <span class="history-barista">par ${o.barista || '?'}</span>
        <span class="history-time">${new Date(o.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    `).join('');
}

// ===== SERVICE WORKER =====
async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker enregistré (barista)');
    } catch (err) {
      console.error('Erreur Service Worker:', err);
    }
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  renderCafeStatus();
  renderOrders();
  await registerSW();
  registerForNotifications();
});
