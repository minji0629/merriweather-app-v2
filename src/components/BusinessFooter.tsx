import { useApp } from '@/store/useApp';

export function BusinessFooter() {
  const { setCurrentPage } = useApp();
  return (
    <footer className="w-full bg-[#14140f] text-white font-sans">
      <div className="max-w-mobile mx-auto px-6 py-8 space-y-4">
        <div className="text-[11px] leading-[1.7] text-white space-y-0.5">
          <p>상호: 릴 스튜디오</p>
          <p>대표: 황민지</p>
          <p>사업자등록번호: 497-10-03495</p>
          <p>사업장 주소: 경상남도 창원시 마산회원구 회성동6길 14</p>
          <p>통신판매업 신고번호: 2026-마산회원-0219</p>
          <p>대표전화: 050-6345-9540</p>
          <p>이메일: merriweather.official@gmail.com</p>
          <p>
            문의:{' '}
            <a
              href="http://pf.kakao.com/_mxkcxnX"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/70 transition-colors"
            >
              카카오톡 채널
            </a>
          </p>
        </div>

        <div className="text-[11px] leading-[1.7] text-white pt-3 border-t border-white/10">
          <p>유선 상담은 운영하지 않습니다.</p>
          <p>문의사항은 카카오톡 채널을 통해 남겨주시면</p>
          <p>평일 10시~18시 내에 답변드립니다.</p>
        </div>

        <div className="flex gap-3 text-[11px] text-white/80 pt-1">
          <button onClick={() => setCurrentPage('terms')} className="underline hover:text-white transition-colors">
            이용약관
          </button>
          <span className="text-white/30">|</span>
          <button onClick={() => setCurrentPage('privacy')} className="underline hover:text-white transition-colors">
            개인정보처리방침
          </button>
        </div>

        <p className="text-[10px] text-white pt-2">
          © 2026 릴 스튜디오. All rights reserved.
        </p>

        <p className="text-[9px] leading-[1.5] text-white/50 whitespace-pre-line">
          릴 스튜디오에서 판매되는 모든 상품은 릴 스튜디오에서 책임지고 있습니다.{'\n'}민원 담당자: 황민지 / 050-6345-9540
        </p>
      </div>
    </footer>
  );
}
