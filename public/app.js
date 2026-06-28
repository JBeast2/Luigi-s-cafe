import { drinks } from './js/drinks.js';
import { addons } from './js/addons.js';
import { listenCafeStatus, registerForNotifications, db, ref, push, onValue, update, showBanner, getDeviceId } from './js/firebase.js';

// ===== ETAT =====
let state = {
  who: '',
  whoEmoji: '',
  barista: '',
  baristaEmoji: '',
  category: '',
  coffee: '',
  coffeeIcon: '',
  addons: {}
};

let cafeStatus = 'open';

// ===== MEMBRES =====
const members = [
  
  { id: 'la mere', label: 'la Mère', emoji: '👩' },
  { id: 'le pere', label: 'le Père', emoji: '👨' },
  { id: 'pepe', label: 'Pépé', emoji: '👴' },
  { id: 'vanessa', label: 'Vanessa', emoji: '👩' },
  { id: 'marco', label: 'Marco', emoji: '👨‍🍳' },
  { id: 'batmo', label: 'Batmo', emoji: '🦇' },
];

const baristas = [
  { id: 'luigi', label: 'Luigi', emoji: '👨‍🍳' },
  { id: 'francesco', label: 'Francesco', emoji: '👨‍🍳' }
];

// ===== NAVIGATION =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  window.scrollTo(0, 0);
}

// ===== PAGE 1 : QUI COMMANDE =====
function renderWho() {
  const container = document.getElementById('whoList');
  container.innerHTML = '';
  members.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'card-btn';
    btn.innerHTML = `<span class="emoji">${m.emoji}</span><span>${m.label}</span>`;
    btn.onclick = () => {
      state.who = m.label;
      state.whoEmoji = m.emoji;
      if (cafeStatus === 'open') {
        renderBarista();
        showPage('page-barista');
      } else {
        showWaitingPage();
      }
    };
    container.appendChild(btn);
  });
}

// ===== PAGE 2 : QUI FAIT LE CAFE =====
function renderBarista() {
  const container = document.getElementById('baristaList');
  container.innerHTML = '';
  baristas.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'card-btn';
    btn.innerHTML = `<span class="emoji">${b.emoji}</span><span>${b.label}</span>`;
    btn.onclick = () => {
      state.barista = b.label;
      state.baristaEmoji = b.emoji;
      renderCategories();
      showPage('page-drinks');
    };
    container.appendChild(btn);
  });
}

// ===== PAGE 3 : BOISSONS =====
function renderCategories() {
  const tabs = document.getElementById('categoryTabs');
  const list = document.getElementById('drinkList');
  tabs.innerHTML = '';
  list.innerHTML = '';

  const categories = Object.keys(drinks);
  let activeCategory = categories[0];

  function renderDrinks(catId) {
    list.innerHTML = '';
    drinks[catId].items.forEach(drink => {
      const btn = document.createElement('button');
      btn.className = 'card-btn';
      if (state.coffee === drink.id) btn.classList.add('selected');
      btn.innerHTML = `<span class="emoji">${drink.icon}</span><span>${drink.label}</span>`;
      btn.onclick = () => {
        state.coffee = drink.id;
        state.coffeeIcon = drink.icon;
        state.category = catId;
        renderAddons();
        showPage('page-addons');
      };
      list.appendChild(btn);
    });
  }

  categories.forEach(catId => {
    const cat = drinks[catId];
    const tab = document.createElement('button');
    tab.className = 'tab-btn';
    if (catId === activeCategory) tab.classList.add('active');
    tab.innerHTML = `${cat.icon} ${cat.label}`;
    tab.onclick = () => {
      activeCategory = catId;
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderDrinks(catId);
    };
    tabs.appendChild(tab);
  });

  renderDrinks(activeCategory);
}

// ===== PAGE 4 : ADDONS =====
function renderAddons() {
  const container = document.getElementById('addonsList');
  container.innerHTML = '';

  Object.keys(addons).forEach(groupId => {
    const group = addons[groupId];
    const section = document.createElement('div');
    section.className = 'addon-group';

    const title = document.createElement('h3');
    title.innerHTML = `${group.icon} ${group.label}`;
    section.appendChild(title);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'btn-group';

    group.items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'addon-btn';

      // Init state
      if (!state.addons[groupId]) {
        state.addons[groupId] = group.type === 'single' ? '' : [];
      }

      // Afficher sélection
      if (group.type === 'single') {
        if (state.addons[groupId] === item.id) btn.classList.add('selected');
      } else {
        if (state.addons[groupId].includes(item.id)) btn.classList.add('selected');
      }

      btn.textContent = item.label;

      btn.onclick = () => {
        if (group.type === 'single') {
          state.addons[groupId] = item.id;
          btnGroup.querySelectorAll('.addon-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        } else {
          if (state.addons[groupId].includes(item.id)) {
            state.addons[groupId] = state.addons[groupId].filter(i => i !== item.id);
            btn.classList.remove('selected');
          } else {
            state.addons[groupId].push(item.id);
            btn.classList.add('selected');
          }
        }
      };

      btnGroup.appendChild(btn);
    });

    section.appendChild(btnGroup);
    container.appendChild(section);
  });
}

