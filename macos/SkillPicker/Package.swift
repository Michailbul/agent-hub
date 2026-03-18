// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SkillPicker",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "SkillPicker",
            path: "Sources"
        )
    ]
)
