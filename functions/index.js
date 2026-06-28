const admin = require("firebase-admin");
admin.initializeApp();

const { onValueCreated, onValueWritten } = require("firebase-functions/v2/database");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

async function getTokens() {
  try {
    const snap = await admin.database().ref("tokens").once("value");
    const data = snap.val();
    if (!data) return [];
    return Object.values(data).map((t) => t.token).filter(Boolean);
  } catch {
    return [];
  }
}

exports.sendQuickNotification = onCall(
  { region: "europe-west1" },
  async (request) => {
    const message = request.data.message;
    if (!message) {
      throw new HttpsError("invalid-argument", "Message requis");
    }

    const tokens = await getTokens();
    if (tokens.length === 0) {
      console.log("sendQuickNotification: aucun token");
      return { sent: 0 };
    }

    console.log(`sendQuickNotification: envoi à ${tokens.length} token(s) — "${message}"`);

    try {
      const result = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: "☕ Luigi's Café",
          body: message
        }
      });
      console.log(`sendQuickNotification: ${result.successCount} envoyé(s)`);
      return { sent: result.successCount };
    } catch (err) {
      console.error("sendQuickNotification: erreur FCM:", err.message);
      throw new HttpsError("internal", err.message);
    }
  }
);

exports.notifyNewOrder = onValueCreated(
  { ref: "/orders/{orderId}", region: "europe-west1" },
  async (event) => {
    const order = event.data.val();
    if (!order) {
      console.log("notifyNewOrder: no order data");
      return;
    }

    const tokens = await getTokens();
    if (tokens.length === 0) {
      console.log("notifyNewOrder: no tokens");
      return;
    }

    console.log(`notifyNewOrder: ${tokens.length} token(s), order from ${order.who}`);

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `☕ Nouvelle commande de ${order.who || "quelqu'un"}`,
          body: `${order.coffeeIcon || "☕"} ${order.coffee || ""} — préparé par ${order.barista || "?"}`
        }
      });
      console.log("notifyNewOrder: envoyé avec succès");
    } catch (err) {
      console.error("notifyNewOrder: erreur FCM:", err.message);
    }
  }
);

exports.notifyWaiting = onValueCreated(
  { ref: "/waiting/{waitingId}", region: "europe-west1" },
  async (event) => {
    const data = event.data.val();
    if (!data || !data.who) return;

    const tokens = await getTokens();
    if (tokens.length === 0) return;

    console.log(`notifyWaiting: ${data.who} attend l'ouverture, ${tokens.length} token(s)`);

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: `🔔 Luigi !! ${data.who} attend l'ouverture !`,
          body: `${data.whoEmoji || "👤"} ${data.who} aimerait commander dès l'ouverture du café`
        }
      });
      console.log("notifyWaiting: envoyé avec succès");
    } catch (err) {
      console.error("notifyWaiting: erreur FCM:", err.message);
    }
  }
);

exports.notifyCafeStatus = onValueWritten(
  { ref: "/cafe/status", region: "europe-west1" },
  async (event) => {
    const newStatus = event.data.after.val();
    const oldStatus = event.data.before.val();
    if (!newStatus || newStatus === oldStatus) return;

    const labels = { open: "🟢 Ouvert", closed: "🔴 Fermé", drive: "🚗 Drive seulement" };
    const title = "☕ Luigi's Café";
    const body = `Le café est maintenant ${labels[newStatus] || newStatus}`;

    console.log(`notifyCafeStatus: ${oldStatus} -> ${newStatus}`);

    // Notify all registered users
    const tokens = await getTokens();
    if (tokens.length > 0) {
      try {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title, body }
        });
        console.log(`notifyCafeStatus: ${tokens.length} notified`);
      } catch (err) {
        console.error("notifyCafeStatus: erreur FCM:", err.message);
      }
    }

    // Clear waiting list on opening
    if (newStatus === "open") {
      await admin.database().ref("waiting").remove();
      console.log("notifyCafeStatus: waiting list cleared");
    }
  }
);

exports.notifyOrderStatus = onValueWritten(
  { ref: "/orders/{orderId}", region: "europe-west1" },
  async (event) => {
    const before = event.data.before.val();
    const after = event.data.after.val();
    if (!before || !after) return;

    const oldStatus = before.status;
    const newStatus = after.status;
    if (!oldStatus || !newStatus || oldStatus === newStatus) return;

    let title, body;
    if (newStatus === "en_preparation" && oldStatus === "en_attente") {
      title = `☕ En préparation pour ${after.who || "quelqu'un"}`;
      body = `${after.coffeeIcon || "☕"} ${after.coffee || ""} — ${after.barista || "?"} s'en occupe !`;
    } else if (newStatus === "pret" && oldStatus === "en_preparation") {
      title = `✅ Commande prête pour ${after.who || "quelqu'un"} !`;
      body = `${after.coffeeIcon || "☕"} ${after.coffee || ""} — va récupérer ton café !`;
    } else {
      return;
    }

    const tokens = await getTokens();
    if (tokens.length === 0) return;

    console.log(`notifyOrderStatus: ${oldStatus} -> ${newStatus}, ${tokens.length} token(s)`);

    try {
      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body }
      });
    } catch (err) {
      console.error("notifyOrderStatus: erreur FCM:", err.message);
    }
  }
);

exports.autoDeleteOrders = onSchedule(
  { schedule: "every 10 minutes", region: "europe-west1", timeZone: "Europe/Paris" },
  async () => {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const snap = await admin.database().ref("orders").once("value");
    const data = snap.val();
    if (!data) {
      console.log("autoDeleteOrders: no orders");
      return;
    }

    let deleted = 0;
    const updates = {};
    for (const [id, order] of Object.entries(data)) {
      if (order.status === "en_attente" && order.createdAt && order.createdAt < cutoff) {
        updates[`/orders/${id}`] = null;
        deleted++;
      }
    }

    if (deleted > 0) {
      await admin.database().ref().update(updates);
      console.log(`autoDeleteOrders: ${deleted} commande(s) supprimée(s)`);
    } else {
      console.log("autoDeleteOrders: aucune commande à supprimer");
    }
  }
);
