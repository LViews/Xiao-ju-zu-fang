/**
 * 房源列表 & 详情模块
 * ===================
 *
 * 功能：
 *   - 侧边栏房源卡片列表
 *   - 房源详情弹窗（价格表、水电费、电器能耗、物业费、评论）
 *   - 评论的好评/差评自动分类展示
 *   - 新增评论（需登录）
 */

const ListingsModule = (() => {
  // ==================== 渲染侧边栏列表 ====================

  function renderSidebar(listings) {
    const container = document.getElementById('sidebar-list');
    if (!container) return;

    if (!listings || listings.length === 0) {
      container.innerHTML = '<div class="review-empty">暂无房源数据</div>';
      return;
    }

    // 更新计数
    const countEl = document.getElementById('sidebar-count');
    if (countEl) countEl.textContent = `共 ${listings.length} 条房源`;

    container.innerHTML = listings.map(listing => {
      const minPrice = listing.prices && listing.prices.length > 0
        ? Math.min(...listing.prices.map(p => p.monthly_rent))
        : '?';
      const maxPrice = listing.prices && listing.prices.length > 0
        ? Math.max(...listing.prices.map(p => p.monthly_rent))
        : '?';

      const reviews = listing.reviews || [];
      const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

      // 获取朝向范围
      const orientations = [...new Set((listing.prices || []).map(p => p.orientation))];

      return `
        <div class="listing-card" onclick="ListingsModule.showDetail('${listing.id}')" data-id="${listing.id}">
          <div class="card-price">
            ¥${minPrice.toLocaleString()}
            ${minPrice !== maxPrice ? `<span>~ ¥${maxPrice.toLocaleString()}/月</span>` : '<span>/月</span>'}
          </div>
          <div class="card-title">${escapeHtml(listing.title)}</div>
          <div class="card-meta">
            <span>📍 ${escapeHtml(listing.district)}</span>
            <span>📐 ${listing.bedrooms}室${listing.halls}厅 ${listing.area_sqm}㎡</span>
            <span>🧭 ${orientations.join('/')}</span>
          </div>
          ${avgRating ? `
          <div class="card-rating">
            <span class="stars">${starsHtml(parseFloat(avgRating))}</span>
            <span>${avgRating}</span>
            <span style="color:var(--color-text-muted);">${reviews.length}条评论</span>
          </div>` : ''}
        </div>
      `;
    }).join('');
  }

  // ==================== 显示房源详情弹窗 ====================

  async function showDetail(listingId) {
    const listing = await DataStore.getListing(listingId);
    if (!listing) {
      showToast('房源数据未找到', 'error');
      return;
    }

    // 高亮侧边栏对应卡片
    document.querySelectorAll('.listing-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.listing-card[data-id="${listingId}"]`);
    if (card) {
      card.classList.add('active');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 地图定位
    MapModule.flyToListing(listingId);

    const overlay = document.getElementById('detail-modal-overlay');
    const body = document.getElementById('detail-modal-body');

    const reviews = listing.reviews || [];
    const positiveReviews = reviews.filter(r => r.rating >= 4);
    const negativeReviews = reviews.filter(r => r.rating <= 2);
    const neutralReviews = reviews.filter(r => r.rating === 3);

    body.innerHTML = `
      <button class="modal-close" onclick="ListingsModule.closeDetail()">✕</button>

      <!-- 头部信息 -->
      <div class="detail-header">
        <h2>🏠 ${escapeHtml(listing.title)}</h2>
        <div class="detail-address">📍 ${escapeHtml(listing.address)}</div>
        <div class="detail-meta">
          <span>📐 <strong>${listing.area_sqm}㎡</strong></span>
          <span>🛏 <strong>${listing.bedrooms}室${listing.halls}厅</strong></span>
          <span>🏘 <strong>${escapeHtml(listing.district)}</strong></span>
          ${reviews.length > 0 ? `<span>⭐ <strong>${(reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1)}</strong> (${reviews.length}条评价)</span>` : ''}
        </div>
        ${listing.description ? `<p style="margin-top:10px;font-size:0.9rem;color:var(--color-text-secondary);">${escapeHtml(listing.description)}</p>` : ''}
      </div>

      <!-- 价格明细表 -->
      ${renderPriceTable(listing)}

      <!-- 水电费用 -->
      ${renderUtilities(listing)}

      <!-- 电器能耗 -->
      ${renderAppliances(listing)}

      <!-- 其他费用 -->
      ${renderFees(listing)}

      <!-- 评论 -->
      ${renderReviews(listing, positiveReviews, negativeReviews, neutralReviews)}
    `;

    overlay.classList.add('show');

    // 点击遮罩关闭
    overlay.onclick = function(e) {
      if (e.target === overlay) closeDetail();
    };
  }

  function closeDetail() {
    document.getElementById('detail-modal-overlay').classList.remove('show');
    document.querySelectorAll('.listing-card').forEach(c => c.classList.remove('active'));
  }

  // ==================== 价格表 ====================

  function renderPriceTable(listing) {
    if (!listing.prices || listing.prices.length === 0) return '';

    const rows = listing.prices.map(p => `
      <tr>
        <td>${escapeHtml(p.orientation)}向</td>
        <td>${escapeHtml(p.floor_level)} ${p.floor_number}F</td>
        <td class="price-highlight">¥${p.monthly_rent.toLocaleString()}/月</td>
      </tr>
    `).join('');

    return `
      <div class="detail-section">
        <h3><span class="icon">💰</span> 价格明细（按朝向和楼层）</h3>
        <div style="overflow-x:auto;">
          <table class="price-table">
            <thead>
              <tr><th>朝向</th><th>楼层</th><th>月租金</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="form-hint" style="margin-top:8px;">
          💡 南向采光最好、高层视野好 → 价格更高；北向、低层 → 价格更低
        </div>
      </div>
    `;
  }

  // ==================== 水电费用 ====================

  function renderUtilities(listing) {
    const u = listing.utilities;
    if (!u) return '';

    return `
      <div class="detail-section">
        <h3><span class="icon">⚡</span> 水电单价</h3>
        <table class="energy-table">
          <tr><td width="100">💧 水费</td><td><strong>¥${u.water_price}/吨</strong></td></tr>
          <tr><td>🔌 电费</td><td><strong>¥${u.electricity_price}/度</strong></td></tr>
        </table>
      </div>
    `;
  }

  // ==================== 电器能耗表 ====================

  function renderAppliances(listing) {
    const u = listing.utilities;
    if (!u || !u.appliances || u.appliances.length === 0) return '';

    // 计算所有电器开一天的总花费
    const totalDaily = u.appliances.reduce((sum, a) => sum + (a.daily_cost_yuan || 0), 0);

    const rows = u.appliances.map(a => `
      <tr>
        <td>${escapeHtml(a.name)}</td>
        <td><span class="energy-level l${a.energy_level}">${a.energy_level}级能耗</span></td>
        <td>${a.power_watts}W</td>
        <td class="daily-cost">¥${a.daily_cost_yuan}/天</td>
      </tr>
    `).join('');

    return `
      <div class="detail-section">
        <h3><span class="icon">🔌</span> 电器能耗详情（开一天花费）</h3>
        <div style="overflow-x:auto;">
          <table class="price-table">
            <thead>
              <tr><th>电器</th><th>能耗等级</th><th>功率</th><th>每天花费</th></tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="font-weight:700;background:var(--color-warning-light);">
                <td colspan="3">📊 所有电器开一天合计</td>
                <td class="daily-cost" style="font-size:1rem;">¥${totalDaily.toFixed(1)}/天</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="form-hint" style="margin-top:6px;">
          💡 每天花费按典型使用时长估算（空调8h、热水器2h、冰箱24h、洗衣机1h）
        </div>
      </div>
    `;
  }

  // ==================== 物业费/网费/停车费 ====================

  function renderFees(listing) {
    const u = listing.utilities;
    if (!u) return '';

    // 计算额外费用总计
    let extraTotal = 0;
    if (!u.property_fee_included && u.property_fee) extraTotal += u.property_fee;
    if (!u.internet_fee_included && u.internet_fee) extraTotal += u.internet_fee;
    if (!u.parking_fee_included && u.parking_fee) extraTotal += u.parking_fee;

    return `
      <div class="detail-section">
        <h3><span class="icon">📋</span> 其他费用明细</h3>
        <table class="energy-table">
          <tr>
            <td width="100">🏢 物业费</td>
            <td><strong>¥${u.property_fee || 0}/月</strong></td>
            <td><span class="fee-tag ${u.property_fee_included ? 'included' : 'excluded'}">${u.property_fee_included ? '✅ 含在租金内' : '❌ 另付'}</span></td>
          </tr>
          <tr>
            <td>🌐 网费</td>
            <td><strong>${u.internet_fee ? '¥' + u.internet_fee + '/月' : '免费'}</strong></td>
            <td><span class="fee-tag ${u.internet_fee_included ? 'included' : 'excluded'}">${u.internet_fee_included ? '✅ 含在租金内' : '❌ 另付'}</span></td>
          </tr>
          <tr>
            <td>🅿️ 停车费</td>
            <td><strong>${u.parking_fee ? '¥' + u.parking_fee + '/月' : '免费'}</strong></td>
            <td><span class="fee-tag ${u.parking_fee_included ? 'included' : 'excluded'}">${u.parking_fee_included ? '✅ 含在租金内' : '❌ 另付'}</span></td>
          </tr>
        </table>
        ${extraTotal > 0 ? `
        <div style="margin-top:8px;padding:8px 12px;background:var(--color-danger-light);border-radius:var(--radius-sm);font-size:0.85rem;">
          ⚠️ 每月租金外需额外支付约 <strong style="color:var(--color-danger);">¥${extraTotal}/月</strong>
        </div>` : `
        <div style="margin-top:8px;padding:8px 12px;background:var(--color-success-light);border-radius:var(--radius-sm);font-size:0.85rem;">
          🎉 所有杂费均含在租金内，无需额外支付！
        </div>`}
      </div>
    `;
  }

  // ==================== 评论 ====================

  function renderReviews(listing, positive, negative, neutral) {
    const allReviews = listing.reviews || [];

    if (allReviews.length === 0) {
      return `
        <div class="detail-section">
          <h3><span class="icon">💬</span> 用户评价</h3>
          <div class="review-empty">暂无评价，成为第一个评价的人吧！</div>
          ${renderReviewForm(listing)}
        </div>
      `;
    }

    return `
      <div class="detail-section">
        <h3><span class="icon">💬</span> 用户评价</h3>

        <!-- 评价标签切换 -->
        <div class="review-tabs">
          <button class="review-tab active" onclick="ListingsModule.filterReviews('${listing.id}', 'all')">
            全部 <span class="count">${allReviews.length}</span>
          </button>
          <button class="review-tab" onclick="ListingsModule.filterReviews('${listing.id}', 'positive')">
            👍 好评 <span class="count">${positive.length}</span>
          </button>
          <button class="review-tab" onclick="ListingsModule.filterReviews('${listing.id}', 'negative')">
            👎 差评 <span class="count">${negative.length}</span>
          </button>
          ${neutral.length > 0 ? `
          <button class="review-tab" onclick="ListingsModule.filterReviews('${listing.id}', 'neutral')">
            😐 中评 <span class="count">${neutral.length}</span>
          </button>` : ''}
        </div>

        <!-- 评价列表 -->
        <div id="review-list-${listing.id}">
          ${allReviews.map(r => reviewItemHtml(r)).join('')}
        </div>

        ${renderReviewForm(listing)}
      </div>
    `;
  }

  function reviewItemHtml(review) {
    const cls = review.rating >= 4 ? 'positive' : (review.rating <= 2 ? 'negative' : '');
    return `
      <div class="review-item ${cls}" data-rating="${review.rating}">
        <div class="review-header">
          <span class="review-user">👤 ${escapeHtml(review.user_name || '匿名用户')}</span>
          <span class="review-date">${review.created_at || ''}</span>
        </div>
        <div class="review-stars">${starsHtml(review.rating)}</div>
        <div class="review-content">${escapeHtml(review.content)}</div>
      </div>
    `;
  }

  // 评价筛选
  function filterReviews(listingId, type) {
    const container = document.getElementById('review-list-' + listingId);
    if (!container) return;

    // 更新 tab 样式
    const tabs = container.parentElement.querySelectorAll('.review-tab');
    tabs.forEach(t => t.classList.remove('active'));
    // 找到被点击的 tab 并激活
    tabs.forEach(t => {
      if (t.textContent.trim().startsWith(type === 'all' ? '全部' : (type === 'positive' ? '👍' : (type === 'negative' ? '👎' : '😐')))) {
        t.classList.add('active');
      }
    });

    // 筛选
    const items = container.querySelectorAll('.review-item');
    items.forEach(item => {
      const rating = parseInt(item.dataset.rating);
      if (type === 'all') {
        item.style.display = '';
      } else if (type === 'positive') {
        item.style.display = rating >= 4 ? '' : 'none';
      } else if (type === 'negative') {
        item.style.display = rating <= 2 ? '' : 'none';
      } else if (type === 'neutral') {
        item.style.display = rating === 3 ? '' : 'none';
      }
    });
  }

  // ==================== 评论表单 ====================

  function renderReviewForm(listing) {
    return `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--color-border-light);">
        <h4 style="font-size:0.9rem;margin-bottom:10px;">✏️ 写评价</h4>
        <div id="review-form-msg-${listing.id}"></div>
        <div class="form-group">
          <label>评分</label>
          <select id="review-rating-${listing.id}">
            <option value="5">⭐⭐⭐⭐⭐ 非常好</option>
            <option value="4">⭐⭐⭐⭐ 好</option>
            <option value="3">⭐⭐⭐ 一般</option>
            <option value="2">⭐⭐ 较差</option>
            <option value="1">⭐ 很差</option>
          </select>
        </div>
        <div class="form-group">
          <label>评价内容</label>
          <textarea id="review-content-${listing.id}" placeholder="分享你的租房体验..." rows="3"></textarea>
        </div>
        <button class="btn btn-primary" onclick="ListingsModule.submitReview('${listing.id}')">提交评价</button>
      </div>
    `;
  }

  async function submitReview(listingId) {
    if (!Auth.isLoggedIn()) {
      showToast('请先登录后再评价', 'error');
      Auth.showModal('login');
      return;
    }

    const rating = parseInt(document.getElementById('review-rating-' + listingId).value);
    const content = document.getElementById('review-content-' + listingId).value.trim();
    const msgEl = document.getElementById('review-form-msg-' + listingId);

    if (!content) {
      msgEl.innerHTML = '<span style="color:var(--color-danger);font-size:0.8rem;">请输入评价内容</span>';
      return;
    }

    const user = Auth.getUser();
    const newReview = {
      id: 'r-' + Date.now(),
      user_name: user.email.split('@')[0],
      rating: rating,
      content: content,
      created_at: new Date().toISOString().split('T')[0],
    };

    try {
      await DataStore.addReview(listingId, newReview);
      showToast('评价发布成功！', 'success');
      // 刷新详情
      showDetail(listingId);
    } catch (err) {
      showToast('发布失败：' + err.message, 'error');
    }
  }

  return { renderSidebar, showDetail, closeDetail, filterReviews, submitReview };
})();