// ===== PAGE 5 : RECAP =====
function renderRecap() {
  document.getElementById('recapWho').textContent = `${state.whoEmoji} ${state.who}`;
  document.getElementById('recapBarista').textContent = `${state.baristaEmoji} ${state.barista}`;
  document.getElementById('recapCoffee').textContent = `${state.coffeeIcon} ${state.coffee}`;

  const addonsList = document.getElementById('recapAddons');
  addonsList.innerHTML = '';

  Object.keys(state.addons).forEach(groupId => {
    const group = addons[groupId];
    const val = state.addons[groupId];
    if (!val || val.length === 0) return;

    const li = document.createElement('li');
    if (group.type === 'single') {
      const item = group.items.find(i => i.id === val);
      li.textContent = `${group.icon} ${group.label} : ${item ? item.label : val}`;
    } else {
      const labels = val.map(id => {
        const item = group.items.find(i => i.id === id);
        return item ? item.label : id;
      });
      li.textContent = `${group.icon} ${group.label} : ${labels.join(', ')}`;
    }
    addonsList.appendChild(li);
  });

  showPage('page-recap');
}

// ===== CONFIRMER LA COMMANDE =====
async function confirmOrder() {
  const btn = document.getElementById('confirmBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Envoi...';

  try {
    // Préparer la commande
    const order = {
      who: state.who,
      whoEmoji: state.whoEmoji,
      barista: state.barista,
      baristaEmoji: state.baristaEmoji,
      coffee: state.coffee,
      coffeeIcon: state.coffeeIcon,
      category: state.category,
      addons: state.addons,
      notes: state.notes || '',
      status: 'en_attente',
      createdAt: Date.now()
    };

    await push(ref(db, 'orders'), order);

    showPage('page-confirm');
  } catch (err) {
    console.error('Erreur:', err);
    alert('Erreur lors de la commande. Réessaie.');
    btn.disabled = false;
    btn.textContent = '✅ Confirmer la commande';
  }
}

// ===== NOUVELLE COMMANDE =====
function newOrder() {
  state = {
    who: '',
    whoEmoji: '',
    barista: '',
    baristaEmoji: '',
    category: '',
    coffee: '',
    coffeeIcon: '',
    addons: {}
  };
  renderWho();
  showPage('page-who');
}

// ===== PRENOM PERSONNALISE =====
function setupCustomName() {
  const input = document.getElementById('customNameInput');
  const btn = document.getElementById('customNameBtn');
  if (!input || !btn) return;

  const select = () => {
    const name = input.value.trim();
    if (!name) return;
    state.who = name;
    state.whoEmoji = '👤';
    if (cafeStatus === 'open') {
      renderBarista();
      showPage('page-barista');
    } else {
      showWaitingPage();
    }
    input.value = '';
  };

  btn.addEventListener('click', select);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') select(); });
}

// ===== COMMANDES PRETES + NOTIFICATIONS =====
let knownOrders = {};

function listenReadyOrders() {
  onValue(ref(db, 'orders'), (snap) => {
    const data = snap.val();
    if (!data) { knownOrders = {}; return hideReadySection(); }

    const orders = Object.entries(data).map(([id, o]) => ({ id, ...o }));
    const ready = orders.filter(o => o.status === 'pret');

    // Notification quand une commande devient prête
    orders.forEach(o => {
      if (knownOrders[o.id] && knownOrders[o.id] !== 'pret' && o.status === 'pret') {
        notifyOrderReady(o);
      }
      knownOrders[o.id] = o.status;
    });

    if (ready.length === 0) return hideReadySection();
    renderReadyOrders(ready);
  });
}

function hideReadySection() {
  const section = document.getElementById('readyOrdersSection');
  if (section) section.style.display = 'none';
}

function renderReadyOrders(orders) {
  const section = document.getElementById('readyOrdersSection');
  const list = document.getElementById('readyOrdersList');
  if (!section || !list) return;
  section.style.display = 'block';
  list.innerHTML = '';

  orders.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.style.marginBottom = '10px';
    card.innerHTML = `
      <p style="font-weight:bold;color:#2e7d32;">
        ${order.whoEmoji || '👤'} ${order.who || '?'} — ${order.coffeeIcon || '☕'} ${order.coffee || ''}
      </p>
      <p style="font-size:0.85rem;color:#888;">
        Préparé par ${order.baristaEmoji || ''} ${order.barista || '?'}
        ${order.notes ? '<br>📝 ' + order.notes : ''}
      </p>
    `;

    const claimBtn = document.createElement('button');
    claimBtn.className = 'btn-ready';
    claimBtn.textContent = '✅ Récupérer';
    claimBtn.onclick = () => update(ref(db, `orders/${order.id}`), { status: 'termine' });
    card.appendChild(claimBtn);

    list.appendChild(card);
  });
}

