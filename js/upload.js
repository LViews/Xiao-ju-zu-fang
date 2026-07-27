/**
 * 上传房源模块
 * ============
 * 用户发布房源 + 管理员审核
 *
 * 对外接口：
 *   UploadModule.showModal()        - 打开发布房源弹窗
 *   UploadModule.renderAdminPanel() - 在侧边栏渲染管理员审核面板
 */

const UploadModule = (() => {
  let selectedLat = null;
  let selectedLng = null;

  // ==================== 弹窗 ====================

  function showModal() {
    if (!Auth.isLoggedIn()) {
      showToast('请先登录后再发布房源', 'error');
      Auth.showModal('login');
      return;
    }

    selectedLat = null;
    selectedLng = null;

    const body = document.getElementById('upload-modal-body');
    body.innerHTML = getFormHTML();

    document.getElementById('upload-modal-overlay').classList.add('show');

    // 点击遮罩关闭
    document.getElementById('upload-modal-overlay').onclick = function(e) {
      if (e.target === this) closeModal();
    };
  }

  function closeModal() {
    MapModule.disablePickMode();
    document.getElementById('upload-modal-overlay').classList.remove('show');
  }

  // ==================== 表单 HTML ====================

  function getFormHTML() {
    const districts = Object.keys(CONFIG.DISTRICTS);
    return `
      <button class="modal-close" onclick="UploadModule.closeModal()">✕</button>
      <h2>📤 发布房源</h2>
      <form id="upload-form" onsubmit="return UploadModule.handleSubmit(event)">

        <!-- 1. 基本信息 -->
        <div class="upload-section">
          <h3>📋 基本信息</h3>

          <div class="form-group">
            <label>房源标题<span class="required">*</span></label>
            <input type="text" id="up-title" placeholder="如：翠柏一里 2室1厅" maxlength="100" required>
          </div>

          <div class="form-group">
            <label>所在区域<span class="required">*</span></label>
            <select id="up-district" required>
              <option value="">请选择区域</option>
              ${districts.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label>位置坐标<span class="required">*</span></label>
            <div class="map-pick-area" id="map-pick-display">
              ${selectedLat !== null
                ? `<span class="coord-set">✓ 已选取</span> <span class="coord">${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}</span>`
                : '尚未选择位置'}
            </div>
            <button type="button" class="btn btn-outline btn-sm" onclick="UploadModule.startMapPick()">📍 从地图选择位置</button>
            <input type="hidden" id="up-lat" value="${selectedLat !== null ? selectedLat.toFixed(6) : ''}">
            <input type="hidden" id="up-lng" value="${selectedLng !== null ? selectedLng.toFixed(6) : ''}">
          </div>

          <div class="form-group">
            <label>详细地址<span class="required">*</span></label>
            <input type="text" id="up-address" placeholder="如：海曙区翠柏路168号翠柏一里12幢" maxlength="200" required>
          </div>

          <div style="display:flex; gap:10px;">
            <div class="form-group" style="flex:1;">
              <label>面积（㎡）<span class="required">*</span></label>
              <input type="number" id="up-area" placeholder="如：85" min="1" required>
            </div>
            <div class="form-group" style="flex:1;">
              <label>卧室数<span class="required">*</span></label>
              <input type="number" id="up-bedrooms" placeholder="如：2" min="0" value="1" required>
            </div>
            <div class="form-group" style="flex:1;">
              <label>客厅数<span class="required">*</span></label>
              <input type="number" id="up-halls" placeholder="如：1" min="0" value="1" required>
            </div>
          </div>

          <div class="form-group">
            <label>描述<span style="color:var(--color-text-muted);font-weight:400;">（选填）</span></label>
            <textarea id="up-description" placeholder="描述一下房源情况..." rows="3" maxlength="500"></textarea>
          </div>
        </div>

        <!-- 2. 租金信息 -->
        <div class="upload-section">
          <h3>💰 租金信息<span class="required">*</span> <span style="font-size:0.7rem;color:var(--color-text-muted);font-weight:400;">（至少一条）</span></h3>
          <div id="price-rows">
            ${getPriceRowHTML(0)}
          </div>
          <button type="button" class="btn-add-row" onclick="UploadModule.addPriceRow()">+ 添加租金</button>
          <input type="hidden" id="price-count" value="1">
        </div>

        <!-- 3. 水电费用 -->
        <div class="upload-section">
          <h3 class="section-toggle open" onclick="UploadModule.toggleSection(this)">⚡ 水电费用<span class="required">*</span></h3>
          <div class="section-content open">
            <div style="display:flex; gap:10px;">
              <div class="form-group" style="flex:1;">
                <label>水费（元/吨）<span class="required">*</span></label>
                <input type="number" id="up-water-price" placeholder="如：3.5" min="0" step="0.1" required>
              </div>
              <div class="form-group" style="flex:1;">
                <label>电费（元/度）<span class="required">*</span></label>
                <input type="number" id="up-elec-price" placeholder="如：0.6" min="0" step="0.01" required>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. 电器信息 -->
        <div class="upload-section">
          <h3 class="section-toggle open" onclick="UploadModule.toggleSection(this)">🔌 电器信息<span class="required">*</span> <span style="font-size:0.7rem;color:var(--color-text-muted);font-weight:400;">（至少一个）</span></h3>
          <div class="section-content open">
            <div id="appliance-rows">
              ${getApplianceRowHTML(0)}
            </div>
            <button type="button" class="btn-add-row" onclick="UploadModule.addApplianceRow()">+ 添加电器</button>
            <input type="hidden" id="appliance-count" value="1">
          </div>
        </div>

        <!-- 5. 其他费用 -->
        <div class="upload-section">
          <h3 class="section-toggle open" onclick="UploadModule.toggleSection(this)">📄 其他费用<span class="required">*</span></h3>
          <div class="section-content open">
            ${getFeeRowHTML('property', '物业费')}
            ${getFeeRowHTML('internet', '网费')}
            ${getFeeRowHTML('parking', '停车费')}
          </div>
        </div>

        <div class="form-error" id="upload-error"></div>
        <button type="submit" class="btn btn-primary btn-block" id="upload-submit-btn">提交房源（等待管理员审核）</button>
      </form>
    `;
  }

  function getPriceRowHTML(index) {
    return `
      <div class="dynamic-row" id="price-row-${index}">
        <select id="price-orientation-${index}" required>
          <option value="">朝向</option>
          <option value="南">南</option>
          <option value="北">北</option>
          <option value="东">东</option>
          <option value="西">西</option>
          <option value="东南">东南</option>
          <option value="西南">西南</option>
          <option value="东北">东北</option>
          <option value="西北">西北</option>
        </select>
        <select id="price-level-${index}">
          <option value="">楼层</option>
          <option value="低层">低层</option>
          <option value="中层">中层</option>
          <option value="高层">高层</option>
        </select>
        <input type="number" id="price-floor-${index}" placeholder="层数" min="1" style="max-width:70px;">
        <input type="number" id="price-rent-${index}" placeholder="月租(元)" min="1" required style="max-width:110px;">
        <button type="button" class="btn-remove" onclick="UploadModule.removeRow('price-row-${index}')" title="删除">✕</button>
      </div>
    `;
  }

  function getApplianceRowHTML(index) {
    return `
      <div class="dynamic-row" id="appliance-row-${index}">
        <input type="text" id="app-name-${index}" placeholder="名称（如：空调）" required>
        <select id="app-energy-${index}" required>
          <option value="">能效</option>
          <option value="1">1级</option>
          <option value="2">2级</option>
          <option value="3">3级</option>
          <option value="4">4级</option>
          <option value="5">5级</option>
        </select>
        <input type="number" id="app-power-${index}" placeholder="功率(W)" min="1" required style="max-width:90px;">
        <input type="number" id="app-daily-${index}" placeholder="日耗电(元)" min="0" step="0.1" required style="max-width:100px;">
        <button type="button" class="btn-remove" onclick="UploadModule.removeRow('appliance-row-${index}')" title="删除">✕</button>
      </div>
    `;
  }

  function getFeeRowHTML(key, label) {
    return `
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px;">
        <span style="width:60px; font-size:0.85rem; color:var(--color-text-secondary);">${label}</span>
        <input type="number" id="up-${key}-fee" placeholder="月费(元)" min="0" value="0" required style="flex:1;">
        <label style="display:flex; align-items:center; gap:4px; font-size:0.8rem; color:var(--color-text-secondary); white-space:nowrap; cursor:pointer;">
          <input type="checkbox" id="up-${key}-included"> 已含在租金
        </label>
      </div>
    `;
  }

  // ==================== 动态行操作 ====================

  function addPriceRow() {
    const count = parseInt(document.getElementById('price-count').value);
    const container = document.getElementById('price-rows');
    container.insertAdjacentHTML('beforeend', getPriceRowHTML(count));
    document.getElementById('price-count').value = count + 1;
  }

  function addApplianceRow() {
    const count = parseInt(document.getElementById('appliance-count').value);
    const container = document.getElementById('appliance-rows');
    container.insertAdjacentHTML('beforeend', getApplianceRowHTML(count));
    document.getElementById('appliance-count').value = count + 1;
  }

  function removeRow(rowId) {
    const el = document.getElementById(rowId);
    if (el) {
      // 检查是否至少保留一行
      const parent = el.parentElement;
      const remaining = parent.querySelectorAll('.dynamic-row');
      if (remaining.length <= 1 && rowId.startsWith('price')) {
        showToast('至少保留一条租金信息', 'error');
        return;
      }
      if (remaining.length <= 1 && rowId.startsWith('appliance')) {
        showToast('至少保留一个电器信息', 'error');
        return;
      }
      el.remove();
    }
  }

  function toggleSection(header) {
    header.classList.toggle('open');
    header.nextElementSibling.classList.toggle('open');
  }

  // ==================== 地图选点 ====================

  function startMapPick() {
    closeModal();
    MapModule.enablePickMode(function(pos) {
      selectedLat = pos.lat;
      selectedLng = pos.lng;
      // 重新显示弹窗并更新坐标
      showModal();
      // 更新坐标显示（重新渲染后需要设置值）
      setTimeout(() => {
        const latEl = document.getElementById('up-lat');
        const lngEl = document.getElementById('up-lng');
        if (latEl) { latEl.value = pos.lat.toFixed(6); selectedLat = pos.lat; }
        if (lngEl) { lngEl.value = pos.lng.toFixed(6); selectedLng = pos.lng; }
        const disp = document.getElementById('map-pick-display');
        if (disp) {
          disp.innerHTML = `<span class="coord-set">✓ 已选取</span> <span class="coord">${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}</span>`;
        }
      }, 0);
    });
  }

  // ==================== 表单提交 ====================

  async function handleSubmit(event) {
    event.preventDefault();

    const errorEl = document.getElementById('upload-error');
    const btnEl = document.getElementById('upload-submit-btn');
    errorEl.style.display = 'none';
    btnEl.disabled = true;
    btnEl.textContent = '提交中...';

    try {
      // 收集基本信息
      const title = document.getElementById('up-title').value.trim();
      const district = document.getElementById('up-district').value;
      let lat = selectedLat;
      let lng = selectedLng;
      const address = document.getElementById('up-address').value.trim();
      const area = parseFloat(document.getElementById('up-area').value);
      const bedrooms = parseInt(document.getElementById('up-bedrooms').value);
      const halls = parseInt(document.getElementById('up-halls').value);
      const description = document.getElementById('up-description').value.trim();

      // 验证基本字段
      if (!title) throw new Error('请填写房源标题');
      if (!district) throw new Error('请选择所在区域');
      if (lat === null || lng === null) throw new Error('请从地图选择房源位置');
      if (!address) throw new Error('请填写详细地址');
      if (!area || area <= 0) throw new Error('请填写有效面积');
      if (isNaN(bedrooms) || bedrooms < 0) throw new Error('请填写卧室数量');
      if (isNaN(halls) || halls < 0) throw new Error('请填写客厅数量');

      // 收集租金
      const priceCount = parseInt(document.getElementById('price-count').value) || 1;
      const prices = [];
      for (let i = 0; i < priceCount; i++) {
        const orientation = document.getElementById(`price-orientation-${i}`)?.value;
        const monthlyRent = parseInt(document.getElementById(`price-rent-${i}`)?.value);
        if (orientation && monthlyRent && monthlyRent > 0) {
          prices.push({
            orientation,
            floor_level: document.getElementById(`price-level-${i}`)?.value || null,
            floor_number: parseInt(document.getElementById(`price-floor-${i}`)?.value) || null,
            monthly_rent: monthlyRent,
          });
        }
      }
      if (prices.length === 0) throw new Error('请至少填写一条完整的租金信息（朝向+月租）');

      // 收集水电
      const waterPrice = parseFloat(document.getElementById('up-water-price')?.value);
      const elecPrice = parseFloat(document.getElementById('up-elec-price')?.value);
      if (!waterPrice || waterPrice < 0) throw new Error('请填写水费单价');
      if (!elecPrice || elecPrice < 0) throw new Error('请填写电费单价');

      // 收集电器
      const appCount = parseInt(document.getElementById('appliance-count').value) || 1;
      const appliances = [];
      for (let i = 0; i < appCount; i++) {
        const name = document.getElementById(`app-name-${i}`)?.value?.trim();
        const energy = parseInt(document.getElementById(`app-energy-${i}`)?.value);
        const power = parseInt(document.getElementById(`app-power-${i}`)?.value);
        const daily = parseFloat(document.getElementById(`app-daily-${i}`)?.value);
        if (name && energy && power && daily >= 0) {
          appliances.push({ name, energy_level: energy, power_watts: power, daily_cost_yuan: daily });
        }
      }
      if (appliances.length === 0) throw new Error('请至少填写一个电器的完整信息');

      // 收集其他费用
      const getFee = (key) => ({
        fee: parseInt(document.getElementById(`up-${key}-fee`)?.value) || 0,
        included: document.getElementById(`up-${key}-included`)?.checked || false,
      });
      const propFee = getFee('property');
      const intFee = getFee('internet');
      const parkFee = getFee('parking');

      // 组装数据
      const listingData = {
        title, address, district, lat, lng,
        area_sqm: area, bedrooms, halls,
        description: description || null,
        prices,
        utilities: {
          water_price: waterPrice,
          electricity_price: elecPrice,
          appliances,
          property_fee: propFee.fee,
          property_fee_included: propFee.included,
          internet_fee: intFee.fee,
          internet_fee_included: intFee.included,
          parking_fee: parkFee.fee,
          parking_fee_included: parkFee.included,
        },
      };

      // 去重检查
      const nearby = await DataStore.findNearbyListings(lat, lng, CONFIG.DEDUP_DISTANCE_METERS);
      const dupes = nearby.filter(l => titlesSimilar(title, l.title));
      if (dupes.length > 0) {
        const dupeTitle = dupes[0].title;
        const confirmed = confirm(
          `⚠️ 附近 ${CONFIG.DEDUP_DISTANCE_METERS}m 内已存在相似房源「${dupeTitle}」。\n\n` +
          '这可能被视为同一房源的不同户型/楼层信息。\n' +
          '是否仍要提交？'
        );
        if (!confirmed) {
          btnEl.disabled = false;
          btnEl.textContent = '提交房源（等待管理员审核）';
          return false;
        }
      }

      // 提交
      await DataStore.addListing(listingData);
      showToast('房源已提交，等待管理员审核', 'success');
      closeModal();

      // 刷新地图和列表
      await MapModule.loadMarkers();
      const listings = await DataStore.getListings();
      ListingsModule.renderSidebar(listings);

    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } finally {
      btnEl.disabled = false;
      btnEl.textContent = '提交房源（等待管理员审核）';
    }
    return false;
  }

  // ==================== 管理员审核面板 ====================

  async function renderAdminPanel() {
    if (!Auth.isAdmin()) return;

    const pending = await DataStore.getPendingListings();

    // 在侧边栏顶部插入审核面板
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // 移除旧面板
    const oldPanel = sidebar.querySelector('.admin-panel');
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.innerHTML = `
      <h4>🔍 待审核房源（${pending.length}）</h4>
      ${pending.length === 0
        ? '<div style="font-size:0.8rem;color:var(--color-text-muted);">暂无待审核房源</div>'
        : pending.map(l => {
            const minPrice = l.prices && l.prices.length > 0
              ? Math.min(...l.prices.map(p => p.monthly_rent)) : '?';
            return `
              <div class="pending-item">
                <div class="pending-info">
                  <div class="pending-title">${escapeHtml(l.title)}</div>
                  <div class="pending-meta">${escapeHtml(l.district)} · ¥${minPrice}/月 · ${escapeHtml(l.submitted_by || '?')} · ${new Date(l.created_at).toLocaleDateString('zh-CN')}</div>
                </div>
                <div class="pending-actions">
                  <button class="btn-approve" onclick="UploadModule.approveListing('${l.id}')">✓ 通过</button>
                  <button class="btn-reject" onclick="UploadModule.rejectListing('${l.id}')">✕ 拒绝</button>
                </div>
              </div>
            `;
          }).join('')
      }
    `;

    // 插入到列表容器之前
    const sidebarList = sidebar.querySelector('.sidebar-header');
    if (sidebarList) {
      sidebar.insertBefore(panel, sidebarList.nextSibling);
    } else {
      sidebar.insertBefore(panel, sidebar.firstChild);
    }
  }

  async function approveListing(id) {
    try {
      await DataStore.updateListingStatus(id, 'approved');
      showToast('房源已通过审核', 'success');
      await MapModule.loadMarkers();
      const listings = await DataStore.getListings();
      ListingsModule.renderSidebar(listings);
      renderAdminPanel();
    } catch (err) {
      showToast('操作失败：' + err.message, 'error');
    }
  }

  async function rejectListing(id) {
    try {
      await DataStore.updateListingStatus(id, 'rejected');
      showToast('房源已拒绝', 'success');
      renderAdminPanel();
    } catch (err) {
      showToast('操作失败：' + err.message, 'error');
    }
  }

  return { showModal, closeModal, startMapPick,
           addPriceRow, addApplianceRow, removeRow, toggleSection,
           handleSubmit, renderAdminPanel, approveListing, rejectListing };
})();
