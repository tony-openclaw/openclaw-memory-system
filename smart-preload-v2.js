#!/usr/bin/env node
/**
 * Smart Preload v2.0 - Minimal Startup Edition
 * 
 * Philosophy (Boss guidance 2026-02-10):
 * - Memory不是无限的
 * - 该想的时候想，该忘的时候忘
 * - 轻装上阵，脑子清爽才能思考
 * 
 * Changes from v1.0:
 * - Tier 1: 只加载核心原则 (<3k tokens)
 * - Tier 2: Just-in-Time按需加载
 * - Tier 3: 用完就清理
 */

const fs = require('fs');
const path = require('path');

// ============================================
// Configuration
// ============================================

const WORKSPACE = process.env.HOME + '/.openclaw/workspace';
const HOTSPOT_FILE = path.join(WORKSPACE, '.session-hotspots.json');

// Tier 1: Core Principles (Minimal - always load)
const TIER1_FILES = {
    'SOUL.md': 'core_values',
    'USER.md': 'user_preferences',
    'AGENTS.md': 'core_checklist'
};

// Tier 2: Task-Specific (Just-in-Time - load on demand)
const TIER2_TOPICS = {
    'github': ['LESSONS.md#11', 'LESSONS.md#9', '.credentials-info.md'],
    'file_modification': ['LESSONS.md#12', 'AGENTS.md#checklist'],
    'defi': ['MEMORY.md#DeFi', '.tony-wallet-info.md'],
    'memory': ['MEMORY.md', 'memory-system-v2.md'],
    'model_router': ['model-router.js', 'MODEL-ROUTER-USAGE.md'],
    'security': ['LESSONS.md#security', 'USER.md#passphrase']
};

// ============================================
// Tier 1: Minimal Startup
// ============================================

function extractCorePrinciples() {
    console.log('📦 Tier 1: Core Principles (Minimal)\n');
    
    const principles = {};
    
    // SOUL.md核心
    principles.soul = [
        '深思熟虑，有根据地说话',
        '修复≠重写，不问=不做',
        '记录每次反馈到LESSONS.md'
    ];
    
    // USER.md核心
    principles.user = [
        'Boss偏好: 中文',
        '安全词: 绝对不显示',
        'Config修改: 必须先审批'
    ];
    
    // AGENTS.md核心
    principles.agents = [
        'STOP·SCOPE·FIX·VERIFY',
        'GitHub push: 强制安全审查',
        'Minimal Startup: 轻装上阵'
    ];
    
    Object.entries(principles).forEach(([key, items]) => {
        console.log(`  ${key.toUpperCase()}:`);
        items.forEach(item => console.log(`    - ${item}`));
    });
    
    console.log(`\n  Estimated: ~2k tokens\n`);
    return principles;
}

// ============================================
// Tier 2: Just-in-Time Loading
// ============================================

function analyzeTaskTopics(message) {
    console.log('🔍 Tier 2: Task Analysis (Just-in-Time)\n');
    
    const topics = [];
    const msg = message.toLowerCase();
    
    // 检测任务类型
    if (msg.match(/github|push|repo|commit/)) topics.push('github');
    if (msg.match(/修改|修复|fix|edit|change/)) topics.push('file_modification');
    if (msg.match(/swap|defi|uniswap|wallet/)) topics.push('defi');
    if (msg.match(/memory|记忆|preload/)) topics.push('memory');
    if (msg.match(/model.*router|路由|模型/)) topics.push('model_router');
    if (msg.match(/密码|安全|security|encrypt/)) topics.push('security');
    
    if (topics.length === 0) {
        console.log('  No specific topics detected');
        console.log('  → 保持轻量，需要时再查询\n');
        return [];
    }
    
    console.log('  Detected topics:');
    topics.forEach(topic => {
        console.log(`    - ${topic}`);
        const files = TIER2_TOPICS[topic] || [];
        files.forEach(f => console.log(`      → ${f}`));
    });
    
    console.log(`\n  Estimated: ~3-5k tokens\n`);
    return topics;
}

// ============================================
// Recommendations
// ============================================

function generateRecommendations(message) {
    // Tier 1: Always load
    const corePrinciples = extractCorePrinciples();
    
    // Tier 2: Just-in-Time
    const taskTopics = analyzeTaskTopics(message);
    
    console.log('📋 Recommendations:\n');
    console.log('1. Core Principles (已加载)');
    console.log('   → 核心原则always available\n');
    
    if (taskTopics.length > 0) {
        console.log('2. Task-Specific Memory (按需查询)');
        taskTopics.forEach(topic => {
            const files = TIER2_TOPICS[topic];
            console.log(`   → memory_search("${topic}")`);
            files.forEach(f => console.log(`     或 read("${f}")`));
        });
        console.log();
    }
    
    console.log('3. Session Context (自动管理)');
    console.log('   → OpenClaw自动维护\n');
    
    console.log('💡 Total Context: ~5-8k tokens (vs 30k+ in v1.0)\n');
    console.log('✨ 脑子清爽，准备执行任务\n');
}

// ============================================
// Main
// ============================================

if (process.argv.length < 3) {
    console.log('Usage: node smart-preload-v2.js "<user_message>"\n');
    console.log('v2.0 Philosophy:');
    console.log('  - Minimal Startup: 只加载核心原则');
    console.log('  - Just-in-Time: 按需查询相关memory');
    console.log('  - Cleanup: 用完就清理\n');
    process.exit(1);
}

const userMessage = process.argv[2];
console.log('='.repeat(60));
console.log('Smart Preload v2.0 - Minimal Startup Edition');
console.log('='.repeat(60));
console.log(`\nUser Message: "${userMessage}"\n`);
console.log('='.repeat(60));
console.log();

generateRecommendations(userMessage);