function notifyOrderReady(order) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(`✅ Commande prête pour ${order.who || 'quelqu\'un'} !`, {
      body: `${order.coffeeIcon || '☕'} ${order.coffee || ''} — va récupérer ton café !`,
      icon: '/favicon.png',
      vibrate: [200, 100, 200]
    });
  }
  // Afficher aussi la bannière
  showBanner('✅ Commande prête !', `${order.who ? 'Pour ' + order.who + ' : ' : ''}${order.coffee || 'café'} est prêt !`);
}

// ===== ATTENTE OUVERTURE =====
function showWaitingPage() {
  document.getElementById('waitingWho').textContent = `${state.whoEmoji} ${state.who}`;
  document.getElementById('waitingConfirm').style.display = 'none';
  document.getElementById('preorderBtn').style.display = 'none';
  document.getElementById('waitingBtn').style.display = 'block';
  document.getElementById('waitingBtn').disabled = false;
  document.getElementById('waitingBtn').textContent = '🔔 Prévenir Luigi';
  showPage('page-waiting');
}

async function requestOpenNotification() {
  const btn = document.getElementById('waitingBtn');
  btn.disabled = true;
  btn.textContent = '⏳ ...';
  try {
    await push(ref(db, 'waiting'), {
      who: state.who,
      whoEmoji: state.whoEmoji,
      createdAt: Date.now()
    });
    document.getElementById('waitingConfirm').style.display = 'block';
    btn.style.display = 'none';
    document.getElementById('preorderBtn').style.display = 'inline-block';
  } catch (err) {
    console.error('Erreur enregistrement attente:', err);
    btn.textContent = '🔔 Prévenir Luigi';
    btn.disabled = false;
  }
}

function startPreorder() {
  renderBarista();
  showPage('page-barista');
}

// ===== STATUT CAFE =====
function renderCafeStatus(status) {
  cafeStatus = status;
  const banner = document.getElementById('cafeStatusBanner');
  if (!banner) return;
  const labels = { open: '🟢 Ouvert', closed: '🔴 Fermé', drive: '🚗 Drive seulement' };
  const cssClasses = { open: 'status-ouvert', closed: 'status-ferme', drive: 'status-drive' };
  banner.textContent = labels[status] || '🟢 Ouvert';
  banner.className = `cafe-status ${cssClasses[status] || 'status-ouvert'}`;
  // Si on était sur la page d'attente et que le café ouvre, on peut commander
  const waitingPage = document.getElementById('page-waiting');
  if (status === 'open' && waitingPage && waitingPage.classList.contains('active') && state.who) {
    renderBarista();
    showPage('page-barista');
  }
}

// ===== SERVICE WORKER =====
async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker enregistré');
    } catch (err) {
      console.error('Erreur Service Worker:', err);
    }
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  renderWho();
  showPage('page-who');
  listenCafeStatus(renderCafeStatus);
  await registerSW();
  registerForNotifications();
  setupCustomName();
  listenReadyOrders();

  // Boutons navigation
  document.getElementById('confirmBtn')?.addEventListener('click', confirmOrder);
  document.getElementById('newOrderBtn')?.addEventListener('click', newOrder);
  document.getElementById('recapBtn')?.addEventListener('click', () => {
    state.notes = document.getElementById('notesInput')?.value || '';
    renderRecap();
  });
  document.getElementById('waitingBtn')?.addEventListener('click', requestOpenNotification);
  document.getElementById('preorderBtn')?.addEventListener('click', startPreorder);
  document.getElementById('backToWhoBtn')?.addEventListener('click', () => { showPage('page-who'); });

  // Retour
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) showPage(target);
    });
  });
});

export { state };
