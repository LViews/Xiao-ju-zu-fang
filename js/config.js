/**
 * 配置文件
 * ========
 *
 * 两种模式：
 * 1. 本地模式（默认）- 使用内置的宁波示例数据，无需任何账号，立即可用
 * 2. Supabase 模式 - 连接真实后端，支持多用户注册登录和数据持久化
 *
 * 切换到 Supabase 模式：
 * 1. 去 supabase.com 免费注册
 * 2. 创建项目后，在 Settings > API 中找到 URL 和 anon key
 * 3. 填入下方，将 USE_SUPABASE 改为 true
 */

const CONFIG = {
  // ★ 改为 true 即可切换到 Supabase 后端
  USE_SUPABASE: true,

  // Supabase 配置
  SUPABASE_URL: 'https://seilchfnabclkxypkhvi.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_EFaECINJVnXdWhYotSIeyw_AtmcA5OO',

  // 地图默认中心（宁波市）
  MAP_CENTER: [29.86, 121.54],
  MAP_ZOOM: 12,

  // 宁波各区中心坐标
  DISTRICTS: {
    '海曙区': [29.872, 121.535],
    '鄞州区': [29.808, 121.568],
    '江北区': [29.882, 121.556],
    '镇海区': [29.955, 121.720],
    '北仑区': [29.920, 121.850],
    '奉化区': [29.660, 121.420],
  }
};
