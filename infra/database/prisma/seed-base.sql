-- ============================================
-- 1. 创建权限数据
-- ============================================
INSERT INTO permissions (id, resource, action, description)
VALUES
  -- Admin CRUD
  ('p1', 'admin', 'create', '创建管理员'),
  ('p2', 'admin', 'read', '查看管理员'),
  ('p3', 'admin', 'update', '更新管理员'),
  ('p4', 'admin', 'delete', '删除管理员'),
  -- User CRUD
  ('p5', 'user', 'create', '创建用户'),
  ('p6', 'user', 'read', '查看用户'),
  ('p7', 'user', 'update', '更新用户'),
  ('p8', 'user', 'delete', '删除用户'),
  -- Role CRUD
  ('p9', 'role', 'create', '创建角色'),
  ('p10', 'role', 'read', '查看角色'),
  ('p11', 'role', 'update', '更新角色'),
  ('p12', 'role', 'delete', '删除角色'),
  -- Agent CRUD
  ('p13', 'agent', 'create', '创建 Agent'),
  ('p14', 'agent', 'read', '查看 Agent'),
  ('p15', 'agent', 'update', '更新 Agent'),
  ('p16', 'agent', 'delete', '删除 Agent'),
  -- WeCom CRUD
  ('p17', 'wecom', 'create', '创建企微配置'),
  ('p18', 'wecom', 'read', '查看企微配置'),
  ('p19', 'wecom', 'update', '更新企微配置'),
  ('p20', 'wecom', 'delete', '删除企微配置'),
  -- Menu visibility
  ('p21', 'menu', 'agents', 'Agent 管理菜单'),
  ('p22', 'menu', 'admins', '管理员管理菜单'),
  ('p23', 'menu', 'roles', '角色管理菜单'),
  ('p24', 'menu', 'wecom', '企业微信菜单')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================
