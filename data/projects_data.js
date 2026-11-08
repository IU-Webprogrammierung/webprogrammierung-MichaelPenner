/**
 * ============================================================================
 * ZENTRALE PROJEKT- & MANUFAKTUR-DATENBANK (projects_data.js)
 * ============================================================================
 * Neues Projekt in 2 Minuten hinzufügen:
 * 1. Für physische / Embedded-Projekte (Sektion 1: Bento-Grid + Case-Study-Modal):
 *    Einfach ein neues Objekt in `PORTFOLIO_DATA.customBuilds` einfügen.
 * 2. Für Web-Showcases im 3D-Browser-Stapel (Sektion 2: Interactive Web Showcase):
 *    Einfach ein neues Objekt in `PORTFOLIO_DATA.webShowcase` einfügen.
 * 3. Für kaufbare Produkte / Shops (Sektion 3: Manufaktur & Shops):
 *    In `PORTFOLIO_DATA.manufaktur` anpassen oder erweitern.
 */

window.PORTFOLIO_DATA = {
  // ==========================================================================
  // SEKTION 1: CREATIVE ENGINEERING & CUSTOM BUILDS (Bento-Grid + Modals)
  // ==========================================================================
  customBuilds: [
    {
      id: "cloud-ceiling",
      bentoSize: "large",
      featured: true,
      year: "2024",
      status: {
        de: "Smart Home & 3D-Light",
        en: "Smart Home & 3D Light"
      },
      tags: ["ESPHome", "3D-Druck", "SCD41 CO₂", "RGBW LEDs"],
      title: {
        de: "Wolkendecke & 3D-Heißluftballons",
        en: "Cloud Ceiling & 3D Hot Air Balloons"
      },
      subtitle: {
        de: "Interaktive Kinderzimmer-Lichtinstallation mit 3D-gedruckten Ballons & CO₂-Sensorik",
        en: "Interactive nursery light installation with 3D-printed balloons & CO₂ sensing"
      },
      shortDesc: {
        de: "Schwebende Wolkendecke mit leuchtenden 3D-Heißluftballons, sanften ESPHome-Sonnenaufgängen und unsichtbarer Raumklima-Überwachung.",
        en: "Floating cloud ceiling with glowing 3D-printed hot air balloons, gentle ESPHome sunrises, and invisible air-quality telemetry."
      },
      media: {
        thumbnail: "assets/images/Screenshot 2026-10-29 224853.png",
        hoverVideo: "",
        gallery: [
          {
            src: "assets/images/Screenshot 2026-10-29 224853.png",
            caption: {
              de: "Abendstimmung im Kinderzimmer: Drei warm leuchtende 3D-gedruckte Heißluftballons an Textilkabeln unter den blau illuminierten LED-Wolken.",
              en: "Evening mood in the nursery: Three warm-glowing 3D-printed hot air balloons suspended on braided cords beneath blue-lit LED clouds."
            }
          },
          {
            src: "assets/images/Screenshot 2026-10-29 224754.png",
            caption: {
              de: "Detailaufnahme eines schwebenden 3D-Heißluftballons mit feiner Lichtdiffusion durch die Ballonhülle und geriffeltem Korb.",
              en: "Close-up of a suspended 3D-printed hot air balloon showing warm light diffusion through the envelope and ribbed basket."
            }
          },
          {
            src: "assets/images/Screenshot 2026-10-29 224631.png",
            caption: {
              de: "Passendes 3D-gedrucktes Raketen-Nachtlicht mit leuchtender Abgaswolke und Mini-Astronaut im Kinderzimmer-Regal.",
              en: "Matching 3D-printed rocket nightlight with glowing exhaust plume and mini astronaut on the nursery shelf."
            }
          },
          {
            src: "assets/projects/cloud-ceiling-detail.jpg",
            caption: {
              de: "Elektronik & Prototyping: ESP32-Controller und maßgefertigtes Sensor-Gehäuse für Home Assistant.",
              en: "Electronics & prototyping: ESP32 controller and custom sensor enclosure for Home Assistant."
            }
          }
        ]
      },
      caseStudy: {
        problem: {
          de: "Ein Kinderzimmer sollte gleichzeitig eine beruhigende, märchenhafte Einschlaf-Atmosphäre bieten und ein echtes Alltagsproblem lösen: unbemerkt steigende CO2-Werte über Nacht bei geschlossener Tür – ganz ohne störende, technisch aussehende Messgeräte.",
          en: "A nursery needed both a calming, magical bedtime atmosphere and a solution to a real everyday problem: rising CO2 levels overnight with the door closed—without intrusive, industrial-looking sensor boxes."
        },
        solution: {
          de: "Ich habe eine mehrteilige Deckeninstallation entworfen, in der einzeln adressierbare LED-Strips in schwer entflammbares Akustik-/Wolkenvlies eingebettet sind. Darunter schweben im CAD designte, mehrfarbig 3D-gedruckte Heißluftballons mit geflochtenem Korb-Detail. Ein ESP32 mit ESPHome steuert nicht nur dynamische Lichtszenen (Gewitterleuchten, Abendrot, Nachtlicht), sondern liest auch einen hochpräzisen SCD41 NDIR-CO2-Sensor aus und visualisiert Lüftungsbedarf sanft über einen Farbverlauf am Wolkenrand sowie in Home Assistant.",
          en: "I engineered a modular ceiling installation embedding individually addressable LED strips inside flame-retardant cloud batting, accented by multi-color 3D-printed hot air balloons designed in CAD. An ESP32 running ESPHome drives dynamic lighting scenes (sunset, gentle nightlight, sunrise alarm) while reading a precision SCD41 NDIR CO2 sensor—subtly shifting a peripheral cloud edge hue when fresh air is needed and logging live telemetry to Home Assistant."
        },
        highlights: {
          de: [
            "NDIR CO2-Echtzeitmessung (Sensirion SCD41) inkl. Temperatur & Luftfeuchte nahtlos in Home Assistant integriert",
            "Maßgefertigte 3D-gedruckte Heißluftballons & belüftetes Sensor-Gehäuse aus mattem PLA/PETG",
            "Blendfreie, stufenlose Dimmung (1 % Nachtlicht bis Taghell) & automatische circadiane Lichtkurven via ESPHome",
            "Komplett lokaler Betrieb (100 % Cloud-frei, ausfallsicher über WLAN / Native Home Assistant API)"
          ],
          en: [
            "Real-time NDIR CO2 sensing (Sensirion SCD41) + temp/humidity seamlessly integrated into Home Assistant",
            "Custom CAD-designed 3D-printed hot air balloons & ventilated sensor housing in matte PLA/PETG",
            "Glare-free stepless dimming (1% nightlight to daylight) & circadian lighting automation via ESPHome",
            "100% local operation (cloud-free reliability via native Home Assistant API)"
          ]
        },
        techStack: ["ESP32", "ESPHome", "Home Assistant", "SCD41 CO2 Sensor", "WS2812B / SK6812 RGBW", "Fusion 360 CAD", "Bambu Lab Multi-Color"]
      },
      inquirySubject: {
        de: "Anfrage ähnlich zu: Kinderzimmer-Wolkendecke & Smart Lighting",
        en: "Inquiry similar to: Smart Nursery Cloud Ceiling & Lighting"
      },
      inquiryChip: "Smart Home / Elektronik-Projekt"
    },

    {
      id: "claw-machine-hw",
      bentoSize: "tall",
      featured: true,
      year: "2025",
      status: {
        de: "CoreXY • Arcade",
        en: "CoreXY • Arcade"
      },
      tags: ["CoreXY", "ESP32 + FastAPI", "3D-Druck", "WebSockets"],
      title: {
        de: "The CloudCatcher – Greifautomat",
        en: "The CloudCatcher – Claw Machine"
      },
      subtitle: {
        de: "Vernetzter CoreXY-Greifautomat mit Echtzeit-Touch-UI & 3D-Greifer",
        en: "Networked CoreXY arcade claw machine with live Touch UI & 3D claw"
      },
      shortDesc: {
        de: "Kompletter Eigenbau eines modernen Arcade-Greifautomaten auf Basis einer modifizierten CoreXY-Kinematik. Gesteuert über Dual-Controller (ESP32 Motion-Firmware + Raspberry Pi FastAPI Backend) mit interaktivem Touch-Dashboard und 8-Bit-Sound-Engine.",
        en: "Complete custom build of a modern arcade claw machine engineered from a modified CoreXY gantry. Powered by a dual-controller architecture (ESP32 motion firmware + Raspberry Pi FastAPI backend) with an interactive touch UI and 8-bit audio engine."
      },
      media: {
        thumbnail: "assets/projects/claw_hero.jpg",
        hoverVideo: "",
        gallery: [
          {
            src: "assets/projects/claw_hero.jpg",
            caption: {
              de: "The CloudCatcher im kompletten Hellblau/Wolken-Design mit beleuchtetem Innenraum.",
              en: "The CloudCatcher in its custom sky-blue cloud cabinet with illuminated prize bay."
            }
          },
          {
            src: "assets/projects/claw_closeup.jpg",
            caption: {
              de: "3D-gedruckter Präzisions-Greifkopf in Rot & Marineblau mit Seilwinden-Führung.",
              en: "Custom 3D-printed precision claw assembly in red & navy blue with winch routing."
            }
          },
          {
            src: "assets/projects/claw_gantry.jpg",
            caption: {
              de: "Modifizierte CoreXY-Riemenkinematik mit Stepper-Treibern und Endstop-Sensorik.",
              en: "Modified CoreXY belt kinematics with silent stepper drivers and limit switches."
            }
          },
          {
            src: "assets/projects/claw_showcase.jpg",
            caption: {
              de: "Detailansicht der Wolken-Spielfläche und des Preis-Auswurfschachts.",
              en: "Detail view of the cloud prize bed and prize drop chute."
            }
          }
        ]
      },
      caseStudy: {
        problem: {
          de: "Klassische Kirmes-Greifautomaten sind sperrig, laut, mechanisch unpräzise und kaum individualisierbar. Ziel war es, einen kompakten, flüsterleisen Design-Greifautomaten für Events, Hochzeiten oder Büros zu bauen, dessen Spielmechanik, Greifkraft und Soundeffekte komplett per Web-Oberfläche konfigurierbar sind.",
          en: "Traditional arcade claw machines are bulky, noisy, mechanically imprecise, and hard to customize. The goal was to engineer a compact, whisper-quiet designer claw machine for events, weddings, or offices whose gameplay physics, grip strength, and sound themes can be configured live via a web dashboard."
        },
        solution: {
          de: "Als hochpräzise Basis dient ein umgebauter Two Trees Sapphire S CoreXY-Rahmen. Die Z-Achse wurde durch eine im CAD konstruierte Seilwinden- und Greifer-Einheit ersetzt. Ein ESP32 übernimmt die verzögerungsfreie Stepper-Ansteuerung (TMC2209) und Endstops, während ein Raspberry Pi über WebSockets die Spiel-State-Machine, Gewinnquoten-Logik, Sound-Effekte und das Touch-Tablet-Frontend bereitstellt.",
          en: "Built around a repurposed Two Trees Sapphire S CoreXY frame, the Z-axis was replaced by a custom CAD-designed winch and 3-finger claw mechanism. An ESP32 handles real-time TMC2209 stepper control and limit switches, while a Raspberry Pi runs a FastAPI WebSocket backend serving the game state machine, win-rate logic, audio engine, and tablet UI."
        },
        highlights: {
          de: [
            "Präzise CoreXY-Kinematik mit lautlosen TMC2209 Stepper-Treibern & Sensorless/Endstop-Homing",
            "Dual-Stack Architektur: C++ PlatformIO Firmware (ESP32) + Python FastAPI Backend (Raspberry Pi)",
            "Interaktives Tablet-Touch-UI + Admin-Dashboard für Spielzeit, Greifkraft & Audio-Themes",
            "Komplett 3D-gedruckter Greifmechanismus, Seilwinde & Wolken-Inlays"
          ],
          en: [
            "High-precision CoreXY kinematics with silent TMC2209 stepper drivers & homing switches",
            "Dual-stack architecture: C++ PlatformIO firmware (ESP32) + Python FastAPI backend (Raspberry Pi)",
            "Interactive tablet touch UI + live admin dashboard for timer, claw strength & audio themes",
            "Fully 3D-printed claw mechanism, Z-winch & modular cloud inlays"
          ]
        },
        techStack: ["CoreXY Mechanics", "ESP32 (PlatformIO)", "Raspberry Pi", "FastAPI & WebSockets", "TMC2209 Steppers", "Bambu Lab 3D Print"],
        liveUrl: "../greifarm/frontend/iframe.html",
        liveLabel: {
          de: "Interaktive CloudCatcher Showcase-Seite öffnen ↗",
          en: "Open Interactive CloudCatcher Showcase ↗"
        }
      },
      inquirySubject: {
        de: "Anfrage ähnlich zu: Custom CoreXY Arcade Claw Machine",
        en: "Inquiry similar to: Custom CoreXY Arcade Claw Machine"
      },
      inquiryChip: "Smart Home / Elektronik-Projekt"
    },

    {
      id: "smart-planter",
      bentoSize: "normal",
      featured: true,
      year: "2025",
      status: {
        de: "ESP-NOW • Hydro IoT",
        en: "ESP-NOW • Hydro IoT"
      },
      tags: ["ESP32-C3", "ESP-NOW", "CYD Touch UI", "Peristaltik"],
      title: {
        de: "SmartPlanter – Autonomes Hydro-IoT",
        en: "SmartPlanter – Autonomous Hydro IoT"
      },
      subtitle: {
        de: "4-Zonen-Bewässerung mit Servo-pH-Lifter, Laser-Sensor & Funk-Touchdisplay",
        en: "4-zone irrigation with servo pH lifter, laser ToF sensor & wireless touch display"
      },
      shortDesc: {
        de: "Ein vollautonomes Bewässerungs- und Nährstoffsystem: 3 Peristaltikpumpen dosieren Dünger & pH-Puffer, ein Servo-Arm taucht die empfindliche pH-Glaselektrode nur zur Messung ein, und ein kabelloses 2,8\" CYD-Display zeigt alle Telemetriedaten live per ESP-NOW.",
        en: "A fully autonomous irrigation and nutrient dosing system: 3 peristaltic pumps dose nutrients & pH buffer, a servo arm dips the delicate glass pH probe only during measurement cycles, and a wireless 2.8\" CYD touch display streams telemetry via ESP-NOW."
      },
      media: {
        thumbnail: "assets/projects/hero-planter-window.jpg",
        hoverVideo: "",
        gallery: [
          {
            src: "assets/projects/hero-planter-window.jpg",
            caption: {
              de: "SmartPlanter Fensterbank-Integration im skandinavischen Minimal-Design.",
              en: "SmartPlanter window bench integration in minimalist Scandinavian design."
            }
          },
          {
            src: "assets/projects/cyd-touch-terminal.jpg",
            caption: {
              de: "Kabelloses 2,8\" ESP32 Cheap Yellow Display (CYD) mit eigenem Dark-UI (2 Hz ESP-NOW Telemetrie).",
              en: "Wireless 2.8\" ESP32 Cheap Yellow Display (CYD) running custom dark UI via 2 Hz ESP-NOW telemetry."
            }
          },
          {
            src: "assets/projects/modular-hardware-detail.jpg",
            caption: {
              de: "Technik-Modul: Dual-Acryltanks, 3 Peristaltikpumpen und motorisierter Servo-pH-Taucharm.",
              en: "Engineering module: Dual acrylic reservoirs, 3 peristaltic pumps, and motorized servo pH dipping arm."
            }
          },
          {
            src: "assets/projects/mobile-app-control.jpg",
            caption: {
              de: "100 % offline nutzbares SoftAP Web-Dashboard direkt vom ESP32-C3 bereitgestellt.",
              en: "100% offline SoftAP web dashboard served directly from the ESP32-C3."
            }
          }
        ]
      },
      caseStudy: {
        problem: {
          de: "Herkömmliche pH-Sensoren in Hydroponik-Systemen verschleißen durch dauerhaftes Eintauchen in die Nährlösung innerhalb weniger Wochen. Zudem fehlte ein modulares System, das sowohl präzise Nährstoffdosierung als auch einzeln steckbare Pflanzzonen ohne Cloud-Zwang vereint.",
          en: "Conventional pH probes degrade rapidly when permanently submerged in nutrient solutions. Furthermore, existing smart planters lack modular hot-swappable zones, automated peristaltic nutrient dosing, and router-independent local control."
        },
        solution: {
          de: "Ein motorisierter Servo-Schwenkarm taucht die analoge pH-Sonde nur für einen 6-Sekunden-Messzyklus in den Misch-Tank und parkt sie danach geschützt. Drei Peristaltikpumpen regeln Dünger A/B sowie pH-Down nach, während ein VL53L0X Laser-Time-of-Flight-Sensor den Wasserstand kontaktlos misst. Gesteuert wird alles über ein kabelloses ESP-NOW Touch-Terminal oder das integrierte SoftAP Web-Interface.",
          en: "A motorized servo lifter submerges the analog pH probe only for a 6-second measurement window, dramatically extending sensor life. Three peristaltic pumps dose Nutrients A/B and pH buffer, while a VL53L0X laser Time-of-Flight sensor measures tank levels contact-free. Controlled via a wireless ESP-NOW CYD touch terminal or the embedded SoftAP web dashboard."
        },
        highlights: {
          de: [
            "Motorisierter Servo-pH-Lifter schützt die Glaselektrode vor chemischer Alterung",
            "Kontaktlose Laser-Füllstandsmessung (VL53L0X ToF) + DS18B20 Wassertemperatur",
            "4 Hot-Swap-Pflanzzonen mit automatischer ADC-Steckererkennung & Trockenlaufschutz",
            "Kabelloses 2,8\" ILI9341 Touch-Terminal via bidirektionalem ESP-NOW Protokoll"
          ],
          en: [
            "Motorized servo pH lifter protects glass bulb from chemical degradation",
            "Non-contact laser level sensing (VL53L0X ToF) + DS18B20 water temperature",
            "4 hot-swappable planter zones with automatic ADC unplug detection & pump failsafes",
            "Wireless 2.8\" ILI9341 touch terminal via bidirectional ESP-NOW protocol"
          ]
        },
        techStack: ["ESP32-C3 Super Mini", "ESP-NOW Protocol", "2.8\" CYD ILI9341", "VL53L0X Laser ToF", "Peristaltic Pumps", "3D-Printed Enclosure"],
        liveUrl: "../smartplanter/index.html",
        liveLabel: {
          de: "SmartPlanter Live-Simulator & Showcase öffnen ↗",
          en: "Open SmartPlanter Live Simulator & Showcase ↗"
        }
      },
      inquirySubject: {
        de: "Anfrage ähnlich zu: SmartPlanter IoT & Automatisierung",
        en: "Inquiry similar to: SmartPlanter IoT & Automation"
      },
      inquiryChip: "Smart Home / Elektronik-Projekt"
    },

    {
      id: "autonomous-train",
      bentoSize: "wide",
      featured: false,
      year: "2025",
      status: {
        de: "CAD & Embedded C++",
        en: "CAD & Embedded C++"
      },
      tags: ["Fusion 360 CAD", "Embedded C++", "Hall-Sensorik", "Servo-Weichen"],
      title: {
        de: "Autonome 3D-Modelleisenbahn",
        en: "Autonomous 3D-Printed Railway"
      },
      subtitle: {
        de: "Komplett 3D-gedrucktes Lok- & Weichensystem mit Hall-Sensoren & ESP32",
        en: "Fully 3D-printed locomotive & turnout system with Hall sensors & ESP32"
      },
      shortDesc: {
        de: "Von den Zahnrädern im Drehgestell bis zu den motorisierten Weichen komplett selbst konstruiert und 3D-gedruckt: Eine autonome Modelleisenbahn mit Hall-Effekt-Gleissensoren, automatischer Kollisionsvermeidung und OLED-Telemetriestation.",
        en: "Engineered from scratch—from bogie gears to motorized turnouts: An autonomous 3D-printed model railway featuring Hall-effect track sensors, automated block collision avoidance, and an ESP32 OLED telemetry station."
      },
      media: {
        thumbnail: "assets/projects/autonomous-train-hero.jpg",
        hoverVideo: "",
        gallery: [
          {
            src: "assets/projects/autonomous-train-hero.jpg",
            caption: {
              de: "3D-gedruckte Lokomotive, modulares Schienensystem mit Servo-Weiche und ESP32-Telemetrie-Station.",
              en: "3D-printed locomotive, modular track system with servo turnout, and ESP32 telemetry station."
            }
          }
        ]
      },
      caseStudy: {
        problem: {
          de: "Wie weit lässt sich moderner FDM-3D-Druck im funktionalen Modellbau treiben? Ziel war es, nicht nur dekorative Gehäuse zu drucken, sondern ein mechanisch zuverlässiges, vollautomatisiertes Schienen- und Antriebssystem inklusive Weichenmechanik und Zugsteuerung komplett selbst zu entwickeln.",
          en: "How far can modern FDM 3D printing be pushed in functional mechanical engineering? The challenge was to design not just decorative shells, but a mechanically reliable, fully automated track, drivetrain, and turnout system with autonomous train control."
        },
        solution: {
          de: "Lokomotiv-Chassis, Getriebeuntersetzung, Kupplungen und modulare Schienenprofile wurden mit engen Toleranzen in Fusion 360 konstruiert und aus schlagfestem PETG/PLA auf Bambu Lab Druckern gefertigt. Unter den Schwellen sitzen Hall-Sensoren, die den Zug millimetergenau erfassen, sodass ein ESP32 Servoweichen stellt, Bremsrampen sanft regelt und einen vollautonomen Fahrplanbetrieb ermöglicht.",
          en: "Locomotive chassis, gear reductions, couplers, and modular track profiles were designed with tight tolerances in Fusion 360 and printed in tough PETG/PLA. Hall-effect sensors embedded beneath the sleepers detect train positions with millimeter accuracy, enabling an ESP32 controller to actuate servo turnouts, compute smooth acceleration/braking ramps, and run autonomous schedules."
        },
        highlights: {
          de: [
            "100 % 3D-gedrucktes Schienen-, Weichen- und Lokomotiv-Chassis mit funktionalem Zahnradgetriebe",
            "Eingebettete Hall-Effekt-Sensoren zur präzisen Positionsbestimmung und Blockstellen-Freigabe",
            "Sanfte PWM-/PID-Geschwindigkeitsregelung für realistisches Anfahren und Halten am Bahnhof",
            "ESP32-Leitstelle mit OLED-Statusanzeige und drahtloser Telemetrie"
          ],
          en: [
            "100% 3D-printed track, turnout, and locomotive chassis with functional gear drivetrain",
            "Embedded Hall-effect sensors for precise train positioning and block signaling",
            "Smooth PWM/PID speed ramping for realistic station arrivals and departures",
            "ESP32 dispatch unit with live OLED status display and wireless telemetry"
          ]
        },
        techStack: ["Fusion 360 CAD", "Bambu Lab PETG/PLA", "ESP32 C++", "Hall-Effect Sensors", "Micro Servos", "PWM Motor Control"]
      },
      inquirySubject: {
        de: "Anfrage ähnlich zu: Autonome 3D-gedruckte Modelleisenbahn / Mechanik-Prototyp",
        en: "Inquiry similar to: Autonomous 3D-Printed Model Railway / Mechanical Prototype"
      },
      inquiryChip: "Custom 3D-Druck / Produkt"
    }
  ],

  // ==========================================================================
  // SEKTION 2: INTERACTIVE WEB SHOWCASE (3D Browser Stack / CD-Player-Effekt)
  // ==========================================================================
  webShowcase: [
    {
      id: "web-clawmachine",
      title: {
        de: "The CloudCatcher – Interactive Arcade Showcase",
        en: "The CloudCatcher – Interactive Arcade Showcase"
      },
      badge: {
        de: "Eigenes Projekt • Scrollytelling",
        en: "Own Project • Scrollytelling"
      },
      displayUrl: "https://clawmachine.michaelkrahn.de",
      iframeUrl: "../greifarm/frontend/iframe.html",
      externalUrl: "../greifarm/frontend/iframe.html",
      mobilePreviewImg: "assets/projects/claw_hero.jpg",
      tags: ["Scrollytelling", "Parallax Clouds", "Hardware Showcase"]
    },
    {
      id: "web-schildwerk",
      title: {
        de: "SchildWerk – 3D Produkt-Konfigurator & Shop",
        en: "SchildWerk – 3D Sign Configurator & Shop"
      },
      badge: {
        de: "Eigener Webshop • React & Three.js",
        en: "Own Webshop • React & Three.js"
      },
      displayUrl: "https://schildwerk.michaelkrahn.de",
      iframeUrl: "../schildwebsite/dist/index.html",
      externalUrl: "../schildwebsite/dist/index.html",
      mobilePreviewImg: "assets/projects/env-door-sign-street.jpg",
      tags: ["React + TypeScript", "Three.js Live 3D", "E-Commerce"]
    },
    {
      id: "web-smartplanter",
      title: {
        de: "SmartPlanter.io – Live IoT Simulator & Docs",
        en: "SmartPlanter.io – Live IoT Simulator & Docs"
      },
      badge: {
        de: "Eigenes Projekt • Live Simulator",
        en: "Own Project • Live Simulator"
      },
      displayUrl: "https://smartplanter.michaelkrahn.de",
      iframeUrl: "../smartplanter/index.html",
      externalUrl: "../smartplanter/index.html",
      mobilePreviewImg: "assets/projects/hero-planter-window.jpg",
      tags: ["Interactive CYD UI", "ESP-NOW Telemetry", "IoT Web App"]
    },
    {
      id: "web-kitchenaid",
      title: {
        de: "Krahn Manufaktur – KitchenAid 3D Shop & Zubehör",
        en: "Krahn Manufaktur – KitchenAid 3D Shop & Parts"
      },
      badge: {
        de: "Eigenständiger 3D-Shop • Three.js & E-Commerce",
        en: "Standalone 3D Shop • Three.js & E-Commerce"
      },
      displayUrl: "https://kitchenaid.michaelkrahn.de",
      iframeUrl: "../kitchenaid-shop/index.html",
      externalUrl: "../kitchenaid-shop/index.html",
      mobilePreviewImg: "assets/shop_images/mixer_brown(1).jpeg",
      tags: ["Three.js Meshopt 3D", "3D Accessories Shop", "Cart & Admin"]
    },
    {
      id: "web-technikcamps",
      title: {
        de: "Technikcamps – MINT & Robotik Plattform",
        en: "Technikcamps – STEM & Robotics Platform"
      },
      badge: {
        de: "Web-Referenz • Bildung",
        en: "Web Reference • Education"
      },
      displayUrl: "https://www.technikcamps.de/",
      iframeUrl: "https://www.technikcamps.de/",
      externalUrl: "https://www.technikcamps.de/",
      mobilePreviewImg: "assets/images/timeline-dhbw.jpg",
      tags: ["MINT / STEM", "Course Portal", "Web Design"]
    },
    {
      id: "web-kinderuni",
      title: {
        de: "Kinderuni Koblenz – Web Portal",
        en: "Kinderuni Koblenz – Web Portal"
      },
      badge: {
        de: "Web-Referenz • Universität",
        en: "Web Reference • University"
      },
      displayUrl: "https://kinderuni-koblenz.de/",
      iframeUrl: "https://kinderuni-koblenz.de/",
      externalUrl: "https://kinderuni-koblenz.de/",
      mobilePreviewImg: "assets/images/globe-deutschland.jpg",
      tags: ["University Portal", "Responsive UI", "Public Outreach"]
    }
  ],

  // ==========================================================================
  // SEKTION 3: MANUFAKTUR & SHOPS (E-Commerce & Custom Products Hub)
  // ==========================================================================
  manufaktur: {
    kitchenaid: {
      showroomUrl: "../kitchenaid-shop/index.html",
      models: [
        {
          id: "truffle-bronze",
          name: { de: "Truffle & Bronze", en: "Truffle & Bronze" },
          subtitle: { de: "Seidenmatt Graubraun + DIY Bronze-Akzente & Glasschüssel", en: "Satin Taupe + Custom Bronze Accents & Glass Bowl" },
          price: "€ 349",
          swatch: "#5c4d42",
          accentSwatch: "#b08d57",
          image: "assets/shop_images/mixer_brown(1).jpeg",
          imageAlt: "assets/shop_images/mixer_brown(2).jpeg",
          badge: { de: "Unikat #01", en: "Edition #01" }
        },
        {
          id: "velvet-bloom",
          name: { de: "Velvet Bloom", en: "Velvet Bloom" },
          subtitle: { de: "Samt-Puderrosa + Dunkles Roségold & 3D-Rosencover", en: "Powder Pink Matte + Dark Rose Gold & 3D Rose Cover" },
          price: "€ 399",
          swatch: "#e3b5c1",
          accentSwatch: "#9e5863",
          image: "assets/shop_images/mixer_rose(1).jpeg",
          imageAlt: "assets/shop_images/mixer_rose(2).jpeg",
          badge: { de: "Unikat #02", en: "Edition #02" }
        },
        {
          id: "reseda-olive",
          name: { de: "Reseda & Olive", en: "Reseda & Olive" },
          subtitle: { de: "Matt Resedagrün + Hochglanz-Oliv & Glasschüssel", en: "Matte Reseda Green + Gloss Olive & Glass Bowl" },
          price: "€ 379",
          swatch: "#6c7c59",
          accentSwatch: "#3d4a2d",
          image: "assets/shop_images/mixer_green(1).jpeg",
          imageAlt: "assets/shop_images/mixer_green(2).jpeg",
          badge: { de: "Unikat #03", en: "Edition #03" }
        },
        {
          id: "classic-elegance",
          name: { de: "Classic Elegance", en: "Classic Elegance" },
          subtitle: { de: "Seidenmatt Signalweiß + Gebürstete Gold-Knöpfe", en: "Semi-Gloss Signal White + Brushed Gold Knobs" },
          price: "€ 379",
          swatch: "#f3f4f6",
          accentSwatch: "#d4af37",
          image: "assets/shop_images/mixer_white(1).jpeg",
          imageAlt: "assets/shop_images/mixer_white(2).jpeg",
          badge: { de: "Unikat #04", en: "Edition #04" }
        },
        {
          id: "nordic-dove",
          name: { de: "Nordic Dove", en: "Nordic Dove" },
          subtitle: { de: "Matt Taubenblau + Echtes Walnussholz-Zierband", en: "Matte Dove Blue + Genuine Walnut Wood Trim" },
          price: "€ 379",
          swatch: "#7b93a8",
          accentSwatch: "#6e472b",
          image: "assets/shop_images/mixer_blue(1).jpeg",
          imageAlt: "assets/shop_images/mixer_blue(2).jpeg",
          badge: { de: "Unikat #05", en: "Edition #05" }
        }
      ]
    },
    schildwerk: {
      shopUrl: "../schildwebsite/dist/index.html",
      externalDomainHint: "schildwerk.michaelkrahn.de",
      previews: [
        {
          title: { de: "3D-Haustürschild im Straßenschild-Design", en: "3D Street-Style Door Sign" },
          price: { de: "ab 24,90 €", en: "from €24.90" },
          image: "assets/projects/env-door-sign-street.jpg"
        },
        {
          title: { de: "LED-beleuchtete 3D-Hausnummer", en: "LED Illuminated 3D House Number" },
          price: { de: "ab 39,90 €", en: "from €39.90" },
          image: "assets/projects/env-led-number-sign.jpg"
        },
        {
          title: { de: "Maßgefertigtes Briefkastenschild", en: "Custom 3D Mailbox Sign" },
          price: { de: "ab 12,90 €", en: "from €12.90" },
          image: "assets/projects/env-mailbox-sign.jpg"
        },
        {
          title: { de: "Personalisierter 3D-Schlüsselanhänger", en: "Personalized 3D Keychain" },
          price: { de: "ab 7,90 €", en: "from €7.90" },
          image: "assets/projects/env-keychain.jpg"
        }
      ]
    },
    arcade: {
      showcaseUrl: "../greifarm/frontend/iframe.html",
      images: [
        "assets/projects/claw_hero.jpg",
        "assets/projects/claw_closeup.jpg",
        "assets/projects/claw_gantry.jpg"
      ]
    }
  },

  // ==========================================================================
  // SEKTION 4: SMART CONTACT QUICK-SELECT CHIPS
  // ==========================================================================
  contactChips: [
    {
      id: "chip-3d",
      label: { de: "Custom 3D-Druck / Produkt", en: "Custom 3D Print / Product" },
      defaultSubject: {
        de: "Anfrage: Custom 3D-Druck / Maßgefertigtes Produkt",
        en: "Inquiry: Custom 3D Print / Bespoke Product"
      }
    },
    {
      id: "chip-smarthome",
      label: { de: "Smart Home / Elektronik-Projekt", en: "Smart Home / Electronics Project" },
      defaultSubject: {
        de: "Anfrage: Smart Home / Embedded-Elektronik Spezialprojekt",
        en: "Inquiry: Smart Home / Embedded Electronics Custom Project"
      }
    },
    {
      id: "chip-kitchenaid",
      label: { de: "Custom KitchenAid", en: "Custom KitchenAid" },
      defaultSubject: {
        de: "Anfrage: Custom KitchenAid Design / 3D-Zubehör",
        en: "Inquiry: Custom KitchenAid Design / 3D Accessory"
      }
    },
    {
      id: "chip-web",
      label: { de: "Webentwicklung / Job", en: "Web Development / Job" },
      defaultSubject: {
        de: "Anfrage: Webentwicklung / Job & Zusammenarbeit",
        en: "Inquiry: Web Development / Job & Collaboration"
      }
    },
    {
      id: "chip-crazy",
      label: { de: "Sonstiges Verrücktes", en: "Something Crazy / Custom Idea" },
      defaultSubject: {
        de: "Anfrage: Verrückte Projektidee / Spezialanfertigung",
        en: "Inquiry: Crazy Project Idea / Custom Commission"
      }
    }
  ]
};

