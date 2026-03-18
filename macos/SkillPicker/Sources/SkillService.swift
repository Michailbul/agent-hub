import Foundation

@MainActor
final class SkillService: Sendable {
    static let shared = SkillService()
    private let serverURL = URL(string: "http://localhost:4001/api/skills/index")!
    private let cacheURL: URL = {
        let home = FileManager.default.homeDirectoryForCurrentUser
        return home.appendingPathComponent(".claude/skill-picker-cache.json")
    }()
    private var lastFetchDate: Date?
    private let staleDuration: TimeInterval = 300 // 5 minutes

    /// All departments seen in the current skill set
    private(set) var departments: [String] = []

    private init() {}

    var isStale: Bool {
        guard let last = lastFetchDate else { return true }
        return Date().timeIntervalSince(last) > staleDuration
    }

    func fetchSkills() async -> [Skill] {
        if let skills = await fetchFromServer() {
            lastFetchDate = Date()
            updateDepartments(from: skills)
            saveCache(skills)
            return skills
        }
        if let skills = loadCache() {
            updateDepartments(from: skills)
            return skills
        }
        return []
    }

    // MARK: - Star sync (reads/writes same file as agent-hub web client)

    private var starConfigURL: URL {
        let home = FileManager.default.homeDirectoryForCurrentUser
        return home.appendingPathComponent(".openclaw/agent-hub/starred-skills.config.json")
    }

    func toggleStar(skillId: String, skills: inout [Skill]) {
        var config = loadStarConfig()
        if config.starred.contains(skillId) {
            config.starred.removeAll { $0 == skillId }
            config.starredAt.removeValue(forKey: skillId)
        } else {
            config.starred.append(skillId)
            config.starredAt[skillId] = ISO8601DateFormatter().string(from: Date())
        }
        saveStarConfig(config)

        // Update in-memory skills
        let starredSet = Set(config.starred)
        skills = skills.map { skill in
            Skill(
                id: skill.id, name: skill.name, description: skill.description,
                department: skill.department, originCategory: skill.originCategory,
                author: skill.author, sourceLabels: skill.sourceLabels,
                ecosystems: skill.ecosystems,
                isStarred: starredSet.contains(skill.id),
                isCustom: skill.isCustom, addedAt: skill.addedAt,
                searchIndex: skill.searchIndex
            )
        }
    }

    private struct StarConfig: Codable {
        var starred: [String]
        var starredAt: [String: String]
    }

    private func loadStarConfig() -> StarConfig {
        guard let data = try? Data(contentsOf: starConfigURL),
              let config = try? JSONDecoder().decode(StarConfig.self, from: data) else {
            return StarConfig(starred: [], starredAt: [:])
        }
        return config
    }

    private func saveStarConfig(_ config: StarConfig) {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            let data = try encoder.encode(config)
            try data.write(to: starConfigURL, options: .atomic)
        } catch {}
    }

    // MARK: - Server fetch

    private func fetchFromServer() async -> [Skill]? {
        do {
            var request = URLRequest(url: serverURL)
            request.timeoutInterval = 5
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                return nil
            }
            let decoded = try JSONDecoder().decode(SkillsIndexData.self, from: data)
            let starredSet = Set(decoded.starredSkillIds ?? [])
            return decoded.skills.map {
                Skill.from(indexSkill: $0, starredIds: starredSet,
                          sources: decoded.sources, agents: decoded.agents)
            }
        } catch {
            print("Server fetch failed: \(error)")
            return nil
        }
    }

    // MARK: - Disk cache

    private func saveCache(_ skills: [Skill]) {
        do {
            let data = try JSONEncoder().encode(skills)
            let dir = cacheURL.deletingLastPathComponent()
            try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
            try data.write(to: cacheURL, options: .atomic)
        } catch {}
    }

    private func loadCache() -> [Skill]? {
        guard let data = try? Data(contentsOf: cacheURL) else { return nil }
        return try? JSONDecoder().decode([Skill].self, from: data)
    }

    // MARK: - Department extraction

    private func updateDepartments(from skills: [Skill]) {
        var depts = Set<String>()
        for skill in skills { depts.insert(skill.department) }
        departments = depts.sorted()
    }
}
