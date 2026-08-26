import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useApp } from '@/store/useApp';
import { PageContainer } from '@/components/PageContainer';
import { QUESTIONS, TOTAL_QUESTIONS, Choice } from '@/constants/questions';
import { CHAPTER_BG_1, CHAPTER_BG_2, CHAPTER_BG_3, CHAPTER_BG_4, CHAPTER_BG_5, CHAPTER_BG_6 } from '@/constants/images';
import { ChevronRight } from '@/components/Icons';

/** 마침표 뒤엔 줄바꿈, 쉼표 뒤엔 자연스러운 줄바꿈 기회 부여 */
function formatLineBreaks(text: string): ReactNode[] {
  const lines = text.split('\n');
  const nodes: ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    // 마침표(.) 뒤에 줄바꿈, 쉼표(,) 뒤에 wbr
    const segments = line.split(/(?<=[.])\s+/);
    segments.forEach((seg, segIdx) => {
      if (segIdx > 0) nodes.push(<br key={`${lineIdx}-${segIdx}`} />);
      // 쉼표 뒤에 wbr 삽입
      const commaParts = seg.split(/(?<=[,])/);
      commaParts.forEach((part, ci) => {
        if (ci > 0) nodes.push(<wbr key={`${lineIdx}-${segIdx}-${ci}`} />);
        nodes.push(part);
      });
    });
    if (lineIdx < lines.length - 1) nodes.push(<br key={`${lineIdx}-end`} />);
  });

  return nodes;
}

/** 루의 말 — 큰따옴표 문장을 한 줄씩 분리 */
function formatLuWords(text: string): { label: string; sentences: string[] } {
  const lines = text.split('\n').filter((l) => l.trim());
  const label = lines[0] || '';
  const sentences = lines.slice(1);
  return { label, sentences };
}

const CHAPTER_BGS: Record<number, string> = {
  1: CHAPTER_BG_1,
  2: CHAPTER_BG_2,
  3: CHAPTER_BG_3,
  4: CHAPTER_BG_4,
  5: CHAPTER_BG_5,
  6: CHAPTER_BG_6,
};

const CHAPTER_COLORS: Record<number, string> = {
  2: '#D4F0E8',
  3: '#E8D4C0',
  4: '#D4E8D4',
  5: '#C0D4E8',
  6: '#E8D4E8',
};

type Phase = 'intro' | 'question' | 'transition' | 'fadein';

/* ── Chapter transition overlay (self-contained component) ── */

interface ChapterTransitionProps {
  chapter: number;
  chapterName: string;
  onNext: () => void;
}

