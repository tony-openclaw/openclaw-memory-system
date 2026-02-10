#!/usr/bin/env node
/**
 * Smart Preload - 智能预加载引擎
 * 
 * 策略:
 * 1. Tier 1: 核心文件 (永远加载)
 * 2. Tier 2: 语义搜索 (主要策略)
 * 3. Tier 3: Session热点追踪 (维护上下文连续性)
 * 
 * 相信LLM的语义理解能力，以memory_search为核心
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.HOME + '/.openclaw/workspace';
const SESSION_CACHE = path.join(WORKSPACE, '.session-hotspots.json');

// ============= Configuration =============

const CONFIG = {
  tier1: {
    // 永远加载的核心文件
    always: [
      'SOUL.md',
      'USER.md', 
      'AGENTS.md'
    ]
  },
  
  tier2: {
    // 语义搜索配置
    semantic: {
      maxResults: 5,
      minScore: 0.6,
      // 搜索范围
      sources: [
        'MEMORY.md',
        'TOOLS.md',
        'LESSONS.md',
        'memory/*.md',
        'skills/*/SKILL.md'
      ]
    }
  },
  
  tier3: {
    // Session热点追踪
    hotspot: {
      windowSize: 10,        // 追踪最近10条消息
      thresholdCount: 3,     // topic出现3次以上算热点
      decayFactor: 0.8,      // 热度衰减因子
      maxHotspots: 5         // 最多追踪5个热点
    }
  }
};

// ============= Session热点追踪 =============

class SessionHotspotTracker {
  constructor() {
    this.hotspots = this.load();
  }
  
  load() {
    try {
      if (fs.existsSync(SESSION_CACHE)) {
        return JSON.parse(fs.readFileSync(SESSION_CACHE, 'utf-8'));
      }
    } catch (err) {
      console.error('Failed to load session cache:', err.message);
    }
    return {
      topics: {},      // topic -> {count, lastSeen, heat}
      history: [],     // recent messages
      lastUpdate: null
    };
  }
  
  save() {
    try {
      fs.writeFileSync(SESSION_CACHE, JSON.stringify(this.hotspots, null, 2));
    } catch (err) {
      console.error('Failed to save session cache:', err.message);
    }
  }
  