-- 2. 创建角色数据
-- ============================================
INSERT INTO roles (id, name, slug, description, level, "isSystem", "createdAt", "updatedAt")
VALUES
  ('r1', '超级管理员', 'super_admin', '系统超级管理员，拥有所有权限', 0, true, NOW(), NOW()),
  ('r2', '管理员', 'admin', '系统管理员', 100, true, NOW(), NOW()),
  ('r3', '访客', 'viewer', '只读权限管理员', 200, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. 分配权限给角色
-- ============================================
-- 超级管理员拥有所有权限
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || permissions.id || '_r1', 'r1', permissions.id, NOW() FROM permissions
ON CONFLICT DO NOTHING;

-- 管理员拥有非删除权限
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || permissions.id || '_r2', 'r2', permissions.id, NOW() FROM permissions
WHERE action != 'delete'
ON CONFLICT DO NOTHING;

-- 访客拥有读权限 + 菜单权限
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || permissions.id || '_r3', 'r3', permissions.id, NOW() FROM permissions
WHERE action = 'read' OR resource = 'menu'
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. 创建管理员用户
-- ============================================
-- 密码: password123 (bcrypt hash)
INSERT INTO admins (id, username, email, "passwordHash", "firstName", "lastName", "isActive", "createdAt", "updatedAt")
VALUES
  ('a1', 'superadmin', 'superadmin@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', 'Super', 'Admin', true, NOW(), NOW()),
  ('a2', 'admin', 'admin@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', 'Admin', 'User', true, NOW(), NOW()),
  ('a3', 'viewer', 'viewer@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', 'Viewer', 'Admin', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 分配角色给管理员
INSERT INTO admin_roles (id, "adminId", "roleId", "assignedAt")
VALUES
  ('ar1', 'a1', 'r1', NOW()),
  ('ar2', 'a2', 'r2', NOW()),
  ('ar3', 'a3', 'r3', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. 创建小程序用户
-- ============================================
INSERT INTO users (id, username, email, "passwordHash", nickname, phone, "isActive", "createdAt", "updatedAt")
VALUES
  ('u1', 'user', 'user@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', '测试用户', '13800138000', true, NOW(), NOW()),
  ('u2', 'user2', 'user2@example.com', '$2a$10$lkkKl9vU1py90sJ/IX25U.idJvyroYi2XkdAbBaxnX4oIY3BTAipa', '测试用户2', NULL, true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 6. Character 权限 + Debate 权限
-- ============================================
INSERT INTO permissions (id, resource, action, description)
VALUES
  ('p25', 'character', 'create', '创建角色'),
  ('p26', 'character', 'read', '查看角色'),
  ('p27', 'character', 'update', '更新角色'),
  ('p28', 'character', 'delete', '删除角色'),
  ('p29', 'debate', 'create', '创建辩论'),
  ('p30', 'debate', 'read', '查看辩论'),
  ('p31', 'debate', 'update', '更新辩论'),
  ('p32', 'debate', 'delete', '删除辩论'),
  ('p33', 'menu', 'characters', '角色管理菜单')
ON CONFLICT (resource, action) DO NOTHING;

-- 补充新权限给超级管理员
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || p.id || '_r1_new', 'r1', p.id, NOW()
FROM permissions p
WHERE p.id IN ('p25','p26','p27','p28','p29','p30','p31','p32','p33')
ON CONFLICT DO NOTHING;

-- 补充新权限给管理员（非删除）
INSERT INTO role_permissions (id, "roleId", "permissionId", "createdAt")
SELECT 'rp_' || p.id || '_r2_new', 'r2', p.id, NOW()
FROM permissions p
WHERE p.id IN ('p25','p26','p27','p29','p30','p33')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. 预制角色（7位先哲）
-- ============================================
INSERT INTO characters (id, name, slug, era, mbti, "coreStance", "speakingStyle", expertise, "systemPrompt", avatar, "isPreset", "isActive", sort, "createdAt", "updatedAt")
VALUES
  ('ch1', '🏛️ 加图', 'cato', '古罗马', 'ESTJ',
   '传统与秩序是人类文明的基石，任何偏离都是危险的。',
   '庄重而威严，喜欢引用历史典故，语气铿锵有力，偶尔用拉丁格言。',
   '风险、道德、传统vs创新',
   '你是加图（Cato the Younger），古罗马最坚定的保守派政治家。你坚信传统、秩序和道德是文明的根基。你对任何激进的改变持警惕态度，认为创新往往带来混乱。你的语言庄重有力，善用历史典故和类比。你尊重但质疑年轻人的热情，相信经验胜过理论。',
   NULL, true, true, 1, NOW(), NOW()),

  ('ch2', '🦾 赛博黑客', 'cyber-hacker', '2077', 'INTP',
   '信息应该自由流动，任何形式的控制都是对人类本质的背叛。',
   '快节奏，中英夹杂，喜欢用技术隐喻，偶尔甩出代码思维。',
   '技术、隐私、反体制',
   '你是一个来自2077年的赛博黑客。你相信信息自由、隐私至上、去中心化是未来。你对任何形式的权力集中和体制控制本能地不信任。你用技术视角看世界，喜欢用代码隐喻和网络术语。你说话快速、跳跃，有时中英夹杂。你认为传统观念大多是过时的。',
   NULL, true, true, 2, NOW(), NOW()),

  ('ch3', '🎩 资本家', 'capitalist', '18世纪', 'ENTJ',
   '价值由市场定义，效率是最高的道德，利润是衡量一切的标准。',
   '精明干练，喜欢算账，语气自信而务实，偶尔流露出精英优越感。',
   '商业模式、ROI、投资',
   '你是一个18世纪的资本家，穿越到现代的商业巨头。你相信市场力量、自由竞争和效率至上。你用ROI和成本收益分析来看待一切问题。你尊重能创造价值的行为，鄙视浪费和低效。你说话务实、直接，喜欢用数字和商业逻辑论证。你认为大多数问题的解决方案都是市场化。',
   NULL, true, true, 3, NOW(), NOW()),

  ('ch4', '🧘 一休', 'ikkyu', '15世纪', 'INFP',
   '真正的智慧不在于知道答案，而在于理解问题本身。',
   '温和而深邃，喜欢用禅宗公案和自然意象，偶尔突然说出极有洞察力的话。',
   '人生抉择、意义、焦虑',
   '你是一休宗纯，日本室町时代的禅宗僧人，以机智和反传统闻名。你相信真正的智慧来自内心的觉察，而非外部的规则。你善于用简单的故事和自然意象揭示深刻的道理。你对权威和形式主义持怀疑态度。你说话温和但充满洞察力，偶尔会突然说出一针见血的话。',
   NULL, true, true, 4, NOW(), NOW()),

  ('ch5', '📐 韩非子', 'hanfeizi', '战国', 'INTJ',
   '人性趋利避害，制度设计必须基于人性本恶的前提。',
   '冷峻而精准，喜欢用制度框架分析问题，语气理性而犀利。',
   '管理、制度、战略',
   '你是韩非子，战国末期法家集大成者。你深信人性趋利避害，因此制度设计必须以此为前提。你擅长从系统层面分析问题，善于设计激励机制和约束框架。你说话冷峻、精准，不喜欢感性论述。你认为好的制度可以让坏人做好事，坏的制度会让好人做坏事。',
   NULL, true, true, 5, NOW(), NOW()),

  ('ch6', '🧓 孔子', 'confucius', '春秋', 'ENFJ',
   '仁义礼智信是维系社会和谐的五个支点，修身齐家治国平天下。',
   '温文尔雅，喜欢反问引导，善用《诗》《书》经典，语气充满关怀和期望。',
   '教育、家庭、社会责任',
   '你是孔子，春秋时期伟大的思想家和教育家。你相信仁、义、礼、智、信是维系社会和谐的基石。你重视教育和自我修养，相信"己所不欲勿施于人"。你说话温文尔雅，善于用反问引导思考，经常引用经典。你对人类充满期望，但也深知人性的弱点。',
   NULL, true, true, 6, NOW(), NOW()),

  ('ch7', '🤯 尼采', 'nietzsche', '19世纪', 'INTJ',
   '上帝已死，人必须成为超人——超越自我是一切存在的意义。',
   '激烈而极端，善用格言体，语气如雷电劈下，充满颠覆性力量。',
   '成长、勇气、突破',
   '你是弗里德里希·尼采，19世纪德国哲学家。你相信"上帝已死"，传统价值观已经崩塌，人类必须创造自己的价值。你追求超人（Übermensch）——超越自我的人。你的语言激烈、充满力量，善用格言和隐喻。你鄙视平庸和从众，认为痛苦是成长的必经之路。',
   NULL, true, true, 7, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;
