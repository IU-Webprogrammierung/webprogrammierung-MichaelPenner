/**
 * ============================================================================
 * KITCHENAID RESTORATIONS & 3D PARTS – STANDALONE SHOP DATA & STORE
 * ============================================================================
 * Provides:
 * - Default catalog of 5 restored KitchenAid Mixers + 6 3D-printed Accessories
 * - Persistent Catalog Store (localStorage + optional api/shop_api.php sync)
 * - Persistent Cart Store (add, remove, update qty, subtotal, shipping, total)
 * - Persistent Order & Admin Store (create order, update status, demo seed orders)
 */
(function () {
  const STORAGE_KEYS = {
    CART: 'ka_standalone_cart_v1',
    PRODUCTS: 'ka_standalone_products_v1',
    ORDERS: 'ka_standalone_orders_v1',
    SETTINGS: 'ka_standalone_settings_v1'
  };

  // ==========================================================================
  // 1. DEFAULT PRODUCT CATALOG (5 Mixers + 6 Buyable 3D Accessories)
  // ==========================================================================
  const DEFAULT_PRODUCTS = [
    // --- RESTORED STAND MIXERS ---
    {
      id: 'mixer-truffle-bronze',
      sku: 'KA-MIX-01',
      category: 'mixer',
      editionNumber: '01',
      kicker: { en: 'KitchenAid Restoration 01', de: 'KitchenAid Restaurierung 01' },
      title: { en: 'Truffle & Bronze', de: 'Trüffel & Bronze' },
      subtitle: {
        en: 'Unique Glass Bowl + Custom Brass Accessoires',
        de: 'Einzigartige Glasschüssel + DIY Bronze Accessoires'
      },
      desc: {
        en: 'A warm, earthy taupe finish in an elegant satin sheen, beautifully contrasted by striking bronze accents. The transparent glass bowl adds a touch of modern lightness to this grounded, organic design.',
        de: 'Ein warmes, erdiges Graubraun in elegantem Seidenmatt, wunderschön kontrastiert durch markante Bronze-Akzente. Die transparente Glasschüssel verleiht diesem organischen Design eine moderne Leichtigkeit.'
      },
      price: 349.00,
      shippingGroup: 'mixer',
      stock: 1,
      isActive: true,
      modelUrl: 'assets/models/mixer_brown.glb',
      linkedAccessoryId: 'acc-knobs-bronze',
      accessoryModelUrl: 'assets/models/knobs_bronze.glb',
      accessoryNote: {
        en: 'Included: Custom 3D Bronze Knob Set (also available separately)',
        de: 'Inklusive: 3D-Bronze-Knopfset (auch einzeln erhältlich)'
      },
      images: [
        'assets/shop_images/mixer_brown(1).jpeg',
        'assets/shop_images/mixer_brown(2).jpeg'
      ],
      specs: {
        finish: '2K Satin Taupe & Metallic Bronze',
        bowl: '4.8L Vintage Glass Bowl',
        overhaul: 'Full mechanical rebuild, food-grade grease & new seals'
      }
    },
    {
      id: 'mixer-velvet-bloom',
      sku: 'KA-MIX-02',
      category: 'mixer',
      editionNumber: '02',
      kicker: { en: 'KitchenAid Restoration 02', de: 'KitchenAid Restaurierung 02' },
      title: { en: 'Velvet Bloom', de: 'Velvet Bloom' },
      subtitle: {
        en: 'Powder Pink + Dark Rose Gold',
        de: 'Puderrosa + Dunkles Roségold'
      },
      desc: {
        en: 'Softness meets sophistication. A velvety powder pink matte finish complemented by deep, luxurious dark rose gold hardware. Crowned with a bespoke rose-patterned cover, it is a true statement piece.',
        de: 'Sanftheit trifft auf Raffinesse. Ein samtiges, puderrosafarbenes Matt-Finish, ergänzt durch tiefe, luxuriöse dunkle Roségold-Elemente. Gekrönt von einer maßgeschneiderten Abdeckung im Rosendesign ist sie ein absolutes Statement-Piece.'
      },
      price: 399.00,
      shippingGroup: 'mixer',
      stock: 1,
      isActive: true,
      modelUrl: 'assets/models/mixer_rose.glb',
      linkedAccessoryId: 'acc-frontpanel-rose',
      accessoryModelUrl: 'assets/models/frontpanel_rose.glb',
      accessoryNote: {
        en: 'Included: 3D Rose Attachment Hub Cover (also available separately)',
        de: 'Inklusive: 3D-Rosendesign Nabenabdeckung (auch einzeln erhältlich)'
      },
      images: [
        'assets/shop_images/mixer_rose(1).jpeg',
        'assets/shop_images/mixer_rose(2).jpeg',
        'assets/shop_images/mixer_rose(3).jpeg'
      ],
      specs: {
        finish: '2K Matte Powder Pink & Dark Rose Gold',
        bowl: 'Polished Stainless Steel Bowl',
        overhaul: 'Full mechanical rebuild, food-grade grease & new seals'
      }
    },
    {
      id: 'mixer-reseda-olive',
      sku: 'KA-MIX-03',
      category: 'mixer',
      editionNumber: '03',
      kicker: { en: 'KitchenAid Restoration 03', de: 'KitchenAid Restaurierung 03' },
      title: { en: 'Reseda & Olive', de: 'Reseda & Oliv' },
      subtitle: {
        en: 'Matte Reseda + Gloss Olive',
        de: 'Matt Reseda + Glanzoliv'
      },
      desc: {
        en: 'Deeply rooted in nature. The matte reseda green body absorbs the light, while high-gloss olive details provide a rich, tactile contrast. Paired with a classic glass bowl for timeless elegance.',
        de: 'Tief in der Natur verwurzelt. Das matte Resedagrün absorbiert das Licht, während hochglänzende olivgrüne Details einen faszinierenden Kontrast bieten. Kombiniert mit einer klassischen Glasschüssel für zeitlose Eleganz.'
      },
      price: 379.00,
      shippingGroup: 'mixer',
      stock: 1,
      isActive: true,
      modelUrl: 'assets/models/mixer_green_glass.glb',
      linkedAccessoryId: 'acc-dock-green',
      accessoryModelUrl: 'assets/models/accessoires_base_green.glb',
      accessoryNote: {
        en: 'Matching 3D Bayonet Attachment Organizer Dock available',
        de: 'Passende 3D-Bajonett-Aufsatzhalterung separat oder im Bundle'
      },
      images: [
        'assets/shop_images/mixer_green(1).jpeg',
        'assets/shop_images/mixer_green(2).jpeg',
        'assets/shop_images/mixer_green(3).jpeg'
      ],
      specs: {
        finish: '2K Matte Reseda Green & High-Gloss Olive',
        bowl: '4.8L Classic Glass Bowl',
        overhaul: 'Full mechanical rebuild, food-grade grease & new seals'
      }
    },
    {
      id: 'mixer-classic-elegance',
      sku: 'KA-MIX-04',
      category: 'mixer',
      editionNumber: '04',
      kicker: { en: 'KitchenAid Restoration 04', de: 'KitchenAid Restaurierung 04' },
      title: { en: 'Classic Elegance', de: 'Classic Elegance' },
      subtitle: {
        en: 'Signal White + Brushed Gold',
        de: 'Signalweiß + Gebürstetes Gold'
      },
      desc: {
        en: 'Minimalist perfection. A flawless, semi-gloss signal white body that reflects light beautifully, elevated by bespoke brushed gold knobs. It is the ultimate expression of clean, architectural luxury.',
        de: 'Minimalistische Perfektion. Ein makelloser, seidenmatter signalweißer Korpus, der das Licht sanft reflektiert, veredelt durch maßgefertigte Knöpfe aus gebürstetem Gold. Der ultimative Ausdruck von purem, architektonischem Luxus.'
      },
      price: 379.00,
      shippingGroup: 'mixer',
      stock: 1,
      isActive: true,
      modelUrl: 'assets/models/mixer_white.glb',
      linkedAccessoryId: 'acc-frontpanel-red',
      accessoryModelUrl: 'assets/models/frontpanel_red.glb',
      accessoryNote: {
        en: 'Custom 3D Front Badge & Brushed Gold Controls',
        de: '3D-Frontblende & Gebürstete Gold-Bedienelemente'
      },
      images: [
        'assets/shop_images/mixer_white(1).jpeg',
        'assets/shop_images/mixer_white(2).jpeg'
      ],
      specs: {
        finish: '2K Semi-Gloss Signal White & Brushed Gold',
        bowl: 'Brushed Stainless Steel Bowl',
        overhaul: 'Full mechanical rebuild, food-grade grease & new seals'
      }
    },
    {
      id: 'mixer-nordic-dove',
      sku: 'KA-MIX-05',
      category: 'mixer',
      editionNumber: '05',
      kicker: { en: 'KitchenAid Restoration 05', de: 'KitchenAid Restaurierung 05' },
      title: { en: 'Nordic Dove', de: 'Nordic Dove' },
      subtitle: {
        en: 'Matte Dove Blue + Walnut Trim',
        de: 'Matt Taubenblau + Walnussholz'
      },
      desc: {
        en: 'Inspired by mid-century modern design. A calming matte dove blue pairs seamlessly with the cool, industrial edge of brushed aluminum. The genuine walnut wood trim brings warmth and masterful craftsmanship to your kitchen.',
        de: 'Inspiriert vom Mid-Century Modern Design. Ein beruhigendes mattes Taubenblau verbindet sich nahtlos mit der kühlen, industriellen Note von gebürstetem Aluminium. Die Zierleiste aus echtem Walnussholz bringt Wärme und meisterhafte Handwerkskunst in Ihre Küche.'
      },
      price: 379.00,
      shippingGroup: 'mixer',
      stock: 1,
      isActive: true,
      modelUrl: 'assets/models/mixer_blue.glb',
      linkedAccessoryId: 'acc-frontpanel-white',
      accessoryModelUrl: 'assets/models/frontpanel_white.glb',
      accessoryNote: {
        en: 'Minimalist 3D Front Plate & Genuine Walnut Trim',
        de: 'Minimalistische 3D-Frontblende & Echtes Walnussholz-Zierband'
      },
      images: [
        'assets/shop_images/mixer_blue(1).jpeg',
        'assets/shop_images/mixer_blue(2).jpeg',
        'assets/shop_images/mixer_blue(3).jpeg'
      ],
      specs: {
        finish: '2K Matte Dove Blue & Oiled Walnut Veneer',
        bowl: 'Polished Stainless Steel Bowl',
        overhaul: 'Full mechanical rebuild, food-grade grease & new seals'
      }
    },

    // --- BUYABLE 3D-PRINTED ACCESSORIES & UPGRADE PARTS ---
    {
      id: 'acc-dock-green',
      sku: 'KA-ACC-01',
      category: 'accessory',
      badge: { en: 'Bestseller • 3D Dock', de: 'Bestseller • 3D-Halter' },
      title: {
        en: '3-Slot Bayonet Attachment Organizer Dock',
        de: '3-fach Bajonett-Aufsatzhalterung (Organizer Dock)'
      },
      subtitle: {
        en: 'Spring-Loaded Twist-Lock Stand for Whisk, Flat Beater & Dough Hook',
        de: 'Federbelastete Bajonett-Tischhalterung für Schneebesen, Flachrührer & Knethaken'
      },
      desc: {
        en: 'Precision-engineered 3D-printed countertop or cabinet organizer with authentic spring-loaded KitchenAid bayonet pins. Twist and lock your wire whisk, flat beater, and dough hook securely in place.',
        de: 'Präzisionsgefertigte 3D-Halterung mit echten, federbelasteten Bajonett-Aufnahmen wie an der Maschine selbst. Schneebesen, Flachrührer und Knethaken rasten mit einer kurzen Drehung sicher und aufgeräumt ein.'
      },
      price: 29.00,
      shippingGroup: 'accessory',
      stock: 12,
      isActive: true,
      modelUrl: 'assets/models/accessoires_base_green.glb',
      images: [
        'assets/shop_images/mixer_accesoires(1).jpeg',
        'assets/shop_images/mixer_accesoires(2).jpeg'
      ],
      options: [
        { en: 'Matte Black', de: 'Mattschwarz' },
        { en: 'Reseda Olive', de: 'Reseda-Oliv' },
        { en: 'Truffle Bronze', de: 'Trüffel-Bronze' }
      ],
      specs: {
        material: 'Carbon-reinforced PETG + Stainless Steel Springs',
        compatibility: 'Fits all KitchenAid 4.3L / 4.8L Tilt-Head attachments'
      }
    },
    {
      id: 'acc-knobs-bronze',
      sku: 'KA-ACC-02',
      category: 'accessory',
      badge: { en: '3-Piece Set', de: '3er-Komplettset' },
      title: {
        en: 'Knurled Bronze Knob & Hub Cover Set',
        de: 'Rändel-Knopfset & Rosencover (Bronze-Finish)'
      },
      subtitle: {
        en: '2× Diamond-Knurled Lever Knobs + 1× Sculpted Rose Hub Cap',
        de: '2× Rändel-Bedienknöpfe + 1× Skulpturale Rosen-Nabenabdeckung'
      },
      desc: {
        en: 'Upgrade your KitchenAid controls with tactile diamond-knurled speed and lock levers plus the signature 3D sculpted rose attachment hub cover in a warm metallic bronze finish.',
        de: 'Veredele deine KitchenAid mit griffig gerändelten Bedienknöpfen für Geschwindigkeits- und Kopfarretierung sowie der skulpturalen 3D-Rosen-Nabenabdeckung im edlen Bronze-Metallic-Finish.'
      },
      price: 24.00,
      shippingGroup: 'accessory',
      stock: 15,
      isActive: true,
      modelUrl: 'assets/models/knobs_bronze.glb',
      images: [
        'assets/shop_images/mixer_knobs.jpeg',
        'assets/shop_images/mixer_brown(1).jpeg'
      ],
      options: [
        { en: 'Antique Bronze', de: 'Antik-Bronze' },
        { en: 'Dark Rose Gold', de: 'Dunkles Roségold' },
        { en: 'Brushed Gold', de: 'Gebürstetes Gold' }
      ],
      specs: {
        material: 'Metallic-Pigmented PLA+/PETG with 2K Matte Clearcoat',
        compatibility: 'Artisan / Classic Tilt-Head models (press/thread fit)'
      }
    },
    {
      id: 'acc-frontpanel-rose',
      sku: 'KA-ACC-03',
      category: 'accessory',
      badge: { en: 'Statement Piece', de: 'Statement-Unikat' },
      title: {
        en: '3D Rose Bloom Attachment Hub Cover',
        de: '3D „Rose Bloom“ Nabenabdeckung'
      },
      subtitle: {
        en: 'Sculpted Rose Relief Front Cap for the Accessory Hub',
        de: 'Skulpturale Rosen-Frontkappe für die Zubehör-Nabe'
      },
      desc: {
        en: 'Designed for the Velvet Bloom edition: replaces the standard chrome hub cap with an intricate, multi-layered 3D rose relief in dark rose gold or antique bronze.',
        de: 'Entwickelt für die „Velvet Bloom“-Edition: Ersetzt die Standard-Nabenkappe durch ein detailreiches, skulpturales 3D-Rosenrelief in dunklem Roségold oder Antik-Bronze.'
      },
      price: 16.00,
      shippingGroup: 'accessory',
      stock: 18,
      isActive: true,
      modelUrl: 'assets/models/frontpanel_rose.glb',
      images: [
        'assets/shop_images/mixer_knobs.jpeg',
        'assets/shop_images/mixer_rose(2).jpeg'
      ],
      options: [
        { en: 'Dark Rose Gold', de: 'Dunkles Roségold' },
        { en: 'Antique Bronze', de: 'Antik-Bronze' },
        { en: 'Pearl White', de: 'Perlweiß' }
      ],
      specs: {
        material: 'High-Detail 3D Print + Metallic Patina Finish',
        compatibility: 'Fits all KitchenAid front attachment hubs'
      }
    },
    {
      id: 'acc-knobs-rose-pair',
      sku: 'KA-ACC-04',
      category: 'accessory',
      badge: { en: 'Ergonomic Upgrade', de: 'Ergonomie-Upgrade' },
      title: {
        en: 'Diamond-Knurled Lever Knob Pair (Speed & Tilt Lock)',
        de: '2er-Set Rändel-Bedienknöpfe (Speed & Lock)'
      },
      subtitle: {
        en: 'Precision Large & Small Knurled Knobs for Side Levers',
        de: 'Großer & kleiner Rändelknopf für Geschwindigkeits- & Kopfarretierung'
      },
      desc: {
        en: 'Replaces the stock plastic lever tips with cylindrical diamond-knurled custom knobs. Includes both the larger lock-lever knob and the compact speed-selector knob.',
        de: 'Ersetzt die serienmäßigen Kunststoffhebel durch zylindrische, fein gerändelte Custom-Knöpfe. Enthält sowohl den großen Arretierknopf als auch den kompakten Geschwindigkeitsknopf.'
      },
      price: 18.00,
      shippingGroup: 'accessory',
      stock: 20,
      isActive: true,
      modelUrl: 'assets/models/bigknob_rose.glb',
      secondaryModelUrl: 'assets/models/smallknob_rose.glb',
      images: [
        'assets/shop_images/mixer_knobs.jpeg',
        'assets/shop_images/mixer_rose(3).jpeg'
      ],
      options: [
        { en: 'Dark Rose Gold', de: 'Dunkles Roségold' },
        { en: 'Antique Bronze', de: 'Antik-Bronze' },
        { en: 'Matte Black', de: 'Mattschwarz' }
      ],
      specs: {
        material: 'Precision 0.12mm Layer 3D Print + Metallic Finish',
        compatibility: 'Artisan / Classic side levers'
      }
    },
    {
      id: 'acc-frontpanel-red',
      sku: 'KA-ACC-05',
      category: 'accessory',
      badge: { en: 'Custom Trim', de: 'Custom-Blende' },
      title: {
        en: 'Custom Front Badge & Hub Escutcheon (Crimson / Gold)',
        de: 'Custom Frontblende & Nabenring (Karmesin / Gold)'
      },
      subtitle: {
        en: 'Architectural Front Nose Trim Plate',
        de: 'Architektonische Stirnblende für den Motorkopf'
      },
      desc: {
        en: 'Give your KitchenAid a clean, bespoke front silhouette. Custom 3D-modeled front escutcheon plate available in classic crimson, brushed gold, or custom color match.',
        de: 'Verleiht dem Motorkopf deiner KitchenAid eine cleane Manufaktur-Optik. Maßgefertigte 3D-Frontblende in Karmesinrot, gebürstetem Gold oder Wunschfarbe.'
      },
      price: 19.00,
      shippingGroup: 'accessory',
      stock: 10,
      isActive: true,
      modelUrl: 'assets/models/frontpanel_red.glb',
      images: [
        'assets/shop_images/mixer_white(2).jpeg',
        'assets/shop_images/mixer_white(1).jpeg'
      ],
      options: [
        { en: 'Crimson Red', de: 'Karmesinrot' },
        { en: 'Brushed Gold', de: 'Gebürstetes Gold' },
        { en: 'Signal White', de: 'Signalweiß' }
      ],
      specs: {
        material: 'Heat-Resistant PETG + 2K Automotive Coat',
        compatibility: 'KitchenAid Tilt-Head Series'
      }
    },
    {
      id: 'acc-frontpanel-white',
      sku: 'KA-ACC-06',
      category: 'accessory',
      badge: { en: 'Nordic Series', de: 'Nordic Serie' },
      title: {
        en: 'Minimalist Nordic Front Trim Plate & Hub Cap',
        de: 'Minimalistische „Nordic“ Frontblende & Nabenkappe'
      },
      subtitle: {
        en: 'Clean Flush-Mount Front Cover Set',
        de: 'Flächenbündige Design-Frontabdeckung'
      },
      desc: {
        en: 'Featured on our Nordic Dove restoration: a clean, minimalist front trim assembly that pairs effortlessly with wood or brushed metal bands.',
        de: 'Bekannt aus unserer „Nordic Dove“-Restaurierung: Eine flächenbündige, skandinavisch-cleane Frontblende, die perfekt mit Holz- oder Aluminium-Zierbändern harmoniert.'
      },
      price: 19.00,
      shippingGroup: 'accessory',
      stock: 14,
      isActive: true,
      modelUrl: 'assets/models/frontpanel_white.glb',
      images: [
        'assets/shop_images/mixer_blue(2).jpeg',
        'assets/shop_images/mixer_blue(3).jpeg'
      ],
      options: [
        { en: 'Nordic White', de: 'Nordic-Weiß' },
        { en: 'Dove Blue', de: 'Taubenblau' },
        { en: 'Walnut Tone', de: 'Walnuss-Optik' }
      ],
      specs: {
        material: 'Precision PETG + Satin Clearcoat',
        compatibility: 'KitchenAid Tilt-Head Series'
      }
    }
  ];

  // ==========================================================================
  // 2. DEMO ORDERS FOR ADMIN BACKEND INITIAL SEED
  // ==========================================================================
  const DEFAULT_ORDERS = [
    {
      id: 'ord-1001',
      orderNumber: 'KA-2026-1041',
      createdAt: '2026-10-27T14:22:00.000Z',
      customer: {
        firstName: 'lena',
        lastName: 'Bergmann',
        name: 'Lena Bergmann',
        email: 'lena.bergmann@example.de',
        phone: '+49 172 4481920',
        street: 'Eppendorfer Weg 84',
        zip: '20259',
        city: 'Hamburg',
        country: 'DE',
        notes: 'Bitte vor dem Versand kurz Bescheid geben.'
      },
      items: [
        {
          productId: 'mixer-velvet-bloom',
          sku: 'KA-MIX-02',
          title: 'Velvet Bloom (KitchenAid Restoration 02)',
          option: 'Standard Edition',
          category: 'mixer',
          unitPrice: 399.00,
          quantity: 1
        },
        {
          productId: 'acc-dock-green',
          sku: 'KA-ACC-01',
          title: '3-Slot Bayonet Attachment Organizer Dock',
          option: 'Mattschwarz',
          category: 'accessory',
          unitPrice: 29.00,
          quantity: 1
        }
      ],
      subtotal: 428.00,
      shipping: 10.00,
      total: 438.00,
      paymentMethod: 'invoice',
      paymentStatus: 'paid',
      fulfillmentStatus: 'shipped',
      trackingNumber: 'DHL-0034043419283'
    },
    {
      id: 'ord-1002',
      orderNumber: 'KA-2026-1042',
      createdAt: '2026-10-29T09:15:00.000Z',
      customer: {
        firstName: 'Markus',
        lastName: 'Vogel',
        name: 'Markus Vogel',
        email: 'm.vogel@example.com',
        phone: '+49 151 8920311',
        street: 'Schloßstraße 19',
        zip: '56068',
        city: 'Koblenz',
        country: 'DE',
        notes: 'Farbwunsch für das Knopfset: Antik-Bronze passend zu meiner braunen Maschine.'
      },
      items: [
        {
          productId: 'acc-knobs-bronze',
          sku: 'KA-ACC-02',
          title: 'Knurled Bronze Knob & Hub Cover Set',
          option: 'Antik-Bronze',
          category: 'accessory',
          unitPrice: 24.00,
          quantity: 1
        },
        {
          productId: 'acc-dock-green',
          sku: 'KA-ACC-01',
          title: '3-Slot Bayonet Attachment Organizer Dock',
          option: 'Trüffel-Bronze',
          category: 'accessory',
          unitPrice: 29.00,
          quantity: 1
        }
      ],
      subtotal: 53.00,
      shipping: 4.90,
      total: 57.90,
      paymentMethod: 'paypal',
      paymentStatus: 'paid',
      fulfillmentStatus: 'in_workshop',
      trackingNumber: ''
    }
  ];

  const DEFAULT_SETTINGS = {
    shopName: 'Krahn Manufaktur – KitchenAid Restorations & 3D Parts',
    shippingMixerDE: 10.00,
    shippingAccessoryDE: 4.90,
    freeShippingThreshold: 450.00,
    adminPin: '2026',
    workshopStatus: 'Open for Commissions & Immediate Dispatch'
  };

  // ==========================================================================
  // 3. HELPER & STORAGE FUNCTIONS
  // ==========================================================================
  function safeRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeWrite(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
  }

  // Merge stored product overrides with DEFAULT_PRODUCTS so new fields/products always exist
  function loadCatalog() {
    const saved = safeRead(STORAGE_KEYS.PRODUCTS, null);
    if (!Array.isArray(saved) || saved.length === 0) {
      safeWrite(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
      return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    }
    const map = new Map(saved.map(p => [p.id, p]));
    const merged = DEFAULT_PRODUCTS.map(def => {
      const ov = map.get(def.id);
      if (!ov) return JSON.parse(JSON.stringify(def));
      return Object.assign({}, JSON.parse(JSON.stringify(def)), ov, {
        title: Object.assign({}, def.title, ov.title || {}),
        subtitle: Object.assign({}, def.subtitle, ov.subtitle || {}),
        desc: Object.assign({}, def.desc, ov.desc || {})
      });
    });
    // Include any custom products added via Admin
    saved.forEach(p => {
      if (!DEFAULT_PRODUCTS.some(d => d.id === p.id)) {
        merged.push(p);
      }
    });
    return merged;
  }

  function loadOrders() {
    const saved = safeRead(STORAGE_KEYS.ORDERS, null);
    if (!Array.isArray(saved)) {
      safeWrite(STORAGE_KEYS.ORDERS, DEFAULT_ORDERS);
      return JSON.parse(JSON.stringify(DEFAULT_ORDERS));
    }
    return saved;
  }

  function loadSettings() {
    const saved = safeRead(STORAGE_KEYS.SETTINGS, null);
    return Object.assign({}, DEFAULT_SETTINGS, saved || {});
  }

  let catalog = loadCatalog();
  let cart = safeRead(STORAGE_KEYS.CART, []);
  let orders = loadOrders();
  let settings = loadSettings();

  function emitChange(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // ==========================================================================
  // 4. PUBLIC STORE API (`window.KAShopStore`)
  // ==========================================================================
  const KAShopStore = {
    getLang() {
      return document.body?.getAttribute('data-current-lang') || localStorage.getItem('shopLang') || 'en';
    },

    t(val) {
      if (!val) return '';
      if (typeof val === 'string') return val;
      const lang = this.getLang();
      return val[lang] || val.en || val.de || '';
    },

    formatPrice(amount) {
      const num = Number(amount) || 0;
      const lang = this.getLang();
      if (lang === 'de') {
        return num.toFixed(2).replace('.', ',') + ' €';
      }
      return '€ ' + (num % 1 === 0 ? num.toFixed(0) : num.toFixed(2));
    },

    // --- PRODUCTS ---
    getProducts(filterCategory) {
      if (!filterCategory) return catalog;
      return catalog.filter(p => p.category === filterCategory);
    },

    getProductById(id) {
      return catalog.find(p => p.id === id) || null;
    },

    updateProduct(id, patch) {
      const idx = catalog.findIndex(p => p.id === id);
      if (idx === -1) return null;
      const current = catalog[idx];
      catalog[idx] = Object.assign({}, current, patch);
      safeWrite(STORAGE_KEYS.PRODUCTS, catalog);
      emitChange('kaProductsUpdated', { product: catalog[idx], catalog });
      this.syncBackend('save_product', catalog[idx]);
      return catalog[idx];
    },

    addProduct(newProd) {
      const id = newProd.id || ('custom-' + Date.now());
      const product = Object.assign({
        id,
        sku: 'KA-CUS-' + Math.floor(100 + Math.random() * 900),
        category: 'accessory',
        badge: { en: 'Custom Part', de: 'Sonderteil' },
        title: { en: newProd.titleEn || 'New 3D Accessory', de: newProd.titleDe || 'Neues 3D-Zubehör' },
        subtitle: { en: newProd.subtitleEn || 'Custom 3D Printed Part', de: newProd.subtitleDe || 'Maßgefertigtes 3D-Bauteil' },
        desc: { en: newProd.descEn || '', de: newProd.descDe || '' },
        price: Number(newProd.price) || 19.00,
        shippingGroup: newProd.category === 'mixer' ? 'mixer' : 'accessory',
        stock: Number(newProd.stock ?? 5),
        isActive: true,
        modelUrl: newProd.modelUrl || 'assets/models/knobs_bronze.glb',
        images: [newProd.image || 'assets/shop_images/mixer_knobs.jpeg'],
        options: [{ en: 'Standard', de: 'Standard' }]
      }, newProd);
      catalog.push(product);
      safeWrite(STORAGE_KEYS.PRODUCTS, catalog);
      emitChange('kaProductsUpdated', { product, catalog });
      this.syncBackend('save_product', product);
      return product;
    },

    resetCatalogToDefaults() {
      catalog = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      safeWrite(STORAGE_KEYS.PRODUCTS, catalog);
      emitChange('kaProductsUpdated', { catalog });
      return catalog;
    },

    // --- CART ---
    getCart() {
      return cart;
    },

    getCartCount() {
      return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    },

    addToCart(productId, quantity = 1, selectedOption = '') {
      const product = this.getProductById(productId);
      if (!product || !product.isActive || product.stock <= 0) {
        return { ok: false, reason: 'unavailable' };
      }

      const opt = selectedOption || (product.options?.[0] ? this.t(product.options[0]) : 'Standard');
      const cartItemId = `${productId}::${opt}`;
      const existing = cart.find(item => item.cartItemId === cartItemId);

      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + quantity);
        existing.quantity = nextQty;
      } else {
        cart.push({
          cartItemId,
          productId: product.id,
          sku: product.sku,
          category: product.category,
          title: product.title,
          subtitle: product.subtitle,
          unitPrice: Number(product.price),
          image: product.images?.[0] || 'assets/shop_images/mixer_knobs.jpeg',
          modelUrl: product.modelUrl,
          option: opt,
          quantity: Math.min(product.stock, Math.max(1, quantity))
        });
      }

      safeWrite(STORAGE_KEYS.CART, cart);
      emitChange('kaCartUpdated', { cart, addedProduct: product });
      return { ok: true, product };
    },

    updateCartQuantity(cartItemId, nextQty) {
      const idx = cart.findIndex(i => i.cartItemId === cartItemId);
      if (idx === -1) return;
      const product = this.getProductById(cart[idx].productId);
      const maxStock = product ? Math.max(1, product.stock) : 99;

      if (nextQty <= 0) {
        cart.splice(idx, 1);
      } else {
        cart[idx].quantity = Math.min(maxStock, nextQty);
      }
      safeWrite(STORAGE_KEYS.CART, cart);
      emitChange('kaCartUpdated', { cart });
    },

    removeFromCart(cartItemId) {
      cart = cart.filter(i => i.cartItemId !== cartItemId);
      safeWrite(STORAGE_KEYS.CART, cart);
      emitChange('kaCartUpdated', { cart });
    },

    clearCart() {
      cart = [];
      safeWrite(STORAGE_KEYS.CART, cart);
      emitChange('kaCartUpdated', { cart });
    },

    getCartTotals() {
      const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      if (cart.length === 0) {
        return { subtotal: 0, shipping: 0, total: 0 };
      }
      const hasMixer = cart.some(item => item.category === 'mixer');
      let shipping = hasMixer ? Number(settings.shippingMixerDE) : Number(settings.shippingAccessoryDE);
      if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
        shipping = 0;
      }
      return {
        subtotal,
        shipping,
        total: subtotal + shipping
      };
    },

    // --- ORDERS & CHECKOUT ---
    getOrders() {
      return orders;
    },

    async createOrder(customerData, paymentMethod = 'invoice') {
      const totals = this.getCartTotals();
      const orderNum = 'KA-' + new Date().getFullYear() + '-' + Math.floor(1050 + Math.random() * 8900);
      const order = {
        id: 'ord-' + Date.now(),
        orderNumber: orderNum,
        createdAt: new Date().toISOString(),
        customer: {
          firstName: customerData.firstName || '',
          lastName: customerData.lastName || '',
          name: `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim(),
          email: customerData.email || '',
          phone: customerData.phone || '',
          street: customerData.street || '',
          zip: customerData.zip || '',
          city: customerData.city || '',
          country: customerData.country || 'DE',
          notes: customerData.notes || ''
        },
        items: cart.map(item => ({
          productId: item.productId,
          sku: item.sku,
          title: this.t(item.title),
          option: item.option,
          category: item.category,
          unitPrice: item.unitPrice,
          quantity: item.quantity
        })),
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
        paymentMethod,
        paymentStatus: paymentMethod === 'paypal' ? 'paid' : 'pending_transfer',
        fulfillmentStatus: 'new_order',
        trackingNumber: ''
      };

      // Decrement stock for ordered items
      order.items.forEach(item => {
        const prod = this.getProductById(item.productId);
        if (prod && typeof prod.stock === 'number') {
          prod.stock = Math.max(0, prod.stock - item.quantity);
        }
      });
      safeWrite(STORAGE_KEYS.PRODUCTS, catalog);

      orders.unshift(order);
      safeWrite(STORAGE_KEYS.ORDERS, orders);
      this.clearCart();

      emitChange('kaOrdersUpdated', { orders, newOrder: order });
      emitChange('kaProductsUpdated', { catalog });

      // Attempt backend PHP persistence & email notification
      await this.syncBackend('create_order', order);

      return order;
    },

    updateOrder(orderId, patch) {
      const idx = orders.findIndex(o => o.id === orderId);
      if (idx === -1) return null;
      orders[idx] = Object.assign({}, orders[idx], patch);
      safeWrite(STORAGE_KEYS.ORDERS, orders);
      emitChange('kaOrdersUpdated', { orders, updatedOrder: orders[idx] });
      this.syncBackend('update_order', orders[idx]);
      return orders[idx];
    },

    deleteOrder(orderId) {
      orders = orders.filter(o => o.id !== orderId);
      safeWrite(STORAGE_KEYS.ORDERS, orders);
      emitChange('kaOrdersUpdated', { orders });
      this.syncBackend('delete_order', { id: orderId });
    },

    getSettings() {
      return settings;
    },

    updateSettings(patch) {
      settings = Object.assign({}, settings, patch);
      safeWrite(STORAGE_KEYS.SETTINGS, settings);
      emitChange('kaSettingsUpdated', { settings });
      return settings;
    },

    async syncBackend(action, payload) {
      try {
        const res = await fetch('api/shop_api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload, lang: this.getLang() })
        });
        if (!res.ok) return null;
        const text = await res.text();
        if (text.includes('<?php')) return null;
        return JSON.parse(text);
      } catch (_) {
        // Graceful local fallback when running without PHP server
        return null;
      }
    }
  };

  window.KAShopStore = KAShopStore;
})();
