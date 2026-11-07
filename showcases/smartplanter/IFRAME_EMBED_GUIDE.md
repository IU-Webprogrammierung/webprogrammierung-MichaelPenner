# SmartPlanter - Portfolio iFrame Integration Guide

This guide explains how to integrate the **SmartPlanter One-Pager Showcase** into your portfolio project tab.

---

## 1. Quick Drop-In Snippet (Standard HTML)

Copy the `portfolio-showcase/` folder into your portfolio assets (e.g. `public/projects/smartplanter/` or `./projects/smartplanter/`).

```html
<!-- Inside your portfolio "Projects" tab -->
<div class="project-showcase-wrapper" style="width: 100%; height: 90vh; min-height: 850px; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.5);">
  <iframe
    src="./portfolio-showcase/index.html"
    title="Arduino & ESP32 SmartPlanter System"
    width="100%"
    height="100%"
    frameborder="0"
    style="border: none; width: 100%; height: 100%; display: block;"
    loading="lazy"
    allow="clipboard-write">
  </iframe>
</div>
```

---

## 2. Dynamic Auto-Height iFrame (Seamless Page Flow)

If you prefer the iframe to expand naturally without an inner scrollbar, add this small postMessage listener:

### In your main Portfolio page:
```html
<iframe
  id="planterShowcaseFrame"
  src="./portfolio-showcase/index.html"
  style="width: 100%; border: none; min-height: 800px; transition: height 0.2s ease;"
  scrolling="no">
</iframe>

<script>
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SMARTPLANTER_HEIGHT') {
      const iframe = document.getElementById('planterShowcaseFrame');
      if (iframe) {
        iframe.style.height = event.data.height + 'px';
      }
    }
  });
</script>
```

---

## 3. Key Highlights Included in the Page

1. **AI-Generated High-Fidelity Window Bench Illustrations**:
   - `assets/images/hero-planter-window.jpg`: Minimalist Scandinavian window bench with natural daylight and soft garden bokeh.
   - `assets/images/cyd-touch-terminal.jpg`: Close-up of the 2.8" ESP32 CYD touch terminal with live dark UI on a custom desktop stand.
   - `assets/images/mobile-app-control.jpg`: Smartphone in hand showing the embedded SoftAP Web Dashboard with window planter in background.
   - `assets/images/modular-hardware-detail.jpg`: Macro engineering view of clear acrylic reservoirs, robotic servo pH arm, and peristaltic pumps.

2. **Full Modular Subsystem Deep Dive**:
   - **Dual Hydro Reservoirs**: Tank 1 non-contact laser Time-of-Flight (VL53L0X) + DS18B20 OneWire temp + charcoal filtration.
   - **Automated pH Servo Lifter**: 6-second timed submerge read cycle protecting analog glass bulb from chemical degradation.
   - **Dosing Triad**: 3 peristaltic pumps for Nutrients A, B, and pH buffer.
   - **4-Zone Hot-Swappable Planters**: ADC threshold disconnection detection, individual moisture setpoints, and pump failsafes.

3. **Dual Control Paradigms**:
   - **Interactive CYD Console Simulator**: 4 live-switchable tabs (Overview fluid waves, Reservoirs, Planters, System console).
   - **Embedded SoftAP Web Dashboard**: 100% offline, privacy-first control hub running on `192.168.4.1` with dual OTA updating.

4. **Interactive Hardware Simulator**:
   - Real-time moisture sliders that trigger automated irrigation pumps when falling below setpoints.
   - Interactive servo dipping arm test button.
   - Live streaming ESP-NOW telemetry packet dump.
