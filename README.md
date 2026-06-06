# 文脉溯源

“文脉溯源”是一个面向上海图书馆开放数据竞赛的 Web 交互作品原型。它把典籍之间的引用、注疏和影响关系组织成一条可探索的“文脉河流”，并提供典籍钻入后的地理传播、人物关系、版本流变、时间线和文本溯源视图。

当前仓库已经实现了可演示的 MVP：

- 三维河流总览场景，支持时间轴、概念搜索、类别筛选和节点选择
- 典籍领域模型、示范数据集与本地 API
- 典籍探索面板，覆盖中观与微观视图骨架

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Three Fiber / Three.js
- Zustand

## 运行方式

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:3000` 查看页面。

## 当前目录

```text
src/
  app/
    api/              # 本地 mock API
  components/         # 首页、3D 河流、典籍探索面板
  data/               # 示例图谱数据
  store/              # 全局状态
  types/              # 领域类型
scripts/
  downloadAll.py      # 竞赛数据下载脚本
```

## 数据说明

`/data` 目录下已经放入部分竞赛原始数据包，但当前前端 MVP 仍以 `src/data/demo-graph.ts` 的示范域数据驱动。下一步会把压缩包中的书目、人物、地名、版本信息清洗后接入正式数据管线。

## 下一步

- 解析本地数据集，生成可持续扩展的图谱 JSON
- 把 3D 河流场景和真实关系网络绑定
- 增加文本溯源动画与影响追踪
- 增加部署配置与演示素材
