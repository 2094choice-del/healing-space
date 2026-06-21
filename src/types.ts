export type Category = '전체' | '숲' | '정원' | '휴식 공간' | '기타';

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface HealingSpot {
  id: string;
  title: string;
  author: string;
  role: '학생' | '선생님' | '관리자' | '동아리' | string;
  category: Exclude<Category, '전체'>;
  imageUrl: string;
  likes: number;
  description: string;
  locationName: string; // e.g. "당정중 2층 복도", "후관 화단" 등
  coordinates?: {
    x: number; // 0 ~ 100 사이의 퍼센트 값 (커스텀 지도 위에 핀을 얹기 위함)
    y: number; // 0 ~ 100 사이의 퍼센트 값
  };
  comments: Comment[];
  createdAt: string;
}

export interface UserSession {
  role: 'guest' | 'studentOrTeacher' | 'admin';
  isLoggedIn: boolean;
  name?: string;
}
