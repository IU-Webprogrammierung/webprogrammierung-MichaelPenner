# Portfolio Webpage - Projektdokumentation

Diese README.md dokumentiert den Entwicklungsprozess, die eingesetzten Technologien und die wichtigsten Errungenschaften dieses Portfolio-Webauftritts gemäß den Projektanforderungen. 

Die gesamte Webseite wurde ohne fertige CSS-Frameworks "from scratch" entwickelt, um ein tiefgreifendes Verständnis der Webentwicklungsgrundlagen zu demonstrieren.

## 🛠️ Eingesetzte Technologien & Methoden

- **HTML5**: Semantisch korrekte Strukturierung der Inhalte.
- **Vanilla CSS (Custom Properties / Variables)**: Aufbau eines globalen Design-Systems (Farben, Typography, Abstände) für konsistentes und modulares Styling.
- **Responsive Web Design**: Einsatz komplexer **Media Queries** (Mobile-First Ansatz) zur fluiden Anpassung von Layouts, Schriftgrößen und Komponenten über mehrere Breakpoints hinweg (von 360px bis hin zu Ultra-Wide Displays).
- **CSS Flexbox & CSS Grid**: Vollständiger Verzicht auf veraltete Layout-Methoden. Kombination von Flexbox (für 1D-Ausrichtung z.B. Navigation, Karten-Inhalte) und Grid (für 2D-Bereiche wie z.B. komplexe Projekt-Galerien).
- **Vanilla JavaScript (ES6+)**: Entwicklung dynamischer Funktionen, Scroll-Events und komplexer Animationen komplett ohne jQuery.
- **Git Versionskontrolle**: Kontinuierliche Datensicherung und strukturierte Dokumentation des Entwicklungsprozesses durch regelmäßige, semantische Commits.
- **Barrierefreiheit (a11y)**: Einsatz von ARIA-Labels, `aria-hidden` für rein dekorative Elemente, logischer Heading-Struktur und hohem Farbkontrast. Unterstützung für `prefers-reduced-motion`.

## ✨ Spezifische & Komplexe Features (Highlights)

Besonderer Wert wurde auf Interaktivität, "Motion Design" und ein einzigartiges, immersives Erlebnis gelegt. Folgende Features waren besonders arbeitsintensiv in der Konzeption und Umsetzung:

### 1. Interaktive Physik-basierte Timeline (Rope Simulation)
Das Herzstück der "About Me"-Sektion ist eine komplett selbst programmierte, interaktive Timeline, die sich wie ein echtes Seil unter Spannung verhält.
- **Custom Physics Engine**: Berechnung von Gravitation, Spannung ("Tension") und Dämpfung mittels JavaScript `requestAnimationFrame`.
- **Dynamisches SVG-Rendering (Quadratic Bezier Curves)**: Das Seil wird live als glatte Bezier-Kurve gezeichnet und gebogen, ohne Ecken oder "harte" Kanten.
- **Magnetischer Hover-Effekt**: Beim Überfahren der Milestone-Punkte berechnet ein Algorithmus einen sanften Einzug (Parabelfunktion), um das Seil natürlich um den Punkt herumzubiegen.
- **Parallax & Scroll-Tension**: Schnelles Scrollen erzeugt physikalische Wellen im Seil. Erreicht man das Ende, "zerreißt" das Seil optisch und physikalisch in zwei Teile.
- **IntersectionObserver (Staggered Entrance)**: Milestones werden erst elegant eingeblendet und schweben ein (CSS Transitions + JS Observer), wenn der Nutzer zu der entsprechenden Sektion scrollt, was Ressourcen schont und visuell ansprechend ist.

