import { useEffect, useState } from 'react';
import { Check, Download, Share2, X } from '@/components/Icons';
import { SERVICE_URL, ShareContent, shareContent, copyLink } from '@/lib/share';
import { Link2 as LinkIcon } from '@/components/Icons';

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
  const [copied, setCopied] = useState(false);
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

  const handleShareLink = async () => {
    const result = await shareContent({ linkUrl });
    if (result === 'unsupported') {
      const ok = await copyLink(linkUrl);
      setMessage(ok ? '링크를 복사했어요.' : '링크 복사에 실패했어요.');
    } else if (result === 'cancelled') {
      // user cancelled — no message
    } else {
      setMessage('공유했어요.');
    }
  };

  const handleInvite = async () => {
    const result = await shareContent({ linkUrl: SERVICE_URL });
    if (result === 'unsupported') {
      const ok = await copyLink(SERVICE_URL);
      setMessage(ok ? '초대 링크를 복사했어요.' : '링크 복사에 실패했어요.');
    } else if (result === 'cancelled') {
      // user cancelled
    } else {
      setMessage('초대 링크를 공유했어요.');
    }
  };

  const handleCopyLink = async () => {
    const ok = await copyLink(linkUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        <h2 className="font-batang text-xl text-text text-center mb-5">나의 주민 알리기</h2>

        <div className="space-y-2.5">
          {/* 나의 주민 알리기 — 결과 링크 공유 */}
          <button onClick={handleShareLink} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-base border border-[#E0DDD8] text-left hover:border-point hover:bg-point/5 transition-colors">
            <span className="w-9 h-9 rounded-full bg-point/15 flex items-center justify-center text-point-dark"><Share2 className="w-4 h-4" /></span>
            <span>
              <strong className="block font-sans text-sm font-medium text-text">나의 주민 알리기</strong>
              <span className="block mt-0.5 font-sans text-xs text-text-sub">나의 결과 링크를 공유해요</span>
            </span>
          </button>

          {/* 나의 주민 카드 다운받기 */}
          <button onClick={handleDownloadCard} disabled={busy} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-base border border-[#E0DDD8] text-left hover:border-point hover:bg-point/5 transition-colors disabled:opacity-50">
            <span className="w-9 h-9 rounded-full bg-point/15 flex items-center justify-center text-point-dark"><Download className="w-4 h-4" /></span>
            <span>
              <strong className="block font-sans text-sm font-medium text-text">나의 주민 카드 다운받기</strong>
              <span className="block mt-0.5 font-sans text-xs text-text-sub">주민 카드 이미지를 저장해요</span>
            </span>
          </button>

          {/* 메리웨더로 초대하기 — 서비스 링크 공유 */}
          <button onClick={handleInvite} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-base border border-[#E0DDD8] text-left hover:border-point hover:bg-point/5 transition-colors">
            <span className="w-9 h-9 rounded-full bg-point/15 flex items-center justify-center text-point-dark"><LinkIcon className="w-4 h-4" /></span>
            <span>
              <strong className="block font-sans text-sm font-medium text-text">메리웨더로 초대하기</strong>
              <span className="block mt-0.5 font-sans text-xs text-text-sub">메리웨더 서비스 링크를 공유해요</span>
            </span>
          </button>

          {/* 링크 복사 버튼 */}
          <button onClick={handleCopyLink} className="w-full flex items-center justify-center gap-1.5 py-3 font-sans text-xs text-text-sub hover:text-point transition-colors">
            {copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : '링크 복사하기'}
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
