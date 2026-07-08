import { useEffect, useRef, useState } from "react";
import { ChevronDown, FolderPlus } from "lucide-react";

interface FolderComboboxProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function FolderCombobox({
  id,
  value,
  options,
  onChange,
  placeholder,
}: FolderComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-3 rounded-sm border border-white/10 bg-white/[0.06] pr-2 transition-colors duration-300 focus-within:border-primary">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
        />
        <button
          type="button"
          aria-label="Show existing folders"
          onClick={() => setIsOpen((prev) => !prev)}
          className="shrink-0 rounded-sm p-1.5 text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/70"
        >
          <ChevronDown size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1.5 max-h-48 w-full overflow-y-auto rounded-sm border border-white/10 bg-background-dark shadow-xl">
          {options.length === 0 ? (
            <p className="px-4 py-3 text-xs text-white/40">
              No folders yet — type a name to create one.
            </p>
          ) : (
            options.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => {
                  onChange(folder);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors duration-300 hover:bg-primary/10 ${
                  folder === value ? "text-primary" : "text-white/70"
                }`}
              >
                {folder}
              </button>
            ))
          )}
          {value.trim() && !options.includes(value.trim()) && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2 text-left text-sm text-primary transition-colors duration-300 hover:bg-primary/10"
            >
              <FolderPlus size={14} />
              Create "{value.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