### 2. 3D Product Configurator & Scroll-Storytelling (Shop)
Die `shop.html` beinhaltet einen hochkomplexen 3D-Produkt-Viewer für restaurierte KitchenAid-Maschinen.
- **Scroll-Driven 3D-Modelle**: Beim Herunterscrollen ("Storytelling") rotieren die 3D-Maschinen passend zur Scrollposition. Ein IntersectionObserver lädt dynamisch und nahtlos komplett neue 3D-Modelle (GLB/GLTF) in die Szene, sobald eine neue Produktsektion betreten wird.
- **Realistische Render-Engine (PBR)**: Nutzung von Three.js mit Physically Based Rendering (PBR), Environments Maps, und weichen dynamischen Schatten (`PCFSoftShadowMap`) für maximale Realismus und Reflexionen auf dem Lack.
- **Multible WebGL-Kontexte**: Neben der Hauptszene rotieren in den Glaskarten zusätzlich kleine, unabhängige 3D-Zubehörteile auf separaten Canvases.
- **Cinematic Transitions**: Einsatz von tiefgreifenden CSS-Filtern (Blur/Desaturate), die asynchron mit dem JavaScript Lade-Fortschritt der Modelle und Sektionen synchronisiert sind.
- **Mobile-Handling**: Eine intelligente Klick-Logik (`is-expanded`), die es Nutzern auf mobilen Geräten erlaubt, die "Glassmorphism"-Karten auszuklappen, ohne die 3D-View zu verstellen.

### 3. 3D Skill-Towers (Three.js WebGL)
Eine stark visuelle Darstellung meiner Fähigkeiten (HTML, CSS, JS etc.) in Form von interaktiven 3D-Bauklötzen.
- **Three.js Integration**: Aufbau einer WebGL-Szene direkt im DOM.
- **Komplexes Lighting & Shadowing**: Eigener Schatten-Wurf der Klötze aufeinander mittels `DirectionalLight` und Shadow-Mapping.
- **Mouse-Tracking & Parallax**: Die Kamera sowie das Licht reagieren subtil auf die Mausbewegungen des Nutzers in Echtzeit.
- **Materialien**: Einsatz von `MeshStandardMaterial` für eine realistische Lichtreflexion (Plastic-Look), kombiniert mit HSL-Farbverschiebungen für die unteren Blöcke.

### 4. Interactive 3D Globe (ThreeGlobe & WebGL)
Eine beeindruckende visuelle 3D-Globus-Darstellung, um internationale Verbindungen und Orte zu visualisieren.
- **ThreeGlobe / Three.js**: Rendering einer kompletten Erde inkl. Wolkenschicht (`MeshLambertMaterial`) und Atmosphäre.
- **Data-Driven Visualization**: Polylinien (Flugrouten) und leuchtende Marker (Städte/Orte) werden asynchron aus einer JSON-Datenquelle ausgelesen und in die 3D-Geometrie übersetzt (`hexPolygonRes`, `arcsData`).
- **Scroll-Linked Animation**: Die Rotation des Globus und der Kamerapositionierung interagieren mit den Scroll-Bereichen (`globeSections`). Der Animations-Loop wird zur Leistungsoptimierung pausiert (`cancelAnimationFrame`), sobald sich der Globus nicht im sichtbaren Bereich befindet.

### 5. Serverless Contact Form (EmailJS)
Ein vollständig funktionierendes, clientseitiges Kontaktformular, welches ohne eigenen Node.js oder PHP-Backend-Server auskommt.
- **EmailJS API Integration**: Direkte Anbindung an die EmailJS API per Vanilla JS (`js/contact.js`) zum asynchronen Versand von Kontaktanfragen.
- **UX / State-Management**: Verriegelung des Submit-Buttons ("Sending...") zur Verhinderung von Doppel-Einsendungen, Error-Handling mit visuellem Feedback via `alert()`/Callbacks und Form-Reset bei Erfolg.

### 6. Mehrsprachigkeit (i18n System)
Komplettes i18n-System in purem Javascript implementiert, welches nahtlos und ohne Page-Reload die gesamte Webseite zwischen Deutsch und Englisch umschaltet.
- Speicherung der Präferenz lokal, Abgreifen von Data-Attributen auf allen relevanten DOM-Elementen.

### 7. Custom Cursor & Hover-States
- Ein globaler Custom-Cursor (Kreis + Punkt), der smooth der Maus folgt und bei klickbaren Elementen (Links, Timeline-Punkte, Projektkarten) dynamisch wächst, seine Farbe ändert oder den Text ("View") anzeigt.

### 8. Smooth Scroll & CSS Animations
- Eigener Scroll-Handler zur ruckelfreien Navigation zwischen den Sektionen.
- Umfangreicher Einsatz von Keyframe-Animationen, weichen Hover-Transitions, `transform: translate3d` und Backdrop-Filtern ("Glassmorphism") für ein extrem hochwertiges Look & Feel.