const addons = {
  milk: {
    label: "Choix du lait",
    icon: "🥛",
    type: "single",
    items: [
      { id: "lait_entier", label: "Lait entier" },
      { id: "lait_demi", label: "Lait demi-écrémé" },
      { id: "lait_ecreme", label: "Lait écrémé" },
      { id: "lait_avoine", label: "Lait d'avoine" },
      { id: "lait_amande", label: "Lait d'amande" },
      { id: "lait_soja", label: "Lait de soja" },
      { id: "lait_coco", label: "Lait de coco" }
    ]
  },
  extras: {
    label: "Extras",
    icon: "➕",
    type: "multiple",
    items: [
      { id: "extra_mousse", label: "Extra mousse de lait" },
      { id: "extra_lait", label: "Extra lait" },
      { id: "double_shot", label: "Double shot" },
      { id: "sans_lactose", label: "Sans lactose" },
      { id: "chantilly", label: "Chantilly" },
      { id: "cacao", label: "Poudre de cacao" },
      { id: "cannelle", label: "Cannelle" }
    ]
  },
  syrups: {
    label: "Sirops",
    icon: "🍯",
    type: "multiple",
    items: [
      { id: "sirop_vanille", label: "Vanille" },
      { id: "sirop_caramel", label: "Caramel" },
      { id: "sirop_noisette", label: "Noisette" },
      { id: "sirop_lavande", label: "Lavande" },
      { id: "sirop_rose", label: "Rose" },
      { id: "sirop_menthe", label: "Menthe" },
      { id: "sirop_chocolat", label: "Chocolat" },
      { id: "sirop_amande", label: "Amande" }
    ]
  },
  sugar: {
    label: "Sucre",
    icon: "🍬",
    type: "single",
    items: [
      { id: "sans_sucre", label: "Sans sucre" },
      { id: "un_sucre", label: "1 sucre" },
      { id: "deux_sucres", label: "2 sucres" },
      { id: "trois_sucres", label: "3 sucres" }
    ]
  },
  strength: {
    label: "Force",
    icon: "💪",
    type: "single",
    items: [
      { id: "leger", label: "Léger" },
      { id: "normal", label: "Normal" },
      { id: "fort", label: "Fort" },
      { id: "tres_fort", label: "Très fort" }
    ]
  }
};

export { addons };
