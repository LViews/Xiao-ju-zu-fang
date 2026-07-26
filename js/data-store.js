/**
 * 数据存取层
 * ==========
 * 统一管理数据来源：本地模式用 MOCK_LISTINGS，Supabase 模式查数据库
 */

const DataStore = (() => {
  // 本地模式：内存中的可变副本
  let localListings = [...MOCK_LISTINGS];

  // ==================== 获取房源列表 ====================

  async function getListings() {
    if (CONFIG.USE_SUPABASE) {
      return await sbGetListings();
    }
    // 本地模式：直接返回（但只返回摘要，不含完整 reviews 以减少开销）
    return localListings;
  }

  // ==================== 获取单个房源 ====================

  async function getListing(id) {
    if (CONFIG.USE_SUPABASE) {
      return await sbGetListing(id);
    }
    return localListings.find(l => l.id === id) || null;
  }

  // ==================== 添加评论 ====================

  async function addReview(listingId, review) {
    if (CONFIG.USE_SUPABASE) {
      return await sbAddReview(listingId, review);
    }
    const listing = localListings.find(l => l.id === listingId);
    if (!listing) throw new Error('房源不存在');
    if (!listing.reviews) listing.reviews = [];
    listing.reviews.unshift(review); // 新评论放最前面
    return review;
  }

  // ==================== Supabase 实现（预留） ====================

  async function sbGetListings() {
    const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { data, error } = await sb
      .from('listings')
      .select('*, listing_prices(monthly_rent, orientation)');
    if (error) throw new Error(error.message);
    // 把 listing_prices 映射为 prices（匹配前端字段名）
    return data.map(l => ({
      ...l,
      prices: (l.listing_prices || []).map(p => ({ monthly_rent: p.monthly_rent, orientation: p.orientation })),
    }));
  }

  async function sbGetListing(id) {
    const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    // 一次查询获取房源 + 价格 + 水电 + 评论
    const { data: listing, error } = await sb
      .from('listings')
      .select('*, listing_prices(*), listing_utilities(*), listing_reviews(*)')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);

    return {
      ...listing,
      prices: listing.listing_prices || [],
      utilities: listing.listing_utilities || {},
      reviews: (listing.listing_reviews || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    };
  }

  async function sbAddReview(listingId, review) {
    const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    const { error } = await sb.from('listing_reviews').insert({
      listing_id: listingId,
      user_id: Auth.getUser()?.id,
      rating: review.rating,
      content: review.content,
    });
    if (error) throw new Error(error.message);
    return review;
  }

  return { getListings, getListing, addReview };
})();
