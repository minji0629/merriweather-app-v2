import { useState, useEffect } from 'react';
import { useApp } from '@/store/useApp';
import { useAuth } from '@/store/useAuth';
import { PageContainer } from '@/components/PageContainer';
import { RESIDENT_IMAGES } from '@/constants/images';
import { getResidentProfile, withNickname, RESIDENT_FEATURES } from '@/constants/residents';
import { hasFinalConsonant } from '@/lib/korean';
import { generateGaul, generateLetter, generateRelation, generateGrowth, answerQuestion } from '@/lib/claude';
import {
  fetchUserResults,
  fetchResultById,
  fetchQuestions,
  decrementQuestion,
  saveAiText,
  appendQuestionHistory,
  QuestionRow,
  QuestionHistoryEntry,
} from '@/lib/supabase';
import { Sparkles, Send, Gift, Plus } from '@/components/Icons';
import ResidentFlipCard from '@/components/ResidentFlipCard';
import { ExtraQuestionsModal } from '@/components/ExtraQuestionsModal';
import { ShareModal } from '@/components/ShareModal';
import { PremiumShareChoiceModal } from '@/components/PremiumShareChoiceModal';
import { buildResultShareUrl, SERVICE_URL, ShareContent } from '@/lib/share';

export function PremiumResultPage() {
  const { nickname, setCurrentPage, residentKey, secondResidentKey, selectedResidentKey, selectedResultId, restart, previousPage } = useApp();
  const { user } = useAuth();

  const effectiveKey = selectedResidentKey ?? residentKey;
  const RESULT = effectiveKey ? getResidentProfile(effectiveKey) : null;
  const secondKey = secondResidentKey ?? effectiveKey;

  const [gaulText, setGaulText] = useState('');
  const [gaulLoading, setGaulLoading] = useState(true);
  const [gaulError, setGaulError] = useState(false);

  const [letterText, setLetterText] = useState('');
  const [letterLoading, setLetterLoading] = useState(true);
  const [letterError, setLetterError] = useState(false);

  const [relationText, setRelationText] = useState('');
  const [relationLoading, setRelationLoading] = useState(true);
  const [relationError, setRelationError] = useState(false);

  const [growthText, setGrowthText] = useState('');
  const [growthLoading, setGrowthLoading] = useState(true);
  const [growthError, setGrowthError] = useState(false);

  const [productType, setProductType] = useState<string | null>(null);

  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState(false);
  const [questionRow, setQuestionRow] = useState<QuestionRow | null>(null);
  const [history, setHistory] = useState<QuestionHistoryEntry[]>([]);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showShareChoiceModal, setShowShareChoiceModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState<ShareContent | null>(null);

  // AI 텍스트(결/편지) 로드 — 저장된 값이 있으면 그대로 사용, 없으면 생성 후 저장
  useEffect(() => {
    if (!RESULT || !effectiveKey) return;
    let cancelled = false;

    (async () => {
      const targetId = selectedResultId;
      let savedAiResult: string | null = null;
      let savedAiLetter: string | null = null;
      let savedAiRelation: string | null = null;
      let savedAiGrowth: string | null = null;
      let savedProductType: string | null = null;

      if (targetId) {
        console.log('[Archive] AI 텍스트 로드 시도, result_id:', targetId);
        const row = await fetchResultById(targetId);
        savedAiResult = row?.ai_result ?? null;
        savedAiLetter = row?.ai_letter ?? null;
        savedAiRelation = row?.ai_relation ?? null;
        savedAiGrowth = row?.ai_growth ?? null;
        savedProductType = row?.product_type ?? null;
        console.log('[Archive] 저장된 ai_result:', savedAiResult ? `${savedAiResult.slice(0, 30)}...` : null);
        console.log('[Archive] 저장된 ai_letter:', savedAiLetter ? `${savedAiLetter.slice(0, 30)}...` : null);
        console.log('[Archive] 저장된 product_type:', savedProductType);
      }

      if (!cancelled && savedProductType) {
        setProductType(savedProductType);
      }

      const isPlus = savedProductType === 'expedition_plus' || savedProductType === '탐험권+추가질문';

      // 결 (gaul)
      if (savedAiResult) {
        if (!cancelled) {
          setGaulText(savedAiResult);
          setGaulLoading(false);
        }
      } else {
        setGaulLoading(true);
        try {
          const text = await generateGaul(nickname || '여행자', effectiveKey, secondKey);
          if (!cancelled) {
            setGaulText(text);
            setGaulLoading(false);
          }
          if (targetId) {
            console.log('[Archive] AI 결 생성 완료, 저장 중...');
            await saveAiText(targetId, 'ai_result', text);
          }
        } catch {
          if (!cancelled) {
            setGaulError(true);
            setGaulLoading(false);
          }
        }
      }

      // 편지 (letter)
      if (savedAiLetter) {
        if (!cancelled) {
          setLetterText(savedAiLetter);
          setLetterLoading(false);
        }
      } else {
        setLetterLoading(true);
        try {
          const text = await generateLetter(nickname || '여행자', effectiveKey, secondKey);
          if (!cancelled) {
            setLetterText(text);
            setLetterLoading(false);
          }
          if (targetId) {
            console.log('[Archive] AI 편지 생성 완료, 저장 중...');
            await saveAiText(targetId, 'ai_letter', text);
          }
        } catch {
          if (!cancelled) {
            setLetterError(true);
            setLetterLoading(false);
          }
        }
      }

      // 관계 나침반 (relation) — 탐험권 플러스 전용
      if (isPlus) {
        if (savedAiRelation) {
          if (!cancelled) {
            setRelationText(savedAiRelation);
            setRelationLoading(false);
          }
        } else {
          setRelationLoading(true);
          try {
            const text = await generateRelation(nickname || '여행자', effectiveKey, secondKey);
            if (!cancelled) {
              setRelationText(text);
              setRelationLoading(false);
            }
            if (targetId) {
              console.log('[Archive] AI 관계 나침반 생성 완료, 저장 중...');
              await saveAiText(targetId, 'ai_relation', text);
            }
          } catch {
            if (!cancelled) {
              setRelationError(true);
              setRelationLoading(false);
            }
          }
        }
      } else {
        setRelationLoading(false);
        setGrowthLoading(false);
      }

      // 성장 나침반 (growth) — 탐험권 플러스 전용
      if (isPlus) {
        if (savedAiGrowth) {
          if (!cancelled) {
            setGrowthText(savedAiGrowth);
            setGrowthLoading(false);
          }
        } else {
          setGrowthLoading(true);
          try {
            const text = await generateGrowth(nickname || '여행자', effectiveKey, secondKey);
            if (!cancelled) {
              setGrowthText(text);
              setGrowthLoading(false);
            }
            if (targetId) {
              console.log('[Archive] AI 성장 나침반 생성 완료, 저장 중...');
              await saveAiText(targetId, 'ai_growth', text);
            }
          } catch {
            if (!cancelled) {
              setGrowthError(true);
              setGrowthLoading(false);
            }
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [RESULT, effectiveKey, secondKey, nickname, selectedResultId]);

  const isPlusUser = productType === 'expedition_plus' || productType === '탐험권+추가질문';

  // 질문 로드 — result_id 기준으로 questions 테이블에서 question_history 불러오기
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const targetId = selectedResultId;
      if (!targetId) {
        const results = await fetchUserResults(user.id);
        if (cancelled || results.length === 0) return;
        const latest = results[0];
        console.log('[Payment] 선택된 result_id 없음, 최신 결과 사용:', latest.id);
        return;
      }
      console.log('[Payment] 현재 user_id:', user.id);
      console.log('[Payment] 클릭한 result_id:', targetId);

      // result_id 기준으로 정확히 조회 (fallback 없음 — remaining_count 초기화 방지)
      const qRow = await fetchQuestions(user.id, targetId);

      console.log('[Payment] 테이블에서 불러온 횟수:', qRow?.remaining_count ?? 0);
      console.log('[Payment] 저장된 질문 내역:', qRow?.question_history ?? []);
      if (!cancelled) {
        setQuestionRow(qRow);
        setHistory(qRow?.question_history ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, selectedResultId]);

  const remainingCount = questionRow?.remaining_count ?? 0;

  const handleAsk = async () => {
    if (!question.trim() || !questionRow || questionRow.remaining_count <= 0 || !effectiveKey) return;
    setIsAsking(true);
    setAskError(false);
    try {
      // 이전 대화 내역을 context로 전달
      const historyContext = history.map((h) => ({ question: h.question, answer: h.answer }));
      const text = await answerQuestion(nickname || '여행자', effectiveKey, secondKey, question.trim(), historyContext);

      const entry: QuestionHistoryEntry = {
        question: question.trim(),
        answer: text,
        created_at: new Date().toISOString(),
      };
      const okHistory = await appendQuestionHistory(questionRow.id, entry);
      if (okHistory) {
        setHistory((prev) => [...prev, entry]);
      }

      const ok = await decrementQuestion(questionRow.id, questionRow.remaining_count);
      if (ok) {
        setQuestionRow({ ...questionRow, remaining_count: questionRow.remaining_count - 1 });
      }
      setQuestion('');
    } catch {
      setAskError(true);
    } finally {
      setIsAsking(false);
    }
  };

  const handleShareSelection = (includeFullContent: boolean) => {
    if (!RESULT || !effectiveKey || !selectedResultId) return;
    const scope = includeFullContent ? 'full' : 'basic';
    const scopedUrl = buildResultShareUrl(selectedResultId, scope);
    setShareContent({ linkUrl: scopedUrl });
    setShowShareChoiceModal(false);
    setShowShareModal(true);
  };

  if (!RESULT) {
    return (
      <PageContainer className="bg-base">
        <div className="flex items-center justify-center flex-1 min-h-0">
          <p className="font-batang text-sm text-text-sub">결과를 불러오고 있어요...</p>
        </div>
      </PageContainer>
    );
  }

  const renderGaul = () => {
    if (gaulLoading) {
      return (
        <p className="font-batang text-sm text-text-sub leading-relaxed text-center py-4">
          당신의 결을 읽어가는 중이에요...
        </p>
      );
    }
    if (gaulError || !gaulText) {
      return (
        <p className="font-batang text-sm text-text-sub leading-relaxed text-center py-4">
          지금은 결을 만들기 어려워요. 잠시 후 다시 확인해줘.
        </p>
      );
    }
    const firstFeature = RESIDENT_FEATURES[effectiveKey!];
    const firstParticle = hasFinalConsonant(firstFeature) ? '과' : '와';
    const secondFeature = RESIDENT_FEATURES[secondKey];
    const secondParticle = hasFinalConsonant(secondFeature) ? '이' : '가';
    const combinationLine = `${RESULT.name}의 ${firstFeature}${firstParticle} ${getResidentProfile(secondKey).name}의 ${secondFeature}${secondParticle} 만나 당신만의 결이 됩니다.`;
    return (
      <div>
        <p className="font-batang text-xs text-text-sub leading-relaxed mb-3">
          {combinationLine}
        </p>
        <p className="font-batang text-sm text-text leading-loose whitespace-pre-line">
          {gaulText}
        </p>
      </div>
    );
  };

  const renderLetter = () => {
    if (letterLoading) {
      return (
        <p className="font-batang text-sm text-text-sub leading-relaxed text-center py-4">
          루가 편지를 쓰고 있어요...
        </p>
      );
    }
    if (letterError || !letterText) {
      return (
        <p className="font-batang text-sm text-text-sub leading-relaxed text-center py-4">
          지금은 편지를 쓰기 어려워요. 잠시 후 다시 확인해줘.
        </p>
      );
    }
    return (
      <p className="font-batang text-sm text-text leading-loose whitespace-pre-line">
        {letterText}
      </p>
    );
  };

  const renderRelation = () => {
    if (relationLoading) {
      return (
        <p className="font-batang text-sm text-text-sub leading-relaxed text-center py-4">
          당신이 함께 걷는 방법을 찾는 중이에요...
        </p>
      );
    }
    if (relationError || !relationText) {
      return (
        <p className="font-batang text-sm text-text-sub leading-relaxed text-center py-4">
          지금은 글을 만들기 어려워요. 잠시 후 다시 확인해줘.
        </p>
      );
    }
    return (
      <p className="font-batang text-sm text-text leading-loose whitespace-pre-line">
        {relationText}
      </p>
    );
  };

  const renderGrowth = () => {
    if (growthLoading) {
      return (
        <p className="font-batang text-sm text-text-sub leading-relaxed text-center py-4">
          당신의 빛을 키우는 방법을 찾는 중이에요...
        </p>
      );
    }
    if (growthError || !growthText) {
      return (
        <p className="font-batang text-sm text-text-sub leading-relaxed text-center py-4">
          지금은 글을 만들기 어려워요. 잠시 후 다시 확인해줘.
        </p>
      );
    }
    return (
      <p className="font-batang text-sm text-text leading-loose whitespace-pre-line">
        {growthText}
      </p>
    );
  };

  return (
    <PageContainer className="bg-base">
      <div className="flex-1">
        <div className="px-4 sm:px-6 pt-10 pb-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 pr-14 sm:pr-0">
            {previousPage === 'archive' ? (
              <button
                onClick={() => setCurrentPage('archive')}
                className="text-sm font-sans text-text-sub hover:text-text transition-colors"
              >
                ← 보관함으로
              </button>
            ) : (
              <button
                onClick={() => setCurrentPage('landing')}
                className="font-playfair text-sm font-bold tracking-[0.12em] text-text-sub hover:text-text transition-colors"
              >
                MERRIWEATHER
              </button>
            )}
            <p className="font-sans text-xs text-text-sub text-right max-w-[200px] leading-relaxed">
              현재 가오픈 기간으로 공유 기능은 잠시 후 오픈될 예정이에요.
            </p>
          </div>

          {/* Resident card */}
          <div className="flex flex-col items-center mb-8 animate-fadeUp">
            {RESIDENT_IMAGES[effectiveKey!] ? (
              <ResidentFlipCard
                frontImage={RESIDENT_IMAGES[effectiveKey!]}
                alt={RESULT.name}
              />
            ) : (
              <div
                className="relative overflow-hidden flex flex-col items-center justify-center"
                style={{
                  width: '280px',
                  height: '380px',
                  border: '2px solid #C9A84C',
                  borderRadius: '12px',
                  background: '#f5f0e0',
                }}
              >
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-golden/80 rounded-full text-[10px] font-sans text-text">
                  MERRIWEATHER
                </div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-b from-point-light/50 to-point/40 flex items-center justify-center mb-4 shadow-inner">
                  <span className="text-4xl">{RESULT.emoji}</span>
                </div>
                <p className="text-xs font-sans text-text-sub mb-1">주민등록증</p>
                <p className="font-batang text-lg text-text">{RESULT.name}</p>
                <p className="text-[10px] font-sans text-text-sub mt-1">No. {nickname || 'GUEST'}-001</p>
              </div>
            )}
          </div>

          {/* Name + intro */}
          <div className="text-center mb-8 animate-fadeUp" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <h1 className="font-batang text-3xl text-text mb-2">{RESULT.name}</h1>
            <p className="font-sans text-sm text-text-sub">{RESULT.intro}</p>
          </div>

          {/* All 10 premium sections */}
          {RESULT.premium.map((section, idx) => {
            const delay = `${0.3 + idx * 0.1}s`;
            const isGaul = section.title === '당신 안에 흐르는 결';
            const isLetter = section.title === '루의 편지';
            const isQuestion = section.title === '루에게 질문하기';
            const isRelation = section.title === '관계 속의 당신';
            const isGrowthSection = section.title === '당신이 성장하는 방식';

            return (
              <>
              <div key={idx} className="mb-8 animate-fadeUp" style={{ animationDelay: delay, opacity: 0 }}>
                {isQuestion ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-batang text-lg text-point-dark">루에게 질문하기</h2>
                      <span className="text-xs font-sans text-text-sub">
                        남은 횟수 {remainingCount}회
                      </span>
                    </div>
                    <div className="p-5 bg-white rounded-xl border border-[#E0DDD8] overflow-hidden">
                      {/* 대화 내역 (위에서 아래로 쌓임) */}
                      {history.length > 0 && (
                        <div className="mb-4 space-y-4">
                          {history.map((h, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex justify-end">
                                <div className="max-w-[80%] px-4 py-2.5 bg-point/10 rounded-2xl rounded-tr-md">
                                  <p className="font-sans text-sm text-text leading-relaxed">{h.question}</p>
                                </div>
                              </div>
                              <div className="flex justify-start">
                                <div className="max-w-[80%] px-4 py-2.5 bg-base rounded-2xl rounded-tl-md border border-[#E0DDD8]">
                                  <p className="font-batang text-sm text-text leading-relaxed whitespace-pre-line">{h.answer}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {isAsking && (
                            <div className="flex justify-start">
                              <div className="px-4 py-2.5 bg-base rounded-2xl rounded-tl-md border border-[#E0DDD8]">
                                <p className="font-batang text-sm text-text-sub">루가 생각하는 중이에요...</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isAsking && history.length === 0 && (
                        <div className="flex justify-start mb-4">
                          <div className="px-4 py-2.5 bg-base rounded-2xl rounded-tl-md border border-[#E0DDD8]">
                            <p className="font-batang text-sm text-text-sub">루가 생각하는 중이에요...</p>
                          </div>
                        </div>
                      )}

                      {askError && (
                        <p className="font-batang text-sm text-text-sub leading-relaxed text-center py-4">
                          지금은 답하기 어려워요. 잠시 후 다시 시도해줘.
                        </p>
                      )}

                      {/* 남은 횟수 0 + 내역 없음 안내 */}
                      {remainingCount <= 0 && !isAsking && history.length === 0 && !askError && (
                        <p className="font-batang text-sm text-text-sub text-center py-4">
                          남은 질문 횟수가 없어요. 추가 질문권을 구매하면 더 물어볼 수 있어요.
                        </p>
                      )}

                      {/* 질문 입력창 */}
                      {remainingCount > 0 ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="루에게 물어보고 싶은 것을 적어줘"
                            className="flex-1 box-border px-4 py-3 text-sm font-sans text-text bg-base rounded-xl border border-[#E0DDD8] focus:border-point focus:outline-none transition-colors"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAsk();
                            }}
                          />
                          <button
                            onClick={handleAsk}
                            disabled={isAsking || !question.trim()}
                            className="px-4 py-3 bg-point text-white rounded-xl font-sans text-sm
                                       transition-all duration-300 hover:bg-point-dark active:scale-95
                                       disabled:opacity-40 disabled:cursor-not-allowed
                                       flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        /* 남은 횟수 0 — 추가 질문 결제 버튼 */
                        <button
                          onClick={() => setShowExtraModal(true)}
                          className="w-full py-3.5 bg-point/10 text-point-dark rounded-xl font-sans font-medium text-sm
                                     border border-point/30 transition-all duration-300 hover:bg-point/15 active:scale-95
                                     flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          루에게 추가 질문 3회 1,990원
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="font-batang text-lg text-point-dark mb-4 flex items-center gap-2">
                      {section.ai && <Sparkles className="w-4 h-4" />}
                      {section.title}
                    </h2>
                    <div className={isLetter ? 'p-6 bg-letter rounded-2xl border border-[#E0DDD8]' : 'p-5 bg-white rounded-xl border border-[#E0DDD8]'}>
                      {isGaul ? renderGaul() : isLetter ? renderLetter() : (
                        <p className="font-batang text-sm text-text leading-loose whitespace-pre-line">
                          {withNickname(section.body, nickname || '여행자')}
                        </p>
                      )}
                    </div>

                  </>
                )}
              </div>
              {/* 관계 나침반 — 탐험권 플러스 전용 */}
              {isPlusUser && isRelation && (
                <div className="mb-8 animate-fadeUp" style={{ animationDelay: `${0.3 + (idx + 1) * 0.1}s`, opacity: 0 }}>
                  <h2 className="font-batang text-lg text-point-dark mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    당신이 함께 걷는 법
                  </h2>
                  <div className="p-5 bg-white rounded-xl border border-[#E0DDD8]">
                    {renderRelation()}
                  </div>
                </div>
              )}
              {/* 성장 나침반 — 탐험권 플러스 전용 */}
              {isPlusUser && isGrowthSection && (
                <div className="mb-8 animate-fadeUp" style={{ animationDelay: `${0.3 + (idx + 1) * 0.1}s`, opacity: 0 }}>
                  <h2 className="font-batang text-lg text-point-dark mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    당신의 빛을 키우는 방법
                  </h2>
                  <div className="p-5 bg-white rounded-xl border border-[#E0DDD8]">
                    {renderGrowth()}
                  </div>
                </div>
              )}
              </>
            );
          })}

          {/* Gift button */}
          <div className="mb-6 animate-fadeUp" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <button
              onClick={() => setCurrentPage('gift')}
              className="w-full py-3.5 bg-white text-point-dark rounded-2xl font-sans font-medium text-sm
                         border border-point shadow-sm transition-all duration-300 hover:bg-point/5 hover:shadow-md active:scale-95
                         flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              소중한 사람에게 선물하기
            </button>
          </div>

          {/* Restart link */}
          <div className="text-center pb-4">
            <button
              onClick={restart}
              className="font-sans text-sm text-text-sub hover:text-text transition-colors underline-offset-4 hover:underline"
            >
              다시 여행하기
            </button>
          </div>

          {/* AI 생성 안내 */}
          <p className="font-sans text-xs text-text-sub/70 mt-4 text-center leading-relaxed">
            {isPlusUser
              ? '당신 안에 흐르는 결, 루의 편지, 당신이 함께 걷는 법, 당신의 빛을 키우는 방법은 AI가 결과를 바탕으로 생성하기 때문에 시간이 조금 걸릴 수 있어요.\n바로 뜨지 않는다면 잠시만 기다려주세요.'
              : '당신 안에 흐르는 결과 루의 편지는 AI가 결과를 바탕으로 생성하기 때문에 시간이 조금 걸릴 수 있어요. 바로 뜨지 않는다면 잠시만 기다려주세요'}
          </p>

          {/* Non-logged-in notice */}
          {!user && (
            <div className="mt-6 rounded-2xl bg-[#FFF8E7] border border-[#E5D9B6] px-4 py-3">
              <p className="font-sans text-xs text-text-sub leading-relaxed text-center">
                결과를 저장하고 싶다면 카카오 로그인을 해주세요.
                <br />
                보관함에서 언제든 다시 볼 수 있어요.
              </p>
            </div>
          )}

          {/* Review invitation */}
          <div className="mt-8 p-5 bg-point/5 rounded-2xl border border-point/20 text-center">
            <p className="font-batang text-sm text-text leading-relaxed mb-3 whitespace-pre-line">
              여행은 어떠셨나요? ✨{'\n'}여행자 광장에 후기를 남겨주세요 :)
            </p>
            <button
              onClick={() => setCurrentPage('travelPlaza')}
              className="px-6 py-2.5 bg-white text-point-dark rounded-full font-sans text-xs font-medium
                         border border-point/40 transition-all duration-300 hover:bg-point/10 hover:border-point active:scale-95"
            >
              후기 남기기
            </button>
          </div>
        </div>
      </div>

      {showExtraModal && (
        <ExtraQuestionsModal open={showExtraModal} onClose={() => setShowExtraModal(false)} />
      )}
      <PremiumShareChoiceModal
        open={showShareChoiceModal}
        onClose={() => setShowShareChoiceModal(false)}
        onSelect={handleShareSelection}
      />
      {shareContent && (
        <ShareModal
          open={showShareModal}
          content={shareContent}
          cardImage={effectiveKey ? RESIDENT_IMAGES[effectiveKey] : undefined}
          cardName={RESULT?.name}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </PageContainer>
  );
}
