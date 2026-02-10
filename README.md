# OpenClaw轻量级内存系统设计

## v2.0 核心理念 (2026-02-10更新)

**Memory不是无限的 - 该想的时候想，该忘的时候忘**

### 为什么v2.0

```
v1.0问题:
  启动时加载所有 → 30k+ tokens
  思维混乱 → 响应慢
  装太多无关信息 → 反而做不好

v2.0改进:
  Minimal Startup → ~3k tokens
  Just-in-Time Loading → 按需查询
  Context Cleanup → 用完就忘
  = 脑子清爽，思考快，能考虑更多新东西
```

### 三个核心改变

1. **轻装上阵** (Minimal Startup)
   - 启动时只加载核心原则 (~2k tokens)
   - 不预加载项目、不读全文、不猜需求

2. **按需加载** (Just-in-Time)
   - 任务来了，查询相关memory (~3k tokens)
   - 需要时继续查询，不需要的不加载

3. **用完就忘** (Context Cleanup)
   - 任务完成，清空临时context
   - 保存结果，准备下一个任务

---

## 设计理念

基于MemOS架构原则，针对OpenClaw单用户场景简化，100%本地化实现。

---

## 架构对比

### MemOS (原架构)

```
MOSCore
 └─ MemCube (multi-user container)
     ├─ Text Memory (Neo4j graph DB)
     ├─ Activation Memory (short-term)
     ├─ Parametric Memory (LoRA fine-tuning)
     └─ Preference Memory (Qdrant vector DB)

依赖: Neo4j + Qdrant + OpenAI API + LLM + Embedder + Reranker
复杂度: 高 (3个数据库容器 + 多个API keys)
```

### OpenClaw Memory v2.0 (简化架构)

```
MemoryCore (Minimal + Just-in-Time)
 └─ MemoryStore (single-user local files)
     ├─ Tier 1: Core Principles (~2k tokens)
     ├─ Tier 2: Task Memory (Just-in-Time ~3k)
     └─ Tier 3: Session Memory (Auto cleanup)

依赖: OpenClaw memory_search + 文件系统
复杂度: 低 (纯文件系统 + 内置工具)
Token使用: 5-8k (vs v1.0 30k+)
```

---

## 工具

### smart-preload-v2.js

**v2.0改进 - Minimal Startup**

```bash
# 分析任务，生成最小加载建议
node smart-preload-v2.js "修复README格式"

输出:
  Tier 1: Core Principles (~2k tokens)
  Tier 2: file_modification topic (~3k tokens)
  → memory_search("修改文件原则")
  Total: ~5k tokens (vs v1.0 30k+)
```

### memory-cleanup.js

**新增 - Context Cleanup**

```bash
# 任务完成后，清空临时context
node memory-cleanup.js

输出:
  ✓ Task-specific memory cleared
  ✓ Temporary variables released
  ✓ Core principles retained
  💡 脑子清爽，准备接受新任务
```

### memory-helper.js

**保持不变 - Daily Note管理**

```bash
# 显示memory统计
node memory-helper.js status

# 搜索memory
node memory-helper.js search "关键词"

# 添加到daily note
node memory-helper.js add "重要事件"

# Review最近memory
node memory-helper.js review
```

---

## 使用流程

### Session启动 (v2.0)

```javascript
// 1. Minimal Startup - 只加载核心
load_core_principles()  // SOUL核心 + AGENTS核心 (~2k tokens)

// 2. 不预加载
// ❌ 不读MEMORY.md全文
// ❌ 不读所有LESSONS
// ❌ 不读所有项目
// ❌ 不读所有daily notes

console.log("Ready - 轻装上阵")
```

### 任务执行 (v2.0)

```javascript
// 1. Just-in-Time - 按需查询
task = "修复README格式"
relevant = memory_search(task, maxResults=5)  // ~3k tokens
// → LESSONS.md #12: 修复≠重写
// → AGENTS.md: STOP·SCOPE·FIX·VERIFY

// 2. 执行任务
execute_with_context(relevant)

// 3. Context Cleanup - 用完就忘
save_results()
cleanup_task_memory()
console.log("Task完成，脑子清爽")
```

---

## 与MemOS对比

| 维度 | MemOS | OpenClaw v1.0 | OpenClaw v2.0 |
|------|-------|--------------|--------------|
| **启动策略** | 全加载 | 全加载 | Minimal |
| **Startup Tokens** | N/A | ~30k | ~2k |
| **Task Tokens** | N/A | ~50k | ~5k |
| **加载方式** | 预加载 | 预加载 | Just-in-Time |
| **Cleanup** | 无 | 无 | 自动 |
| **思维负担** | 高 | 高 | 低 |
| **响应速度** | 慢 | 慢 | 快 |
| **适应性** | 一般 | 一般 | 强 |

---

## 文件说明

### 核心设计

- `memory-system-v2.md` - v2.0完整设计文档
- `README.md` - 本文档

### 工具脚本

- `memory-helper.js` - Daily note管理
- `smart-preload-v2.js` - v2.0最小化预加载
- `memory-cleanup.js` - Context清理
- `monthly-memory-review.md` - 月度review checklist

---

## 核心原则

1. **Memory不是无限的** - 不管AI还是人
2. **该想的时候想** - Just-in-Time查询
3. **该忘的时候忘** - Cleanup释放空间
4. **轻装上阵** - 脑子清爽才能思考
5. **按需加载** - 不预判需要什么

---

## 成功指标

**v2.0 vs v1.0**:
- Startup tokens: 2k vs 30k (93%↓)
- Task tokens: 5k vs 50k (90%↓)
- 响应速度: 快 (不等待大量加载)
- 思维清晰度: 高 (不被无关信息干扰)
- 适应性: 强 (不依赖预加载)

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

**Created**: 2026-02-10  
**Version**: 2.0  
**Author**: Tony (OpenClaw Agent)  
**Core Insight**: Memory不是无限的 - 该想的时候想，该忘的时候忘
