-- ==========================================
-- 宁波租房地图 - 示例数据导入 SQL
-- 在 Supabase SQL Editor 中执行
-- ==========================================

-- 海曙区 翠柏一里
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试1',
    '海曙区翠柏路168号翠柏一里12幢',
    '海曙区', 29.872, 121.535, 85, 2, 1,
    '翠柏一里位于海曙核心地段，小区环境整洁。步行5分钟到地铁1号线大卿桥站，周边有欧尚超市、宁波市中医院。全明户型，南北通透，精装修，拎包入住。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 3, 2500 FROM new_listing
UNION ALL SELECT id, '南', '中层', 12, 3000 FROM new_listing
UNION ALL SELECT id, '南', '高层', 22, 3200 FROM new_listing
UNION ALL SELECT id, '北', '低层', 3, 2200 FROM new_listing
UNION ALL SELECT id, '北', '中层', 12, 2600 FROM new_listing
UNION ALL SELECT id, '东', '中层', 12, 2800 FROM new_listing
UNION ALL SELECT id, '西', '中层', 12, 2700 FROM new_listing;

-- 海曙区 鼓楼
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试2',
    '海曙区府桥街35号',
    '海曙区', 29.868, 121.545, 50, 1, 1,
    '鼓楼核心地段，下楼就是步行街。适合年轻人居住，周边餐饮娱乐丰富。一室一厅格局，带独立厨卫。距离地铁2号线鼓楼站步行3分钟。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 2, 2200 FROM new_listing
UNION ALL SELECT id, '南', '中层', 8, 2500 FROM new_listing
UNION ALL SELECT id, '南', '高层', 18, 2800 FROM new_listing
UNION ALL SELECT id, '北', '低层', 2, 1900 FROM new_listing
UNION ALL SELECT id, '北', '中层', 8, 2200 FROM new_listing;

-- 鄞州区 万达
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试3',
    '鄞州区四明中路518号都市森林',
    '鄞州区', 29.808, 121.568, 130, 3, 2,
    '鄞州万达步行可达，都市森林高档小区。三室两厅两卫，全明户型，精装修。小区有游泳池、健身房。离宁波博物馆、鄞州公园也很近。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 5, 5500 FROM new_listing
UNION ALL SELECT id, '南', '中层', 15, 6200 FROM new_listing
UNION ALL SELECT id, '南', '高层', 28, 6800 FROM new_listing
UNION ALL SELECT id, '东南', '中层', 15, 6000 FROM new_listing
UNION ALL SELECT id, '西南', '中层', 15, 5800 FROM new_listing;

-- 鄞州区 南部商务区
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试4',
    '鄞州区天童南路568号',
    '鄞州区', 29.805, 121.550, 40, 1, 0,
    '南部商务区青年公寓，精装单间带独卫。适合在南部商务区上班的年轻人。楼下有便利店、餐厅。免费WiFi覆盖。共享厨房在每层公共区域。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 3, 1800 FROM new_listing
UNION ALL SELECT id, '南', '中层', 10, 2000 FROM new_listing
UNION ALL SELECT id, '南', '高层', 20, 2200 FROM new_listing
UNION ALL SELECT id, '北', '低层', 3, 1600 FROM new_listing
UNION ALL SELECT id, '北', '中层', 10, 1800 FROM new_listing
UNION ALL SELECT id, '东', '中层', 10, 1950 FROM new_listing;

-- 江北区 老外滩
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试5',
    '江北区老外滩中马路128号',
    '江北区', 29.882, 121.556, 160, 3, 2,
    '老外滩一线江景房，大平层设计，客厅就能看到三江口夜景。豪华装修，全屋智能家居。步行到老外滩酒吧街2分钟，来福士广场步行8分钟。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '中层', 16, 8500 FROM new_listing
UNION ALL SELECT id, '南', '高层', 30, 9500 FROM new_listing
UNION ALL SELECT id, '东南', '高层', 30, 10000 FROM new_listing;

-- 江北区 洪塘
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试6',
    '江北区洪塘中路200号亲亲家园',
    '江北区', 29.925, 121.505, 78, 2, 1,
    '江北洪塘亲亲家园，成熟社区。两室一厅，简单装修。适合在江北工业园区上班的租客。楼下公交直达市区，附近有洪塘购物中心。性价比高。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 2, 1600 FROM new_listing
UNION ALL SELECT id, '南', '中层', 7, 1800 FROM new_listing
UNION ALL SELECT id, '北', '低层', 2, 1400 FROM new_listing
UNION ALL SELECT id, '北', '中层', 7, 1600 FROM new_listing;

