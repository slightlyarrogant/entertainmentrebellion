# Decision Registry: Entertainment Discovery Rebellion

## Critical Context
_The 3-5 most important decisions that shape the current direction:_
- **Strategic Track Selection**: Open Challenge chosen over specific tracks for maximum creative freedom and competitive differentiation
- **Technical Architecture**: MCP server with memory nodes vs web application - leverages existing infrastructure for sophisticated AI demonstration
- **Problem Scope**: Subscription-aware entertainment discovery vs broader content creation - addresses real user frustration with practical solution
- **Implementation Strategy**: Leverage existing memory MCP server rather than building custom infrastructure - focus development time on entertainment logic

## Project ID: EDR-001
**Last Updated:** 2025-07-02  
**Version:** 2.0

## Decision Log

| ID | Date | Category | Decision | Context | Alternatives Considered | Rationale | Impact | Status |
|----|------|----------|----------|---------|------------------------|-----------|--------|--------|
| DEC-001 | 2025-06-18 | Strategic | Open Challenge track selection | 833 participants, multiple tracks available | Creative Track (viral videos), Technical Track (automation tools) | Maximum creative freedom, leverages research infrastructure advantage, meta-system approach vs point solutions | Allows sophisticated solution addressing root problem vs symptoms | ACTIVE |
| DEC-002 | 2025-06-18 | Technical | MCP server architecture vs web application | Need technical differentiation, sophisticated AI demonstration | Web app (standard approach), API service, desktop application | 99% of participants will build web apps, MCP shows cutting-edge AI architecture understanding | Major competitive advantage through conversational AI interface | ACTIVE |
| DEC-003 | 2025-06-18 | Technical | Leverage existing memory MCP server | Need persistent context, complex subscription relationships | Build custom memory system, use database, simple JSON storage | Existing system proven and working, eliminates infrastructure development time | Focus 80% time on entertainment logic vs 20% on infrastructure | ACTIVE |
| DEC-004 | 2025-06-18 | Scope | Subscription-aware discovery focus | Entertainment choice paralysis problem | Content generation tools, social media automation, recommendation algorithms | Addresses real frustration (40,000+ daily choices), subscription reality ignored by existing systems | Practical problem solving with immediate user value demonstration | ACTIVE |
| DEC-005 | 2025-06-18 | Technical | Memory nodes for subscription complexity | Real-world contexts: shared Netflix, family HBO Max, etc. | Simple user profiles, static subscription lists, form-based preferences | Captures messiness of real entertainment consumption, enables sophisticated context intelligence | Natural conversation updates vs form filling, persistent learning across sessions | ACTIVE |
| DEC-006 | 2025-06-18 | Strategic | Research infrastructure utilization | Competitive advantage through preparation | Start from zero like other participants, use only provided resources | Synapse AI, Brave Search, viral psychology research already complete | Massive head start on content strategy and technical sophistication | ACTIVE |
| DEC-007 | 2025-06-20 | Technical | Local memory storage for development | Need persistent memory during development without external dependencies | Redis, PostgreSQL, MongoDB | Simplified development with global.memoryStorage, no external services needed | Faster development cycles, easier debugging | ACTIVE |
| DEC-008 | 2025-06-21 | Technical | Mock data fallback strategy | API rate limits and availability concerns | Only use live APIs, cache all responses, use different APIs | Ensures demo reliability even if APIs fail or hit limits | Guaranteed demo functionality regardless of external factors | ACTIVE |
| DEC-009 | 2025-06-25 | Feature | Adventure assessment service addition | Need to prevent recommendation echo chambers | Simple genre rotation, random suggestions, user-selected adventure level | Sophisticated assessment based on context, mood, and history | Better user engagement through intelligent content stretching | ACTIVE |
| DEC-010 | 2025-06-26 | Feature | Visual artifact generation | Text recommendations less engaging than visual | Simple text list, external web UI, basic HTML table | Rich HTML cards with posters, streaming links, and adventure indicators | Compelling visual demonstration of recommendations | ACTIVE |
| DEC-011 | 2025-06-27 | Technical | Enhanced prompt system with tool enforcement | Claude using general knowledge instead of tools | Trust Claude's knowledge, manual tool invocation, simple prompts | Prompts explicitly enforce tool usage and memory checking | Ensures consistent behavior using real data not assumptions | ACTIVE |
| DEC-012 | 2025-06-27 | Technical | Memory visualization tools | Complex memory relationships difficult to debug | Console logging, manual inspection, no visualization | Interactive HTML visualization and analysis scripts | Easier debugging and understanding of memory patterns | ACTIVE |

## Decision Categories
- **Strategic**: Decisions affecting overall project direction or scope
- **Technical**: Technology choices, architecture, patterns
- **Process**: How work is performed or managed
- **Resource**: Allocation of time, effort, or materials
- **External**: Decisions related to third parties or dependencies

## Recently Revisited Decisions
_Decisions that have been recently discussed or may need reconsideration._

| ID | Revisit Date | Outcome | Notes |
|----|--------------|---------|-------|
| DEC-003 | 2025-06-18 | CONFIRMED | User insight about existing memory server eliminated over-engineering concerns |

## Pending Decisions
_Important decisions that need to be made soon._

| Topic | Options | Required By | Blocking | Notes |
|-------|---------|-------------|----------|-------|
| Submission Format | Video demo vs live demo vs documentation package | July 3 | Final submission | Check hackathon submission requirements |
| Production Deployment | Deploy to cloud vs local demo only | July 3 | Submission package | Consider judges' testing needs |

## Resolved Decisions (Previously Pending)

| Topic | Decision | Resolution Date | Outcome |
|-------|----------|-----------------|---------|
| API Strategy | Watchmode + TMDB with mock fallback | June 19 | Implemented successfully with DEC-008 |
| Demo Scenario | Three scenarios: stressed solo, date night, family weekend | June 21 | Comprehensive demo coverage achieved |
| Subscription Scope | Major platforms with extensible system | June 20 | Balanced approach implemented |
| Manifest Integration | Embedded in conversational interface | June 22 | Natural integration achieved |

## Decision-Making Process
_How decisions are evaluated and made for this project._

1. **Identification**: Apply Project Constitution principles - needs vs wants analysis
2. **Analysis**: Competitive advantage assessment, technical feasibility, timeline impact
3. **Consultation**: Bogdan provides domain expertise, Claude provides technical and strategic analysis
4. **Documentation**: All significant decisions recorded in this registry with rationale
5. **Review**: Regular assessment against Project Constitution guidelines and hackathon objectives

## Key Decision Principles Applied
_From Project Constitution framework:_

- **Needs vs Wants**: Chose practical subscription intelligence over perfect recommendation algorithms
- **Technical Expertise**: Leveraged existing memory infrastructure vs building from scratch
- **Collaborative Direction Setting**: Open Challenge selection challenged typical track-following approach
- **Knowledge Utilization**: Applied research infrastructure and viral psychology insights
- **Shared Success Model**: Prioritized winning competition through genuine innovation vs following guidelines

---

This registry serves as the authoritative record of significant decisions that shape the project. It prevents revisiting settled questions while providing context for why choices were made, with Project Constitution principles guiding the decision-making process.
