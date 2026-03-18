import AppKit

@MainActor
final class GlobalHotkey {
    private var globalMonitor: Any?
    private var localMonitor: Any?
    private let action: @MainActor () -> Void

    init(action: @escaping @MainActor () -> Void) {
        self.action = action
    }

    func register() {
        // Cmd+Shift+S
        let modifiers: NSEvent.ModifierFlags = [.command, .shift]
        let keyCode: UInt16 = 1 // 's'

        globalMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.modifierFlags.intersection(.deviceIndependentFlagsMask) == modifiers,
               event.keyCode == keyCode {
                Task { @MainActor in
                    self?.action()
                }
            }
        }

        localMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            if event.modifierFlags.intersection(.deviceIndependentFlagsMask) == modifiers,
               event.keyCode == keyCode {
                Task { @MainActor in
                    self?.action()
                }
                return nil
            }
            return event
        }
    }

    func unregister() {
        if let m = globalMonitor { NSEvent.removeMonitor(m) }
        if let m = localMonitor { NSEvent.removeMonitor(m) }
        globalMonitor = nil
        localMonitor = nil
    }
}
