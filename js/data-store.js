/**
 * 数据存取层
 * ==========
 * 统一管理数据来源：本地模式用 MOCK_LISTINGS，Supabase 模式查数据库
 */

const DataStore = (() => {
  // 本地模式：内存中的可变副本
  let localListings = [...MOCK_LISTINGS];

  // ==================== 获取房源列表 ====================

  async function getListings(includeAll) {
    if (CONFIG.USE_SUPABASE) {
      return await sbGetListings(includeAll);
    }
    // 本地模式：管理员可选择查看所有房源
    if (includeAll) return localListings;
    return localListings.filter(l => l.status !== 'pending' && l.status !== 'rejected');
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

  async function sbGetListings(includeAll) {
    const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    let query = sb.from('listings').select('*, listing_prices(monthly_rent, orientation)');
    if (!includeAll) query = query.eq('status', 'approved');
    const { data, error } = await query;
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

    // listing_utilities 可能返回数组 [{...}]，取第一个元素确保是对象
    const utils = listing.listing_utilities;
    const utilityObj = Array.isArray(utils) ? (utils[0] || {}) : (utils || {});

    return {
      ...listing,
      prices: listing.listing_prices || [],
      utilities: utilityObj,
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

  // ==================== 添加房源 ====================

  async function addListing(data) {
    if (CONFIG.USE_SUPABASE) {
      return await sbAddListing(data);
    }
    // 本地模式
    const newListing = {
      ...data,
      id: 'local-' + Date.now(),
      status: 'pending',
      submitted_by: Auth.getUser()?.email || null,
      created_at: new Date().toISOString(),
      reviews: [],
    };
    localListings.unshift(newListing);
    return newListing.id;
  }

  // ==================== 审核房源（管理员） ====================

  async function updateListingStatus(id, newStatus) {
    if (CONFIG.USE_SUPABASE) {
      const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      const { error } = await sb.from('listings').update({ status: newStatus }).eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }
    const listing = localListings.find(l => l.id === id);
    if (!listing) throw new Error('房源不存在');
    listing.status = newStatus;
  }

  // ==================== 获取待审核房源 ====================

  async function getPendingListings() {
    if (CONFIG.USE_SUPABASE) {
      const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      const { data, error } = await sb
        .from('listings')
        .select('*, listing_prices(monthly_rent, orientation)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data.map(l => ({
        ...l,
        prices: (l.listing_prices || []).map(p => ({ monthly_rent: p.monthly_rent, orientation: p.orientation })),
      }));
    }
    return localListings.filter(l => l.status === 'pending');
  }

  // ==================== 查找附近房源（去重） ====================

  async function findNearbyListings(lat, lng, radiusMeters) {
    const all = CONFIG.USE_SUPABASE
      ? await sbGetListings(true)
      : localListings;
    return all.filter(l => haversineDistance(lat, lng, l.lat, l.lng) <= radiusMeters);
  }

  // ==================== Supabase 写入实现 ====================

  async function sbAddListing(data) {
    const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

    // 插入主表
    const { data: listing, error } = await sb.from('listings').insert({
      title: data.title, address: data.address, district: data.district,
      lat: data.lat, lng: data.lng, area_sqm: data.area_sqm,
      bedrooms: data.bedrooms, halls: data.halls,
      description: data.description || null,
      status: 'pending',
      submitted_by: Auth.getUser()?.email || null,
    }).select('id').single();
    if (error) throw new Error(error.message);
    const listingId = listing.id;

    // 插入租金
    if (data.prices && data.prices.length > 0) {
      const { error: priceErr } = await sb.from('listing_prices').insert(
        data.prices.map(p => ({
          listing_id: listingId, orientation: p.orientation,
          floor_level: p.floor_level || null, floor_number: p.floor_number || null,
          monthly_rent: p.monthly_rent,
        }))
      );
      if (priceErr) throw new Error(priceErr.message);
    }

    // 插入水电费用
    if (data.utilities) {
      const u = data.utilities;
      const { error: utilErr } = await sb.from('listing_utilities').insert({
        listing_id: listingId,
        water_price: u.water_price, electricity_price: u.electricity_price,
        appliances: u.appliances || [],
        property_fee: u.property_fee, property_fee_included: u.property_fee_included || false,
        internet_fee: u.internet_fee, internet_fee_included: u.internet_fee_included || false,
        parking_fee: u.parking_fee, parking_fee_included: u.parking_fee_included || false,
      });
      if (utilErr) throw new Error(utilErr.message);
    }

    return listingId;
  }

  return { getListings, getListing, addReview, addListing,
           updateListingStatus, getPendingListings, findNearbyListings };
})();
