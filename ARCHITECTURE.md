# 文脉溯源架构与数据流

这份文档用于解释当前仓库已经实现的系统结构，以及它如何对应参赛方案中的“前端交互层 + 本地 API + 离线数据处理”三段式思路。

## 1. 当前实现的整体架构

```text
┌─────────────────────────────────────────────────────────────┐
│                         浏览器 / Next.js                    │
│                                                             │
│  /                    综合工作台                            │
│                                                             │
│  组件层                                                    │
│  - cultural-vein-shell.tsx   宏观总控 + 首页叙事            │
│  - river-scene.tsx           3D 河流场景                    │
│  - book-explorer.tsx         中观/微观典籍钻入              │
│                                                             │
│  状态层                                                    │
│  - app-store.ts              era / 搜索 / 选书 / 视图状态   │
└──────────────────────────────┬──────────────────────────────┘
                               │ fetch / import
┌──────────────────────────────┴──────────────────────────────┐
│                         本地 API / 数据装配                 │
│                                                             │
│  /api/graph                首页图谱数据                     │
│  /api/books/[slug]         单书详情                         │
│  /api/insights             真实数据覆盖与统计               │
│  /api/source-atlas         来源河册与覆盖层集合查询          │
│  /api/source-atlas/[id]    单条来源明细                      │
│  /api/search               概念搜索与命中排序               │
│  backend/server.ts         独立后端骨架（可单独启动）       │
│                                                             │
│  src/server/payloads.ts    API 共享 payload 装配            │
│  src/data/river-dataset.ts 运行时图谱合并与增强             │
│  src/data/generated/real-supplements.json                   │
│                           由脚本生成的真实资料数据          │
│  src/lib/concept-search.ts 概念搜索排序逻辑                 │
│  src/lib/source-evidence.ts 单书来源证据归并                │
└──────────────────────────────┬──────────────────────────────┘
                               │ generated from
┌──────────────────────────────┴──────────────────────────────┐
│                      离线处理 / 数据抽取脚本                │
│                                                             │
│  scripts/export_real_dataset.py                             │
│  - 读取 /data 中已下载的数据包                              │
│  - 读取 tmp_cbdb/CBDB_20240208.db                           │
│  - 抽取人物、活动、馆藏、图像资源资料                       │
│  - 输出统一 JSON 供前端与 API 使用                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ source files
┌──────────────────────────────┴──────────────────────────────┐
│                      原始数据与中间文件                     │
│                                                             │
│  /data                    竞赛数据包                        │
│  /tmp_cbdb                解压后的 CBDB SQLite 数据库       │
│  /tmp_generated           方案提取文本等中间文件            │
└─────────────────────────────────────────────────────────────┘
```

## 2. 对应参赛方案的实现映射

### 前端层

方案中的“宏观 - 中观 - 微观”三层交互，目前在仓库中已经有明确落点：

- 宏观层
  - `src/components/cultural-vein-shell.tsx`
  - `src/components/river-scene.tsx`
  - 已实现：时间轴、概念搜索、类别筛选、河流节点选择、关系图例、证据层级说明
  - 概念搜索已包含搜索 API、概念联想、命中结果排序与直接钻入
- 中观层
  - `src/components/book-explorer.tsx`
  - 已实现：地理传播、人物关系、版本流变、关联时间线
  - 当前已补入统一“场景联动焦点”，可把传播、人物、版本、时间事件反向驱动河流镜头与节点高亮
- 微观层
  - `src/components/book-explorer.tsx`
  - 已实现：文本对读、横排/竖排切换、证据卡切换、溯源链、下游影响

### 数据层

方案中原本设想更完整的图数据库与搜索后端。当前版本为了先完成可运行、可展示的参赛作品，采用了更稳的轻量路线：

- 以 `scripts/export_real_dataset.py` 做离线抽取
- 以 `src/data/generated/real-supplements.json` 作为稳定中间产物
- 以 `src/data/river-dataset.ts` 做运行时增强和前端消费整合
- 以 `src/server/payloads.ts` 统一装配 API payload
- 以 Next.js Route Handlers 提供站内 API
- 以 `backend/server.ts` 提供可独立启动的轻量 Node 后端骨架

这意味着当前仓库虽然还不是正式 Neo4j + MeiliSearch 架构，但已经把“数据装配”“接口边界”和“前端消费”三者拆开，后续可平滑迁移。

## 3. 当前数据流

