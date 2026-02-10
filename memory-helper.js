#!/usr/bin/env node
/**
 * Memory Helper - OpenClaw轻量级内存管理工具
 * 
 * 基于MemOS设计原则，针对单用户场景优化
 * 依赖: OpenClaw memory_search + 文件系统
 * 
 * Usage:
 *   node memory-helper.js status              # 显示记忆系统状态
 *   node memory-helper.js search "query"      # 搜索记忆
 *   node memory-helper.js add "content"       # 添加到daily note
 *   node memory-helper.js review              # Review最近记忆
 *   node memory-helper.js compress            # 检查压缩潜力
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.HOME + '/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');

// ============= 工具函数 =============

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

function countTokens(text) {
  // 简单估算: 1 token ≈ 4 characters (英文+中文混合)
  return Math.ceil(text.length / 4);
}

function getFileSize(filepath) {
  try {
    const stats = fs.statSync(filepath);
    return stats.size;
  } catch (err) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// ============= 核心功能 =============

function status() {
  console.log('📊 OpenClaw Memory System Status\n');
  
  // 1. 核心文件状态
  console.log('🗂️  Core Files:');
  const coreFiles = [
    'MEMORY.md',
    'SOUL.md',
    'AGENTS.md',
    'TOOLS.md',
    'LESSONS.md',
    'USER.md'
  ];
  
  let totalTokens = 0;
  let totalSize = 0;
  
  coreFiles.forEach(file => {
    const filepath = path.join(WORKSPACE, file);
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf-8');
      const tokens = countTokens(content);
      const size = getFileSize(filepath);
      totalTokens += tokens;
      totalSize += size;
      console.log(`  ✓ ${file.padEnd(15)} ${tokens.toLocaleString().padStart(6)} tokens  ${formatBytes(size)}`);
    } else {
      console.log(`  ✗ ${file.padEnd(15)} (not found)`);
    }
  });
  
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  ${'Total'.padEnd(15)} ${totalTokens.toLocaleString().padStart(6)} tokens  ${formatBytes(totalSize)}\n`);
  
  // 2. Daily notes状态
  console.log('📅 Daily Notes:');
  if (fs.existsSync(MEMORY_DIR)) {
    const files = fs.readdirSync(MEMORY_DIR)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .sort()
      .reverse()
      .slice(0, 7); // 最近7天
    
    let dailyTokens = 0;
    files.forEach(file => {
      const filepath = path.join(MEMORY_DIR, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const tokens = countTokens(content);
      dailyTokens += tokens;
      const isToday = file === `${getTodayDate()}.md`;
      const marker = isToday ? '📍' : '  ';
      console.log(`  ${marker} ${file}  ${tokens.toLocaleString().padStart(6)} tokens`);
    });
    console.log(`  ${'─'.repeat(50)}`);
    console.log(`  ${'Recent 7 days'.padEnd(15)} ${dailyTokens.toLocaleString().padStart(6)} tokens\n`);
  } else {
    console.log('  ⚠️  memory/ directory not found\n');
  }
  
  // 3. Compression状态
  console.log('🗜️  Compression:');
  const codebookPath = path.join(MEMORY_DIR, '.codebook.json');
  if (fs.existsSync(codebookPath)) {
    const codebook = JSON.parse(fs.readFileSync(codebookPath, 'utf-8'));
    const dictSize = Object.keys(codebook).length;
    console.log(`  ✓ Codebook active (${dictSize} entries)`);
    
    // 检查observations
    const obsDir = path.join(MEMORY_DIR, 'observations');
    if (fs.existsSync(obsDir)) {
      const obsFiles = fs.readdirSync(obsDir);
      console.log(`  ✓ Observations: ${obsFiles.length} compressed sessions`);
    }
  } else {
    console.log('  ⚠️  No compression data (run compress command)');
  }
  
  console.log('\n📈 Total Memory Footprint: ' + (totalTokens + 0).toLocaleString() + ' tokens\n');
}

function search(query) {
  console.log(`🔍 Searching memory for: "${query}"\n`);
  
  // 方法1: 使用grep快速搜索
  console.log('📄 File Matches:');
  try {
    const grepCmd = `cd ${WORKSPACE} && grep -r -i -n --include="*.md" "${query}" . 2>/dev/null | head -20`;
    const results = execSync(grepCmd, { encoding: 'utf-8' });
    
    if (results.trim()) {
      const lines = results.trim().split('\n');
      lines.forEach(line => {
        const [filepath, lineNum, ...content] = line.split(':');
        const cleanPath = filepath.replace('./', '');
        console.log(`  ${cleanPath}:${lineNum}`);
        console.log(`    ${content.join(':').trim().substring(0, 80)}...`);
      });
    } else {
      console.log('  No matches found');
    }
  } catch (err) {
    console.log('  (grep search failed)');
  }
  
  console.log('\n💡 Tip: Use memory_search tool in OpenClaw for semantic search');
  console.log('   Example: memory_search({query: "' + query + '", maxResults: 10})');
}

function add(content, type = 'daily') {
  const today = getTodayDate();
  const timestamp = getTimestamp();
  
  if (type === 'daily') {
    const dailyFile = path.join(MEMORY_DIR, `${today}.md`);
    
    // 确保memory目录存在
    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }
    
    // 创建或追加
    const entry = `\n## ${timestamp}\n${content}\n`;
    
    if (!fs.existsSync(dailyFile)) {
      fs.writeFileSync(dailyFile, `# Daily Notes - ${today}\n${entry}`);
      console.log(`✅ Created new daily note: ${today}.md`);
    } else {
      fs.appendFileSync(dailyFile, entry);
      console.log(`✅ Added to daily note: ${today}.md`);
    }
    
    console.log(`📝 Content: ${content.substring(0, 60)}...`);
  }
}

function review() {
  console.log('📖 Reviewing Recent Memory\n');
  
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  
  // 读取今天和昨天的notes
  console.log('📅 Today (' + today + '):');
  const todayFile = path.join(MEMORY_DIR, `${today}.md`);
  if (fs.existsSync(todayFile)) {
    const content = fs.readFileSync(todayFile, 'utf-8');
    const sections = content.split('##').filter(s => s.trim());
    console.log(`  ${sections.length - 1} entries`);
    sections.slice(-3).forEach(section => {
      const lines = section.trim().split('\n');
      console.log(`  • ${lines[0]}`);
    });
  } else {
    console.log('  (no entries yet)');
  }
  
  console.log('\n📅 Yesterday (' + yesterday + '):');
  const yesterdayFile = path.join(MEMORY_DIR, `${yesterday}.md`);
  if (fs.existsSync(yesterdayFile)) {
    const content = fs.readFileSync(yesterdayFile, 'utf-8');
    const sections = content.split('##').filter(s => s.trim());
    console.log(`  ${sections.length - 1} entries`);
  } else {
    console.log('  (no file)');
  }
  
  console.log('\n💡 Suggestions:');
  console.log('  1. Review if any important info should be added to MEMORY.md');
  console.log('  2. Extract lessons learned to LESSONS.md');
  console.log('  3. Update TOOLS.md with new tool discoveries');
}

function compress() {
  console.log('🗜️  Checking Compression Potential\n');
  
  const compressorScript = path.join(
    process.env.HOME,
    '.local/share/openclaw-skills/openclaw-token-compressor/scripts/mem_compress.py'
  );
  
  if (!fs.existsSync(compressorScript)) {
    console.log('⚠️  openclaw-token-compressor not installed');
    console.log('   Install: Clone to ~/.local/share/openclaw-skills/');
    return;
  }
  
  console.log('Running benchmark...');
  try {
    const cmd = `python3 "${compressorScript}" "${WORKSPACE}" benchmark`;
    const output = execSync(cmd, { encoding: 'utf-8' });
    console.log(output);
    
    console.log('\n💡 To apply compression:');
    console.log(`   python3 "${compressorScript}" "${WORKSPACE}" full`);
  } catch (err) {
    console.log('❌ Compression check failed:', err.message);
  }
}

// ============= CLI Interface =============

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help' || command === '--help') {
    console.log(`
📚 Memory Helper - OpenClaw轻量级内存管理工具

Usage:
  node memory-helper.js <command> [options]

Commands:
  status              显示记忆系统状态 (文件大小、token数)
  search <query>      搜索记忆 (grep + 提示使用memory_search)
  add <content>       添加内容到今日memo
  review              Review最近的记忆 (今天+昨天)
  compress            检查token压缩潜力

Examples:
  node memory-helper.js status
  node memory-helper.js search "GitHub配置"
  node memory-helper.js add "完成Model Router实现"
  node memory-helper.js review
  node memory-helper.js compress

Architecture:
  Context Memory   → MEMORY.md (长期事实)
  Daily Memory     → memory/YYYY-MM-DD.md (中期日志)
  Session Memory   → session transcripts (短期对话)
  Skill Memory     → AGENTS.md, TOOLS.md, LESSONS.md (工作流程)

See: OPENCLAW-MEMORY-SYSTEM.md for full design
`);
    return;
  }
  
  switch (command) {
    case 'status':
      status();
      break;
    
    case 'search':
      if (!args[1]) {
        console.error('❌ Error: search requires a query');
        console.log('   Usage: node memory-helper.js search "your query"');
        process.exit(1);
      }
      search(args[1]);
      break;
    
    case 'add':
      if (!args[1]) {
        console.error('❌ Error: add requires content');
        console.log('   Usage: node memory-helper.js add "your content"');
        process.exit(1);
      }
      add(args[1]);
      break;
    
    case 'review':
      review();
      break;
    
    case 'compress':
      compress();
      break;
    
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('   Run "node memory-helper.js help" for usage');
      process.exit(1);
  }
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { status, search, add, review, compress };
