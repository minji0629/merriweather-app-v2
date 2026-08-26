export type ProductId = 'expedition' | 'expedition_plus' | 'extra_questions' | 'gift_basic' | 'gift_plus';

export interface Product {
  id: ProductId;
  name: string;
  amount: number;
  orderName: string;
}

export const PRODUCTS: Record<ProductId, Product> = {
  expedition: { id: 'expedition', name: '탐험권', amount: 4990, orderName: '메리웨더 탐험권' },
  expedition_plus: { id: 'expedition_plus', name: '탐험권 + 추가 질문 2회', amount: 6980, orderName: '메리웨더 탐험권 + 추가 질문 2회' },
  extra_questions: { id: 'extra_questions', name: '추가 질문 3회', amount: 1990, orderName: '메리웨더 추가 질문 3회' },
  gift_basic: { id: 'gift_basic', name: '선물하기 - 탐험권', amount: 4990, orderName: '메리웨더 선물 - 탐험권' },
  gift_plus: { id: 'gift_plus', name: '선물하기 - 탐험권 + 추가 질문', amount: 6980, orderName: '메리웨더 선물 - 탐험권 + 추가 질문 2회' },
};

const IMP_CODE = 'imp51603503';
const PG_PROVIDER = 'html5_inicis';

interface IamportCallback {
  success: boolean;
  error_msg?: string;
  imp_uid?: string;
  merchant_uid?: string;
}

declare global {
  interface Window {
    IMP?: {
      init: (code: string) => void;
      request_pay: (params: Record<string, unknown>, callback: (rsp: IamportCallback) => void) => void;
    };
  }
}

let initialized = false;

function ensureInit(): void {
  if (initialized) return;
  if (!window.IMP) throw new Error('포트원 SDK가 로드되지 않았습니다.');
  window.IMP.init(IMP_CODE);
  initialized = true;
}

export function requestPayment(productId: ProductId): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      ensureInit();
      const product = PRODUCTS[productId];
      const merchantUid = `merriweather-${productId}-${Date.now()}`;

      window.IMP!.request_pay(
        {
          pg: PG_PROVIDER,
          pay_method: 'card',
          merchant_uid: merchantUid,
          name: product.orderName,
          amount: product.amount,
          buyer_email: '',
          buyer_name: '',
          buyer_tel: '',
          m_redirect_url: `${window.location.origin}/payment/success`,
        },
        (rsp: IamportCallback) => {
          if (rsp.success) {
            const params = new URLSearchParams({
              imp_uid: rsp.imp_uid ?? '',
              merchant_uid: rsp.merchant_uid ?? merchantUid,
              amount: String(product.amount),
              product_id: productId,
            });
            window.location.href = `${window.location.origin}/payment/success?${params.toString()}`;
            resolve();
          } else {
            reject(new Error(rsp.error_msg ?? '결제가 취소되었거나 실패했습니다.'));
          }
        },
      );
    } catch (e) {
      reject(e instanceof Error ? e : new Error('결제 중 오류가 발생했습니다.'));
    }
  });
}
