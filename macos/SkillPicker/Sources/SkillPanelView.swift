import SwiftUI

struct SkillPanelView: View {
    let onSelect: (Skill) -> Void
    let onDismiss: () -> Void

    @State private var query = ""
    @State private var skills: [Skill] = []
    @State private var selectedIndex = 0
    @State private var isLoading = true
    @State private var copiedSkill: String?
    @State private var activeDepartments: Set<String> = []
    @State private var starredOnly = false
    @State private var departments: [String] = []

    private var filtered: [Skill] {
        FuzzyMatcher.filter(skills, query: query,
                           departments: activeDepartments,
                           starredOnly: starredOnly)
    }

    var body: some View {
        VStack(spacing: 0) {
            // Search bar
            HStack(spacing: 8) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.secondary)
                TextField("Search skills...", text: $query)
                    .textFieldStyle(.plain)
                    .font(.system(.title3))
                    .onSubmit { selectCurrent() }
                if !query.isEmpty {
                    Button(action: { query = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(12)

            // Filter chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    FilterChip(
                        label: "Starred",
                        icon: "star.fill",
                        isActive: starredOnly,
                        color: .yellow
                    ) {
                        starredOnly.toggle()
                    }

                    ForEach(departments, id: \.self) { dept in
                        FilterChip(
                            label: dept,
                            isActive: activeDepartments.contains(dept),
                            color: DepartmentBadge.color(for: dept)
                        ) {
                            if activeDepartments.contains(dept) {
                                activeDepartments.remove(dept)
                            } else {
                                activeDepartments.insert(dept)
                            }
                        }
                    }

                    if !activeDepartments.isEmpty || starredOnly {
                        Button("Clear") {
                            activeDepartments.removeAll()
                            starredOnly = false
                        }
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
            }

            Divider()

            // Content
            if let copied = copiedSkill {
                Spacer()
                VStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.largeTitle)
                        .foregroundStyle(.green)
                    Text("Copied \"\(copied)\"")
                        .font(.headline)
                }
                Spacer()
            } else if isLoading {
                Spacer()
                ProgressView("Loading skills...")
                Spacer()
            } else if filtered.isEmpty {
                Spacer()
                VStack(spacing: 4) {
                    Image(systemName: "magnifyingglass")
                        .font(.title)
                        .foregroundStyle(.secondary)
                    Text("No skills found")
                        .foregroundStyle(.secondary)
                }
                Spacer()
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 2) {
                            ForEach(Array(filtered.enumerated()), id: \.element.id) { index, skill in
                                SkillRowView(skill: skill, isSelected: index == selectedIndex)
                                    .id(skill.id)
                                    .onTapGesture {
                                        selectedIndex = index
                                        selectCurrent()
                                    }
                            }
                        }
                        .padding(8)
                    }
                    .onChange(of: selectedIndex) { _, newValue in
                        if let skill = filtered[safe: newValue] {
                            proxy.scrollTo(skill.id, anchor: .center)
                        }
                    }
                }
            }

            // Footer
            Divider()
            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    KeyboardHint("↑↓")
                    Text("navigate")
                }
                HStack(spacing: 4) {
                    KeyboardHint("↩")
                    Text("copy")
                }
                HStack(spacing: 4) {
                    KeyboardHint("esc")
                    Text("close")
                }
                Spacer()
                Text("\(filtered.count) skills")
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
        }
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.primary.opacity(0.1), lineWidth: 1)
        )
        .onChange(of: query) { _, _ in selectedIndex = 0 }
        .onChange(of: activeDepartments) { _, _ in selectedIndex = 0 }
        .onChange(of: starredOnly) { _, _ in selectedIndex = 0 }
        .task {
            skills = await SkillService.shared.fetchSkills()
            departments = SkillService.shared.departments
            isLoading = false
        }
        .onKeyPress(.upArrow) {
            if selectedIndex > 0 { selectedIndex -= 1 }
            return .handled
        }
        .onKeyPress(.downArrow) {
            if selectedIndex < filtered.count - 1 { selectedIndex += 1 }
            return .handled
        }
        .onKeyPress(.escape) {
            onDismiss()
            return .handled
        }
    }

    private func selectCurrent() {
        guard let skill = filtered[safe: selectedIndex] else { return }
        ClipboardService.copy(skill.name)
        copiedSkill = skill.name
        onSelect(skill)
    }
}

// MARK: - Filter chip

struct FilterChip: View {
    let label: String
    var icon: String? = nil
    let isActive: Bool
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon {
                    Image(systemName: icon)
                        .font(.caption2)
                }
                Text(label)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(isActive ? color.opacity(0.2) : Color.primary.opacity(0.05))
            .foregroundStyle(isActive ? color : .secondary)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Keyboard hint

struct KeyboardHint: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(.caption)
            .fontDesign(.monospaced)
            .padding(.horizontal, 4)
            .padding(.vertical, 1)
            .background(Color.primary.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 3))
    }
}

extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