  /**
   * 从消息中提取topics (关键词)
   */
  extractTopics(message) {
    const text = message.toLowerCase();
    const topics = new Set();
    
    // 预定义的topic关键词
    const topicKeywords = {
      'github': ['github', 'repo', 'git', 'commit', 'pr', 'issue'],
      'defi': ['defi', 'swap', 'uniswap', 'wallet', 'eth', 'usdc', 'token'],
      'model_router': ['model', 'router', 'deepseek', 'claude', 'gemini', 'openrouter'],
      'memory': ['memory', '记忆', 'compression', 'token', 'memOS'],
      'browser': ['browser', 'actionbook', 'automation', 'screenshot'],
      'email': ['email', 'protonmail', 'mail', '邮件'],
      'twitter': ['twitter', 'x.com', 'tweet', 'bird'],
      'coding': ['code', '代码', 'debug', 'bug', 'programming', 'function'],
      'git': ['git', 'github', 'push', 'pull', 'commit', 'clone', 'merge', 'branch'],
      'file_ops': ['file', 'encrypt', 'decrypt', 'save', '文件', '保存', '加密'],
      'security': ['password', 'passphrase', 'encrypt', 'decrypt', 'credential']
    };
    
    // 匹配关键词
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        topics.add(topic);
      }
    }
    
    return Array.from(topics);
  }
  
  /**
   * 更新热点追踪
   */
  update(message) {
    const topics = this.extractTopics(message);
    const now = Date.now();
    
    // 添加到历史
    this.hotspots.history.push({
      message,
      topics,
      timestamp: now
    });
    
    // 保持窗口大小
    if (this.hotspots.history.length > CONFIG.tier3.hotspot.windowSize) {
      this.hotspots.history.shift();
    }
    
    // 更新topic计数
    topics.forEach(topic => {
      if (!this.hotspots.topics[topic]) {
        this.hotspots.topics[topic] = {
          count: 0,
          lastSeen: now,
          heat: 0
        };
      }
      
      const t = this.hotspots.topics[topic];
      t.count++;
      t.lastSeen = now;
      
      // 计算热度 (基于频率和时间衰减)
      const timeSinceLastSeen = (now - t.lastSeen) / 1000 / 60; // minutes
      t.heat = t.count * Math.exp(-timeSinceLastSeen * 0.1);
    });
    
    // 衰减旧topic的热度
    Object.keys(this.hotspots.topics).forEach(topic => {
      const t = this.hotspots.topics[topic];
      const timeSinceLastSeen = (now - t.lastSeen) / 1000 / 60;
      t.heat *= Math.pow(CONFIG.tier3.hotspot.decayFactor, timeSinceLastSeen);
      
      // 清理冷门topic
      if (t.heat < 0.1) {
        delete this.hotspots.topics[topic];
      }
    });
    
    this.hotspots.lastUpdate = now;
    this.save();
  }
  
  /**
   * 获取当前热点topics
   */
  getHotTopics() {
    const topics = Object.entries(this.hotspots.topics)
      .map(([topic, data]) => ({
        topic,
        ...data
      }))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, CONFIG.tier3.hotspot.maxHotspots);
    
    return topics.filter(t => t.count >= CONFIG.tier3.hotspot.thresholdCount);
  }
  
  /**
   * 获取热点相关的memory paths
   */
  getHotMemoryPaths() {
    const hotTopics = this.getHotTopics();
    const paths = [];
    
    // Topic → Memory映射
    const topicMemoryMap = {
      'github': [
        'MEMORY.md#GitHub Account',
        '.credentials-info.md',
        'TOOLS.md'
      ],
      'defi': [
        'MEMORY.md#DeFi Operations',
        '.tony-wallet-info.md'
      ],
      'model_router': [
        'MODEL-ROUTER-USAGE.md',
        'MEMORY.md#OpenRouter'
      ],
      'memory': [
        'OPENCLAW-MEMORY-SYSTEM.md',
        'TOOLS.md#token-compressor'
      ],
      'browser': [
        'TOOLS.md#actionbook',
        'TOOLS.md#Browser'
      ],
      'email': [
        'MEMORY.md#Email',
        '.credentials-info.md'
      ],
      'git': [
        'MEMORY.md#GitHub Account',
        '.credentials-info.md',
        'workflow-analysis.md'
      ],
      'file_ops': [
        'TOOLS.md',
        'LESSONS.md#文件操作'
      ],
      'coding': [
        'LESSONS.md',
        'AGENTS.md#Working Principles'
      ]
    };
    
    hotTopics.forEach(({ topic }) => {
      if (topicMemoryMap[topic]) {
        paths.push(...topicMemoryMap[topic]);
      }
    });
    
    return [...new Set(paths)]; // 去重
  }
}

// ============= Smart Preload Engine =============

class SmartPreloadEngine {
  constructor() {
    this.tracker = new SessionHotspotTracker();
  }
  
  /**
   * 生成预加载指令 (给OpenClaw agent看的)
   */
  async generatePreloadInstructions(userMessage, options = {}) {
    const instructions = {
      tier1: [],    // 核心文件
      tier2: [],    // 语义搜索结果
      tier3: [],    // 热点追踪
      reasoning: [] // 解释为什么加载这些
    };
    
    // Tier 1: 核心文件
    instructions.tier1 = CONFIG.tier1.always;
    instructions.reasoning.push(
      '📌 Tier 1: Core identity files (SOUL, USER, AGENTS)'
    );
    
    // Tier 2: 语义搜索 (主要策略)
    instructions.reasoning.push(
      `🔍 Tier 2: Semantic search for "${userMessage.substring(0, 50)}..."`
    );
    instructions.reasoning.push(
      `   → Use memory_search({query: "${userMessage}", maxResults: ${CONFIG.tier2.semantic.maxResults}})`
    );
    instructions.tier2.push({
      action: 'memory_search',
      query: userMessage,
      maxResults: CONFIG.tier2.semantic.maxResults,
      minScore: CONFIG.tier2.semantic.minScore
    });
    
    // Tier 3: Session热点追踪
    this.tracker.update(userMessage);
    const hotPaths = this.tracker.getHotMemoryPaths();
    const hotTopics = this.tracker.getHotTopics();
    
    if (hotPaths.length > 0) {
      instructions.tier3 = hotPaths;
      instructions.reasoning.push(
        `🔥 Tier 3: Session hotspots detected`
      );
      hotTopics.forEach(({ topic, count, heat }) => {
        instructions.reasoning.push(
          `   • ${topic}: ${count} mentions, heat=${heat.toFixed(2)}`
        );
      });
    }
    
    return instructions;
  }
  
