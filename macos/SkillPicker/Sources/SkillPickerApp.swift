import AppKit
import SwiftUI

@main
@MainActor
struct SkillPickerApp {
    static let panelController = PanelController()
    static var hotkey: GlobalHotkey?
    static var statusItem: NSStatusItem?

    static func main() {
        let app = NSApplication.shared
        app.setActivationPolicy(.accessory) // No dock icon

        let delegate = AppDelegate()
        app.delegate = delegate

        setupStatusItem()
        setupHotkey()

        print("SkillPicker running. Cmd+Shift+S to toggle. Look for 🔍 in menu bar.")
        print("NOTE: Global hotkey requires Accessibility permission.")
        print("  → System Settings > Privacy & Security > Accessibility > enable SkillPicker (or Terminal)")

        // Prefetch skills
        Task {
            let skills = await SkillService.shared.fetchSkills()
            print("Loaded \(skills.count) skills.")
        }

        app.run()
    }

    static func setupStatusItem() {
        let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = item.button {
            // Try SF Symbol first, fall back to text
            if let img = NSImage(systemSymbolName: "magnifyingglass.circle", accessibilityDescription: "Skill Picker") {
                img.isTemplate = true
                button.image = img
            } else {
                button.title = "🔍"
            }
        }

        let menu = NSMenu()

        let showItem = NSMenuItem(title: "Show Picker  ⌘⇧S", action: #selector(AppDelegate.showPicker), keyEquivalent: "")
        showItem.target = delegate
        menu.addItem(showItem)

        let refreshItem = NSMenuItem(title: "Refresh Skills", action: #selector(AppDelegate.refreshSkills), keyEquivalent: "")
        refreshItem.target = delegate
        menu.addItem(refreshItem)

        menu.addItem(.separator())

        let quitItem = NSMenuItem(title: "Quit Skill Picker", action: #selector(AppDelegate.quitApp), keyEquivalent: "q")
        quitItem.target = delegate
        menu.addItem(quitItem)

        item.menu = menu
        statusItem = item
    }

    static func setupHotkey() {
        hotkey = GlobalHotkey { panelController.toggle() }
        hotkey?.register()
    }

    // Keep delegate alive for the lifetime of the app
    private static let delegate = AppDelegate()
    private static var app: NSApplication { NSApplication.shared }
}

@MainActor
class AppDelegate: NSObject, NSApplicationDelegate {
    @objc func showPicker() {
        SkillPickerApp.panelController.show()
    }

    @objc func refreshSkills() {
        Task {
            let skills = await SkillService.shared.fetchSkills()
            print("Refreshed: \(skills.count) skills.")
        }
    }

    @objc func quitApp() {
        SkillPickerApp.hotkey?.unregister()
        NSApp.terminate(nil)
    }

    nonisolated func applicationDidFinishLaunching(_ notification: Notification) {}
}
