import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '@/store/useApp';
import { PageContainer } from '@/components/PageContainer';
import { fetchDeveloperNotes, DeveloperNoteRow } from '@/lib/supabase';
import { ArrowLeft } from '@/components/Icons';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function DeveloperNotePage() {
  const { setCurrentPage } = useApp();

  const [notes, setNotes] = useState<DeveloperNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<DeveloperNoteRow | null>(null);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    const data = await fetchDeveloperNotes();
    setNotes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // --- Detail view ---
  if (selectedNote) {
    return (
      <PageContainer className="bg-base">
        <div className="flex-1">
          <div className="px-6 pt-10 pb-10">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => setSelectedNote(null)}
                className="flex items-center gap-1.5 font-sans text-sm text-text-sub hover:text-text transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                목록으로
              </button>
              <span className="font-playfair text-sm font-bold tracking-[0.12em] text-text-sub">MERRIWEATHER</span>
            </div>

            <article className="mb-8 animate-fadeUp">
              <h1 className="font-batang text-2xl text-text mb-3 leading-snug">{selectedNote.title}</h1>
              <p className="font-sans text-xs text-text-sub mb-6">{formatDate(selectedNote.created_at)}</p>
              <div className="font-batang text-sm text-text leading-loose">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-4 leading-loose">{children}</p>,
                    h1: ({ children }) => <h1 className="font-batang text-xl text-text mb-4 mt-6 leading-snug">{children}</h1>,
                    h2: ({ children }) => <h2 className="font-batang text-lg text-text mb-3 mt-5 leading-snug">{children}</h2>,
                    h3: ({ children }) => <h3 className="font-batang text-base text-text mb-3 mt-4 leading-snug">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-4 leading-loose">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 leading-loose">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    a: ({ children, href }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-point underline hover:text-point-dark">
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => <strong className="font-bold text-text">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-point pl-4 my-4 text-text-sub italic">{children}</blockquote>
                    ),
                    code: ({ children }) => <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{children}</code>,
                    pre: ({ children }) => <pre className="font-mono text-xs bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                    img: ({ src, alt }) => (
                      <img src={src} alt={alt} className="w-full rounded-2xl my-4" loading="lazy" />
                    ),
                  }}
                >
                  {selectedNote.content}
                </ReactMarkdown>
              </div>
            </article>
          </div>
        </div>
      </PageContainer>
    );
  }

  // --- List view ---
  return (
    <PageContainer className="bg-base">
      <div className="flex-1">
        <div className="px-6 pt-10 pb-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => setCurrentPage('landing')}
              className="font-batang text-lg text-text hover:text-point transition-colors"
            >
              MERRIWEATHER
            </button>
            <span className="font-sans text-sm text-text-sub">개발자 노트</span>
          </div>

          {/* Title */}
          <h1 className="font-batang text-2xl text-text mb-8 animate-fadeUp">개발자 노트</h1>

          {/* Note list */}
          {loading ? (
            <p className="font-sans text-sm text-text-sub text-center py-12">불러오는 중...</p>
          ) : notes.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-batang text-base text-text-sub">아직 작성된 글이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note, i) => (
                <button
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="w-full text-left p-5 bg-white rounded-2xl border border-[#E0DDD8] shadow-sm hover:border-point hover:shadow-md transition-all duration-300 animate-fadeUp"
                  style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                >
                  <h2 className="font-batang text-lg text-text mb-2 leading-snug">{note.title}</h2>
                  <p className="font-sans text-xs text-text-sub mb-3">{formatDate(note.created_at)}</p>
                  <p
                    className="font-sans text-sm text-text-sub leading-relaxed overflow-hidden whitespace-pre-line"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                  >
                    {note.content}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