```text
1. 用户把下载好的竞赛数据放入 /data
2. Python 脚本读取 /data 与 tmp_cbdb
3. 脚本输出 src/data/generated/real-supplements.json
4. src/data/river-dataset.ts 合并：
   - 当前典籍骨架
   - 真实人物与地点信号
   - 馆藏 / 活动 / 机构资料
   - 关系层级与证据文本
5. src/lib/concept-search.ts 对典籍题名、概念、学派与摘要做概念搜索排序
6. src/lib/source-evidence.ts 将单书中的人物、场馆、事件、机构资料归并为来源证据总表
7. `src/server/payloads.ts` 输出共享接口结果
8. `/api/*` 路由与独立后端骨架共同消费这些结果
9. React 组件消费这些数据，驱动：
   - 河流总览
   - 典籍钻入
   - 文本溯源
```

## 4. 关键文件职责

### 页面与路由

- `src/app/page.tsx`
  - 综合工作台入口
- `src/app/api/graph/route.ts`
  - 图谱数据接口
- `src/app/api/books/[slug]/route.ts`
  - 单书详情接口
  - 返回结构化 `sourceEvidence`
- `src/app/api/insights/route.ts`
  - 数据覆盖与统计接口
- `src/app/api/source-atlas/route.ts`
  - 来源河册与覆盖层集合查询接口
- `src/app/api/source-atlas/[id]/route.ts`
  - 单条来源明细接口
- `src/app/api/search/route.ts`
  - 概念搜索接口
- `backend/server.ts`
  - 轻量独立后端骨架
  - 当前可直接提供 `/health`、`/graph`、`/books/:slug`、`/insights`、`/source-atlas`、`/source-atlas/:id`、`/search`

### 交互组件

- `src/components/cultural-vein-shell.tsx`
  - 首页主容器
  - 数据规模、概念搜索与证据面板
- `src/components/river-scene.tsx`
  - 3D 河流总览
  - 关系弧线
  - 节点选择
  - 与中观层的镜头联动
- `src/components/book-explorer.tsx`
  - 中观与微观统一面板
  - 单书来源证据板与来源证据总表

### 数据与状态

- `src/data/river-dataset.ts`
  - 合并当前典籍数据与真实资料
  - 输出 `riverDataset`
- `src/server/payloads.ts`
  - 为 Next Route Handlers 与独立后端共用的 payload 装配层
- `src/data/generated/real-supplements.json`
  - 由脚本生成的真实数据中间层
- `src/lib/concept-search.ts`
  - 概念搜索与排序逻辑
- `src/lib/source-evidence.ts`
  - 结构化来源证据归并
- `src/store/app-store.ts`
  - 首页筛选与选书状态
- `src/types/domain.ts`
  - 全部领域模型与接口定义

### 脚本与中间产物

- `scripts/export_real_dataset.py`
  - 当前数据管线主入口
- `tmp_generated/proposal_extract.txt`
  - 方案文档抽取文本

## 5. 为什么当前结构适合参赛

### 先保证可讲、可演示

竞赛现场最先看的是成品表达能力，而不是后端架构是否最重。当前实现优先确保：

- 宏观、中观、微观三层叙事完整
- 真实数据已经可见、可讲、可证明
- 证据层级与学术严谨性可以直接展示
- 家族传播支流已经由复旦馆藏中的族裔递藏与地方书楼线索正式接入，并补出《朱子家礼》这一可钻入的家礼中继河段
- 红色文献支流已经由南湖专题中的中共“一大”、代表人物与题词题诗线索正式接入，并补出《南湖纪念文献》这一可钻入的近现代纪念河段
- 诗学支流已经不止停留在《诗经》《楚辞章句》《文心雕龙》《昭明文选》的首尾串联，当前又补出《诗品》这一品第批评中继层
- 来源河册与河面高亮的对应关系，当前也已由数据层显式给出关联典籍列表，而不是主要依赖前端启发式猜测
- 来源河册面板已可直接列出这股来源牵出的典籍，并从来源说明一键入卷到对应书段

### 同时保留后续扩展空间

虽然现在不是完整图数据库部署，但已经保留了明确升级路径：

```text
离线脚本 -> 生成 JSON -> 共享 payload -> 本地 API / 独立后端 -> 前端消费
                │
                └── 后续可替换为：
                    Neo4j / MeiliSearch / 外部服务 API
```

这使得当前仓库既能支撑比赛阶段快速迭代，也不会把后续工程演进堵死。

## 6. 后续可升级方向

### 数据层升级

- 把 `river-dataset.ts` 中的运行时整合逐步外迁到服务端
- 将典籍关系正式落入 Neo4j
- 引入全文检索与多条件查询

### 分析层升级

- 扩大显式引用检测覆盖范围
- 引入更系统的语义相似度计算
- 增加抽检与人工校验流程说明

### 展示层升级

- 增加更明显的镜头转场
- 提升版本树与传播图的沉浸式视觉表现
- 补录屏脚本与展示视频素材

## 7. 适合放进提交材料的简述

如果需要在作品文档或 PPT 中用一句话说明当前架构，可以直接使用：

“当前版本采用‘离线抽取 + 统一图谱装配 + 共享 payload + 本地 API / 独立后端骨架 + 三层交互前端’的轻量架构，先保证典籍传承网络的可视化表达、真实数据接入与现场展示效果，同时保留后续平滑升级到图数据库与检索服务的工程空间。”
