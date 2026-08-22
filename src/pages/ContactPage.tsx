import { useApp } from '@/store/useApp';
import { PageContainer } from '@/components/PageContainer';
import { MessageCircle, Clock } from '@/components/Icons';

export function ContactPage() {
  const { setCurrentPage } = useApp();

  const handleKakao = () => {
    window.open('http://pf.kakao.com/_mxkcxnX', '_blank', 'noopener,noreferrer');
  };

  return (
    <PageContainer className="bg-base">
      <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0">
        <div className="px-6 pt-10 pb-10">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => setCurrentPage('landing')}
              className="font-batang text-lg text-text hover:text-point transition-colors"
            >
              MERRIWEATHER
            </button>
            <span className="font-sans text-sm text-text-sub">문의하기</span>
          </div>

          {/* Title */}
          <h1 className="font-batang text-2xl text-text mb-8 animate-fadeUp">문의하기</h1>

          {/* Content */}
          <div
            className="p-6 bg-white rounded-2xl border border-[#E0DDD8] shadow-sm animate-fadeUp"
            style={{ animationDelay: '0.1s', opacity: 0 }}
          >
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-point/15 flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-point" />
              </div>
              <p className="font-batang text-lg text-text mb-2">
                메리웨더에 대해 궁금한 점이 있으신가요?
              </p>
              <p className="font-sans text-sm text-text-sub mb-8 leading-relaxed">
                아래 버튼을 눌러 카카오톡으로 문의해주세요.
              </p>

              <button
                onClick={handleKakao}
                className="w-full py-4 bg-[#FEE500] text-[#3C1E1E] rounded-2xl font-sans font-bold text-base
                           shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-95
                           flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                카카오톡으로 문의하기
              </button>
            </div>

            <div className="my-2 h-px bg-[#E0DDD8]" />

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-text-sub flex-shrink-0" />
                <span className="font-sans text-sm text-text-sub">평일 10시 ~ 18시 운영</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-text-sub flex-shrink-0" />
                <span className="font-sans text-sm text-text-sub">답변까지 1~2일 소요될 수 있어요.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
