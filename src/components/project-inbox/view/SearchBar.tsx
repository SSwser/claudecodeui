import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { Badge } from '../../../shared/view/ui';
import { cn } from '../../../lib/utils';
import SessionProviderLogo from '../../llm-logo-provider/SessionProviderLogo';
import type { SessionProvider } from '../../../types/app';
import type { SessionSearchResult, SessionStatus } from '../../../types/session';
import type { SessionState } from '../../../types/session';
import { useSearch } from '../hooks/useSearch';

type SearchBarProps = {
  projectId: number;
  sessions: SessionState[];
  onSelectSession: (sessionId: string, provider: SessionProvider) => void;
};

const STATUS_BADGE_CLASS: Record<SessionStatus, string> = {
  active:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  frozen:
    'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300',
  archived:
    'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300',
  deleted:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  active: 'Active',
  frozen: 'Frozen',
  archived: 'Archived',
  deleted: 'Deleted',
};

type FlatResult =
  | { kind: 'title'; sessionId: string; provider: SessionProvider; title: string; status: SessionStatus }
  | { kind: 'content'; sessionId: string; provider: SessionProvider; title: string; status: SessionStatus };

function toFlatTitle(s: SessionState): FlatResult {
  return {
    kind: 'title',
    sessionId: s.sessionId,
    provider: s.provider,
    title: s.title ?? s.sessionId,
    status: s.status,
  };
}

function toFlatContent(r: SessionSearchResult): FlatResult {
  return {
    kind: 'content',
    sessionId: r.sessionId,
    provider: r.provider,
    title: r.title ?? r.sessionId,
    status: r.status,
  };
}

export default function SearchBar({ projectId, sessions, onSelectSession }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const { query, setQuery, titleMatches, contentMatches, isSearching, hasQuery } = useSearch({
    projectId,
    sessions,
  });

  const flatTitles = titleMatches.map(toFlatTitle);
  const flatContent = contentMatches.map(toFlatContent);
  const flatResults: FlatResult[] = [...flatTitles, ...flatContent];

  // Ctrl+K / Cmd+K global shortcut to focus the search input.
  useEffect(() => {
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener('keydown', handleGlobalKeydown);
    return () => document.removeEventListener('keydown', handleGlobalKeydown);
  }, []);

  // Close dropdown when clicking outside the component.
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const closeAndReset = () => {
    setIsOpen(false);
    setSelectedIndex(-1);
    setQuery('');
  };

  const handleSelect = (sessionId: string, provider: SessionProvider) => {
    onSelectSession(sessionId, provider);
    closeAndReset();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatResults[selectedIndex];
      if (item) {
        handleSelect(item.sessionId, item.provider);
      }
    }
  };

  const showDropdown = isOpen && hasQuery;
  const hasResults = flatResults.length > 0 || isSearching;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search input */}
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search sessions… (Ctrl+K)"
          aria-label="Search sessions"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          className={cn(
            'w-full rounded-medium border border-border bg-background py-2 pl-9 pr-8 text-sm',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring/40',
            'transition-colors',
          )}
        />
        {hasQuery && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showDropdown && (
        <div
          role="listbox"
          aria-label="Search results"
          className={cn(
            'absolute z-50 mt-1 w-full overflow-y-auto rounded-large border border-border bg-popover shadow-lg',
            'max-h-96',
          )}
        >
          {!hasResults && (
            <p className="px-4 py-3 text-sm text-muted-foreground">No results found</p>
          )}

          {/* Section 1: Title matches (instant) */}
          {flatTitles.length > 0 && (
            <section>
              <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Title matches
              </p>
              {flatTitles.map((item, idx) => (
                <ResultRow
                  key={`title-${item.sessionId}-${item.provider}`}
                  title={item.title}
                  provider={item.provider}
                  status={item.status}
                  isSelected={selectedIndex === idx}
                  onClick={() => handleSelect(item.sessionId, item.provider)}
                />
              ))}
            </section>
          )}

          {/* Section 2: Content matches (debounced FTS5, with loading spinner) */}
          {(flatContent.length > 0 || isSearching) && (
            <section>
              <p className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Content matches
                {isSearching && <Loader2 className="h-3 w-3 animate-spin" />}
              </p>
              {flatContent.map((item, idx) => (
                <ResultRow
                  key={`content-${item.sessionId}-${item.provider}`}
                  title={item.title}
                  provider={item.provider}
                  status={item.status}
                  isSelected={selectedIndex === flatTitles.length + idx}
                  onClick={() => handleSelect(item.sessionId, item.provider)}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

type ResultRowProps = {
  title: string;
  provider: SessionProvider;
  status: SessionStatus;
  isSelected: boolean;
  onClick: () => void;
};

function ResultRow({ title, provider, status, isSelected, onClick }: ResultRowProps) {
  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground',
      )}
    >
      <SessionProviderLogo provider={provider} className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-foreground">{title}</span>
      <Badge className={cn('shrink-0 text-xs', STATUS_BADGE_CLASS[status])}>
        {STATUS_LABEL[status]}
      </Badge>
    </div>
  );
}
