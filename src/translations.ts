export const translations = {
  ru: {
    ui: {
      storage: "Склад",
      transport: "Транспорт",
      status_ready: "Готов",
      status_active: "В пути",
      status_loading: "Загрузка",
      status_en_route: "Рейс",
      overclock: "Разгон",
      send: "Отправить",
      upgrades: "Улучшения",
      drones: "Дроны",
      efficiency: "Эффективность",
      unlock_at: "Разблокируется при",
      control_center: "Центр управления",
      base_upgrades: "База",
      drone_fleet: "Флот",
      hangar_status: "Ангар: {current} / {max} занято",
      purchase: "Купить",
      upgrade: "Улучшить",
      max_level: "МАКС",
      settings: "Настройки",
      language: "Язык",
      language_name: "Русский",
      hq_lvl: "База Ур.",
      archive: "Архив",
      resource_identified: "ОБЪЕКТ ИДЕНТИФИЦИРОВАН",
      rarity: "Редкость",
      value: "Ценность",
      density: "Плотность",
      hits_unit: "удара",
      locked: "Заблокировано",
      rarity_types: {
        common: "Обычная",
        uncommon: "Средняя",
        rare: "Высокая",
        legendary: "Исключительная"
      }
    },
    resources: {
      metal: "Металл",
      ice: "Космический лед",
      crystal: "Кристаллы",
      iridium: "Иридий",
    },
    upgrades: {
      refinery: {
        name: "Завод",
        description: "Увеличивает цену продажи ресурсов",
      },
      cargo_bay: {
        name: "Грузовой отсек",
        description: "Увеличивает максимальную емкость склада",
      },
      hangar: {
        name: "Ангар",
        description: "Увеличивает максимальное количество дронов",
      },
      automation: {
        name: "Автоматизация",
        description: "Авто-запуск транспорта при 80% заполнении",
      },
    },
    drones: {
      basic: {
        name: "Базовый дрон",
        description: "Стандартная единица добычи",
      },
      scout: {
        name: "Разведчик",
        description: "Быстрый, но малая добыча",
      },
      heavy: {
        name: "Тяжеловоз",
        description: "Медленный, но высокая добыча",
      },
    },
    notifications: {
      new_drone: "Куплен новый {name}!",
      upgrade_success: "{name} улучшен до уровня {level}!",
      offline_income: "Пока вас не было, дроны добыли {resources} ресурсов и заработали {credits} CR!",
    },
    menu: {
      continue: "Продолжить",
      new_game: "Новая игра",
      settings: "Настройки",
      confirm_new_game: "Начать новую игру? Текущий прогресс будет удален.",
      back: "Назад",
    }
  },
  en: {
    ui: {
      storage: "Storage",
      transport: "Transport",
      status_ready: "Ready",
      status_active: "Active",
      status_loading: "Loading",
      status_en_route: "En Route",
      overclock: "Overclock",
      send: "Send",
      upgrades: "Upgrades",
      drones: "Drones",
      efficiency: "Efficiency",
      unlock_at: "Unlocks at",
      control_center: "Control Center",
      base_upgrades: "Base",
      drone_fleet: "Fleet",
      hangar_status: "Hangar: {current} / {max} slots used",
      purchase: "Purchase",
      upgrade: "Upgrade",
      max_level: "MAX",
      settings: "Settings",
      language: "Language",
      language_name: "English",
      hq_lvl: "HQ Lv.",
      archive: "Archive",
      resource_identified: "OBJECT IDENTIFIED",
      rarity: "Rarity",
      value: "Value",
      density: "Density",
      hits_unit: "hits",
      locked: "Locked",
      rarity_types: {
        common: "Common",
        uncommon: "Uncommon",
        rare: "Rare",
        legendary: "Legendary"
      }
    },
    resources: {
      metal: "Metal",
      ice: "Space Ice",
      crystal: "Crystals",
      iridium: "Iridium",
    },
    upgrades: {
      refinery: {
        name: "Refinery",
        description: "Increases selling price of resources",
      },
      cargo_bay: {
        name: "Cargo Bay",
        description: "Increases maximum storage capacity",
      },
      hangar: {
        name: "Hangar",
        description: "Increases maximum number of drones",
      },
      automation: {
        name: "Automation",
        description: "Auto-launches transport at 80% storage",
      },
    },
    drones: {
      basic: {
        name: "Basic Drone",
        description: "Standard mining unit",
      },
      scout: {
        name: "Scout Drone",
        description: "Fast but low capacity",
      },
      heavy: {
        name: "Heavy Hauler",
        description: "Slow but high yield",
      },
    },
    notifications: {
      new_drone: "New {name} Purchased!",
      upgrade_success: "{name} Upgraded to Lv.{level}!",
      offline_income: "While you were away, drones mined {resources} resources and earned {credits} CR!",
    },
    menu: {
      continue: "Continue",
      new_game: "New Game",
      settings: "Settings",
      confirm_new_game: "Start new game? Current progress will be lost.",
      back: "Back",
    }
  }
};

export type Language = keyof typeof translations;
