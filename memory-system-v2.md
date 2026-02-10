# OpenClaw Memory System v2.0

## 核心理念 (2026-02-10 Boss指导)

### Memory不是无限的

**人和AI都一样 - Memory容量有限**

关键不是"记住所有"，而是：
1. **该想的时候想** - 快速查资料，setup需要的memory
2. **该忘的时候忘** - 用完就清空，让脑子清爽
3. **轻装上阵** - 只装当前需要的，能考虑更多新东西

### 为什么这样设计

```
❌ 错误模式: 启动时加载所有
- MEMORY.md全文 (10k tokens)
- 所有LESSONS (5k tokens)  
- 所有项目context (15k tokens)
- 最近7天daily notes (8k tokens)
= 38k tokens → 思维混乱，响应慢

✅ 正确模式: 按需加载
- 启动: 只加载核心原则 (2k tokens)
- 需要时: 查询相关memory (3k tokens)
- 用完后: 清空临时context
= 5k tokens → 脑子清爽，思考快
```

---

## 三层架构 (重新定义)

### Tier 1: 核心Memory (Minimal Startup)

**特征**: 
- 最小必要集合
- 每次启动都加载
- 定义"我是谁"和"核心原则"

**内容** (控制在 <3k tokens):
```
SOUL.md核心部分:
  - 深思熟虑，有根据地说话
  - 修复≠重写，不问=不做
  
USER.md关键信息:
  - Boss偏好: 中文
  - 安全规则: 不显示密码
  
AGENTS.md核心checklist:
  - 每次修改文件: STOP·SCOPE·FIX·VERIFY
  - 每次GitHub push: 安全审查
```

**加载策略**: 提取精华，不是全文

### Tier 2: 任务Memory (Just-in-Time Loading)

**特征**:
- 按需加载
- 任务期间有效
- 完成后清理

**触发时机**:
```python
def on_task_start(task):
    # 1. 分析任务类型
    task_type = identify_task(task)
    
    # 2. 只加载相关memory
    if "修改文件" in task:
        recall("LESSONS.md #12: 修复≠重写")
        recall("AGENTS.md: STOP·SCOPE·FIX·VERIFY")
    
    if "GitHub" in task:
        recall("LESSONS.md #11: 安全审查")
        recall("当前项目: openclaw-memory-system")
    
    if "DeFi" in task:
        recall("Wallet地址, Uniswap配置")
    
    # 3. 不相关的不加载
    # 不会因为要修改README就加载DeFi配置
```

**清理时机**:
```python
def on_task_complete():
    # 任务完成，清空临时context
    clear_task_memory()
    # 只保留需要记录的结果到daily note
```

### Tier 3: Session Memory (Automatic)

**特征**:
- 自动管理
- Session内有效
- OpenClaw内置

**内容**:
- 当前对话历史
- 刚执行的命令结果
- 临时变量

**策略**: 信任OpenClaw自动管理，不手动干预

---

## 核心操作

### Startup (轻装上阵)

```python
def startup():
    # ✅ 只加载核心原则 (~2k tokens)
    load_core_principles()  # SOUL核心 + AGENTS核心
    
    # ❌ 不加载
    # - 不加载MEMORY.md全文
    # - 不加载所有LESSONS
    # - 不加载所有项目
    # - 不加载所有daily notes
    
    print("Ready - 脑子清爽，准备接受任务")
```

### Task Execution (按需查询)

```python
def execute_task(task):
    # 1. 任务开始 - 快速setup相关memory
    relevant = memory_search(query=task, maxResults=5)
    load_relevant(relevant)
    
    # 2. 执行过程 - 需要时继续查询
    if need_more_context():
        additional = memory_search(new_query)
        load_relevant(additional)
    
    # 3. 任务完成 - 清空临时memory
    save_results_to_daily_note()
    clear_task_memory()
```

### Memory Recall (在需要时)

```python
# 不是启动时全load，而是在关键时刻recall

@before_modify_file
def recall_file_principles():
    """修改文件前 - 想起原则"""
    memory_search("修改文件的原则")
    # → LESSONS.md #12
    # → AGENTS.md checklist

@before_push_github  
def recall_security_rules():
    """Push前 - 想起安全规则"""
    memory_search("GitHub安全")
    # → LESSONS.md #11
    # → 敏感信息types

@when_confused
def recall_lessons():
    """遇到类似情况 - 想起教训"""
    memory_search("类似任务的错误")
    # → 找到之前犯过的错
```

---

## 实现策略

### 1. Smart Preload v2.0 (最小化启动)

