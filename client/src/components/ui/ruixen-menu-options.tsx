import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export default function RuixenMenuOptions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium px-2.5 h-8 shadow-sm shadow-black/5 hover:bg-secondary/80 transition-colors outline-none"
      >
        Actions
        <ChevronDown className="opacity-60" size={16} strokeWidth={2} />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 rounded-xl shadow-lg">
        {/* Quick Edits */}
        <DropdownMenuGroup>
          <DropdownMenuItem title="Make changes to the current item">
            Rename
            <DropdownMenuShortcut>⌘ R</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem title="Create a copy">
            Clone
            <DropdownMenuShortcut>⌘ C</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Organize */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>To Folder</DropdownMenuItem>
              <DropdownMenuItem>To Project</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem title="Add to your favorites list">
            Pin Item
          </DropdownMenuItem>
          <DropdownMenuItem title="Collaborate with others">
            Share
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuGroup>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>View Logs</DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Destructive */}
        <DropdownMenuItem
          variant="destructive"
          title="Permanently remove this item"
        >
          Delete Forever
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
