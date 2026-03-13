import { Settings, X } from 'lucide-react';

type TableAgentPaneProps = {
  title?: string;
  subtitle?: string;
  suggestions: string[];
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onClose: () => void;
};

export function TableAgentPane({
  title = 'New Chat',
  subtitle,
  suggestions,
  value,
  onChange,
  onSubmit,
  onClose,
}: TableAgentPaneProps) {
  return (
    <aside className="fixed right-0 top-12 bottom-0 z-40 w-full sm:w-[360px] border-l border-gray-200 bg-white shadow-lg">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-xs font-semibold text-gray-900">{title}</p>
            {subtitle ? <p className="mt-1 text-2xs text-gray-500">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close assistant"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-auto space-y-1.5 px-3 pb-3">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSubmit(suggestion)}
              className="h-8 w-full rounded-md border border-gray-200 bg-white px-3 text-left text-xs font-normal text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4">
          <div className="rounded-lg border border-gray-300 bg-white px-3 py-2">
            <div className="mb-2 inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full border border-gray-300" />
              testing
            </div>
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey) return;
                event.preventDefault();
                onSubmit(value);
              }}
              className="w-full resize-none border-0 p-0 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none"
              rows={2}
              placeholder="Describe what you need. Press @ for context, / for Skills."
            />
            <div className="mt-1.5 flex items-center justify-between">
              <button className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
                <Settings size={13} />
                Auto
              </button>
              <button
                onClick={() => onSubmit(value)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-orange-500 text-white hover:bg-orange-600"
                aria-label="Send"
              >
                ↵
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
