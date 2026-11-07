/**
 * ============================================================================
 * KRAHN MANUFAKTUR – STANDALONE ADMIN BACKEND CONTROLLER (js/admin.js)
 * ============================================================================
 * Manages:
 * - Dashboard KPIs (Total Revenue, Orders, Active Mixers & 3D Parts, Open Fulfillment)
 * - Order Management (Filter, Inspect Customer & Items, Update Payment/Shipping Status, Export JSON/CSV)
 * - Product & Inventory Editor (Live Price, Stock, Active Toggle for Mixers & Accessories, Add New Part)
 * - Shop Settings (Shipping rates, Free shipping threshold, Reset demo data)
 */
document.addEventListener('DOMContentLoaded', () => {
  const store = window.KAShopStore;
  if (!store) return;

  let activeTab = 'dashboard';
  let expandedOrderId = null;

  const FULFILLMENT_LABELS = {
    new_order: 'Neu eingegangen',
    in_workshop: 'In Werkstatt / 3D-Druck',
    ready_to_ship: 'Versandfertig',
    shipped: 'Versendet (DHL)',
    completed: 'Abgeschlossen'
  };

  const PAYMENT_LABELS = {
    paid: 'Bezahlt',
    pending_transfer: 'Wartet auf Überweisung',
    refunded: 'Erstattet'
  };

  // ==========================================================================
  // 1. TAB NAVIGATION
  // ==========================================================================
  const navButtons = document.querySelectorAll('[data-admin-tab]');
  const panels = document.querySelectorAll('.admin-panel');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.getAttribute('data-admin-tab');
      navButtons.forEach(b => b.classList.toggle('is-active', b === btn));
      panels.forEach(p => p.classList.toggle('is-active', p.id === `panel-${activeTab}`));
      renderAll();
    });
  });

  // ==========================================================================
  // 2. RENDER KPIs & DASHBOARD
  // ==========================================================================
  function renderKPIs() {
    const orders = store.getOrders();
    const products = store.getProducts();

    const totalRevenue = orders
      .filter(o => o.paymentStatus !== 'refunded')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const openOrders = orders.filter(o => o.fulfillmentStatus !== 'completed' && o.fulfillmentStatus !== 'shipped').length;
    const activeMixers = products.filter(p => p.category === 'mixer' && p.isActive && p.stock > 0).length;
    const activeAccs = products.filter(p => p.category === 'accessory' && p.isActive && p.stock > 0).length;

    const kpiContainer = document.getElementById('adminKpiGrid');
    if (kpiContainer) {
      kpiContainer.innerHTML = `
        <div class="admin-kpi-card">
          <div class="admin-kpi-label">Gesamtumsatz</div>
          <div class="admin-kpi-val">${store.formatPrice(totalRevenue)}</div>
          <div class="admin-kpi-sub">Aus ${orders.length} Bestellungen</div>
        </div>
        <div class="admin-kpi-card">
          <div class="admin-kpi-label">Offene Aufträge</div>
          <div class="admin-kpi-val">${openOrders}</div>
          <div class="admin-kpi-sub">Werkstatt &amp; 3D-Druck Queue</div>
        </div>
        <div class="admin-kpi-card">
          <div class="admin-kpi-label">KitchenAid Unikate</div>
          <div class="admin-kpi-val">${activeMixers} / ${products.filter(p => p.category === 'mixer').length}</div>
          <div class="admin-kpi-sub">Verfügbar im 3D-Showroom</div>
        </div>
        <div class="admin-kpi-card">
          <div class="admin-kpi-label">3D-Zubehör Artikel</div>
          <div class="admin-kpi-val">${activeAccs}</div>
          <div class="admin-kpi-sub">Sofort lieferbare 3D-Parts</div>
        </div>
      `;
    }
  }

  // ==========================================================================
  // 3. RENDER ORDERS TABLE (Dashboard Preview + Full Orders Tab)
  // ==========================================================================
  function buildOrdersTableHTML(orderList) {
    if (orderList.length === 0) {
      return `<p style="color:#64748b; padding:16px 0;">Noch keine Bestellungen vorhanden.</p>`;
    }

    const rows = orderList.map(order => {
      const dateStr = new Date(order.createdAt).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const itemsSummary = (order.items || []).map(i => `${i.quantity}× ${i.title}`).join(', ');
      const payBadgeClass = order.paymentStatus === 'paid' ? 'badge-paid' : 'badge-pending';
      const isExpanded = expandedOrderId === order.id;

      const statusOptions = Object.entries(FULFILLMENT_LABELS).map(([val, label]) =>
        `<option value="${val}" ${order.fulfillmentStatus === val ? 'selected' : ''}>${label}</option>`
      ).join('');

      const payOptions = Object.entries(PAYMENT_LABELS).map(([val, label]) =>
        `<option value="${val}" ${order.paymentStatus === val ? 'selected' : ''}>${label}</option>`
      ).join('');

      return `
        <tr>
          <td><strong>${order.orderNumber}</strong></td>
          <td>${dateStr}</td>
          <td>
            <strong>${order.customer?.name || '-'}</strong><br>
            <span style="font-size:0.76rem; color:#64748b;">${order.customer?.email || ''}</span>
          </td>
          <td style="max-width:260px;">${itemsSummary}</td>
          <td><strong>${store.formatPrice(order.total)}</strong></td>
          <td>
            <select class="admin-select" data-order-pay="${order.id}">
              ${payOptions}
            </select>
          </td>
          <td>
            <select class="admin-select" data-order-status="${order.id}">
              ${statusOptions}
            </select>
          </td>
          <td>
            <div style="display:flex; gap:6px;">
              <button type="button" class="admin-btn" data-toggle-order="${order.id}">
                ${isExpanded ? 'Schließen ▲' : 'Details ▼'}
              </button>
              <button type="button" class="admin-btn admin-btn-danger" data-delete-order="${order.id}" title="Löschen">✕</button>
            </div>
          </td>
        </tr>
        ${isExpanded ? `
        <tr style="background:#f8fafc;">
          <td colspan="8" style="padding:18px 22px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:20px;">
              <div>
                <h4 style="margin:0 0 8px; font-size:0.9rem;">Lieferadresse &amp; Kontakt</h4>
                <p style="margin:0; font-size:0.84rem; line-height:1.5;">
                  <strong>${order.customer?.name || ''}</strong><br>
                  ${order.customer?.street || ''}<br>
                  ${order.customer?.zip || ''} ${order.customer?.city || ''} (${order.customer?.country || 'DE'})<br>
                  Tel: ${order.customer?.phone || '-'}<br>
                  E-Mail: <a href="mailto:${order.customer?.email || ''}">${order.customer?.email || ''}</a>
                </p>
                ${order.customer?.notes ? `<p style="margin:8px 0 0; padding:8px; background:#fef3c7; border-radius:8px; font-size:0.8rem;"><strong>Kundennotiz:</strong> ${order.customer.notes}</p>` : ''}
              </div>
              <div>
                <h4 style="margin:0 0 8px; font-size:0.9rem;">Bestellte Artikel</h4>
                <ul style="margin:0; padding-left:18px; font-size:0.84rem; line-height:1.6;">
                  ${(order.items || []).map(it => `
                    <li>
                      <strong>${it.quantity}× ${it.title}</strong> (${it.option || 'Standard'})
                      – ${store.formatPrice(it.unitPrice * it.quantity)}
                      <span style="color:#64748b;">[${it.sku || it.productId}]</span>
                    </li>
                  `).join('')}
                </ul>
                <div style="margin-top:8px; font-size:0.82rem; color:#475569;">
                  Zwischensumme: ${store.formatPrice(order.subtotal)} | Versand: ${store.formatPrice(order.shipping)} | <strong>Gesamt: ${store.formatPrice(order.total)}</strong>
                </div>
              </div>
              <div>
                <h4 style="margin:0 0 8px; font-size:0.9rem;">DHL Sendungsverfolgung</h4>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="admin-input" id="trackInput_${order.id}" value="${order.trackingNumber || ''}" placeholder="DHL Tracking-Nr." style="flex:1;">
                  <button type="button" class="admin-btn admin-btn-primary" data-save-track="${order.id}">Speichern</button>
                </div>
                <p style="font-size:0.76rem; color:#64748b; margin-top:8px;">
                  Zahlungsart: <strong>${order.paymentMethod || 'invoice'}</strong>
                </p>
              </div>
            </div>
          </td>
        </tr>
        ` : ''}
      `;
    }).join('');

    return `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Bestell-Nr.</th>
              <th>Datum</th>
              <th>Kunde</th>
              <th>Positionen</th>
              <th>Summe</th>
              <th>Zahlung</th>
              <th>Werkstatt-Status</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function bindOrderTableEvents(container) {
    if (!container) return;

    container.querySelectorAll('[data-order-status]').forEach(sel => {
      sel.addEventListener('change', () => {
        store.updateOrder(sel.getAttribute('data-order-status'), { fulfillmentStatus: sel.value });
        renderAll();
      });
    });

    container.querySelectorAll('[data-order-pay]').forEach(sel => {
      sel.addEventListener('change', () => {
        store.updateOrder(sel.getAttribute('data-order-pay'), { paymentStatus: sel.value });
        renderAll();
      });
    });

    container.querySelectorAll('[data-toggle-order]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-order');
        expandedOrderId = expandedOrderId === id ? null : id;
        renderAll();
      });
    });

    container.querySelectorAll('[data-delete-order]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-order');
        if (confirm('Bestellung wirklich löschen?')) {
          store.deleteOrder(id);
          renderAll();
        }
      });
    });

    container.querySelectorAll('[data-save-track]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-save-track');
        const input = document.getElementById(`trackInput_${id}`);
        if (input) {
          store.updateOrder(id, {
            trackingNumber: input.value.trim(),
            fulfillmentStatus: input.value.trim() ? 'shipped' : 'in_workshop'
          });
          renderAll();
        }
      });
    });
  }

  function renderOrders() {
    const orders = store.getOrders();
    const dashContainer = document.getElementById('dashboardRecentOrders');
    if (dashContainer) {
      dashContainer.innerHTML = buildOrdersTableHTML(orders.slice(0, 5));
      bindOrderTableEvents(dashContainer);
    }

    const fullContainer = document.getElementById('adminAllOrdersTable');
    if (fullContainer) {
      fullContainer.innerHTML = buildOrdersTableHTML(orders);
      bindOrderTableEvents(fullContainer);
    }
  }

  // ==========================================================================
  // 4. RENDER PRODUCTS & INVENTORY EDITOR (Mixers & 3D Accessories)
  // ==========================================================================
  function renderProductsEditor() {
    const mixerContainer = document.getElementById('adminMixersGrid');
    const accContainer = document.getElementById('adminAccessoriesGrid');
    if (!mixerContainer || !accContainer) return;

    const buildCard = (p) => `
      <div class="admin-prod-item" data-prod-card="${p.id}">
        <div class="admin-prod-top">
          <img src="${p.images?.[0] || 'assets/shop_images/mixer_knobs.jpeg'}" alt="${store.t(p.title)}">
          <div style="flex:1;">
            <span style="font-size:0.7rem; color:#64748b; font-weight:700;">${p.sku} • ${p.category.toUpperCase()}</span>
            <h4 style="margin:2px 0; font-size:1rem;">${store.t(p.title)}</h4>
            <span class="admin-badge ${p.isActive && p.stock > 0 ? 'badge-active' : 'badge-inactive'}">
              ${p.isActive && p.stock > 0 ? `Aktiv (${p.stock} Lager)` : 'Inaktiv / Ausverkauft'}
            </span>
          </div>
        </div>

        <div class="admin-prod-fields">
          <div>
            <label>Preis (€)</label>
            <input type="number" step="0.50" class="admin-input" style="width:100%; box-sizing:border-box;" data-field="price" value="${p.price}">
          </div>
          <div>
            <label>Lagerbestand</label>
            <input type="number" step="1" min="0" class="admin-input" style="width:100%; box-sizing:border-box;" data-field="stock" value="${p.stock}">
          </div>
          <div style="grid-column: 1 / -1;">
            <label>Titel (DE)</label>
            <input type="text" class="admin-input" style="width:100%; box-sizing:border-box;" data-field="titleDe" value="${p.title?.de || p.title?.en || ''}">
          </div>
          <div style="grid-column: 1 / -1;">
            <label>3D-Modell (GLB Pfad)</label>
            <input type="text" class="admin-input" style="width:100%; box-sizing:border-box;" data-field="modelUrl" value="${p.modelUrl || ''}">
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; padding-top:10px; border-top:1px solid rgba(15,23,42,0.06);">
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:6px; cursor:pointer;">
            <input type="checkbox" data-field="isActive" ${p.isActive ? 'checked' : ''}>
            Im Shop sichtbar
          </label>
          <button type="button" class="admin-btn admin-btn-primary" data-save-prod="${p.id}">Speichern</button>
        </div>
      </div>
    `;

    mixerContainer.innerHTML = store.getProducts('mixer').map(buildCard).join('');
    accContainer.innerHTML = store.getProducts('accessory').map(buildCard).join('');

    document.querySelectorAll('[data-save-prod]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-save-prod');
        const card = btn.closest('[data-prod-card]');
        const prod = store.getProductById(id);
        if (!card || !prod) return;

        const price = parseFloat(card.querySelector('[data-field="price"]').value) || 0;
        const stock = parseInt(card.querySelector('[data-field="stock"]').value, 10) || 0;
        const titleDe = card.querySelector('[data-field="titleDe"]').value.trim();
        const modelUrl = card.querySelector('[data-field="modelUrl"]').value.trim();
        const isActive = card.querySelector('[data-field="isActive"]').checked;

        store.updateProduct(id, {
          price,
          stock,
          modelUrl,
          isActive,
          title: Object.assign({}, prod.title, { de: titleDe, en: prod.title.en || titleDe })
        });

        btn.textContent = '✓ Gespeichert';
        setTimeout(() => {
          renderAll();
        }, 700);
      });
    });
  }

  // ==========================================================================
  // 5. ADD NEW ACCESSORY / PRODUCT FORM & SETTINGS
  // ==========================================================================
  const newProdForm = document.getElementById('adminNewProductForm');
  newProdForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(newProdForm);
    store.addProduct({
      category: fd.get('category') || 'accessory',
      titleDe: fd.get('titleDe'),
      titleEn: fd.get('titleEn') || fd.get('titleDe'),
      descDe: fd.get('descDe'),
      descEn: fd.get('descDe'),
      price: parseFloat(fd.get('price')) || 19.00,
      stock: parseInt(fd.get('stock'), 10) || 10,
      modelUrl: fd.get('modelUrl') || 'assets/models/knobs_bronze.glb',
      images: [fd.get('imageUrl') || 'assets/shop_images/mixer_knobs.jpeg']
    });
    newProdForm.reset();
    renderAll();
    alert('Neues Produkt wurde dem Shop-Katalog hinzugefügt!');
  });

  // Export Orders JSON
  document.getElementById('exportOrdersBtn')?.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(store.getOrders(), null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `krahn-manufaktur-orders-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  // Reset Catalog to Default
  document.getElementById('resetCatalogBtn')?.addEventListener('click', () => {
    if (confirm('Alle Produktpreise und Lagerbestände auf die Standardwerte zurücksetzen?')) {
      store.resetCatalogToDefaults();
      renderAll();
    }
  });

  function renderAll() {
    renderKPIs();
    renderOrders();
    renderProductsEditor();
  }

  renderAll();
});
