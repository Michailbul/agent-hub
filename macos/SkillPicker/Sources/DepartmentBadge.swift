import SwiftUI

struct DepartmentBadge: View {
    let department: String

    static func color(for department: String) -> Color {
        switch department.lowercased() {
        case "engineering":        return .blue
        case "product/design":     return .purple
        case "product", "design":  return .purple
        case "marketing":          return .orange
        case "operations":         return .green
        case "data", "analytics":  return .cyan
        case "security":           return .red
        case "research":           return .indigo
        case "knowledge":          return .mint
        case "sales":              return .yellow
        default:                   return .gray
        }
    }

    var body: some View {
        let c = Self.color(for: department)
        Text(department)
            .font(.caption2)
            .fontWeight(.medium)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(c.opacity(0.15))
            .foregroundStyle(c)
            .clipShape(Capsule())
    }
}
