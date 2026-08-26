import { useEffect, useState } from 'react';
import { Check, Download, Share2, X } from '@/components/Icons';
import { SERVICE_URL, ShareContent } from '@/lib/share';

interface ShareModalProps {
  open: boolean;
  content: ShareContent;
  cardImage?: string;
  cardName?: string;
  onClose: () => void;
}

export function ShareModal({ open, content, cardImage, cardName, onClose }: ShareModalProps) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const linkUrl = content.linkUrl ?? SERVICE_URL;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    setMessage('');
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleDownloadCard = async () => {
    if (!cardImage) {
      setMessage('주민 카드 이미지를 찾을 수 없어요.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(cardImage);
      const blob = await res.blob();
      const file = new File([blob], `${cardName ?? '주민카드'}.png`, { type: blob.type || 'image/png' });

      const shareData = { files: [file] };
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setMessage('주민 카드를 공유하거나 저장할 수 있어요.');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setMessage('주민 카드를 저장했어요.');
      }
    } catch {
      setMessage('카드를 저장하지 못했어요. 다시 시도해줘.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="relative mx-4 mb-4 sm:mb-0 w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-scaleIn" onClick={(event) => event.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F0F0EE] flex items-center justify-center text-text-sub hover:bg-[#E0DDD8] transition-colors" aria-label="공유 모달 닫기">
          <X className="w-4 h-4" />
        </button>
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-point/15 flex items-center justify-center">
          <Share2 className="w-7 h-7 text-point-dark" />
        </div>
        <h2 className="font-batang text-xl text-text text-center mb-1">나의 주민 알리기</h2>
        <p className="font-sans text-xs text-text-sub text-center mb-3 break-all">{linkUrl}</p>
        <p className="font-sans text-xs text-point-dark text-center mb-5 leading-relaxed">
          지금은 프리 오픈 기간으로 주민 카드 내려받기만 가능해요.
        </p>

        <div className="space-y-2.5">
          <button onClick={handleDownloadCard} disabled={busy} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-base border border-[#E0DDD8] text-left hover:border-point hover:bg-point/5 transition-colors disabled:opacity-50">
            <span className="w-9 h-9 rounded-full bg-point/15 flex items-center justify-center text-point-dark"><Download className="w-4 h-4" /></span>
            <span>
              <strong className="block font-sans text-sm font-medium text-text">나의 주민 카드 다운받기</strong>
              <span className="block mt-0.5 font-sans text-xs text-text-sub">주민 카드 이미지를 저장해요</span>
            </span>
          </button>
        </div>

        <p className="mt-3 font-sans text-[11px] text-text-sub/70 text-center leading-relaxed">
          아이폰에서 저장이 안 된다면 결과 페이지의 주민 카드 이미지를 길게 눌러 저장해주세요.
        </p>

        {message && (
          <p className="mt-4 flex items-center justify-center gap-1.5 font-sans text-xs text-point-dark" role="status">
            <Check className="w-3.5 h-3.5" />
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
