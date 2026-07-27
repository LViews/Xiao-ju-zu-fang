/**
 * 用户认证模块
 * ============
 *
 * 两种模式：
 * - 本地模式（默认）：localStorage 模拟注册登录，数据仅在本地浏览器中
 * - Supabase 模式：真正的后端认证，多设备同步
 *
 * 对外接口：
 *   Auth.init()     - 初始化，更新导航栏UI
 *   Auth.signUp(email, password)    - 注册
 *   Auth.signIn(email, password)    - 登录
 *   Auth.signOut()                  - 登出
 *   Auth.getUser()                  - 获取当前用户
 *   Auth.isLoggedIn()               - 是否已登录
 *   Auth.onAuthChange(callback)     - 登录状态变化时回调
 */

const Auth = (() => {
  // 当前用户
  let currentUser = null;
  // 状态变化监听器
  let changeCallbacks = [];

  // ==================== 本地模式（Mock） ====================

  function mockSignUp(email, password) {
    const users = JSON.parse(localStorage.getItem('nb_rent_users') || '{}');
    if (users[email]) {
      throw new Error('该邮箱已注册，请直接登录');
    }
    users[email] = {
      id: 'local-' + Date.now(),
      email: email,
      password: password, // 注意：仅本地模式存明文，Supabase 会加密
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('nb_rent_users', JSON.stringify(users));
    // 注册后自动登录
    const user = { id: users[email].id, email: email };
    localStorage.setItem('nb_rent_current_user', JSON.stringify(user));
    return user;
  }

  function mockSignIn(email, password) {
    const users = JSON.parse(localStorage.getItem('nb_rent_users') || '{}');
    const user = users[email];
    if (!user) {
      throw new Error('该邮箱未注册，请先注册');
    }
    if (user.password !== password) {
      throw new Error('密码错误');
    }
    const sessionUser = { id: user.id, email: user.email };
    localStorage.setItem('nb_rent_current_user', JSON.stringify(sessionUser));
    return sessionUser;
  }

  function mockSignOut() {
    localStorage.removeItem('nb_rent_current_user');
  }

  function mockGetUser() {
    const data = localStorage.getItem('nb_rent_current_user');
    return data ? JSON.parse(data) : null;
  }

  // ==================== Supabase 模式 ====================

  function getSupabase() {
    if (!window.supabase) {
      throw new Error('Supabase SDK 未加载，请检查网络连接');
    }
    return window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }

  async function sbSignUp(email, password) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  }

  async function sbSignIn(email, password) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  }

  async function sbSignOut() {
    const sb = getSupabase();
    const { error } = await sb.auth.signOut();
    if (error) throw new Error(error.message);
  }

  function sbGetUser() {
    // Supabase 会自动从 localStorage 恢复 session
    return null; // 由 Supabase 的 onAuthStateChange 管理
  }

  // ==================== 公共接口 ====================

  async function signUp(email, password) {
    if (!email || !password) throw new Error('请填写邮箱和密码');
    if (password.length < 6) throw new Error('密码至少6位');

    let user;
    if (CONFIG.USE_SUPABASE) {
      user = await sbSignUp(email, password);
    } else {
      user = mockSignUp(email, password);
    }
    currentUser = user;
    notifyChange();
    return user;
  }

  async function signIn(email, password) {
    if (!email || !password) throw new Error('请填写邮箱和密码');

    let user;
    if (CONFIG.USE_SUPABASE) {
      user = await sbSignIn(email, password);
    } else {
      user = mockSignIn(email, password);
    }
    currentUser = user;
    notifyChange();
    return user;
  }

  async function signOut() {
    if (CONFIG.USE_SUPABASE) {
      await sbSignOut();
    } else {
      mockSignOut();
    }
    currentUser = null;
    notifyChange();
  }

  function getUser() {
    if (currentUser) return currentUser;
    if (CONFIG.USE_SUPABASE) {
      return sbGetUser();
    }
    currentUser = mockGetUser();
    return currentUser;
  }

  function isLoggedIn() {
    return !!getUser();
  }

  function isAdmin() {
    const user = getUser();
    if (!user) return false;
    const email = (user.email || '').toLowerCase();
    return CONFIG.ADMIN_EMAILS.some(e => e.toLowerCase() === email);
  }

  function onAuthChange(callback) {
    changeCallbacks.push(callback);
  }

  function notifyChange() {
    changeCallbacks.forEach(cb => cb(currentUser));
    renderNavbar();
  }

  // ==================== UI 渲染 ====================

  function renderNavbar() {
    const authEl = document.getElementById('navbar-auth');
    if (!authEl) return;

    const user = getUser();

    if (user) {
      authEl.innerHTML = `
        <div class="navbar-user">
          <button class="btn btn-primary btn-sm" onclick="UploadModule.showModal()" style="margin-right:8px;">📤 发布房源</button>
          <span class="user-email">👤 ${escapeHtml(user.email)}</span>
          <button class="btn btn-outline btn-sm" onclick="Auth.signOut()">退出</button>
        </div>
      `;
    } else {
      authEl.innerHTML = `
        <button class="btn btn-outline btn-sm" onclick="Auth.showModal('login')">登录</button>
        <button class="btn btn-primary btn-sm" onclick="Auth.showModal('register')">注册</button>
      `;
    }
  }

  // ==================== 登录/注册弹窗 ====================

  function showModal(mode) {
    const isLogin = mode === 'login';
    const overlay = document.getElementById('auth-modal-overlay');
    const body = document.getElementById('auth-modal-body');

    body.innerHTML = `
      <button class="modal-close" onclick="Auth.closeModal()">✕</button>
      <h2>${isLogin ? '🔑 登录' : '📝 注册'}</h2>
      <form id="auth-form" onsubmit="return Auth.handleSubmit(event, '${mode}')">
        <div class="form-group">
          <label>邮箱</label>
          <input type="email" id="auth-email" placeholder="your@email.com" required autocomplete="email">
        </div>
        <div class="form-group">
          <label>密码</label>
          <input type="password" id="auth-password" placeholder="${isLogin ? '输入密码' : '至少6位密码'}" required minlength="6" autocomplete="${isLogin ? 'current-password' : 'new-password'}">
        </div>
        <div class="form-error" id="auth-error"></div>
        <button type="submit" class="btn btn-primary btn-block" id="auth-submit-btn">
          ${isLogin ? '登录' : '注册'}
        </button>
      </form>
      <p style="text-align:center; margin-top:14px; font-size:0.85rem; color:var(--color-text-secondary);">
        ${isLogin ? '还没有账号？' : '已有账号？'}
        <a href="#" onclick="Auth.showModal('${isLogin ? 'register' : 'login'}')" style="color:var(--color-primary); text-decoration:none; font-weight:500;">
          ${isLogin ? '立即注册' : '去登录'}
        </a>
      </p>
      ${CONFIG.USE_SUPABASE ? '' : '<p style="text-align:center; margin-top:8px; font-size:0.75rem; color:var(--color-text-muted);">💡 当前为本地模式，数据仅保存在此浏览器</p>'}
    `;

    overlay.classList.add('show');
    document.getElementById('auth-email').focus();
  }

  function closeModal() {
    document.getElementById('auth-modal-overlay').classList.remove('show');
  }

  async function handleSubmit(event, mode) {
    event.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error');
    const btnEl = document.getElementById('auth-submit-btn');

    errorEl.style.display = 'none';
    btnEl.disabled = true;
    btnEl.textContent = '处理中...';

    try {
      if (mode === 'register') {
        await signUp(email, password);
        showToast('注册成功！已自动登录', 'success');
      } else {
        await signIn(email, password);
        showToast('登录成功！', 'success');
      }
      closeModal();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } finally {
      btnEl.disabled = false;
      btnEl.textContent = mode === 'login' ? '登录' : '注册';
    }
    return false;
  }

  // ==================== 初始化 ====================

  async function init() {
    // 恢复本地用户
    if (!CONFIG.USE_SUPABASE) {
      currentUser = mockGetUser();
    } else {
      // Supabase: 监听认证状态变化
      const sb = getSupabase();
      sb.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        notifyChange();
      });
      // 等待 session 恢复
      try {
        const { data } = await sb.auth.getSession();
        currentUser = data.session?.user || null;
      } catch (e) {
        console.warn('Supabase session 恢复失败：', e.message);
      }
    }
    notifyChange();
  }

  return { init, signUp, signIn, signOut, getUser, isLoggedIn, isAdmin, onAuthChange,
           showModal, closeModal, handleSubmit };
})();