function ChapterTransition({ chapter, chapterName, onNext }: ChapterTransitionProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledRef = useRef(false);

  const goNext = useCallback(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    onNext();
  }, [onNext]);

  useEffect(() => {
    timerRef.current = setTimeout(goNext, 2000);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [goNext]);

  const bgImage = CHAPTER_BGS[chapter] || '';

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-fadeIn cursor-pointer"
      onClick={goNext}
    >
      {bgImage && (
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      <div className="relative text-center pointer-events-none flex flex-col items-center">
        {/* 상단: CHAPTER N (Pretendard, 작게, 자간 넓게) */}
        <p className="font-sans text-xs text-white/80 tracking-[0.3em] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] animate-fadeUp">
          Chapter {chapter}
        </p>
        {/* 중앙: 챕터 이름 (Playfair Display, 크게) */}
        <h2 className="font-playfair text-3xl font-bold text-white tracking-[0.05em] mt-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-fadeUp" style={{ animationDelay: '0.3s', opacity: 0 }}>
          {chapterName}
        </h2>
        <div className="mt-6 flex justify-center">
          <div className="w-1 h-1 rounded-full bg-white/50 animate-pulse" />
        </div>
      </div>

      {/* 하단: 자동 넘어감 안내 + [다음으로 →] 버튼 */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <p className="font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] animate-fadeUp" style={{ animationDelay: '0.5s', opacity: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
          잠시 후 자동으로 넘어갑니다.
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="flex items-center gap-1.5 px-6 py-3
                     bg-white/80 backdrop-blur-sm rounded-full font-sans text-sm font-medium text-text
                     border border-white/60 shadow-md hover:bg-white hover:shadow-lg transition-all duration-300 active:scale-95"
        >
          다음으로
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Question page ── */

export function QuestionPage() {
  const { setCurrentPage, addAnswer } = useApp();
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [nextChapter, setNextChapter] = useState<number | null>(null);
  const [introChapter] = useState<number>(QUESTIONS[0].chapter);

  const question = QUESTIONS[qIndex];
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup all timers on unmount only
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const advanceToNextQuestion = useCallback(() => {
    setQIndex((prev) => prev + 1);
    setSelected(null);
    setNextChapter(null);
    setPhase('fadein');
  }, []);

  // Handle fadein → question transition
  useEffect(() => {
    if (phase === 'fadein') {
      fadeTimerRef.current = setTimeout(() => setPhase('question'), 800);
      return () => {
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      };
    }
  }, [phase]);

  const handleSelect = (choice: Choice) => {
    if (selected) return;
    setSelected(choice.text);
    addAnswer({
      questionId: question.id,
      choice: choice.text,
      scores: choice.scores,
      residentWeights: choice.residentWeights,
    });

    advanceTimerRef.current = setTimeout(() => {
      if (qIndex >= QUESTIONS.length - 1) {
        // 마지막 질문 → 로딩 페이지
        setCurrentPage('loading');
        return;
      }

      const nextQ = QUESTIONS[qIndex + 1];
      if (nextQ.chapter !== question.chapter) {
        // 챕터가 바뀌면 전환 화면 표시
        setNextChapter(nextQ.chapter);
        setPhase('transition');
      } else {
        // 같은 챕터 → 바로 다음 질문
        setQIndex((prev) => prev + 1);
        setSelected(null);
      }
    }, 500);
  };

  const bgColor = CHAPTER_COLORS[question.chapter] || '#FAFAF8';
  const questionBgGradient = 'linear-gradient(to bottom, #FAF8F5, #D4F0D0)';
  const transitionChapterName = nextChapter ? QUESTIONS.find((q) => q.chapter === nextChapter)?.chapterName || '' : '';

  const showQuestion = phase === 'question' || phase === 'fadein';

  const introChapterName = QUESTIONS.find((q) => q.chapter === introChapter)?.chapterName || '';

  return (
    <PageContainer className="bg-black" footer={false}>
      {/* Question view */}
      <div
        className="absolute inset-0 z-0 overflow-hidden transition-opacity duration-500"
        style={{ opacity: showQuestion ? 1 : 0, height: '100vh' }}
      >
        {/* Background — gradient */}
        <div className="absolute inset-0" style={{ background: questionBgGradient }} />

        {/* Content */}
        <div className={`relative z-10 flex flex-col max-w-[430px] mx-auto transition-opacity duration-300 ${phase === 'transition' ? 'opacity-0' : 'opacity-100'}`} style={{ height: '100vh' }}>
          {/* Top bar: chapter badge + progress — fixed at very top */}
          <div className="flex items-center justify-between w-full flex-shrink-0" style={{ padding: '1rem 3.5rem 0 1rem' }}>
            <span className="px-3 py-1 bg-point text-white text-xs font-sans font-medium rounded-full shadow-md">
              {question.chapterName}
            </span>
            <span className="text-text/70 text-xs font-sans font-medium">
              {qIndex + 1} / {TOTAL_QUESTIONS}
            </span>
          </div>

          {/* Top half: question text only (centered) */}
          <div
            className="flex flex-col justify-center items-center"
            style={{ height: '50%', padding: '1rem' }}
          >
            {/* Question text */}
            <div key={qIndex} className="w-full text-center animate-fadeUp">
              {question.question.startsWith('루의 말') ? (
                <div className="space-y-2.5">
                  <p className="font-sans text-[11px] text-text/50 tracking-wide">
                    {formatLuWords(question.question).label}
                  </p>
                  <div className="space-y-2.5">
                    {formatLuWords(question.question).sentences.map((sentence, i) => (
                      <p
                        key={i}
                        className="font-batang leading-[1.7] text-text/80 drop-shadow-sm"
                        style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)' }}
                      >
                        {sentence}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <p
                  className="font-batang leading-[1.7] text-text drop-shadow-sm"
                  style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)' }}
                >
                  {formatLineBreaks(question.question)}
                </p>
              )}
            </div>
          </div>

          {/* Bottom half: choices (50%) */}
          <div
            className="flex flex-col justify-evenly"
            style={{ height: '50%', padding: '1rem' }}
          >
            {question.choices.map((choice, i) => {
              const isSelected = selected === choice.text;
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(choice)}
                  disabled={!!selected}
                  className={`w-full px-4 py-2.5 rounded-xl font-sans leading-[1.7] text-text text-left
                             transition-all duration-300
                             ${isSelected
                               ? 'bg-white border-[1.5px] border-point shadow-lg scale-[1.02]'
                               : 'bg-white/90 border border-[#E0DDD8] hover:border-point/50 hover:bg-white'
                             }
                             ${selected && !isSelected ? 'opacity-50' : ''}
                             disabled:cursor-default`}
                  style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}
                >
                  <span className="font-medium text-point mr-1.5">{String.fromCharCode(65 + i)}.</span>
                  {choice.text}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chapter transition overlay — separate component with its own timer */}
      {phase === 'transition' && nextChapter !== null && (
        <ChapterTransition
          chapter={nextChapter}
          chapterName={transitionChapterName}
          onNext={advanceToNextQuestion}
        />
      )}

      {/* Intro transition — shown before the first question */}
      {phase === 'intro' && (
        <ChapterTransition
          chapter={introChapter}
          chapterName={introChapterName}
          onNext={() => setPhase('question')}
        />
      )}
    </PageContainer>
  );
}
