export interface Choice {
  text: string;
  scores: DimensionScores;
  /** Q24 only: resident keys that get +1 weight */
  residentWeights?: ResidentKey[];
}

export interface DimensionScores {
  D1?: number;
  D2?: number;
  D3?: number;
  D4?: number;
  D5?: number;
  D6?: number;
}

export type Dimension = keyof DimensionScores;

export type ResidentKey =
  | 'guardian'
  | 'guide'
  | 'pioneer'
  | 'lightkeeper'
  | 'voyager'
  | 'wayfarer'
  | 'forestKeeper'
  | 'sculptor';

export interface Question {
  id: number;
  chapter: number;
  chapterName: string;
  question: string;
  choices: Choice[];
}

export const QUESTIONS: Question[] = [
  // ── Chapter 2 — 첫 번째 갈림길 (Q1~Q5) ──
  {
    id: 1,
    chapter: 2,
    chapterName: '첫 번째 갈림길',
    question: '설레는 마음으로 숲에 첫 발을 내딛는다.\n너는 무엇에 가장 먼저 눈길이 가?',
    choices: [
      { text: '멀리 펼쳐진 숲 전체 풍경을 눈에 담는다', scores: { D1: 2, D4: 2 } },
      { text: '어디로 이어질지, 길의 방향을 먼저 확인한다', scores: { D1: 1, D4: 1 } },
      { text: '발 밑의 작은 흔적들이 먼저 눈에 들어온다', scores: { D1: -1, D4: -1 } },
      { text: '나뭇잎 사이로 스며드는 빛의 움직임을 따라 시선이 간다', scores: { D1: -2, D4: -2 } },
    ],
  },
  {
    id: 2,
    chapter: 2,
    chapterName: '첫 번째 갈림길',
    question: '걷다 보니 앞에 갈림길이 나타난다.\n두 길은 전혀 다른 방향으로 이어져 있다.\n이 갈림길 앞에서 너는 어떻게 해?',
    choices: [
      { text: '잠시 멈춰 서서 두 길을 충분히 비교해본다', scores: { D3: 2, D5: -2 } },
      { text: '빠르게 훑어보고, 더 나아 보이는 쪽으로 결정한다', scores: { D3: -1, D5: 1 } },
      { text: '주변에 남겨진 흔적이나 단서를 먼저 살펴본다', scores: { D3: 1, D5: -1 } },
      { text: '그냥 끌리는 쪽으로, 이유 없이 발걸음이 향한다', scores: { D3: -2, D5: 2 } },
    ],
  },
  {
    id: 3,
    chapter: 2,
    chapterName: '첫 번째 갈림길',
    question: '그때, 숲 어딘가에서 작은 움직임이 느껴진다.\n그 순간 너는 어떻게 해?',
    choices: [
      { text: '즉시 멈춰 상황을 파악하려 한다', scores: { D4: -1, D5: -1 } },
      { text: '가까이 다가가 직접 확인해본다', scores: { D4: 2, D5: 2 } },
      { text: '조용히 거리를 두고 지켜본다', scores: { D4: -2, D5: -2 } },
      { text: '크게 신경 쓰지 않고 걸음을 이어간다', scores: { D4: 1, D5: 1 } },
    ],
  },
  {
    id: 4,
    chapter: 2,
    chapterName: '첫 번째 갈림길',
    question: '조금 더 걷자 커다란 나무가 쓰러져 길을 완전히 막고 있다.\n너는 어떻게 해결할 거야?',
    choices: [
      { text: '다른 길이 있는지 먼저 찾는다', scores: { D3: 1, D5: -1 } },
      { text: '직접 넘거나 치워본다', scores: { D3: -2, D5: 2 } },
      { text: '멈춰서 가장 나은 방법을 생각한다', scores: { D3: 2, D5: -2 } },
      { text: '도움을 받을 수 있는지 주변을 살핀다', scores: { D3: -1, D5: 1 } },
    ],
  },
  {
    id: 5,
    chapter: 2,
    chapterName: '첫 번째 갈림길',
    question: '갑자기 짙은 안개가 깔리기 시작한다.\n앞이 잘 보이지 않는다.\n이 순간 너는?',
    choices: [
      { text: '안개 속으로 그냥 걸어 들어간다', scores: { D1: 2, D4: 2 } },
      { text: '잠시 멈춰 주변을 탐색하며 상황을 파악한다', scores: { D1: 1, D4: -1 } },
      { text: '멈추지 않고 조심스럽게 나아간다', scores: { D1: -1, D4: 1 } },
      { text: '멈춰 서서 안개가 걷히길 기다린다', scores: { D1: -2, D4: -2 } },
    ],
  },
  // ── Chapter 3 — 오래된 흔적 (Q6~Q10) ──
  {
    id: 6,
    chapter: 3,
    chapterName: '오래된 흔적',
    question: '나무에 낡은 표지판 하나가 걸려 있다.\n글씨는 거의 지워져 알아보기 힘들다.\n너는 어떻게 할 것 같아?',
    choices: [
      { text: '누가 남겼을지 잠시 떠올려본다', scores: { D2: -1, D6: -1 } },
      { text: '왜 이렇게 됐는지 이유를 생각해본다', scores: { D2: 1, D6: 1 } },
      { text: '잠시 눈길이 가지만 발걸음은 계속 이어간다', scores: { D2: -2, D6: -2 } },
      { text: '중요하지 않다고 판단하고 지나친다', scores: { D2: 2, D6: 2 } },
    ],
  },
  {
    id: 7,
    chapter: 3,
    chapterName: '오래된 흔적',
    question: '오래전부터 수많은 사람들이\n걸어온 듯한 길이 이어지고 있다.\n발자국의 흔적이 깊게 남아 있다.\n이 길을 걸으면서 너는 어떤 쪽이야?',
    choices: [
      { text: '이 길을 걸었던 사람들을 떠올리며 따라간다', scores: { D2: -2, D6: -2 } },
      { text: '왜 이런 길이 생겼는지 생각해본다', scores: { D2: 2, D6: 2 } },
      { text: '분위기를 느끼며 천천히 걷는다', scores: { D2: -1, D6: -1 } },
      { text: '길의 흔적보다 앞으로 나아가는 데 집중한다', scores: { D2: 1, D6: 1 } },
    ],
  },
  {
    id: 8,
    chapter: 3,
    chapterName: '오래된 흔적',
    question: '숲길 바닥에 누군가 남긴 작은 표시가 눈에 띈다.\n방향처럼 보이는데, 누가 남긴 건지 알 수 없다.\n너는 어떻게 해?',
    choices: [
      { text: '다른 단서도 찾아보고 결정한다', scores: { D3: 2, D6: -1 } },
      { text: '일단 따라가보기로 한다', scores: { D3: -2, D6: -1 } },
      { text: '어떤 의미일지 생각하며 천천히 따라간다', scores: { D3: -1, D6: -2 } },
      { text: '따라가는 게 맞는 선택인지 먼저 생각한다', scores: { D3: 1, D6: 2 } },
    ],
  },
  {
    id: 9,
    chapter: 3,
    chapterName: '오래된 흔적',
    question: '표식은 계속 이어지고 있다. 끝이 보이지 않는다.\n걸으면서 어떤 생각이 들어?',
    choices: [
      { text: '이걸 남긴 사람은 어디까지 갔을까 궁금해진다', scores: { D2: -2, D6: -1 } },
      { text: '이 흔적이 어떤 의미인지 파악하고 싶어진다', scores: { D2: 2, D6: -1 } },
      { text: '끝이 어디든 걷는 것 자체가 좋다는 생각이 든다', scores: { D2: -1, D6: -2 } },
      { text: '끝이 어딘지 직접 확인하고 싶어진다', scores: { D2: 1, D6: 2 } },
    ],
  },
  {
    id: 10,
    chapter: 3,
    chapterName: '오래된 흔적',
    question: '오래된 흔적 앞에 잠시 발걸음을 멈춰 선다.\n이 순간 가장 가까운 느낌은?',
    choices: [
      { text: '누군가의 이야기를 마주한 느낌이다', scores: { D2: -2, D6: -2 } },
      { text: '이 흔적이 어떤 구조인지 궁금하다', scores: { D2: 2, D6: 2 } },
      { text: '세월의 흔적이 느껴져 인상깊다', scores: { D2: -1, D6: -1 } },
      { text: '눈길은 가지만 깊게 생각하진 않는다', scores: { D2: 1, D6: 1 } },
    ],
  },
  // ── Chapter 4 — 숲속의 쉼터 (Q11~Q15) ──
  {
    id: 11,
    chapter: 4,
    chapterName: '숲속의 쉼터',
    question: '숲 사이로 작은 쉼터가 보인다.\n몇 명의 사람들이 저마다의 방식으로 쉬고 있다.\n이런 공간에 들어서면 너는 보통 어떻게 해?',
    choices: [
      { text: '자연스럽게 사람들 사이로 들어간다', scores: { D1: 2, D5: 2 } },
      { text: '먼저 전체적인 분위기를 살피고 들어간다', scores: { D1: 1, D5: -1 } },
      { text: '조용히 한쪽에 자리잡고 상황을 지켜본다', scores: { D1: -1, D5: -2 } },
      { text: '사람들과 어울리기보다 혼자 편한 자리를 찾는다', scores: { D1: -2, D5: 1 } },
    ],
  },
  {
    id: 12,
    chapter: 4,
    chapterName: '숲속의 쉼터',
    question: '쉼터에 잠시 자리를 잡는다.\n낯선 사람들과 같은 공간에 있다.\n사람들 사이에서 너는 보통 어떤 편이야?',
    choices: [
      { text: '자연스럽게 사람들 속으로 섞여 든다', scores: { D1: 2, D2: -2 } },
      { text: '필요할 때만 대화에 참여한다', scores: { D1: 1, D2: -1 } },
      { text: '조용히 분위기를 읽으며 흐름을 파악한다', scores: { D1: -1, D2: 1 } },
      { text: '사람들 속에서도 혼자만의 시간을 갖는 편이다', scores: { D1: -2, D2: 2 } },
    ],
  },
  {
    id: 13,
    chapter: 4,
    chapterName: '숲속의 쉼터',
    question: '그때 옆에 있던 누군가가 조심스럽게 말을 건넨다.\n이럴 때 너는 어떻게 반응해?',
    choices: [
      { text: '자연스럽게 대화 속으로 들어간다', scores: { D1: 2, D2: -1 } },
      { text: '먼저 듣고, 상대에 맞춰 천천히 반응한다', scores: { D1: 1, D2: -2 } },
      { text: '짧게 반응하며 상대를 조용히 살핀다', scores: { D1: -1, D2: 1 } },
      { text: '필요한 말만 나누고 대화를 마무리한다', scores: { D1: -2, D2: 2 } },
    ],
  },
  {
    id: 14,
    chapter: 4,
    chapterName: '숲속의 쉼터',
    question: '쉬는 사이 예상보다 시간이 많이 흘렀다.\n원래 계획대로 움직이기 어려울 것 같다.\n너는 어떻게 해?',
    choices: [
      { text: '바로 일어나 계획을 다시 조정하고 움직인다', scores: { D3: 2, D5: 2 } },
      { text: '잠깐 멈추고 어떻게 하면 좋을지 먼저 생각해본다', scores: { D3: 1, D5: -1 } },
      { text: '계획보다 지금 이 순간이 더 중요하다고 생각한다', scores: { D3: -1, D5: -2 } },
      { text: '일단 움직이면서 상황에 맞게 맞춰간다', scores: { D3: -2, D5: 1 } },
    ],
  },
  {
    id: 15,
    chapter: 4,
    chapterName: '숲속의 쉼터',
    question: '옆에 앉아 있던 누군가가 힘든 감정을 털어놓기 시작한다.\n이럴 때 너는 어떻게 해?',
    choices: [
      { text: '적극적으로 공감하며 함께 이야기를 나눈다', scores: { D1: 2, D6: -2 } },
      { text: '조용히 옆에 있어주는 것으로 충분하다', scores: { D1: -2, D6: -1 } },
      { text: '어떻게 해결할 수 있을지 함께 찾아본다', scores: { D1: 1, D6: 2 } },
      { text: '속으로 어떻게 하면 나아질지 방법을 떠올린다', scores: { D1: -1, D6: 1 } },
    ],
  },
  // ── Chapter 5 — 깊은 숲 (Q16~Q20) ──
  {
    id: 16,
    chapter: 5,
    chapterName: '깊은 숲',
    question: '점점 깊은 숲으로 들어가다,\n어느 순간 길이 두 갈래로 나뉜다.\n하나는 사람들이 많이 지나간 넓은 길,\n하나는 발자국이 거의 없는 좁은 길.\n너는 어느 쪽으로 발걸음이 향할 것 같아?',
    choices: [
      { text: '흔적이 넓게 남아 있는 길로 간다', scores: { D4: -2, D5: -1 } },
      { text: '발자국이 거의 없는 길로 들어가본다', scores: { D4: 2, D5: 2 } },
      { text: '두 길을 비교하면서 더 나은 방향을 판단한다', scores: { D4: -1, D5: -2 } },
      { text: '딱히 이유 없이 끌리는 쪽으로 발걸음이 향한다', scores: { D4: 1, D5: 1 } },
    ],
  },
  {
    id: 17,
    chapter: 5,
    chapterName: '깊은 숲',
    question: '앞에 오래된 작은 다리가 나타난다.\n발을 올리자 삐걱거리며 흔들린다.\n이 다리 앞에서 너는 어떻게 할 것 같아?',
    choices: [
      { text: '조심하며 그대로 건넌다', scores: { D4: -1, D5: 1 } },
      { text: '흔들어보고 괜찮으면 건넌다', scores: { D4: 1, D5: 2 } },
      { text: '다리 주변을 둘러보며 새로운 방법을 찾는다', scores: { D4: 2, D5: -1 } },
      { text: '충분히 살펴보고 가장 안전한 방법을 택한다', scores: { D4: -2, D5: -2 } },
    ],
  },
  {
    id: 18,
    chapter: 5,
    chapterName: '깊은 숲',
    question: '걷다 보니 다시 갈림길이다.\n표지판이 있지만 글씨가 거의 지워져\n방향만 겨우 알아볼 수 있다.\n이럴 때 너는 어떻게 해?',
    choices: [
      { text: '알아볼 수 있는 방향대로 일단 움직인다', scores: { D3: 1, D5: 2 } },
      { text: '깊게 생각하지 않고 느낌 가는 방향으로 간다', scores: { D3: -2, D5: 1 } },
      { text: '주변을 둘러보며 힌트가 될 만한 것을 찾아본다', scores: { D3: 2, D5: -1 } },
      { text: '잠시 멈춰 어느 쪽이 맞을지 천천히 따져본다', scores: { D3: -1, D5: -2 } },
    ],
  },
  {
    id: 19,
    chapter: 5,
    chapterName: '깊은 숲',
    question: '문득 정신을 차리니 일행과 떨어져 있다.\n주변은 온통 숲길이고, 방향이 잠시 헷갈린다.\n너는 가장 먼저 어떻게 해?',
    choices: [
      { text: '멈춰서 주변을 살피며 방향을 파악한다', scores: { D3: 1, D5: -1 } },
      { text: '일행이 갔을 방향을 떠올리며 바로 움직인다', scores: { D3: -1, D5: 1 } },
      { text: '왔던 길을 되짚어 다시 만날 지점을 찾는다', scores: { D3: 2, D5: 2 } },
      { text: '계속 걸으면서 자연스럽게 만나길 기다린다', scores: { D3: -2, D5: -2 } },
    ],
  },
  {
    id: 20,
    chapter: 5,
    chapterName: '깊은 숲',
    question: '걷다 보니 지름길처럼 보이는 길이 눈에 띈다.\n하지만 지형이 험하고 위험 요소가 있어 보인다.\n지금 걷고 있는 길은 익숙하지만 시간이 더 걸린다.\n너는 어떤 선택을 할 것 같아?',
    choices: [
      { text: '익숙하고 안전해 보이는 길을 선택한다', scores: { D4: -2, D5: -2 } },
      { text: '빠르게 도착할 수 있어 보이는 길을 선택한다', scores: { D4: 2, D5: 2 } },
      { text: '두 길의 장단점을 생각해보고 결정한다', scores: { D4: -1, D5: -1 } },
      { text: '위험한 길을 잠깐 살펴보고 결정한다', scores: { D4: 1, D5: 1 } },
    ],
  },
  // ── Chapter 6 — 중심의 나무 (Q21~Q25) ──
  {
    id: 21,
    chapter: 6,
    chapterName: '중심의 나무',
    question: '루의 말\n"이제 곧 숲을 떠나게 될 거야."\n"하지만 사람마다..."\n"오래도록 마음속에 남는 건 조금씩 다르더라."\n"너라면 무엇이 가장 오래 마음에 남을 것 같아?"',
    choices: [
      { text: '함께 걸으며 쌓았던 추억들', scores: { D6: -2 } },
      { text: '숲을 걸으며 새롭게 알게 된 나', scores: { D6: -1 } },
      { text: '어려운 순간마다 포기하지 않았다는 것', scores: { D6: 1 } },
      { text: '숲의 끝에 도착했다는 뿌듯함', scores: { D6: 2 } },
    ],
  },
  {
    id: 22,
    chapter: 6,
    chapterName: '중심의 나무',
    question: '루의 말\n"숲에서는..."\n"생각했던 대로 흘러가는 순간도 있었고."\n"전혀 예상하지 못한 길을 만나기도 했지."\n"그럴 때마다 사람들은 저마다 다른 모습을 보이더라."\n"너는 어떤 모습에 가장 가까울 것 같아?"',
    choices: [
      { text: '가능하면 처음 정한 계획대로 다시 길을 이어가려고 한다', scores: { D3: 2 } },
      { text: '큰 방향은 그대로 두되, 필요한 만큼만 계획을 조정한다', scores: { D3: 1 } },
      { text: '처음 계획에 얽매이지 않고, 상황에 맞는 선택을 이어간다', scores: { D3: -1 } },
      { text: '처음 계획보다 지금의 흐름을 믿고 자연스럽게 방향을 바꾼다', scores: { D3: -2 } },
    ],
  },
  {
    id: 23,
    chapter: 6,
    chapterName: '중심의 나무',
    question: '루의 말\n"이 숲에서는..."\n"가끔 누구도 예상하지 못한 일이 일어나곤 해."\n"그럴 때 사람들은 저마다 다른 방식으로 그 일을 마주하더라."\n"너는 가장 먼저 어떤 쪽으로 마음이 움직일 것 같아?"',
    choices: [
      { text: '함께 있는 사람들이 괜찮은지 먼저 살핀다', scores: { D2: -2 } },
      { text: '왜 이런 일이 생겼는지 궁금해서 알아보고 싶어진다', scores: { D2: -1 } },
      { text: '원인보다 지금 당장 어떻게 할지가 먼저다', scores: { D2: 1 } },
      { text: '다시는 이런 일이 없도록 방법을 찾고 싶어진다', scores: { D2: 2 } },
    ],
  },
  {
    id: 24,
    chapter: 6,
    chapterName: '중심의 나무',
    question: '루의 말\n"앞에는 아직 아무도 가보지 않은 길이 하나 있어."\n"꼭 가야 하는 건 아니야."\n"이 길을 바라본 순간, 가장 먼저 어떤 마음이 들 것 같아?"',
    choices: [
      {
        text: '"뭔가 재미있는 일이 기다리고 있을 것 같은데?"',
        scores: {},
        residentWeights: ['pioneer', 'voyager'],
      },
      {
        text: '"저 길에서는 어떤 사람들을 만날 수 있을까?"',
        scores: {},
        residentWeights: ['wayfarer', 'lightkeeper'],
      },
      {
        text: '"이 길이 어디로 이어지는지 알고 싶다"',
        scores: {},
        residentWeights: ['guardian', 'guide'],
      },
      {
        text: '"새로운 길보다 지금 이 순간을 더 즐기고 싶다"',
        scores: {},
        residentWeights: ['forestKeeper', 'sculptor'],
      },
    ],
  },
  {
    id: 25,
    chapter: 6,
    chapterName: '중심의 나무',
    question: '루의 말\n"숲의 끝이 보이기 시작했어."\n"이제 곧 너는 이 숲을 떠나게 될 거야."\n"뒤를 돌아보니,"\n"네가 걸어온 길은 어느새 숲속으로 천천히 사라지고 있었어."\n"그 순간, 가장 먼저 드는 마음은 뭐야?"',
    choices: [
      { text: '"끝이라기보다 또 다른 시작처럼 느껴진다"', scores: { D4: 2, D6: 1 } },
      { text: '"이 숲을 나답게 기억하고 싶다"', scores: { D4: -1, D6: -1 } },
      { text: '"걸어온 길 자체가 소중하게 느껴진다"', scores: { D4: -2, D6: -2 } },
      { text: '"여기까지 해냈다는 게 뿌듯하다"', scores: { D4: 1, D6: 2 } },
    ],
  },
];

export const TOTAL_QUESTIONS = 25;
