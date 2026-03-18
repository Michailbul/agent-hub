import Foundation

/// Matches the web client's filtering logic from skillsLab.ts:
/// - All search terms must match (AND logic)
/// - Searches across pre-built search index (name, description, department, author, source labels, ecosystems, agent labels)
/// - Results sorted: starred first, then name prefix match, then name contains, then alphabetical
enum FuzzyMatcher {

    static func filter(
        _ skills: [Skill],
        query: String,
        departments: Set<String> = [],
        starredOnly: Bool = false
    ) -> [Skill] {
        var result = skills

        // Department filter (OR logic, matching web client)
        if !departments.isEmpty {
            result = result.filter { departments.contains($0.department) }
        }

        // Starred filter
        if starredOnly {
            result = result.filter { $0.isStarred }
        }

        // Text search (AND logic on all terms, matching web client)
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty {
            let terms = trimmed.lowercased().split(separator: " ").map(String.init)
            result = result.filter { skill in
                terms.allSatisfy { skill.searchIndex.contains($0) }
            }
        }

        // Sort: starred first, then name prefix, then name contains, then alphabetical
        return result.sorted { a, b in
            let aName = a.name.lowercased()
            let bName = b.name.lowercased()
            let q = trimmed.lowercased()

            if a.isStarred != b.isStarred { return a.isStarred }

            if !q.isEmpty {
                let aPrefix = aName.hasPrefix(q)
                let bPrefix = bName.hasPrefix(q)
                if aPrefix != bPrefix { return aPrefix }

                let aContains = aName.contains(q)
                let bContains = bName.contains(q)
                if aContains != bContains { return aContains }
            }

            return aName < bName
        }
    }
}