-- 镇海区 庄市
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试7',
    '镇海区庄市街道毓秀路66号',
    '镇海区', 29.938, 121.610, 35, 1, 0,
    '宁波大学附近学生公寓，步行5分钟到宁大正门。精装单间带独卫、小阳台。楼下有学生食堂、快递站。适合宁大学生或考研党。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 2, 1200 FROM new_listing
UNION ALL SELECT id, '南', '中层', 6, 1300 FROM new_listing
UNION ALL SELECT id, '北', '低层', 2, 1000 FROM new_listing
UNION ALL SELECT id, '北', '中层', 6, 1100 FROM new_listing;

-- 镇海区 骆驼
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试8',
    '镇海区骆驼街道慈海南路888号',
    '镇海区', 29.980, 121.590, 115, 3, 2,
    '镇海新城核心地段，新交付商品房。三室两厅两卫，南北通透。小区自带底商，对面就是镇海区行政服务中心。适合在镇海工作的家庭。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 3, 3200 FROM new_listing
UNION ALL SELECT id, '南', '中层', 11, 3600 FROM new_listing
UNION ALL SELECT id, '南', '高层', 20, 3800 FROM new_listing
UNION ALL SELECT id, '东南', '中层', 11, 3500 FROM new_listing
UNION ALL SELECT id, '北', '低层', 3, 2800 FROM new_listing
UNION ALL SELECT id, '北', '中层', 11, 3200 FROM new_listing;

-- 北仑区 新碶
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试9',
    '北仑区新碶街道长江路999号',
    '北仑区', 29.905, 121.845, 100, 2, 2,
    '北仑核心区域，高层可以看到海。两室两厅带大阳台。楼下就是银泰城，步行到北仑区政府。附近有多条公交线路直达宁波市区。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '中层', 15, 2800 FROM new_listing
UNION ALL SELECT id, '南', '高层', 28, 3200 FROM new_listing
UNION ALL SELECT id, '东南', '高层', 28, 3500 FROM new_listing
UNION ALL SELECT id, '东', '中层', 15, 2600 FROM new_listing;

-- 北仑区 大碶
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试10',
    '北仑区大碶街道坝头路268号',
    '北仑区', 29.885, 121.805, 90, 2, 1,
    '大碶工业园区周边，适合在附近工厂和物流园上班的家庭。多层住宅，无电梯。小区安静，停车方便。附近有大碶菜场和卫生院。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 2, 1500 FROM new_listing
UNION ALL SELECT id, '南', '中层', 4, 1700 FROM new_listing
UNION ALL SELECT id, '北', '低层', 2, 1300 FROM new_listing
UNION ALL SELECT id, '北', '中层', 4, 1500 FROM new_listing
UNION ALL SELECT id, '东', '低层', 2, 1400 FROM new_listing;

-- 奉化区 锦屏
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试11',
    '奉化区锦屏街道中山路168号',
    '奉化区', 29.655, 121.415, 82, 2, 1,
    '奉化老城区，周边生活气息浓厚。步行可到奉化江边散步。适合喜欢安静、慢节奏生活的人。距离奉化火车站15分钟车程。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 3, 1300 FROM new_listing
UNION ALL SELECT id, '南', '中层', 6, 1500 FROM new_listing
UNION ALL SELECT id, '北', '低层', 3, 1100 FROM new_listing
UNION ALL SELECT id, '北', '中层', 6, 1300 FROM new_listing;

-- 奉化区 岳林
WITH new_listing AS (
  INSERT INTO listings (title, address, district, lat, lng, area_sqm, bedrooms, halls, description)
  VALUES (
    '测试12',
    '奉化区岳林街道南山路388号',
    '奉化区', 29.660, 121.425, 120, 3, 2,
    '奉化万达广场附近，新建商品房小区，精装交付。三室两厅两卫，电梯房，一梯两户。小区有儿童游乐区和健身设施。适合在奉化安家的家庭。'
  ) RETURNING id
)
INSERT INTO listing_prices (listing_id, orientation, floor_level, floor_number, monthly_rent)
SELECT id, '南', '低层', 5, 2500 FROM new_listing
UNION ALL SELECT id, '南', '中层', 12, 2800 FROM new_listing
UNION ALL SELECT id, '南', '高层', 22, 3000 FROM new_listing
UNION ALL SELECT id, '东南', '中层', 12, 2700 FROM new_listing
UNION ALL SELECT id, '西南', '低层', 5, 2400 FROM new_listing;
