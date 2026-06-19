 const API_BASE_URL = 'https://backend-massacre-production.up.railway.app';

 // État global
    let currentView = 'front';
    let productId = '';
    let productImages = { front: null, back: null, left: null, right: null };
    let zones = {
      front: [],
      back: [],
      left: [],
      right: []
    };
    let zoneCounter = 0;
    let isDragging = false;
    let isResizing = false;
    let currentZone = null;
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    // Charger un produit depuis Shopify
    async function loadProduct() {
      const input = document.getElementById('product-id');
      productId = input.value.trim();
      
      if (!productId) {
        showMessage('error', 'Veuillez entrer un ID de produit');
        return;
      }

      showLoading(true);
      
      try {
            const response = await fetch(`${API_BASE_URL}/api/zones/product/${encodeURIComponent(productId)}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Erreur de chargement');

            productImages = data.images; // ← stocke toutes les vues

            // Affiche l'image de la vue courante
            updateProductImage();

            if (data.zones) {
            zones = data.zones;
            renderZones();
            }

            showMessage('success', '✅ Produit chargé avec succès !');
        } catch (error) {
            console.error('Erreur:', error);
            showMessage('error', error.message);
        } finally {
            showLoading(false);
        }
    }

    // Nouvelle fonction
    function updateProductImage() {
        const imageUrl = productImages[currentView] || productImages.front || 'https://via.placeholder.com/600x800';
        document.getElementById('product-image').src = imageUrl;
    }

    // Changer de vue
    function switchView(view) {
        currentView = view;

        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });

        updateProductImage(); // ← ajouter ça
        renderZones();
    }

    // Ajouter une nouvelle zone
    function addZone() {
        const img = document.getElementById('product-image');
        const imgRect = img.getBoundingClientRect();

        const zoneWidthPx = 200;
        const zoneHeightPx = 200;
        const zoneLeftPx = (imgRect.width - zoneWidthPx) / 2;
        const zoneTopPx = (imgRect.height - zoneHeightPx) / 2;

        const zoneData = {
            id: `zone-${++zoneCounter}`,
            xPct: zoneLeftPx / imgRect.width,
            yPct: zoneTopPx / imgRect.height,
            wPct: zoneWidthPx / imgRect.width,
            hPct: zoneHeightPx / imgRect.height
        };

        zones[currentView].push(zoneData);
        renderZones();
        updateJSON();
    }

    // Rendre toutes les zones de la vue courante
    function renderZones() {
      const overlay = document.getElementById('zone-overlay');
      overlay.innerHTML = '';
      
      const currentZones = zones[currentView];
      
      currentZones.forEach((zoneData, index) => {
        const zone = createZoneElement(zoneData, index);
        overlay.appendChild(zone);
      });
      
      updateZoneList();
      updateJSON();
    }

    // Créer l'élément DOM d'une zone
    function createZoneElement(zoneData, index) {
    const img = document.getElementById('product-image');
    const imgRect = img.getBoundingClientRect();

    // Conversion pourcentages -> pixels selon la taille actuelle de l'image
    const left = zoneData.xPct * imgRect.width;
    const top = zoneData.yPct * imgRect.height;
    const width = zoneData.wPct * imgRect.width;
    const height = zoneData.hPct * imgRect.height;

    const zone = document.createElement('div');
    zone.className = 'editable-zone';
    zone.dataset.index = index;
    zone.style.left = left + 'px';
    zone.style.top = top + 'px';
    zone.style.width = width + 'px';
    zone.style.height = height + 'px';

    // Label
    const label = document.createElement('div');
    label.className = 'zone-label';
    label.textContent = `${Math.round(width)}×${Math.round(height)}`;
    zone.appendChild(label);

    // Bouton supprimer
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-zone';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = () => deleteZone(index);
    zone.appendChild(deleteBtn);

    // Poignées de redimensionnement
    ['nw', 'ne', 'sw', 'se'].forEach(position => {
        const handle = document.createElement('div');
        handle.className = `zone-handle ${position}`;
        handle.dataset.position = position;
        zone.appendChild(handle);

        handle.addEventListener('mousedown', (e) => startResize(e, zone, position));
    });

    // Drag & drop
    zone.addEventListener('mousedown', (e) => {
        if (e.target === zone) startDrag(e, zone);
    });

    return zone;
    }

    // Démarrer le drag
    function startDrag(e, zone) {
      if (isResizing) return;
      isDragging = true;
      currentZone = zone;
      
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(zone.style.left);
      startTop = parseInt(zone.style.top);
      
      e.preventDefault();
    }

    // Démarrer le resize
    function startResize(e, zone, position) {
      isResizing = true;
      currentZone = zone;
      
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(zone.style.width);
      startHeight = parseInt(zone.style.height);
      startLeft = parseInt(zone.style.left);
      startTop = parseInt(zone.style.top);
      currentZone.dataset.resizePosition = position;
      
      e.preventDefault();
      e.stopPropagation();
    }

    // Événements globaux de souris
    document.addEventListener('mousemove', (e) => {
      if (isDragging && currentZone) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        currentZone.style.left = (startLeft + dx) + 'px';
        currentZone.style.top = (startTop + dy) + 'px';
        
        updateZoneLabel(currentZone);
      }
      
      if (isResizing && currentZone) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const position = currentZone.dataset.resizePosition;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        if (position.includes('e')) newWidth = Math.max(50, startWidth + dx);
        if (position.includes('w')) {
          newWidth = Math.max(50, startWidth - dx);
          newLeft = startLeft + dx;
        }
        if (position.includes('s')) newHeight = Math.max(50, startHeight + dy);
        if (position.includes('n')) {
          newHeight = Math.max(50, startHeight - dy);
          newTop = startTop + dy;
        }
        
        currentZone.style.width = newWidth + 'px';
        currentZone.style.height = newHeight + 'px';
        currentZone.style.left = newLeft + 'px';
        currentZone.style.top = newTop + 'px';
        
        updateZoneLabel(currentZone);
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging || isResizing) {
        saveZonePosition(currentZone);
      }
      isDragging = false;
      isResizing = false;
      currentZone = null;
    });

    // Sauvegarder la position d'une zone
    function saveZonePosition(zone) {
        const img = document.getElementById('product-image');
        const imgRect = img.getBoundingClientRect();
        const index = parseInt(zone.dataset.index);

        zones[currentView][index] = {
            xPct: parseInt(zone.style.left) / imgRect.width,
            yPct: parseInt(zone.style.top) / imgRect.height,
            wPct: parseInt(zone.style.width) / imgRect.width,
            hPct: parseInt(zone.style.height) / imgRect.height
        };
        updateJSON();
        updateZoneList();
    }

    // Mettre à jour le label d'une zone
    function updateZoneLabel(zone) {
      const label = zone.querySelector('.zone-label');
      const w = Math.round(parseInt(zone.style.width));
      const h = Math.round(parseInt(zone.style.height));
      label.textContent = `${w}×${h}`;
    }

    // Supprimer une zone
    function deleteZone(index) {
      zones[currentView].splice(index, 1);
      renderZones();
    }

    // Effacer toutes les zones de la vue courante
    function clearZones() {
      if (confirm(`Voulez-vous vraiment effacer toutes les zones de la vue "${currentView}" ?`)) {
        zones[currentView] = [];
        renderZones();
      }
    }

    // Mettre à jour la liste des zones
    function updateZoneList() {
    const list = document.getElementById('zone-list');
    const currentZones = zones[currentView];

    if (currentZones.length === 0) {
        list.innerHTML = '<p style="color: #a0aec0; font-size: 13px;">Aucune zone définie pour cette vue</p>';
        return;
    }

    list.innerHTML = currentZones.map((zone, index) => `
        <div class="zone-item">
        <strong>Zone ${index + 1}</strong><br>
        Position : (${(zone.xPct * 100).toFixed(1)}%, ${(zone.yPct * 100).toFixed(1)}%)<br>
        Taille : ${(zone.wPct * 100).toFixed(1)}% × ${(zone.hPct * 100).toFixed(1)}%
        </div>
    `).join('');
    }

    // Mettre à jour le JSON
    function updateJSON() {
      const json = JSON.stringify(zones, null, 2);
      document.getElementById('json-preview').value = json;
    }

    // Sauvegarder dans Shopify
    async function saveToShopify() {
      if (!productId) {
        showMessage('error', 'Veuillez d\'abord charger un produit');
        return;
      }
      
      showLoading(true);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/zones/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId: productId,
            zones: zones
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Erreur de sauvegarde');
        
        showMessage('success', '✅ Zones sauvegardées dans Shopify avec succès !');
      } catch (error) {
        console.error('Erreur:', error);
        showMessage('error', error.message);
      } finally {
        showLoading(false);
      }
    }

    // Afficher un message
    function showMessage(type, message) {
      const msgEl = document.getElementById('status-message');
      msgEl.className = `status-message ${type}`;
      msgEl.textContent = message;
      msgEl.style.display = 'block';
      
      setTimeout(() => {
        msgEl.style.display = 'none';
      }, 5000);
    }

    // Afficher/masquer le loading
    function showLoading(show) {
      document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    document.getElementById('load-btn').addEventListener('click', loadProduct);
    document.getElementById('add-zone-btn').addEventListener('click', addZone);
    document.getElementById('clear-zones-btn').addEventListener('click', clearZones);
    document.getElementById('save-btn').addEventListener('click', saveToShopify);

    document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Initialisation
    updateJSON();