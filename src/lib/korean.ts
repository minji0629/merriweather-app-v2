/**
 * 한국어 닉네임의 마지막 글자 받침 여부를 확인한다.
 * 받침이 있으면 true, 없으면 false.
 * 한글 음절(U+AC00~U+D7A3)만 판별하며, 한글이 아닌 글자는 받침이 없는 것으로 간주한다.
 */
export function hasFinalConsonant(word: string): boolean {
  if (!word) return false;
  const last = word[word.length - 1];
  const code = last.charCodeAt(0);
  const HANGUL_START = 0xac00;
  const HANGUL_END = 0xd7a3;
  if (code < HANGUL_START || code > HANGUL_END) return false;
  return (code - HANGUL_START) % 28 !== 0;
}

/**
 * 닉네임에 올바른 호칭 접미사(-아 / -야)를 붙여 반환한다.
 * 받침이 있으면 -아, 없으면 -야.
 */
export function vocative(nickname: string): string {
  const name = nickname || '여행자';
  return hasFinalConsonant(name) ? `${name}아` : `${name}야`;
}
