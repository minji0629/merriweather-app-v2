import { useEffect, useState } from 'react';
import { Check, Download, Link2, Share2, Sparkles, X } from '@/components/Icons';
import { copyLink, SERVICE_URL, shareContent, ShareContent } from '@/lib/share';

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

  const handleCopy = async () => {
    setBusy(true);
    const copied = await copyLink(linkUrl);
    setMessage(copied ? '결과 링크를 복사했어요.' : '링크를 복사하지 못했어요.');
    setBusy(false);
  };

  const handleNativeShare = async () => {
    setBusy(true);
    try {
      const result = await shareContent(content);
      if (result === 'unsupported') {
        setMessage('이 기기에서는 다른 앱 공유를 지원하지 않아요. 링크 복사를 이용해줘.');
      } else if (result === 'shared') {
        setMessage('공유했어요.');
      }
    } catch {
      setMessage('공유하지 못했어요. 다시 시도해줘.');
    } finally {
      setBusy(false);
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cardName ?? '주민카드'}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('주민 카드를 저장했어요.');
    } catch {
      setMessage('카드를 저장하지 못했어요. 다시 시도해줘.');
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async () => {
    setBusy(true);
    const inviteUrl = SERVICE_URL;
    try {
      if (navigator.share) {
        await navigator.share({ url: inviteUrl, text: '메리웨더에서 나의 주민을 만나보세요.' });
        setMessage('초대 링크를 공유했어요.');
      } else {
        const copied = await copyLink(inviteUrl);
        setMessage(copied ? '초대 링크를 복사했어요.' : '링크를 복사하지 못했어요.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // user cancelled — no message
      } else {
        setMessage('공유하지 못했어요. 다시 시도해줘.');
      }
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
        <p className="font-sans text-xs text-text-sub text-center mb-5 break-all">{linkUrl}</p>

        <div className="space-y-2.5">
          <button onClick={handleDownloadCard} disabled={busy} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-base border border-[#E0DDD8] text-left hover:border-point hover:bg-point/5 transition-colors disabled:opacity-50">
            <span className="w-9 h-9 rounded-full bg-point/15 flex items-center justify-center text-point-dark"><Download className="w-4 h-4" /></span>
            <span>
              <strong className="block font-sans text-sm font-medium text-text">나의 주민 카드 다운받기</strong>
              <span className="block mt-0.5 font-sans text-xs text-text-sub">주민 카드 이미지를 저장해요</span>
            </span>
          </button>
          <button onClick={handleInvite} disabled={busy} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-point text-white text-left hover:bg-point-dark transition-colors disabled:opacity-50">
            <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"><Sparkles className="w-4 h-4" /></span>
            <span>
              <strong className="block font-sans text-sm font-medium">메리웨더로 초대하기</strong>
              <span className="block mt-0.5 font-sans text-xs text-white/75">메리웨더 링크를 공유해요</span>
            </span>
          </button>
          <button onClick={handleCopy} disabled={busy} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-base border border-[#E0DDD8] text-left hover:border-point hover:bg-point/5 transition-colors disabled:opacity-50">
            <span className="w-9 h-9 rounded-full bg-point/15 flex items-center justify-center text-point-dark"><Link2 className="w-4 h-4" /></span>
            <span>
              <strong className="block font-sans text-sm font-medium text-text">링크 복사</strong>
              <span className="block mt-0.5 font-sans text-xs text-text-sub">이 결과의 고유 링크를 복사해요</span>
            </span>
          </button>
          <button onClick={handleNativeShare} disabled={busy} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#E0DDD8] text-left hover:border-point hover:bg-point/5 transition-colors disabled:opacity-50">
            <span className="w-9 h-9 rounded-full bg-point/15 flex items-center justify-center text-point-dark"><Share2 className="w-4 h-4" /></span>
            <span>
              <strong className="block font-sans text-sm font-medium text-text">다른 앱으로 공유</strong>
              <span className="block mt-0.5 font-sans text-xs text-text-sub">휴대폰의 공유 메뉴를 열어요</span>
            </span>
          </button>
        </div>

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
