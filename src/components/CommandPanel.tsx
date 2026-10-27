import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Search, Terminal, X, Zap, BarChart3, Activity } from "lucide-react";
import { prefersReducedMotion } from "../core/utilities";
import rawCommands from "../data/commands.json";

interface CommandItem {
  title: string;
  subtitle: string;
  category: string;
  shortcut?: string;
  type: string;
  target: string;
}

export function CommandPanel(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isMouseMovingRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const onClose = () => setIsOpen(false);

  // 📡 Single Event Interceptor Handshake
  useEffect(() => {
    const handleSignal = () => setIsOpen((prev) => !prev);
    window.addEventListener("core-engine:toggle-palette", handleSignal);
    return () => window.removeEventListener("core-engine:toggle-palette", handleSignal);
  }, []);

  // Universal Action Execution Engine
  const runAction = useCallback(async (cmd: CommandItem) => {
    try {
      switch (cmd.type) {
        case "scroll": {
          const scrollBehaviorCheck = prefersReducedMotion() ? "auto" : "smooth";
          document.querySelector(cmd.target)?.scrollIntoView({ behavior: scrollBehaviorCheck, block: "start" });
          break;
        }
        case "click":
          document.querySelector<HTMLElement>(cmd.target)?.click();
          break;
        case "copy": {
          const textToCopy = cmd.target === "LOCATION_HREF" ? window.location.href : cmd.target;
          await navigator.clipboard.writeText(textToCopy);
          setToastMessage(`Copied text string safely: ${cmd.title}`);
          setTimeout(() => setToastMessage(null), 2000);
          return; // Stay open during clip confirmations
        }
        case "class-toggle":
          document.documentElement.classList.toggle(cmd.target);
          break;
        case "print":
          window.print();
          break;
        case "link":
          window.open(cmd.target, "_blank", "noopener,noreferrer");
          break;
      }
    } catch (err) {
      console.error("Action execution exception channel:", err);
    }
    onClose();
  }, []);

  // Telemetry Memoized Scanners
  const telemetry = useMemo(() => {
    if (!isOpen) return { projects: 0, skills: 0, anchors: 0, theme: "Dark" };
    return {
      projects: document.querySelectorAll(".project-card").length || 8,
      skills: document.querySelectorAll(".skill-card").length || 14,
      anchors: document.querySelectorAll("section[id]").length || 6,
      theme: document.documentElement.classList.contains("light") ? "Light" : "Dark",
    };
  }, [isOpen]);

  // High-performance search string query filter
  const filteredCommands = useMemo<CommandItem[]>(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return rawCommands;
    return rawCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(term) ||
        c.subtitle.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term),
    );
  }, [searchQuery]);

  // ⚡ Single, Unified Focus & Keyboard Control Loop
  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove("body-locked");
      return;
    }

    document.body.classList.add("body-locked");
    setSelectedIndex(0);

    // Smooth input box activation focus ring
    const frameId = requestAnimationFrame(() => inputRef.current?.focus());

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((p) => {
          const nextIdx = Math.min(p + 1, filteredCommands.length - 1);
          const nextEl = listRef.current?.querySelector(`[data-index="${nextIdx}"]`);
          nextEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return nextIdx;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((p) => {
          const nextIdx = Math.max(p - 1, 0);
          const nextEl = listRef.current?.querySelector(`[data-index="${nextIdx}"]`);
          nextEl?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          return nextIdx;
        });
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        runAction(filteredCommands[selectedIndex]);
      } else if (/^[1-9]$/.test(e.key) && document.activeElement === inputRef.current) {
        const idx = Number(e.key) - 1;
        if (filteredCommands[idx]) {
          e.preventDefault();
          runAction(filteredCommands[idx]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, filteredCommands, selectedIndex, runAction]);

  // Tracks cursor motion states cleanly
  useEffect(() => {
    const handleMouseMove = () => {
      isMouseMovingRef.current = true;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!isOpen) return <></>;

  return (
    <div className="command-panel open" role="dialog" aria-modal="true" aria-label="Command Center Engine">
      <div className="command-panel-backdrop" onClick={onClose} aria-hidden="true" />

      <div className="command-panel-shell">
        <div className="command-panel-header">
          <div className="flex items-center gap-2">
            <Terminal className="text-green-400 animate-pulse" size={20} />
            <div>
              <h2>Command Center Core</h2>
              <p className="command-panel-subtitle">Data-driven architecture engine optimized for speed.</p>
            </div>
          </div>
          <button className="command-close" type="button" onClick={onClose} aria-label="Close command center">
            <X size={18} />
          </button>
        </div>

        <div className="command-panel-search">
          <Search className="search-icon-left" size={16} />
          <input
            ref={inputRef}
            id="command-input"
            type="search"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, tools, structural variables..."
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {toastMessage && (
          <div className="clipboard-toast-alert">
            <Zap size={14} className="text-yellow-400" /> {toastMessage}
          </div>
        )}

        <div className="command-panel-meta" aria-label="Live Telemetry Status">
          <span className="command-chip">
            <Activity size={12} /> Live Scan Active
          </span>
          <span className="command-chip">Projects Featured: {telemetry.projects}</span>
          <span className="command-chip">Toolkit Anchors: {telemetry.skills}</span>
          <span className="command-chip">Mode: {telemetry.theme}</span>
        </div>

        <div className="command-panel-results-title">Instructions ({filteredCommands.length} parsed matches)</div>

        <div ref={listRef} className="command-panel-list" role="listbox" aria-label="Command Options Matrix">
          {filteredCommands.length === 0 ? (
            <div className="command-item empty text-center py-4 text-gray-400">No matching system routes.</div>
          ) : (
            filteredCommands.map((command, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${command.title}-${idx}`}
                  type="button"
                  data-index={idx}
                  className={`command-item ${isSelected ? "selected" : ""}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => runAction(command)}
                  onMouseOver={() => {
                    if (isMouseMovingRef.current) {
                      setSelectedIndex(idx);
                    }
                  }}
                >
                  <div className="command-item-main">
                    <strong>{command.title}</strong>
                    <span>{command.subtitle}</span>
                  </div>
                  {command.shortcut && <kbd className="cmd-shortcut">{command.shortcut}</kbd>}
                </button>
              );
            })
          )}
        </div>

        <div className="command-panel-summary">
          <BarChart3 size={14} />
          <span>Core Matrix: {telemetry.anchors} structural segments stabilized. JSON registry connected.</span>
        </div>
        <p className="command-panel-footer">
          Navigate: <kbd>↑</kbd> <kbd>↓</kbd> | Run: <kbd>Enter</kbd> | Toggle: <kbd>Ctrl + K</kbd>
        </p>
      </div>
    </div>
  );
}
