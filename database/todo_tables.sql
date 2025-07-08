-- 待办任务系统数据库表结构
-- 创建时间: 2025-01-06

-- 1. 统一任务表 (合并全局任务和每日待办)
CREATE TABLE `todo_task` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务内容',
  `task_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务分类: work/study/health',
  `category` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务类别: global-全局任务, daily-每日待办',
  `points` int NOT NULL DEFAULT 10 COMMENT '积分奖励',
  `encouragement` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '鼓励语',
  `target_count` int NOT NULL DEFAULT 1 COMMENT '目标完成次数',
  `completed_count` int NOT NULL DEFAULT 0 COMMENT '已完成次数',
  `original_task_id` bigint DEFAULT NULL COMMENT '原始任务ID(从全局任务复制到每日待办时)',
  `todo_date` date DEFAULT NULL COMMENT '待办日期(仅每日待办使用)',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_category` (`user_id`, `category`) USING BTREE,
  KEY `idx_user_date` (`user_id`, `todo_date`) USING BTREE,
  KEY `idx_task_type` (`task_type`) USING BTREE,
  KEY `idx_original_task` (`original_task_id`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='统一任务表';

-- 2. 奖励商品表 (对应 rewardsList)
CREATE TABLE `todo_reward_item` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '奖励ID',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '奖励名称',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '奖励描述',
  `points` int NOT NULL COMMENT '所需积分',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态: 1-可用, 0-禁用',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_points` (`points`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='奖励商品表';

-- 3. 用户奖励表 (对应 myRewards)
CREATE TABLE `todo_user_reward` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `reward_id` bigint NOT NULL COMMENT '奖励商品ID',
  `reward_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '奖励名称',
  `points_cost` int NOT NULL COMMENT '消耗积分',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `obtained_date` date NOT NULL COMMENT '获得日期',
  `used_date` date DEFAULT NULL COMMENT '使用日期',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态: 0-未使用, 1-已使用',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_reward_id` (`reward_id`) USING BTREE,
  KEY `idx_obtained_date` (`obtained_date`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='用户奖励表';

-- 4. 用户积分表
CREATE TABLE `todo_user_points` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `total_points` int NOT NULL DEFAULT 0 COMMENT '总积分',
  `available_points` int NOT NULL DEFAULT 0 COMMENT '可用积分',
  `used_points` int NOT NULL DEFAULT 0 COMMENT '已使用积分',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_user_id` (`user_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='用户积分表';

-- 5. 积分变动记录表
CREATE TABLE `todo_points_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `change_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '变动类型: earn-获得, spend-消费',
  `points` int NOT NULL COMMENT '积分数量',
  `source_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '来源类型: task-任务, reward-奖励兑换',
  `source_id` bigint DEFAULT NULL COMMENT '来源ID',
  `description` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '描述',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `create_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '创建人',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_user_id` (`user_id`) USING BTREE,
  KEY `idx_create_time` (`create_time`) USING BTREE,
  KEY `idx_source` (`source_type`, `source_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC COMMENT='积分变动记录表';

-- 插入示例数据
-- 示例用户积分
INSERT INTO `user_points` (`user_id`, `total_points`, `available_points`, `used_points`, `create_by`) VALUES
(1, 150, 150, 0, 'system');

-- 示例奖励商品
INSERT INTO `reward_item` (`name`, `description`, `points`, `user_id`, `create_by`) VALUES
('精美电影票', '周末看场期待已久的电影', 200, 1, 'system'),
('美味火锅', '犒劳一下辛苦工作的自己', 300, 1, 'system'),
('新款数码产品', '为生活添加一些科技感', 500, 1, 'system');