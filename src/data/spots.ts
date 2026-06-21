import { HealingSpot } from '../types';

const exampleImage = new URL('../assets/images/regenerated_image_1781956395816.png', import.meta.url).href;

export const INITIAL_SPOTS: HealingSpot[] = [
  {
    id: 'spot-example-1',
    title: '[예시] 뒷뜰의 뜨락온',
    author: '미술샘',
    role: '선생님',
    category: '정원',
    imageUrl: exampleImage,
    likes: 15,
    description: "당정중학교 뒷뜰에 위치한 아름답고 평온한 정원 '뜨락온'입니다. 동글동글 예쁜 조경 식물들과 화사한 꽃들, 정교하게 놓인 디딤돌 산책로가 한데 조화를 이루어 힐링하기에 더할 나위 없이 소중한 공간이에요. 바쁜 일상 중에 가볍게 걸으며 마음의 안정을 찾고 평온한 교정의 기운을 얻어가세요.",
    locationName: '뒷뜰 뜨락 정원',
    createdAt: '2026-06-20',
    comments: [
      { id: 'c1', author: '초록나무숲', content: '푸릇푸릇하고 알록달록한 정원을 걷기만 해도 기분이 맑아집니다! 🌱', createdAt: '2026-06-20' }
    ]
  }
];
