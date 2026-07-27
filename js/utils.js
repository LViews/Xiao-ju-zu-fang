/**
 * 工具函数
 * ========
 */

/**
 * HTML 转义，防止 XSS 攻击
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 生成星级 HTML
 */
function starsHtml(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
}

/**
 * Toast 消息提示
 */
/**
 * 计算两点之间的 Haversine 距离（米）
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 地球半径（米）
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 计算两个字符串的编辑距离（Levenshtein Distance）
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * 判断两个标题是否相似
 * 归一化后检查：子串包含 或 编辑距离 ≤ 30%较短字符串长度
 */
function titlesSimilar(a, b) {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9一-鿿]/g, '');
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  const dist = levenshtein(na, nb);
  const threshold = Math.max(1, Math.floor(Math.min(na.length, nb.length) * 0.3));
  return dist <= threshold;
}

function showToast(message, type) {
  // 移除旧 toast
  const old = document.querySelector('.toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'success');
  toast.textContent = message;
  document.body.appendChild(toast);

  // 3秒后自动消失
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