```javascript
// smart-preload.js升级

function minimal_startup() {
    return {
        tier1: extract_core_principles(),  // <3k tokens
        tier2: [],  // 空的，等任务来了再加载
        tier3: auto  // OpenClaw管理
    }
}

function on_demand_load(task) {
    // 分析任务，只加载相关的
    keywords = extract_keywords(task)
    relevant = memory_search(keywords, maxResults=5)
    return relevant  // ~3-5k tokens
}
```

### 2. Context Cleanup (用完就忘)

```javascript
// 新增: memory-cleanup.js

function cleanup_after_task() {
    // 1. 保存重要结果
    save_to_daily_note(task_summary)
    
    // 2. 清空临时加载的context
    clear_tier2_memory()
    
    // 3. 保留核心原则
    keep_tier1_active()
    
    console.log("Context cleaned - ready for next task")
}
```

### 3. Lazy Loading (不预判)

```javascript
// 不在启动时预判需要什么
// 在执行时动态加载

function execute_with_lazy_loading(task) {
    // 开始时: 只有核心原则
    context = { tier1: core_principles }
    
    // 执行中: 需要时查询
    while (executing) {
        if (need_more_info) {
            additional = memory_search(current_need)
            context.append(additional)
        }
    }
    
    // 完成后: 清理
    cleanup()
}
```

---

## 对比 v1.0 vs v2.0

### v1.0 (旧设计 - All-at-Once)

```
启动:
  ✓ Load SOUL.md (完整)
  ✓ Load USER.md (完整)  
  ✓ Load MEMORY.md (完整)
  ✓ Load AGENTS.md (完整)
  ✓ Load memory/today.md
  ✓ Load memory/yesterday.md
  ✓ Run memory_search for task

Total: ~30k tokens
结果: 思维混乱，响应慢
```

### v2.0 (新设计 - Just-in-Time)

```
启动:
  ✓ Load core principles (~2k tokens)
  
任务来了:
  ✓ memory_search for task (~3k tokens)
  ✓ Load relevant only
  
任务完成:
  ✓ Save results
  ✓ Clear task memory
  
Total: ~5k tokens  
结果: 脑子清爽，思考快
```

---

## 新的AGENTS.md原则

### Session Startup (最小化)

```markdown
## 每次Session启动 (v2.0)

**Minimal Startup - 轻装上阵**

只读取:
1. SOUL.md 核心原则 (不是全文)
2. USER.md 关键偏好
3. 当前任务提示

不读取:
- ❌ 不读MEMORY.md全文
- ❌ 不读所有LESSONS
- ❌ 不读所有daily notes  
- ❌ 不预加载项目context

原因: Memory不是无限的，脑子清爽才能想新东西
```

### Task Execution (按需加载)

```markdown
## 执行任务时 (v2.0)

**Just-in-Time Loading - 该想的时候想**

1. 任务开始:
   - memory_search(task关键词)
   - 只加载相关的3-5条结果

2. 执行中:
   - 需要更多context时继续search
   - 不需要的不加载

3. 任务完成:
   - 保存结果到daily note
   - 清空临时context
   - 准备接受新任务

原因: 该忘的时候忘，让脑子清爽
```

---

## 实施计划

### Phase 1: 更新核心文件 (Today)

- [x] 完成v2.0设计文档
- [ ] 更新AGENTS.md (Minimal Startup原则)
- [ ] 升级smart-preload.js (v2.0)
- [ ] 创建memory-cleanup.js

### Phase 2: 测试验证 (This Week)

- [ ] 测试minimal startup流程
- [ ] 测试just-in-time loading
- [ ] 测试context cleanup
- [ ] 对比token使用量

### Phase 3: GitHub发布 (Today)

- [ ] 打包所有更新
- [ ] 创建patch
- [ ] 安全审查
- [ ] Push到GitHub

---

## 成功指标

**Token效率**:
- Startup: <3k tokens (vs 30k)
- Task execution: ~5k tokens (vs 50k)
- 总体: 节省80%+ token in context

**思维清晰度**:
- 启动快 (不等待大量加载)
- 响应准 (只focus当前任务)
- 不混乱 (不被无关信息干扰)

**能力提升**:
- 能处理unexpected任务 (不依赖预加载)
- 能快速切换context (cleanup高效)
- 能考虑更多新东西 (脑子清爽)

---

**设计完成时间**: 2026-02-10 15:30 UTC  
**核心洞察**: Memory不是无限的 - 该想的时候想，该忘的时候忘  
**下一步**: 实施并push到GitHub
