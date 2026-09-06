const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
const KAKAO_JS_KEY = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY as string | undefined;

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: KakaoShareOptions) => void;
      };
    };
  }
}

interface KakaoShareOptions {
  objectType: 'feed';
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
}

let loadingPromise: Promise<void> | null = null;

export function isKakaoAvailable(): boolean {
  return !!KAKAO_JS_KEY;
}

export async function loadKakaoSDK(): Promise<void> {
  if (typeof window === 'undefined') return;

  console.log('[Kakao] loadKakaoSDK 시작 — KAKAO_JS_KEY:', KAKAO_JS_KEY ? `${KAKAO_JS_KEY.slice(0, 8)}...(${KAKAO_JS_KEY.length}자)` : '(없음)');

  if (window.Kakao) {
    console.log('[Kakao] SDK 이미 로드됨 — isInitialized:', window.Kakao.isInitialized());
    if (!window.Kakao.isInitialized() && KAKAO_JS_KEY) {
      console.log('[Kakao] SDK 초기화 실행');
      window.Kakao.init(KAKAO_JS_KEY);
      console.log('[Kakao] SDK 초기화 완료 — isInitialized:', window.Kakao.isInitialized());
    }
    return;
  }

  if (loadingPromise) {
    console.log('[Kakao] SDK 로드 중복 호출 감지 — 기존 로드 대기');
    await loadingPromise;
    return;
  }

  console.log('[Kakao] SDK 스크립트 동적 로드 시작:', KAKAO_SDK_URL);
  loadingPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => {
      console.log('[Kakao] SDK 스크립트 로드 완료 — window.Kakao 존재:', !!window.Kakao);
      if (window.Kakao && KAKAO_JS_KEY) {
        console.log('[Kakao] SDK 초기화 실행 (스크립트 로드 후)');
        window.Kakao.init(KAKAO_JS_KEY);
        console.log('[Kakao] SDK 초기화 완료 — isInitialized:', window.Kakao.isInitialized());
      } else {
        console.warn('[Kakao] SDK 초기화 건너뜀 — window.Kakao:', !!window.Kakao, 'KAKAO_JS_KEY:', !!KAKAO_JS_KEY);
      }
      resolve();
    };
    script.onerror = () => {
      console.error('[Kakao] SDK 스크립트 로드 실패 — URL:', KAKAO_SDK_URL);
      loadingPromise = null;
      reject(new Error('Kakao SDK 로드 실패'));
    };
    document.head.appendChild(script);
  });

  await loadingPromise;
}

export interface KakaoGiftShareParams {
  senderName: string;
  giftCode: string;
  giftPageUrl: string;
  homeUrl: string;
  imageUrl: string;
}

export async function shareGiftViaKakao(params: KakaoGiftShareParams): Promise<void> {
  console.log('[Kakao] shareGiftViaKakao 시작 — params:', {
    senderName: params.senderName,
    giftCode: params.giftCode,
    giftPageUrl: params.giftPageUrl,
    homeUrl: params.homeUrl,
    imageUrl: params.imageUrl,
  });

  try {
    await loadKakaoSDK();
  } catch (err) {
    console.error('[Kakao] loadKakaoSDK 예외:', err);
    throw err;
  }

  console.log('[Kakao] SDK 로드 후 상태 — window.Kakao:', !!window.Kakao, 'isInitialized:', window.Kakao?.isInitialized());

  if (!window.Kakao) {
    throw new Error('Kakao SDK를 사용할 수 없어요. (window.Kakao 없음)');
  }

  if (!window.Kakao.isInitialized()) {
    console.warn('[Kakao] SDK가 초기화되지 않음 — KAKAO_JS_KEY:', KAKAO_JS_KEY ? '설정됨' : '없음');
    throw new Error('Kakao SDK가 초기화되지 않았어요.');
  }

  const description = `${params.senderName}님이 선물을 보냈어요.\n선물 코드: ${params.giftCode}`;
  const shareOptions = {
    objectType: 'feed' as const,
    content: {
      title: '메리웨더 선물이 도착했어요 🎁',
      description,
      imageUrl: params.imageUrl,
      link: {
        mobileWebUrl: params.giftPageUrl,
        webUrl: params.giftPageUrl,
      },
    },
    buttons: [
      {
        title: '선물 페이지 확인하기',
        link: {
          mobileWebUrl: params.giftPageUrl,
          webUrl: params.giftPageUrl,
        },
      },
      {
        title: '메리웨더 시작하기',
        link: {
          mobileWebUrl: params.homeUrl,
          webUrl: params.homeUrl,
        },
      },
    ],
  };

  console.log('[Kakao] sendDefault 호출:', JSON.stringify(shareOptions, null, 2));

  try {
    window.Kakao.Share.sendDefault(shareOptions);
    console.log('[Kakao] sendDefault 호출 완료');
  } catch (err) {
    console.error('[Kakao] sendDefault 예외:', err);
    throw err;
  }
}
