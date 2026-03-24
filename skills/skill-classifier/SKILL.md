---
name: Skill Classifier
description: Reads all skills from Agent Hub and produces rich semantic classifications (department, tags, use-cases, summary) using Claude as the classification engine. Writes results to a persistent JSON file that the server merges into the skills index.
department: Operations
author: laniameda
---

# Skill Classifier

You are a skill classification agent. Your job is to read every skill in the Agent Hub skills index, analyze each one, and produce a rich semantic classification for each skill. The output is a JSON file that the Agent Hub server reads to enrich the skills index with agent-generated metadata.

## Workflow

### 1. Read the existing classification index (delta mode)

First, check if a classification file already exists:

```bash
cat ~/.openclaw/agent-hub/skill-classifications.json 2>/dev/null
```

If it exists, parse the JSON. You'll use the `contentHash` field on each skill to skip re-classifying unchanged skills.

### 2. Fetch the skills index

```bash
curl -s http://localhost:4001/api/skills/index
```

This returns JSON with a `skills` array. Each skill has:
- `id` — unique skill identifier
- `name` — display name
- `summary` — brief description
- `variants` — array with `path` to SKILL.md files

### 3. Read each skill's content

For each skill, read its SKILL.md content:

```bash
curl -s "http://localhost:4001/api/file?path=<variant.path>"
```

Compute a content hash (SHA-256) of the returned content. If the existing classification index has a matching `contentHash` for this skill ID, **skip it** — the classification is still valid.

### 4. Classify skills in batches

Process 15-20 skills per batch. For each skill, produce:

```json
{
  "department": "<one of the departments below>",
  "tags": ["tag1", "tag2", "tag3"],
  "useCases": ["One sentence describing a use case"],
  "summary": "One-line agent-generated summary of what this skill does",
  "source": "agent",
  "classifiedAt": "<ISO 8601 timestamp>",
  "contentHash": "<SHA-256 of the SKILL.md content>"
}
```

#### Departments

Choose exactly ONE department per skill:

- **Engineering** — Code generation, frameworks, APIs, DevOps, testing, debugging
- **Design** — UI/UX design, visual design, prototyping, design systems, Figma
- **Marketing** — Marketing strategy, ads, SEO, growth, campaigns, analytics
- **Content** — Copywriting, content strategy, social media, email sequences, editing
- **Sales** — Sales processes, outreach, pricing, proposals, CRM
- **Operations** — Workflow automation, project management, scheduling, CI/CD
- **Research** — Web research, data extraction, analysis, knowledge management
- **Product** — Product management, requirements, user research, feature planning
- **Data** — Database design, data modeling, schemas, migrations, enrichment
- **AI/ML** — AI agents, LLM integration, embeddings, prompt engineering, AI SDK

#### Tags

Use 2-5 lowercase hyphenated tags per skill. Draw from this seed vocabulary but you may introduce new tags when appropriate:

`frontend`, `backend`, `full-stack`, `react`, `typescript`, `node`, `api`, `rest`, `graphql`, `database`, `sql`, `nosql`, `testing`, `e2e`, `unit-test`, `ci-cd`, `devops`, `docker`, `aws`, `deployment`, `performance`, `security`, `authentication`, `ui-design`, `ux-design`, `figma`, `design-system`, `responsive`, `animation`, `accessibility`, `seo`, `content-writing`, `copywriting`, `email`, `social-media`, `advertising`, `analytics`, `conversion`, `landing-page`, `branding`, `marketing-strategy`, `sales-outreach`, `pricing`, `crm`, `automation`, `workflow`, `project-management`, `documentation`, `code-review`, `refactoring`, `web-scraping`, `data-extraction`, `research`, `ai-agent`, `llm`, `embeddings`, `prompt-engineering`, `rag`, `streaming`, `tool-use`, `mcp`, `plugin`, `mobile`, `ios`, `android`, `react-native`, `expo`, `convex`, `next-js`, `svelte`, `vue`, `tailwind`, `css`, `html`, `svg`, `canvas`, `video`, `image-generation`, `diagram`, `presentation`, `portfolio`, `ecommerce`

#### Use Cases

List 1-3 concrete use cases as short sentences. These should describe real scenarios where someone would invoke this skill.

#### Summary

Write a single clear sentence (under 120 chars) that captures the skill's core purpose. Avoid marketing language — be precise and technical.

### 5. Write the classification file

Write the complete classification index to:

```
~/.openclaw/agent-hub/skill-classifications.json
```

The file format:

```json
{
  "version": 1,
  "classifiedAt": "<ISO 8601 timestamp>",
  "skills": {
    "<skill-id>": {
      "department": "Engineering",
      "tags": ["react", "typescript", "frontend"],
      "useCases": ["Build type-safe React components with modern patterns"],
      "summary": "React + TypeScript component patterns and best practices",
      "source": "agent",
      "classifiedAt": "2024-01-15T10:30:00Z",
      "contentHash": "abc123..."
    }
  }
}
```

When merging with existing classifications, preserve unchanged entries (matching contentHash) and only update/add entries for skills that were newly classified.

### 6. Refresh the server cache

After writing the file, tell the server to reload:

```bash
curl -s -X POST http://localhost:4001/api/refresh
```

This invalidates the skills index cache so the next load picks up your classifications.

## Important Notes

- The server at `localhost:4001` must be running (start with `npm run dev` in the agent-hub repo)
- If auth is enabled, you may need to pass a cookie. For local dev, auth is typically disabled.
- Process ALL skills, not just a sample. The classifier should be comprehensive.
- Be accurate — the department assignment directly affects how skills appear in the Skills Lab sidebar.
- When in doubt about department, prefer the most specific match over generic ones (e.g., "AI/ML" over "Engineering" for an AI agent skill).
- Tags should be genuinely descriptive, not stuffed. 2-3 precise tags beats 5 vague ones.
- For the content hash, use the full SKILL.md content as-is (before any parsing). A simple way: `echo -n "<content>" | shasum -a 256 | cut -d' ' -f1`
