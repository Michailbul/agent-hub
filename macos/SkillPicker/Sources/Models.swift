import Foundation

// MARK: - Full API Response (matches /api/skills/index from agent-hub)
// All fields that might be absent from the server are optional with defaults

struct SkillsIndexData: Sendable, Decodable {
    let sources: [SkillsIndexSource]
    let agents: [SkillsIndexAgent]
    let skills: [SkillsIndexSkill]
    let starredSkillIds: [String]?
}

struct SkillsIndexSource: Sendable, Decodable {
    let id: String
    let label: String
    let ecosystem: String
    let root: String
    let kind: String
    let isMaster: Bool?
}

struct SkillsIndexAgent: Sendable, Decodable {
    let id: String
    let label: String
    let emoji: String?
    let role: String?
    let skillsRoot: String?
}

struct SkillsIndexSkill: Sendable, Decodable {
    let id: String
    let name: String
    let summary: String
    let variants: [SkillsIndexVariant]
    let installedAgentIds: [String]?
    let missingAgentIds: [String]?
    let isInMaster: Bool?
    let addedAt: String?
    let addedVia: String?
    let isCustom: Bool?
    let originCategory: String?
    let grouping: SkillGrouping?
}

struct SkillGrouping: Sendable, Decodable {
    let purpose: String?
    let department: String?
    let confidence: Double?
    let source: String?
}

struct SkillsIndexVariant: Sendable, Decodable {
    let sourceId: String?
    let sourceLabel: String?
    let ecosystem: String?
    let kind: String?
    let path: String?
    let label: String?
    let directoryName: String?
    let frontmatter: SkillFrontmatter?
    let summary: String?
    let sourceRank: Int?
    let folder: String?
    let isSymlink: Bool?
}

struct SkillFrontmatter: Sendable, Decodable {
    let name: String?
    let author: String?
    let source: String?
    let description: String?
    let license: String?
    let department: String?
}

// MARK: - App Model (unified, matches web client's UnifiedSkill shape)

struct Skill: Identifiable, Codable, Sendable {
    let id: String
    let name: String
    let description: String
    let department: String
    let originCategory: String
    let author: String?
    let sourceLabels: [String]
    let ecosystems: [String]
    let isStarred: Bool
    let isCustom: Bool
    let addedAt: String?

    /// Pre-built search index (matches web client's buildSkillSearchIndex)
    let searchIndex: String

    static func from(
        indexSkill: SkillsIndexSkill,
        starredIds: Set<String>,
        sources: [SkillsIndexSource],
        agents: [SkillsIndexAgent]
    ) -> Skill {
        let desc = indexSkill.variants.first?.frontmatter?.description ?? indexSkill.summary
        let author = indexSkill.variants.first?.frontmatter?.author
        let department = indexSkill.grouping?.department ?? "Uncategorized"

        let sourceLabels = indexSkill.variants.compactMap { $0.sourceLabel }
        let ecosystems = Array(Set(indexSkill.variants.compactMap { $0.ecosystem }))

        // Build search index matching web client logic
        let installedAgentTokens = (indexSkill.installedAgentIds ?? []).compactMap { agentId in
            agents.first(where: { $0.id == agentId })
        }.flatMap { [$0.label, $0.role ?? ""] }

        let relatedSourceTokens = sources
            .filter { source in indexSkill.variants.contains(where: { $0.sourceId == source.id }) }
            .map { "\($0.label) \($0.ecosystem)" }

        let variantTokens = indexSkill.variants.flatMap { variant -> [String] in
            [variant.sourceLabel ?? "", variant.ecosystem ?? "", variant.kind ?? "",
             String(variant.path?.split(separator: "/").last ?? "")]
        }

        let searchParts: [String?] = [
            indexSkill.name,
            desc,
            department,
            author,
            indexSkill.variants.first?.frontmatter?.source,
            indexSkill.variants.first?.frontmatter?.license,
        ]

        let searchIndex = (
            searchParts.compactMap { $0 } +
            relatedSourceTokens +
            variantTokens +
            installedAgentTokens
        ).joined(separator: " ").lowercased()

        return Skill(
            id: indexSkill.id,
            name: indexSkill.name,
            description: desc,
            department: department,
            originCategory: indexSkill.originCategory ?? "built-in",
            author: author,
            sourceLabels: sourceLabels,
            ecosystems: ecosystems,
            isStarred: starredIds.contains(indexSkill.id),
            isCustom: indexSkill.isCustom ?? false,
            addedAt: indexSkill.addedAt,
            searchIndex: searchIndex
        )
    }
}
