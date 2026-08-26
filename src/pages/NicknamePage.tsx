import { useState } from 'react';
import { useApp } from '@/store/useApp';
import { PageContainer } from '@/components/PageContainer';
import { ArrowRight } from '@/components/Icons';

export function NicknamePage() {
  const { setNickname, setCurrentPage } = useApp();
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      setNickname(input.trim());
      setCurrentPage('transition');
    }
  };

  return (
    <PageContainer className="bg-gradient-to-b from-[#FAF8F5] to-[#D4F0D0]" footer={false}>
      <div className="relative flex flex-col items-center flex-1 min-h-0 px-6 pt-32 pb-12">
        {/* Title */}
        <div className="text-center animate-fadeUp">
          <h2 className="font-batang text-2xl text-text leading-relaxed">
            당신의 이름을<br />알려주세요.
          </h2>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Input */}
        <div className="w-full max-w-xs animate-fadeUp" style={{ animationDelay: '0.3s', opacity: 0 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="이름을 입력해주세요"
            maxLength={12}
            className="w-full px-5 py-4 bg-white/70 backdrop-blur-sm rounded-2xl font-sans text-base text-text
                       placeholder:text-text-sub/50 border border-white/60 shadow-sm
                       focus:bg-white focus:border-point focus:shadow-md transition-all duration-300"
          />
        </div>

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="group mt-6 w-full max-w-xs flex items-center justify-center gap-2 px-8 py-4 rounded-full font-sans font-medium text-base
                     transition-all duration-300 animate-fadeUp
                     disabled:opacity-40 disabled:cursor-not-allowed
                     enabled:bg-text enabled:text-white enabled:hover:shadow-xl enabled:hover:scale-[1.02] enabled:active:scale-95"
          style={{ animationDelay: '0.5s', opacity: 0 }}
        >
          메리웨더로 들어가기
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="h-8" />
      </div>
    </PageContainer>
  );
}
