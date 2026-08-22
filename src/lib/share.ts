export const SERVICE_URL = 'https://merriweather-app-pql4.vercel.app';

export interface ShareContent {
  linkUrl?: string;
}

export type ShareScope = 'basic' | 'full';

export function buildResultShareUrl(resultId: string, scope: ShareScope = 'basic'): string {
  return `${SERVICE_URL}/result/${resultId}?share=${scope}`;
}

export async function shareContent(content: ShareContent): Promise<'shared' | 'cancelled' | 'unsupported'> {
  if (!navigator.share) return 'unsupported';

  const shareData: ShareData = {
    url: content.linkUrl ?? SERVICE_URL,
  };

  try {
    await navigator.share(shareData);
    return 'shared';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}

export async function copyLink(linkUrl: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(linkUrl);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = linkUrl;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }
}
