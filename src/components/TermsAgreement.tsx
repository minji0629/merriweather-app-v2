import { Check } from '@/components/Icons';

interface TermsAgreementProps {
  agreed: boolean;
  onChange: (agreed: boolean) => void;
}

export function TermsAgreement({ agreed, onChange }: TermsAgreementProps) {
  return (
    <div className="flex items-start gap-2.5">
      <button
        onClick={() => onChange(!agreed)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5
                    ${agreed ? 'border-point bg-point' : 'border-[#C8C4BE] bg-white'}`}
      >
        {agreed && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1">
        <button
          onClick={() => onChange(!agreed)}
          className="font-sans text-xs text-text-sub text-left leading-relaxed"
        >
          <span className="text-point-dark underline">이용약관</span>
          {' 및 '}
          <span className="text-point-dark underline">개인정보처리방침</span>
          에 동의합니다.
        </button>
      </div>
    </div>
  );
}
