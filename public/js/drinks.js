const drinks = {
  espresso: {
    label: "Espresso",
    icon: "☕",
    items: [
      { id: "espresso", label: "Espresso", icon: "☕" },
      { id: "double_espresso", label: "Double Espresso", icon: "☕☕" },
      { id: "americano", label: "Americano", icon: "🫖" },
      { id: "lungo", label: "Lungo", icon: "☕" },
      { id: "ristretto", label: "Ristretto", icon: "☕" },
      { id: "macchiato", label: "Macchiato", icon: "☕" }
    ]
  },
  cappuccino: {
    label: "Cappuccino",
    icon: "🥛",
    items: [
      { id: "cappuccino", label: "Cappuccino", icon: "🥛" },
      { id: "latte", label: "Latte", icon: "🥛" },
      { id: "flat_white", label: "Flat White", icon: "🥛" },
      { id: "cortado", label: "Cortado", icon: "🥛" },
      { id: "latte_macchiato", label: "Latte Macchiato", icon: "🥛" }
    ]
  },
  specialty: {
    label: "Spécialités",
    icon: "✨",
    items: [
      { id: "mocha", label: "Mocha", icon: "🍫" },
      { id: "caramel_latte", label: "Latte Caramel", icon: "🍮" },
      { id: "vanilla_latte", label: "Latte Vanille", icon: "🌼" },
      { id: "chai_latte", label: "Chai Latte", icon: "🌿" },
      { id: "matcha_latte", label: "Matcha Latte", icon: "🍵" }
    ]
  },
  cold: {
    label: "Froid",
    icon: "🧊",
    items: [
      { id: "cold_brew", label: "Cold Brew", icon: "🧊" },
      { id: "iced_latte", label: "Iced Latte", icon: "🧊" },
      { id: "iced_americano", label: "Iced Americano", icon: "🧊" },
      { id: "frappuccino", label: "Frappuccino", icon: "🥤" },
      { id: "iced_matcha", label: "Iced Matcha", icon: "🍵" }
    ]
  }
};

export { drinks };
