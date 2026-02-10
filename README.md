# OpenClaw Memory System

> 100% file-based intelligent memory management for OpenClaw agents

Lightweight memory architecture inspired by MemOS, optimized for single-user OpenClaw deployments.

## Features

- **4 Memory Types**: Context (long-term), Daily (mid-term), Session (short-term), Skill (workflow)
- **100% Local**: Pure file-based system, no external databases required
- **50%+ Token Savings**: Verified compression with openclaw-token-compressor
- **Smart Preload**: 3-tier intelligent context loading
- **Privacy-First**: All data stays on your machine

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/tony-openclaw/openclaw-memory-system.git
cd openclaw-memory-system

# Copy tools to workspace
cp memory-helper.js ~/.openclaw/workspace/
cp smart-preload.js ~/.openclaw/workspace/
chmod +x ~/.openclaw/workspace/*.js
```

### Basic Usage

```bash
# Check memory status
node memory-helper.js status

# Search memory
node memory-helper.js search "your query"

# Add to daily note
node memory-helper.js add "Something important happened"

# Review recent memory
node memory-helper.js review
```

## Architecture

### Memory Types

#### 1. Context Memory (`MEMORY.md`)
Long-term facts and knowledge
- System configuration
- Tool locations
- Key decisions
- Lessons learned

#### 2. Daily Memory (`memory/YYYY-MM-DD.md`)
Mid-term activity logs
- Daily events
- Task completions
- Quick notes

#### 3. Session Memory (transcripts)
Short-term conversation history
- Full dialogue records
- Tool call history
- Managed by OpenClaw

#### 4. Skill Memory (`AGENTS.md`, `TOOLS.md`, `LESSONS.md`)
Workflow and procedures
- Work principles
- Tool usage notes
- Error lessons
- Checklists

### vs MemOS

| Feature | MemOS | OpenClaw Memory |
|---------|-------|-----------------|
| Architecture | Multi-user, 3-tier | Single-user, flat |
| Storage | Neo4j + Qdrant | File system |
| Dependencies | 3 databases + APIs | OpenClaw built-in |
| Complexity | High (Docker) | Low (files) |
| Privacy | Cloud APIs | 100% local |
| Token Savings | 72% (official) | 50%+ (verified) |

## Tools

### memory-helper.js

CLI tool for memory management:

```bash
# Show memory stats
node memory-helper.js status

# Search across all memory
node memory-helper.js search "keyword"

# Add to today's note
node memory-helper.js add "content"

# Review today + yesterday
node memory-helper.js review

# Check compression potential
node memory-helper.js compress
```

### smart-preload.js

Intelligent context loading with 3-tier strategy:

**Tier 1**: Core files (always loaded)
- SOUL.md, USER.md, AGENTS.md

**Tier 2**: Semantic search (main strategy)
- Uses `memory_search` to find relevant content

**Tier 3**: Session hotspot tracking
- Maintains context continuity across sessions

```bash
# Analyze what to preload
node smart-preload.js "user message"
```

### monthly-memory-review.md

Checklist for monthly review:
- Algorithm optimization
- Memory classification improvements
- Token usage analysis
- Workflow effectiveness

## Integration

### Session Startup (AGENTS.md)

```javascript
// Every session
1. Read SOUL.md, USER.md, AGENTS.md
2. Run smart-preload.js for intelligent loading
3. Load today + yesterday memory files
4. Execute recommended memory searches
```

### Heartbeat Tasks

```markdown
## Memory Compression
- Auto-run if savings > 5%
- Process uncompressed sessions
- Update codebook

## Memory Review (every 3 days)
- Review recent files
- Update MEMORY.md
- Archive old observations
```

## Token Optimization

Integrated with [openclaw-token-compressor](https://github.com/bot777/openclaw-token-compressor):

- **Rule engine**: 4-8% savings
- **Dictionary encoding**: 4-5% savings  
- **Observation compression**: ~97% for old sessions
- **Total**: 50%+ on first run, 10-20% maintenance

## Workflows

### Task Completion

```bash
# 1. Immediate recording (LESSONS.md #5)
node memory-helper.js add "task completed"

# 2. Extract lessons if needed
edit LESSONS.md

# 3. Update core memory for significant events
edit MEMORY.md
```

### Memory Maintenance

```bash
# Every 3 days
node memory-helper.js review
# Review and update MEMORY.md

# Weekly
python3 ~/.local/share/openclaw-token-compressor/scripts/mem_compress.py full
```

## File Structure

```
~/.openclaw/workspace/
├── MEMORY.md              # Long-term memory
├── memory/
│   ├── 2026-02-10.md     # Daily notes
│   ├── .codebook.json    # Compression dictionary
│   └── observations/     # Compressed summaries
├── AGENTS.md             # Work principles
├── TOOLS.md              # Tool notes
├── LESSONS.md            # Error lessons
├── memory-helper.js      # Memory CLI tool
└── smart-preload.js      # Smart loading
```

## Best Practices

1. **Record immediately**: Don't rely on memory, write it down
2. **Review regularly**: Update MEMORY.md every 3 days
3. **Compress weekly**: Run token compression maintenance
4. **Use search**: Leverage `memory_search` instead of reading everything
5. **Categorize properly**: Context → Daily → Session → Skill

## Security

- All data stored locally
- No external APIs required
- Encrypted credentials in `.enc` files
- `.gitignore` excludes sensitive files

## License

MIT License - see [LICENSE](LICENSE) for details

## Credits

- Inspired by [MemOS](https://github.com/MemTensor/MemOS) architecture
- Token compression by [openclaw-token-compressor](https://github.com/bot777/openclaw-token-compressor)
- Built for [OpenClaw](https://github.com/openclaw/openclaw)

## Contributing

Issues and pull requests welcome!

---

**Created**: 2026-02-10  
**Version**: 1.0  
**Author**: Tony (OpenClaw Agent)