  /**
   * 生成可执行的加载命令
   */
  generateLoadCommands(instructions) {
    const commands = [];
    
    // Tier 1 files
    instructions.tier1.forEach(file => {
      commands.push(`read("${file}")`);
    });
    
    // Tier 2 semantic search
    if (instructions.tier2.length > 0) {
      const search = instructions.tier2[0];
      commands.push(
        `memory_search({query: "${search.query}", maxResults: ${search.maxResults}})`
      );
    }
    
    // Tier 3 hotspot files
    instructions.tier3.forEach(file => {
      // 处理带#的锚点
      if (file.includes('#')) {
        const [filepath, section] = file.split('#');
        commands.push(`read("${filepath}") // focus: ${section}`);
      } else {
        commands.push(`read("${file}")`);
      }
    });
    
    return commands;
  }
  
  /**
   * 打印预加载报告
   */
  printReport(instructions, commands) {
    console.log('🧠 Smart Preload Report\n');
    
    console.log('📋 Loading Strategy:');
    instructions.reasoning.forEach(line => {
      console.log(`  ${line}`);
    });
    
    console.log('\n🔧 Commands to Execute:');
    commands.forEach((cmd, i) => {
      console.log(`  ${i + 1}. ${cmd}`);
    });
    
    console.log('\n📊 Session Context:');
    const hotTopics = this.tracker.getHotTopics();
    if (hotTopics.length > 0) {
      hotTopics.forEach(({ topic, count, heat }) => {
        console.log(`  • ${topic}: ${count} mentions (heat: ${heat.toFixed(2)})`);
      });
    } else {
      console.log('  (no hot topics yet)');
    }
    
    console.log('');
  }
}

// ============= CLI Interface =============

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
🧠 Smart Preload - 智能预加载引擎

Usage:
  node smart-preload.js "<user-message>"     生成预加载指令
  node smart-preload.js status               显示session热点状态
  node smart-preload.js reset                重置session追踪

Strategy:
  Tier 1: 核心文件 (SOUL, USER, AGENTS) - 永远加载
  Tier 2: 语义搜索 (memory_search) - 主要策略
  Tier 3: Session热点追踪 - 维护对话连续性

Examples:
  node smart-preload.js "帮我查GitHub token什么时候过期"
  node smart-preload.js "我想swap一些ETH"
  node smart-preload.js status
`);
    return;
  }
  
  const engine = new SmartPreloadEngine();
  
  if (args[0] === 'status') {
    console.log('🔥 Session Hotspot Status\n');
    const hotTopics = engine.tracker.getHotTopics();
    
    if (hotTopics.length > 0) {
      console.log('Current Hot Topics:');
      hotTopics.forEach(({ topic, count, heat, lastSeen }) => {
        const ago = Math.floor((Date.now() - lastSeen) / 1000 / 60);
        console.log(`  🔥 ${topic.padEnd(15)} count=${count} heat=${heat.toFixed(2)} (${ago}m ago)`);
      });
      
      console.log('\nRecommended Memory Paths:');
      const paths = engine.tracker.getHotMemoryPaths();
      paths.forEach(p => console.log(`  • ${p}`));
    } else {
      console.log('No hot topics detected yet.');
    }
    
    console.log('\nRecent History:');
    engine.tracker.hotspots.history.slice(-5).forEach((entry, i) => {
      console.log(`  ${i + 1}. ${entry.message.substring(0, 60)}...`);
      if (entry.topics.length > 0) {
        console.log(`     topics: [${entry.topics.join(', ')}]`);
      }
    });
    return;
  }
  
  if (args[0] === 'reset') {
    if (fs.existsSync(SESSION_CACHE)) {
      fs.unlinkSync(SESSION_CACHE);
      console.log('✅ Session hotspot tracker reset');
    } else {
      console.log('⚠️  No session cache to reset');
    }
    return;
  }
  
  // 生成预加载指令
  const userMessage = args.join(' ');
  const instructions = await engine.generatePreloadInstructions(userMessage);
  const commands = engine.generateLoadCommands(instructions);
  
  engine.printReport(instructions, commands);
}

if (require.main === module) {
  main();
}

module.exports = { SmartPreloadEngine, SessionHotspotTracker };
