"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIgnoreFolderAppearance } from "@/features/folders/hooks/use-folder-appearance-enabled";
import { setIgnoreFolderAppearance } from "@/features/folders/lib/folder-appearance-pref";

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const ignoreFolderAppearance = useIgnoreFolderAppearance();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Alternar tema"
          data-tour="theme-toggle"
        >
          <Sun className="scale-100 dark:scale-0" />
          <Moon className="absolute scale-0 dark:scale-100" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun /> Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon /> Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor /> Sistema
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Per-browser opt-out: folders keep their appearance for everyone else. */}
        <DropdownMenuCheckboxItem
          checked={ignoreFolderAppearance}
          onCheckedChange={(checked) => setIgnoreFolderAppearance(checked === true)}
        >
          <Palette /> Usar sempre a aparência padrão
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
