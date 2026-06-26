// ===== DONNÉES DE L'APP =====

const PERSONNES = ['Luigi', 'Francesco', 'Mamma', 'Papà', 'Sofia', 'Marco'];

const BOISSONS = {
    espresso: [
        { id: 'espresso', nom: 'Espresso', emoji: '☕' },
        { id: 'double-espresso', nom: 'Double Espresso', emoji: '☕☕' },
        { id: 'macchiato', nom: 'Macchiato', emoji: '☕' },
        { id: 'americano', nom: 'Americano', emoji: '🫖' },
    ],
    cappuccino: [
        { id: 'cappuccino', nom: 'Cappuccino', emoji: '☕' },
        { id: 'latte', nom: 'Latte', emoji: '🥛' },
        { id: 'flat-white', nom: 'Flat White', emoji: '☕' },
        { id: 'cortado', nom: 'Cortado', emoji: '☕' },
    ],
    specialite: [
        { id: 'mocha', nom: 'Mocha', emoji: '🍫' },
        { id: 'caramel-latte', nom: 'Caramel Latte', emoji: '🍮' },
        { id: 'matcha-latte', nom: 'Matcha Latte', emoji: '🍵' },
        { id: 'chai-latte', nom: 'Chai Latte', emoji: '🫖' },
    ],
    froid: [
        { id: 'cold-brew', nom: 'Cold Brew', emoji: '🧊' },
        { id: 'frappe', nom: 'Frappé', emoji: '🥤' },
        { id: 'iced-latte', nom: 'Iced Latte', emoji: '🧊' },
        { id: 'iced-matcha', nom: 'Iced Matcha', emoji: '🍵' },
    ],
};

// ===== COMMANDE EN COURS =====
let commandeEnCours = {
    personne: '',
    barista: '',
    boisson: '',
    lait: '',
    extras: [],
};

let commandes = []; // Toutes les commandes
let statutCafe = 'ouvert';

// ===== INITIALISATION =====
function init() {
    afficherPersonnes();
    afficherBoissons('espresso');
    afficherEcran('ecran-accueil');
}

// ===== NAVIGATION =====
function afficherEcran(id) {
    document.querySelectorAll('.ecran').forEach(e => e.classList.remove('actif'));
    document.getElementById(id).classList.add('actif');
}

function retour(ecranId) {
    afficherEcran(ecranId);
}

// ===== PERSONNES =====
function afficherPersonnes() {
    const container = document.getElementById('liste-personnes');
    container.innerHTML = '';
    
    PERSONNES.forEach(personne => {
        const btn = document.createElement('button');
        btn.className = 'btn-choix';
        btn.innerHTML = `👤 ${personne}`;
        btn.onclick = () => choisirPersonne(personne);
        container.appendChild(btn);
    });
}

function choisirPersonne(personne) {
    commandeEnCours.personne = personne;
    afficherEcran('ecran-barista-choix');
}

// ===== BARISTA =====
function choisirBarista(barista) {
    commandeEnCours.barista = barista;
    afficherEcran('ecran-boisson');
}

function allerBarista() {
    afficherEcran('ecran-mode-barista');
    afficherCommandes();
}

// ===== BOISSONS =====
function afficherCategorie(categorie) {
    // Mise à jour onglets
    document.querySelectorAll('.onglet').forEach(o => o.classList.remove('actif-onglet'));
    document.getElementById('tab-' + categorie).classList.add('actif-onglet');
    
    afficherBoissons(categorie);
}

function afficherBoissons(categorie) {
    const container = document.getElementById('liste-boissons');
    container.innerHTML = '';
    
    BOISSONS[categorie].forEach(boisson => {
        const btn = document.createElement('button');
        btn.className = 'btn-choix';
        btn.innerHTML = `${boisson.emoji}<br>${boisson.nom}`;
        btn.onclick = () => choisirBoisson(boisson.nom);
        container.appendChild(btn);
    });
}

function choisirBoisson(boisson) {
    commandeEnCours.boisson = boisson;
    // Reset options
    commandeEnCours.lait = '';
    commandeEnCours.extras = [];
    resetOptions();
    afficherEcran('ecran-options');
}

// ===== OPTIONS =====
function resetOptions() {
    document.querySelectorAll('.btn-option').forEach(b => b.classList.remove('selectionne'));
}

