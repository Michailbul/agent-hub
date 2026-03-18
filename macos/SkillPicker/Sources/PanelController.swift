import AppKit
import SwiftUI

@MainActor
final class PanelController {
    private var panel: FloatingPanel?
    private var dismissWorkItem: DispatchWorkItem?

    var isVisible: Bool {
        panel?.isVisible ?? false
    }

    func toggle() {
        if isVisible {
            hide()
        } else {
            show()
        }
    }

    func show() {
        // Always recreate panel for fresh state (cleared search, reset selection)
        hide()
        let view = SkillPanelView(
            onSelect: { [weak self] _ in
                self?.hideAfterDelay()
            },
            onDismiss: { [weak self] in
                self?.hide()
            }
        )
        let p = FloatingPanel(contentView: view)
        p.showCentered()
        panel = p

        // Focus the panel
        NSApp.activate(ignoringOtherApps: true)
    }

    func hide() {
        dismissWorkItem?.cancel()
        panel?.orderOut(nil)
        panel = nil
    }

    private func hideAfterDelay() {
        dismissWorkItem?.cancel()
        let item = DispatchWorkItem { [weak self] in
            Task { @MainActor in
                self?.hide()
            }
        }
        dismissWorkItem = item
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: item)
    }
}
