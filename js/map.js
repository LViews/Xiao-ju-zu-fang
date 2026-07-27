/**
 * 地图模块
 * =======
 * 使用 Leaflet + 高德地图瓦片 显示宁波市地图和房源标记
 *
 * 功能：
 *   - 初始化地图，中心为宁波市
 *   - 加载房源数据并在对应坐标显示标记
 *   - 点击标记弹出简要信息，点击详情跳转完整弹窗
 *   - 点击侧边栏卡片时自动定位到对应标记
 *
 * 依赖：Leaflet CSS/JS（CDN 加载）、seed-data.js、listings.js
 */

const MapModule = (() => {
  let map = null;
  let markersLayer = null;
  let markers = {}; // listingId -> marker

  // ==================== 初始化 ====================

  function init() {
    // 创建地图
    map = L.map('map', {
      center: CONFIG.MAP_CENTER,
      zoom: CONFIG.MAP_ZOOM,
      zoomControl: true,
    });

    // 使用高德地图瓦片（国内加载快、无需 API Key、中文标注）
    // style=7 是矢量图，1-4 是子域名用于负载均衡
    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}', {
      subdomains: '1234',
      attribution: '&copy; 高德地图',
      maxZoom: 18,
    }).addTo(map);

    // 创建一个图层组来管理标记
    markersLayer = L.layerGroup().addTo(map);

    // 加载房源标记
    loadMarkers();

    console.log('🗺️ 地图已初始化，中心：宁波市');
  }

  // ==================== 加载房源标记 ====================

  async function loadMarkers() {
    const listings = await DataStore.getListings();

    // 清除旧标记
    markersLayer.clearLayers();
    markers = {};

    listings.forEach(listing => {
      // 找到该房源的最低租金作为显示价格
      const minPrice = listing.prices && listing.prices.length > 0
        ? Math.min(...listing.prices.map(p => p.monthly_rent))
        : '?';

      // 计算平均评分
      const reviews = listing.reviews || [];
      const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

      // 创建标记
      const marker = L.marker([listing.lat, listing.lng], {
        title: listing.title,
        riseOnHover: true,
      });

      // 点击弹窗
      marker.bindPopup(`
        <div style="min-width:180px;">
          <div class="popup-title">${escapeHtml(listing.title)}</div>
          <div style="font-size:0.8rem;color:#64748b;margin:3px 0;">${escapeHtml(listing.address)}</div>
          <div class="popup-price">¥${minPrice}/月</div>
          <div style="font-size:0.75rem;color:#64748b;">
            ${listing.bedrooms}室${listing.halls}厅 · ${listing.area_sqm}㎡
            ${avgRating ? `· ⭐${avgRating}` : ''}
          </div>
          <a class="popup-link" onclick="ListingsModule.showDetail('${listing.id}')">查看详情 →</a>
        </div>
      `);

      markersLayer.addLayer(marker);
      markers[listing.id] = marker;
    });

    console.log(`📍 已加载 ${listings.length} 个房源标记`);
  }

  // ==================== 定位到房源 ====================

  function flyToListing(listingId) {
    const marker = markers[listingId];
    if (marker) {
      const latlng = marker.getLatLng();
      map.flyTo(latlng, 16, { duration: 0.8 });
      marker.openPopup();
    }
  }

  // ==================== 按区域缩放 ====================

  function flyToDistrict(district) {
    const coords = CONFIG.DISTRICTS[district];
    if (coords) {
      map.flyTo(coords, 13, { duration: 0.8 });
    }
  }

  // ==================== 地图选点模式 ====================

  let pickCallback = null;
  let pickHint = null;
  let pickMarker = null;

  function getMap() {
    return map;
  }

  function enablePickMode(callback) {
    if (!map) return;
    pickCallback = callback;

    // 改变光标
    document.getElementById('map').style.cursor = 'crosshair';

    // 显示提示条
    pickHint = document.createElement('div');
    pickHint.style.cssText = `
      position:absolute;top:16px;left:50%;transform:translateX(-50%);z-index:1000;
      background:var(--color-primary);color:#fff;padding:10px 24px;border-radius:8px;
      font-size:0.9rem;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.3);
      pointer-events:none;white-space:nowrap;
    `;
    pickHint.textContent = '📍 请在地图上点击房源位置（按 Esc 取消）';
    document.getElementById('map').appendChild(pickHint);

    // 添加点击监听
    map.once('click', function(e) {
      if (pickMarker) map.removeLayer(pickMarker);
      disablePickMode();
      callback({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // ESC 取消
    function onEsc(e) {
      if (e.key === 'Escape') {
        disablePickMode();
        document.removeEventListener('keydown', onEsc);
      }
    }
    document.addEventListener('keydown', onEsc);
  }

  function disablePickMode() {
    if (!map) return;
    document.getElementById('map').style.cursor = '';
    if (pickHint) { pickHint.remove(); pickHint = null; }
    pickCallback = null;
  }

  return { init, loadMarkers, flyToListing, flyToDistrict, getMap,
           enablePickMode, disablePickMode };
})();
