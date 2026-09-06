const MARKETING_KEY = 'merriweather_marketing_consented';
const MARKETING_DETAIL_KEY = 'merriweather_marketing_detail';
const RETURN_PAGE_KEY = 'merriweather_return_page';
const USER_ID_KEY = 'merriweather_user_id';
const PENDING_PURCHASE_KEY = 'merriweather_pending_purchase';
const RESULT_ID_KEY = 'merriweather_result_id';

export interface PendingPurchase {
  impUid: string;
  merchantUid: string;
  amount: number;
  productType: string;
}

export function hasMarketingConsent(): boolean {
  return localStorage.getItem(MARKETING_KEY) === 'true';
}

export function setMarketingConsented(value: boolean) {
  localStorage.setItem(MARKETING_KEY, value ? 'true' : 'false');
}

export function loadMarketingDetail(): { kakao: boolean; email: boolean } {
  try {
    const raw = localStorage.getItem(MARKETING_DETAIL_KEY);
    if (raw) return JSON.parse(raw) as { kakao: boolean; email: boolean };
  } catch {
    // ignore
  }
  return { kakao: false, email: false };
}

export function saveMarketingDetail(consent: { kakao: boolean; email: boolean }) {
  localStorage.setItem(MARKETING_DETAIL_KEY, JSON.stringify(consent));
}

export function saveReturnPage(page: string) {
  try { localStorage.setItem(RETURN_PAGE_KEY, page); } catch { /* ignore */ }
  try { sessionStorage.setItem(RETURN_PAGE_KEY, page); } catch { /* ignore */ }
  try {
    document.cookie = `${RETURN_PAGE_KEY}=${encodeURIComponent(page)};path=/;max-age=3600;SameSite=Lax`;
  } catch { /* ignore */ }
}

export function loadReturnPage(): string | null {
  // 1. localStorage
  try {
    const local = localStorage.getItem(RETURN_PAGE_KEY);
    if (local) return local;
  } catch { /* ignore */ }
  // 2. sessionStorage
  try {
    const session = sessionStorage.getItem(RETURN_PAGE_KEY);
    if (session) return session;
  } catch { /* ignore */ }
  // 3. cookie
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${RETURN_PAGE_KEY}=([^;]*)`));
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch { /* ignore */ }
  return null;
}

export function clearReturnPage() {
  try { localStorage.removeItem(RETURN_PAGE_KEY); } catch { /* ignore */ }
  try { sessionStorage.removeItem(RETURN_PAGE_KEY); } catch { /* ignore */ }
  try {
    document.cookie = `${RETURN_PAGE_KEY}=;path=/;max-age=0`;
  } catch { /* ignore */ }
}

export function saveUserId(userId: string) {
  localStorage.setItem(USER_ID_KEY, userId);
}

export function loadUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function clearUserId() {
  localStorage.removeItem(USER_ID_KEY);
}

export function savePendingPurchase(purchase: PendingPurchase) {
  localStorage.setItem(PENDING_PURCHASE_KEY, JSON.stringify(purchase));
}

export function loadPendingPurchase(): PendingPurchase | null {
  try {
    const raw = localStorage.getItem(PENDING_PURCHASE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingPurchase;
  } catch {
    return null;
  }
}

export function clearPendingPurchase() {
  localStorage.removeItem(PENDING_PURCHASE_KEY);
}

export function saveResultId(resultId: string) {
  localStorage.setItem(RESULT_ID_KEY, resultId);
}

export function loadResultId(): string | null {
  return localStorage.getItem(RESULT_ID_KEY);
}

export function clearResultId() {
  localStorage.removeItem(RESULT_ID_KEY);
}

const GIFT_INFO_KEY = 'merriweather_gift_info';

export interface GiftInfo {
  recipient: string;
  message: string;
}

export function saveGiftInfo(info: GiftInfo) {
  localStorage.setItem(GIFT_INFO_KEY, JSON.stringify(info));
}

export function loadGiftInfo(): GiftInfo | null {
  try {
    const raw = localStorage.getItem(GIFT_INFO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GiftInfo;
  } catch {
    return null;
  }
}

export function clearGiftInfo() {
  localStorage.removeItem(GIFT_INFO_KEY);
}
const PRE_LOGIN_RESULT_KEY = 'merriweather_pre_login_result';

export interface PreLoginResult {
  resultId: string;
  residentKey: string;
}

export function savePreLoginResult(data: PreLoginResult) {
  localStorage.setItem(PRE_LOGIN_RESULT_KEY, JSON.stringify(data));
}

export function loadPreLoginResult(): PreLoginResult | null {
  try {
    const raw = localStorage.getItem(PRE_LOGIN_RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PreLoginResult;
  } catch {
    return null;
  }
}

export function clearPreLoginResult() {
  localStorage.removeItem(PRE_LOGIN_RESULT_KEY);
}
