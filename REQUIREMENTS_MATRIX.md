# 文脉溯源需求与证据矩阵

这份文档的目标不是介绍愿景，而是把参赛方案中的关键要求，和当前仓库里可以直接指向的实现证据对应起来，方便终稿自查、答辩和提交前核验。

## 1. 目标口径

- 方案来源：
  - `C:\Users\saurl\Downloads\文脉溯源_参赛方案(1).pdf`
  - `tmp_generated/proposal_extract.txt`
- 当前仓库证据来源：
  - 代码
  - 本地 API
  - 构建与预检命令
  - 已同步的交付文档

## 2. 核心要求对照

| 方案要求 | 当前状态 | 直接证据 |
| --- | --- | --- |
| 宏观层 3D 河流总览 | 已实现 | `src/components/river-scene.tsx`, `src/components/cultural-vein-shell.tsx` |
| 时间轴演化 | 已实现 | 首页时代轴、时代按钮、时代过滤逻辑 |
| 概念搜索 | 已实现 | `src/app/api/search/route.ts`, `src/lib/concept-search.ts` |
| 类别筛选 | 已实现 | 首页“经 / 史 / 子 / 集”筛选 |
| 分支标注与入卷转场 | 已实现 | 河面分支标注、镜头俯冲/拉回、单书钻入 |
| 中观地理传播图 | 已实现 | `src/components/spread-globe.tsx`, `book-explorer.tsx` 的 `spread` tab |
| 中观人物关系网 | 已实现 | `src/components/person-network-3d.tsx`, `people` tab |
| 中观版本流变树 | 已实现 | `src/components/version-tree.tsx`, `versions` tab |
| 中观关联时间线 | 已实现 | `timeline` tab |
| 微观文本对读 | 已实现 | `passages` tab，横/竖排切换，对读证据卡 |
| 置信度分层 | 已实现 | 高/中/低三层关系样式与文案 |
| 溯源光线动画 | 已实现 | `src/components/trace-light-field.tsx` |
| 下游影响追踪 | 已实现 | `downstreamInfluence` 面板 |
| 来源河册 | 已实现 | `/api/source-atlas`, 首页来源河册与来源过滤 |
| 单书来源证据归并 | 已实现 | `src/lib/source-evidence.ts`, 单书“来源卷录” |
| 独立后端骨架 | 已实现 | `backend/server.ts`, `pnpm backend:dev` |
| 构建与预检 | 已实现 | `pnpm lint`, `pnpm build`, `pnpm preflight` |

## 3. 关键示范链证据

### 主干案例

| 案例 | 当前状态 | 证据 |
| --- | --- | --- |
| `论语` | 已实现 | `/books/lunyu`, `pnpm preflight` 中主案例 smoke check |
| `周易` | 已实现 | `/books/zhouyi`, `pnpm preflight` 中主案例 smoke check |
| `四书章句集注` | 已实现 | `src/data/river-dataset.ts`, 单书钻入链路 |

### 新增中继支流

| 支流 | 当前状态 | 证据 |
| --- | --- | --- |
| `诗品` | 已实现 | `src/data/river-dataset.ts` 中 `book-shipin` 与详情、诗学关系边 |
| `朱子家礼` | 已实现 | `src/data/river-dataset.ts` 中 `book-zhuzi-jiali` 与详情、`pnpm preflight` |
| `南湖纪念文献` | 已实现 | `src/data/river-dataset.ts` 中 `book-nanhu-jinian` 与详情、`pnpm preflight` |

## 4. 真实来源接入证据

| 来源 | 当前状态 | 证据 |
| --- | --- | --- |
| CBDB / 纪传人物库 | 已实现 | `scripts/export_real_dataset.py`, `cbdbPeople`, `cbdbSummary` |
| 上海图书馆开放数据 | 已实现 | 活动、事件、借阅流通样本 |
| 南京图书馆 | 已实现 | 图像资源样本、机构来源字段 |
| 复旦大学图书馆 | 已实现 | 南社诗笺摘要、家谱文献线索 |
| 南湖文献数据库 | 已实现 | 文献数量、图像数量、专题条目 |
| 近代上海城市文化专题片 | 已实现 | `videoTopicSample`, 城市影像支流 |
| 深圳图书馆 | 已实现 | 专题资料与来源字段 |
| 韬奋纪念馆 | 已实现 | API 文档字段与机构来源信号 |
| 宋庆龄文献数据中心 | 已实现 | 文中人名、事件组织、写作地点、题词对象字段 |
| 搜韵知识图谱 | 已实现 | 诗文、古籍、知识图谱来源信号 |
| 全国报刊索引 | 已实现 | 题名、主题词、摘要与全文路径字段 |
| Artlib 世界艺术鉴赏库 | 已实现 | 艺术家与艺术品接口资料 |

## 5. 新增来源支流的可证明性

| 支流联动 | 当前状态 | 自动证明 |
| --- | --- | --- |
| `家谱文献 -> 朱子家礼` | 已实现 | `pnpm preflight` 的 source linkage check |
| `红色文献 -> 南湖纪念文献` | 已实现 | `pnpm preflight` 的 source linkage check |
| `朱子家礼` 单书链路 | 已实现 | `pnpm preflight` 中 timeline smoke check |
| `南湖纪念文献` 单书链路 | 已实现 | `pnpm preflight` 中 source evidence smoke check |

## 6. 仍属部分实现的项

这些项不是未做，而是与方案原始设想相比仍保留了明显简化：

| 方案项 | 当前状态 | 差距说明 |
| --- | --- | --- |
| 大规模古籍循证全量导入 | 部分实现 | 当前以精选示范域为主，不是全量 130 万种古籍导入 |
| 人名规范库 / 书目数据 / 地名志 / 历史文化事件的全量工程化接入 | 部分实现 | 当前以可演示替代资料与局部真实来源形成支流 |
| Neo4j 图数据库 | 部分实现 | 已有共享 payload 与独立后端骨架，但未接入 Neo4j |
| MeiliSearch 搜索后端 | 部分实现 | 已有站内搜索 API，但未接入 MeiliSearch |
| LLM 批量显式引文检测生产管线 | 部分实现 | 当前以结构化示范数据与证据层实现为主，未形成大规模自动检测链 |

## 7. 当前最强的终稿证据

- `pnpm preflight`
  - 已覆盖构建、独立后端健康、来源河册 smoke check、四个主案例 smoke check、两条关键来源支流联动 check
- `FINAL_AUDIT.md`
  - 说明当前项目与方案要求之间的完成度判断
- `DELIVERY.md`
  - 可直接用于 5 分钟讲解与评审问答
- `ARCHITECTURE.md`
  - 可解释当前“前端 + 本地 API + 离线抽取”的工程结构

## 8. 结论

按当前仓库与命令级证据判断：

- 作品已达到 `可运行、可演示、可提交`
- 宏观 / 中观 / 微观三层主交互均已存在直接实现
- 真实来源已形成“来源河册 -> 河面高亮 -> 单书来源证据”的闭环
- 诗学、家礼、红色三条高价值支流已从“来源名目”升级为“可钻入的中继河段”
- 方案中最重的后端与全量自动分析部分，仍属于后续可扩展而非当前终稿的已完成项
