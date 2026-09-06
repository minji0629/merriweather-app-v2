const KAKAO_SDK_URL = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
const KAKAO_SERVICE_URL = 'https://merriweather.net';
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


  if (window.Kakao) {
    if (!window.Kakao.isInitialized() && KAKAO_JS_KEY) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
    return;
  }

  if (loadingPromise) {
    await loadingPromise;
    return;
  }

  loadingPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => {
      if (window.Kakao && KAKAO_JS_KEY) {
        window.Kakao.init(KAKAO_JS_KEY);
      } else {
      }
      resolve();
    };
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('Kakao SDK 로드 실패'));
    };
    document.head.appendChild(script);
  });

  await loadingPromise;
}

export interface KakaoGiftShareParams {
  senderName: string;
  receiverName: string;
  giftCode: string;
  giftPageUrl: string;
  homeUrl: string;
  imageUrl: string;
}

export async function shareGiftViaKakao(params: KakaoGiftShareParams): Promise<void> {
  const giftPageUrl = `${KAKAO_SERVICE_URL}/gift?code=${encodeURIComponent(params.giftCode)}`;
  const homeUrl = KAKAO_SERVICE_URL;
  const imageUrl = `${KAKAO_SERVICE_URL}/landing-bg.png`;


  try {
    await loadKakaoSDK();
  } catch (err) {
    throw err;
  }


  if (!window.Kakao) {
    throw new Error('Kakao SDK를 사용할 수 없어요. (window.Kakao 없음)');
  }

  if (!window.Kakao.isInitialized()) {
    throw new Error('Kakao SDK가 초기화되지 않았어요.');
  }

  const description = `${params.senderName}님이 ${params.receiverName}님께 선물을 보냈어요.`;
  const shareOptions = {
    objectType: 'feed' as const,
    content: {
      title: '메리웨더 선물이 도착했어요 🎁',
      description,
      imageUrl,
      link: {
        mobileWebUrl: giftPageUrl,
        webUrl: giftPageUrl,
      },
    },
    buttons: [
      {
        title: '선물 페이지 확인하기',
        link: {
          mobileWebUrl: giftPageUrl,
          webUrl: giftPageUrl,
        },
      },
      {
        title: '메리웨더 시작하기',
        link: {
          mobileWebUrl: homeUrl,
          webUrl: homeUrl,
        },
      },
    ],
  };


  try {
    window.Kakao.Share.sendDefault(shareOptions);
  } catch (err) {
    throw err;
  }
}
