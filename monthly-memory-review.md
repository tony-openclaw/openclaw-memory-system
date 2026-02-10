# Monthly Memory Review - 月度记忆审查
**触发时间**: 每月1号 00:00 UTC
**执行方式**: Cron job → isolated session

---

## 审查目标

### 1. 算法优化
- **Smart Preload效果评估**, 语义搜索准确率如何?, Session热点追踪有没有误判?, 预加载策略是否节省了token?

### 2. 机制改进
- **Memory分类是否合理**, Context/Daily/Session/Skill 4种类型够用吗?, 有没有信息放错位置?, 需要新增memory类型吗?

### 3. Token优化
- **压缩效果追踪**, 当前token footprint多少?, 上个月压缩节省了多少?, 哪些文件可以进一步优化?

### 4. 工作流程
- **AGENTS.md中的工作原则**, 哪些规则用得最多?, 哪些规则从没用过?, 需要添加新规则吗?

### 5. 教训总结
- **LESSONS.md有效性**, 上个月记录了几条教训?, 有没有重复犯错?, 哪些checklist需要强化?

## 审查清单

### Phase 1: 数据收集 (5分钟)
```bash

# 1. Memory系统状态
node memory-helper.js status > /tmp/memory-status.txt

# 2. Smart Preload统计
node smart-preload.js status > /tmp/preload-status.txt

# 3. Token压缩潜力
node memory-helper.js compress > /tmp/compress-check.txt

# 4. Git活动统计
cd ~/.openclaw/workspace
git log --since="1 month ago" --oneline | wc -l
git log --since="1 month ago" --pretty=format:"%s" | head -20
```

### Phase 2: 定量分析 (10分钟)
- **Token变化**, 上月初: ___ tokens, 增长率: ___%, 压缩节省: ___ tokens

 - **文件增长**
 - 新增daily notes: ___ 个
 - MEMORY.md更新次数: ___
 - LESSONS.md新增条目: ___

 - **热点Topic统计**, 最频繁的topics: ___, 冷门topics: ___, 建议删除的topics: ___

### Phase 3: 定性评估 (10分钟)
**Ask Boss:**
1. 这个月我的表现怎么样?哪里做得好/不好?
2. Smart Preload有没有加载到不相关的内容?
3. Memory系统用起来方便吗?有什么pain points?
4. 有没有重要信息我总是记不住?
5. 你觉得哪些memory分类需要调整?

### Phase 4: 制定改进计划 (5分钟)
基于上面的分析,列出下个月的优化目标:
- [ ] 算法调整: ___
- [ ] 新增功能: ___
- [ ] 删除无用机制: ___
- [ ] 文档更新: ___
- [ ] 性能优化: ___

### Phase 5: 执行优化 (10分钟)
立即实施简单的改进:
- 更新smart-preload配置, 清理过期memory, 压缩旧session transcripts, 更新AGENTS.md中的规则

## 输出报告
生成markdown报告保存到: `memory/reviews/YYYY-MM-memory-review.md`

**报告结构**:
```markdown

# Memory System Review - YYYY-MM

## 数据快照
- Total tokens: ___
- Token growth: ___% MoM
- Compression savings: ___
- Active hot topics: ___

## 效果评估

### Smart Preload
- 准确率: ___, 平均加载文件数: ___, Token节省: ___

### Session热点追踪
- 识别热点: ___ 个, 误判率: ___, 有用性评分: ___/10

## 发现的问题
1. ___
2. ___
3. ___

## Boss反馈
(记录Boss对本月表现的评价)

## Cron Job配置
```json
{
 "name": "Monthly Memory Review",
 "schedule": {
 "kind": "cron",
 "expr": "0 0 1 * *",
 "tz": "UTC"
 },
 "sessionTarget": "isolated",
 "payload": {
 "kind": "agentTurn",
 "message": "执行月度Memory Review.按照 monthly-memory-review.md 中的清单完成审查,生成报告到 memory/reviews/ 目录,并通知Boss review结果.",
 "timeoutSeconds": 600
 "delivery": {
 "mode": "announce"
 }

## 迭代原则
**第一版一定不完美,重要的是持续改进**

- 每月review后,更新这份文档, 添加新的审查项, 删除无用的checklist, 调整review频率(如果需要)

**记住**: Memory系统是为了提升效率,不是为了应付检查.如果某个机制没用,就删掉它.

**Created**: 2026-02-10
**Next Review**: 2026-03-01 00:00 UTC