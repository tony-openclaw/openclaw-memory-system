# OpenClaw轻量级内存系统设计

## 设计理念
基于MemOS架构原则,针对OpenClaw单用户场景简化,100%本地化实现.

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

### OpenClaw Memory (简化架构)
MemoryCore
 └─ MemoryStore (single-user local files)
 ├─ Context Memory (MEMORY.md + memory/*.md)
 ├─ Session Memory (session transcripts)
 ├─ Skill Memory (AGENTS.md, TOOLS.md, LESSONS.md)
 └─ Search Memory (memory_search tool)

依赖: OpenClaw memory_search + 文件系统
复杂度: 低 (纯文件系统 + 内置工具)

## 核心组件

### 1. Memory Types (记忆类型)

#### A. Context Memory (上下文记忆)
**用途**: 长期事实知识,状态追踪
**存储**: `MEMORY.md` + `memory/YYYY-MM-DD.md`
**特点**:
- 手工策划的重要信息, 系统配置,工具位置, 关键决策和教训

**操作**:
```python

# 读取
memory_get(path="MEMORY.md", from=1, lines=50)

# 搜索
memory_search(query="GitHub账号配置", maxResults=5)

# 写入
edit(file_path="MEMORY.md", ...)

#### B. Session Memory (会话记忆)
**用途**: 短期对话历史,上下文连续性
**存储**: `~/.openclaw/gateway-state/sessions/*/log*.jsonl`
- 完整对话记录, 工具调用历史, 自动管理(OpenClaw内置)

# 搜索历史会话
memory_search(query="昨天讨论的DeFi方案", maxResults=10)

# 获取会话历史
sessions_history(sessionKey="...", limit=50)

#### C. Skill Memory (技能记忆)
**用途**: 工作流程,操作指南,经验教训
**存储**:
- `AGENTS.md` - 工作原则, `TOOLS.md` - 工具使用笔记, `LESSONS.md` - 错误教训, `skills/*/SKILL.md` - 技能文档

- 可执行的checklist, 具体的操作步骤, 持续迭代更新

# 读取技能文档
read(file_path="/app/skills/github/SKILL.md")

# 更新教训
edit(file_path="LESSONS.md", ...)

#### D. Observation Memory (观察记忆)
**用途**: 浓缩的会话总结(token压缩)
**存储**: `memory/observations/*.json`
- 自动生成(openclaw-token-compressor), 高度压缩(97%+), 快速检索

```bash

# 自动压缩(集成到heartbeat)
python3 ~/.local/share/openclaw-skills/openclaw-token-compressor/scripts/mem_compress.py observe

### 2. Memory Operations (记忆操作)

#### Load (加载)
def load_memory(context="full"):
 """启动时加载记忆"""
 # 1. 读取长期记忆
 core_memory = read("MEMORY.md")

 # 2. 读取最近daily notes (今天+昨天)
 today = memory_get(f"memory/{TODAY}.md")
 yesterday = memory_get(f"memory/{YESTERDAY}.md")

 # 3. (可选)搜索相关上下文
 if context != "minimal":
 related = memory_search(query="当前任务上下文", maxResults=5)

 return {
 "core": core_memory,
 "recent": [today, yesterday],
 "related": related
 }

#### Search (搜索)
def search_memory(query, scope="all"):
 """智能搜索记忆"""
 # 使用OpenClaw内置memory_search (向量搜索)
 results = memory_search(
 query=query,
 maxResults=10,
 minScore=0.7
 )

 # 按来源分类
 categorized = {
 "context": [r for r in results if "MEMORY.md" in r.path],
 "daily": [r for r in results if "memory/" in r.path],
 "skills": [r for r in results if "SKILL.md" in r.path],
 "sessions": [r for r in results if "sessions/" in r.path]

 return categorized

#### Add (添加)
def add_memory(content, type="daily"):
 """添加新记忆"""
 if type == "daily":
 # 追加到今日memo
 file = f"memory/{TODAY}.md"
 append(file, f"\n## {timestamp()}\n{content}\n")

 elif type == "core":
 # 更新MEMORY.md
 edit("MEMORY.md", ...)

 elif type == "lesson":
 # 记录到LESSONS.md
 append("LESSONS.md", f"\n## {date()} - {content}\n")

#### Compress (压缩)
def compress_memory():
 """定期压缩记忆(集成到heartbeat)"""
 # 1. 检查潜在节省
 savings = exec("python3 ... benchmark")

 # 2. 如果>5%则执行压缩
 if savings > 0.05:
 exec("python3 ... full")

 # 3. 压缩旧session transcripts
 exec("python3 ... observe")

# 1. 读取核心文件 (AGENTS.md要求)
- SOUL.md (身份), USER.md (用户信息), MEMORY.md (长期记忆)
- memory/TODAY.md + YESTERDAY.md (最近上下文)

# 2. 检查待办事项
check_pending_tasks()

# 3. 加载相关技能文档(按需)
if task_matches_skill():
 read(skill_location)

# 1. 检查是否需要压缩
if token_usage > threshold:
 compress_memory()

# 2. 整理daily notes到MEMORY.md
if days_since_review > 3:
 review_and_update_memory()

# 3. 清理过期observations
if old_observations_exist:
 archive_old_summaries()

# 1. 立即记录到daily note (LESSONS.md #5)
append(f"memory/{TODAY}.md", task_summary)

# 2. 检查是否需要提取教训
if task_has_feedback:
 append("LESSONS.md", lesson)

# 3. 更新MEMORY.md (重要事件)
if task_is_significant:
 update("MEMORY.md", key_learnings)

## 实现策略

### Phase 1: 利用现有基础设施
- **已完成**: MEMORY.md, memory/*.md, LESSONS.md
- **已集成**: openclaw-token-compressor (heartbeat)
- **已使用**: memory_search, memory_get工具

### Phase 2: 增强记忆管理 (Next)
1. **创建Memory Helper脚本**
 # memory-helper.js
 - load_memory() - 启动加载, search_memory() - 智能搜索, add_memory() - 快速添加, review_memory() - 定期review

2. **集成到HEARTBEAT.md**
 ```markdown
 ## Memory Maintenance (每3天)
 - Review recent memory/*.md files
 - Update MEMORY.md with key learnings
 - Run token compression if needed

3. **创建Memory Status命令**
 # 显示记忆系统状态
 memory-status:
 - Token count (by file)
 - Compression savings potential, Recent additions, Search index health

### Phase 3: 高级功能 (未来)
1. **自动分类**: 使用LLM自动提取重要信息到MEMORY.md
2. **关联分析**: 发现记忆之间的连接(类似MemOS的图结构,但用文件引用)
3. **上下文推荐**: 基于当前任务自动推荐相关记忆

## 与MemOS对比
**架构**, MemOS=Multi-user, 3-tier, OpenClaw Memory=Single-user, flat
**存储**, MemOS=Neo4j + Qdrant, OpenClaw Memory=文件系统
**依赖**, MemOS=3个数据库 + APIs, OpenClaw Memory=OpenClaw内置工具
**复杂度**, MemOS=高 (Docker Compose), OpenClaw Memory=低 (纯文件)
**隐私**, MemOS=需trust云端API, OpenClaw Memory=100%本地
**Token节省**, MemOS=72% (官方数据), OpenClaw Memory=50%+ (已验证)
**搜索能力**, MemOS=向量+图+BM25, OpenClaw Memory=向量(memory_search)
**维护成本**, MemOS=高 (DB管理), OpenClaw Memory=低 (文件编辑)
**适用场景**, MemOS=多Agent共享记忆, OpenClaw Memory=个人助手

## 核心原则(从MemOS学到的)
1. **分层设计**: Context(长期) → Daily(中期) → Session(短期)
2. **选择性加载**: 不是所有记忆都需要每次加载
3. **定期压缩**: 旧记忆自动总结,减少token消耗
4. **多种检索**: 向量搜索 + 关键词搜索 + 文件浏览
5. **持久化接口**: load/dump抽象,支持备份和迁移

## 下一步行动

### 立即实施 (Today)
- [x] 完成MemOS代码分析, [ ] 创建`memory-helper.js`脚本, [ ] 测试memory_search在不同场景下的效果, [ ] 更新AGENTS.md中的memory使用指南

### 短期优化 (This Week)
- [ ] 集成memory review到heartbeat
- [ ] 创建memory-status命令
- [ ] 编写memory使用best practices文档

### 长期增强 (This Month)
- [ ] 实现自动MEMORY.md更新(从daily notes提取)
- [ ] 添加memory关联分析
- [ ] 探索与sessions_history的深度集成

**设计完成时间**: 2026-02-10 13:15 UTC
**下一步**: 实现memory-helper.js脚本