function toggleOption(type, valeur) {
    if (type === 'lait') {
        commandeEnCours.lait = valeur;
        // Désélectionner tous les laits
        document.querySelectorAll('[id^="opt-lait"], #opt-sans-lait, #opt-lait-vegetal, #opt-lait-avoine').forEach(b => {
            b.classList.remove('selectionne');
        });
        // Trouver et sélectionner le bon bouton
        const btnId = 'opt-' + valeur.toLowerCase()
            .replace(/ /g, '-')
            .replace(/'/g, '')
            .replace('lait dentier', 'lait-entier');
        
        // Sélection manuelle selon valeur
        const mapping = {
            'Lait entier': 'opt-lait-entier',
            'Lait végétal': 'opt-lait-vegetal',
            "Lait d'avoine": 'opt-lait-avoine',
            'Sans lait': 'opt-sans-lait',
        };
        if (mapping[valeur]) {
            document.getElementById(mapping[valeur]).classList.add('selectionne');
        }
    }
}

function toggleExtra(valeur) {
    const index = commandeEnCours.extras.indexOf(valeur);
    const mapping = {
        'Mousse extra': 'opt-mousse',
        'Lait extra': 'opt-lait-extra',
        'Double shot': 'opt-double',
        'Sirop vanille': 'opt-vanille',
        'Sirop caramel': 'opt-caramel',
        'Sirop noisette': 'opt-noisette',
        'Sirop chocolat': 'opt-chocolat',
    };
    
    if (index === -1) {
        commandeEnCours.extras.push(valeur);
        if (mapping[valeur]) document.getElementById(mapping[valeur]).classList.add('selectionne');
    } else {
        commandeEnCours.extras.splice(index, 1);
        if (mapping[valeur]) document.getElementById(mapping[valeur]).classList.remove('selectionne');
    }
}

// ===== RÉCAP =====
function allerRecap() {
    document.getElementById('recap-personne').textContent = commandeEnCours.personne;
    document.getElementById('recap-barista').textContent = commandeEnCours.barista;
    document.getElementById('recap-boisson').textContent = commandeEnCours.boisson;
    document.getElementById('recap-lait').textContent = commandeEnCours.lait || 'Standard';
    document.getElementById('recap-extras').textContent = 
        commandeEnCours.extras.length > 0 ? commandeEnCours.extras.join(', ') : 'Aucun';
    
    afficherEcran('ecran-recap');
}

// ===== CONFIRMER COMMANDE =====
function confirmerCommande() {
    const nouvelleCommande = {
        id: Date.now(),
        ...commandeEnCours,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        statut: 'en-cours',
    };
    
    commandes.push(nouvelleCommande);
    
    // Message de confirmation
    alert(`✅ Commande passée !\n\n☕ ${nouvelleCommande.boisson} pour ${nouvelleCommande.personne}\n👨‍🍳 Préparé par ${nouvelleCommande.barista}`);
    
    // Reset et retour accueil
    commandeEnCours = { personne: '', barista: '', boisson: '', lait: '', extras: [] };
    afficherEcran('ecran-accueil');
}

// ===== MODE BARISTA - COMMANDES =====
function afficherCommandes() {
    const container = document.getElementById('liste-commandes');
    
    const commandesEnCours = commandes.filter(c => c.statut === 'en-cours');
    
    if (commandesEnCours.length === 0) {
        container.innerHTML = '<p class="vide">Aucune commande pour le moment ☕</p>';
        return;
    }
    
    container.innerHTML = '';
    commandesEnCours.forEach(commande => {
        const carte = document.createElement('div');
        carte.className = 'carte-commande';
        carte.innerHTML = `
            <h4>☕ ${commande.boisson} — ${commande.personne}</h4>
            <p>🥛 Lait: ${commande.lait || 'Standard'}</p>
            <p>✨ Extras: ${commande.extras.length > 0 ? commande.extras.join(', ') : 'Aucun'}</p>
            <p style="color:#aaa; font-size:0.85rem;">🕐 ${commande.heure} | 👨‍🍳 ${commande.barista}</p>
            <button class="btn-pret" onclick="commandePrete(${commande.id})">
                ✅ Commande prête !
            </button>
        `;
        container.appendChild(carte);
    });
}

function commandePrete(id) {
    const commande = commandes.find(c => c.id === id);
    if (commande) {
        commande.statut = 'pret';
        alert(`🔔 ${commande.boisson} pour ${commande.personne} est prêt !`);
        afficherCommandes();
    }
}

// ===== STATUT CAFÉ =====
function changerStatut(statut) {
    statutCafe = statut;
    const el = document.getElementById('statut-cafe');
    
    const labels = {
        ouvert: 'OUVERT',
        ferme: 'FERMÉ',
        drive: '🚗 DRIVE ONLY',
    };
    
    el.textContent = labels[statut];
    el.className = 'statut ' + statut;
    
    alert(`✅ Statut changé : ${labels[statut]}`);
}

// ===== DÉMARRAGE =====
init();
