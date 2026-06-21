import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Map as MapIcon, 
  Grid, 
  PlusCircle, 
  User, 
  Heart, 
  MessageSquare, 
  MousePointerClick, 
  Send,
  Sparkles,
  Info,
  LogOut,
  Calendar,
  Crown,
  Layers,
  MapPin,
  Check,
  ChevronRight,
  Bookmark,
  X,
  School,
  Train,
  Trees,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Waves,
  Lock,
  Edit,
  Trash2,
  Camera,
  MessageCircle
} from 'lucide-react';

import { Category, HealingSpot, UserSession } from './types';
import { INITIAL_SPOTS } from './data/spots';
import SpotCard from './components/SpotCard';
import UploadModal from './components/UploadModal';
import LoginModal from './components/LoginModal';

const CLASSIC_BGM_URL = 'https://ccrma.stanford.edu/~jos/mp3/pno-cs.mp3';

export default function App() {
  // Session Gate state
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('dangjeong_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { role: 'guest', isLoggedIn: false };
      }
    }
    return { role: 'guest', isLoggedIn: false };
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditingSpotLocation, setIsEditingSpotLocation] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Persistence state
  const [spots, setSpots] = useState<HealingSpot[]>(() => {
    const saved = localStorage.getItem('dangjeong_healing_spots_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed.map((spot: any) => ({
            ...spot,
            locationName: spot.locationName.replace('본관 뒷뜰', '뒷뜰').replace('본관 ', ''),
            description: spot.description.replace('본관 뒷뜰', '뒷뜰')
          }));
        }
      } catch (e) {
        return INITIAL_SPOTS;
      }
    }
    return INITIAL_SPOTS;
  });

  const [activeCategory, setActiveCategory] = useState<Category>('전체');
  const [viewMode, setViewMode] = useState<'gallery' | 'map'>('gallery');
  
  // High detail poetic dialog modal
  const [detailSpotModal, setDetailSpotModal] = useState<HealingSpot | null>(null);
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  // Admin Editing States
  const [isEditingSpotInfo, setIsEditingSpotInfo] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<Exclude<Category, '전체'>>('숲');
  const [editLocationName, setEditLocationName] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  useEffect(() => {
    if (detailSpotModal) {
      setEditTitle(detailSpotModal.title);
      setEditDescription(detailSpotModal.description);
      setEditCategory(detailSpotModal.category);
      setEditLocationName(detailSpotModal.locationName);
      setEditImageUrl(detailSpotModal.imageUrl);
    } else {
      setIsEditingSpotInfo(false);
    }
  }, [detailSpotModal]);

  // Guide Map Zoom and Panning states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  useEffect(() => {
    setIsFirstRender(false);
  }, []);

  const handleSoundClick = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Direct assignment to bypass autoplay blocks & ensure smooth replay
        if (!audioRef.current.src || audioRef.current.src !== CLASSIC_BGM_URL) {
          audioRef.current.src = CLASSIC_BGM_URL;
        }
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => {
            console.log("Playback error toggling sound:", err);
            // Fail-safe force load & play
            if (audioRef.current) {
              audioRef.current.src = CLASSIC_BGM_URL;
              audioRef.current.load();
              audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log(e));
            }
          });
      }
    }
  };

  // Sync back state changes to local storage
  useEffect(() => {
    localStorage.setItem('dangjeong_healing_spots_v2', JSON.stringify(spots));
  }, [spots]);

  useEffect(() => {
    localStorage.setItem('dangjeong_session', JSON.stringify(session));
  }, [session]);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSpots(prev => {
      const updated = prev.map(spot => {
        if (spot.id === id) {
          const alreadyLiked = localStorage.getItem(`liked_${id}`);
          if (alreadyLiked) {
            showToast('이미 따뜻한 공감을 누르신 안식처입니다. 🌱');
            return spot;
          }
          localStorage.setItem(`liked_${id}`, 'true');
          showToast(`"${spot.title}"에 하트 공감을 남겼습니다.`);
          return { ...spot, likes: spot.likes + 1 };
        }
        return spot;
      });
      
      // Keep state modals updated synchronously
      if (detailSpotModal && detailSpotModal.id === id) {
        const found = updated.find(s => s.id === id);
        if (found) setDetailSpotModal(found);
      }
      return updated;
    });
    triggerBotanicalConfetti(e.clientX, e.clientY);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailSpotModal || !newCommentText.trim()) return;

    const author = newCommentAuthor.trim() || (session.isLoggedIn ? session.name : '무명의 솔바람') || '익명의 식구';
    const newComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      author,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSpots(prev => {
      const updated = prev.map(spot => {
        if (spot.id === detailSpotModal.id) {
          return {
            ...spot,
            comments: [...spot.comments, newComment],
          };
        }
        return spot;
      });

      // Synchronize models
      const refreshed = updated.find(s => s.id === detailSpotModal.id);
      if (refreshed) {
        setDetailSpotModal(refreshed);
      }
      return updated;
    });

    setNewCommentText('');
    showToast('감평 댓글이 은은히 등록되었습니다. 🍁');
  };

  const handleNewSpot = (newSpotData: Omit<HealingSpot, 'id' | 'likes' | 'comments' | 'createdAt'>) => {
    const freshSpot: HealingSpot = {
      ...newSpotData,
      id: `spot-${Date.now()}`,
      likes: 1,
      comments: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSpots(prev => [freshSpot, ...prev]);
    setIsUploadOpen(false);
    showToast(`"${freshSpot.title}" 안식처가 갤러리에 아름답게 가꾸어졌습니다! ✨`);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setEditImageUrl(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSaveSpotInfo = () => {
    if (!editTitle.trim() || !editDescription.trim() || !editLocationName.trim()) {
      showToast('⚠️ 모든 필수 항목을 기입해 주세요!');
      return;
    }
    if (!editImageUrl) {
      showToast('⚠️ 안식처 사진을 등록해 주세요!');
      return;
    }

    setSpots(prev => {
      const updated = prev.map(spot => {
        if (spot.id === detailSpotModal?.id) {
          const editedSpot = {
            ...spot,
            title: editTitle.trim(),
            description: editDescription.trim(),
            category: editCategory,
            locationName: editLocationName.trim(),
            imageUrl: editImageUrl,
          };
          setDetailSpotModal(editedSpot);
          return editedSpot;
        }
        return spot;
      });
      return updated;
    });

    showToast('안식처 카드 정보가 수정되었습니다! 💾');
    setIsEditingSpotInfo(false);
  };

  const handleDeleteSpot = (spotId: string) => {
    if (window.confirm('이 안식처 카드와 업로드된 사진을 영구 삭제하시겠습니까?')) {
      setSpots(prev => prev.filter(s => s.id !== spotId));
      showToast('안식처 카드가 삭제되었습니다. 🗑️');
      setDetailSpotModal(null);
    }
  };

  const handleLogout = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setSession({ role: 'guest', isLoggedIn: false });
    showToast('보안 로그아웃 처리되었습니다.');
  };

  // Fun little biological garden flower petal/foliage particle burst effect!
  const triggerBotanicalConfetti = (x: number, y: number) => {
    const colors = ['#1b4332', '#2b694d', '#a5d0b9', '#3f6653', '#e4e3db', '#b0f1cc'];
    const shapes = ['rounded-full', 'rounded-tr-none rounded-bl-none', 'rounded-tl-none rounded-br-none'];

    for (let i = 0; i < 18; i++) {
      const el = document.createElement('div');
      el.className = 'leaf-particle';
      
      const size = Math.random() * 8 + 5;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Apply different random leaf shapes
      const shapeClass = shapes[Math.floor(Math.random() * shapes.length)];
      el.className = `leaf-particle ${shapeClass}`;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.position = 'fixed';
      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 90 + 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance - 25; // upward floating trend

      el.animate([
        { transform: 'translate(0, 0) scale(1.1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0) rotate(${Math.random() * 320}deg)`, opacity: 0 }
      ], {
        duration: 900 + Math.random() * 450,
        easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
        fill: 'forwards'
      }).onfinish = () => el.remove();
    }
  };

  const filteredSpots = spots.filter(
    (spot) => activeCategory === '전체' || spot.category === activeCategory
  );

  // '전체'는 가상 필터이므로 실제 통계 대상 카테고리만 정의합니다.
  const categoriesList: Exclude<Category, '전체'>[] = ['숲', '정원', '휴식 공간', '기타'];

  const categoryStats = categoriesList.map((cat) => {
    const catSpots = spots.filter((s) => s.category === cat);
    const totalLikes = catSpots.reduce((acc, cur) => acc + cur.likes, 0);
    const totalComments = catSpots.reduce((acc, cur) => acc + cur.comments.length, 0);
    return {
      category: cat,
      likes: totalLikes,
      comments: totalComments,
      spotCount: catSpots.length
    };
  });

  const topLikedTheme = [...categoryStats]
    .filter((stat) => stat.likes > 0)
    .sort((a, b) => b.likes - a.likes)[0] || null;

  const topCommentedTheme = [...categoryStats]
    .filter((stat) => stat.comments > 0)
    .sort((a, b) => b.comments - a.comments)[0] || null;

  // 전체적으로 가장 반응(공감 + 댓글)이 활발한 개별 쉼터 선정
  const topSpot = spots.length > 0
    ? [...spots].sort((a, b) => (b.likes + b.comments.length * 2) - (a.likes + a.comments.length * 2))[0]
    : null;

  // 댓글을 가장 많이 남긴 소통 귀재(소통왕) 찾기
  const allComments = spots.flatMap((s) => s.comments || []);
  const authorCounts: Record<string, number> = {};
  allComments.forEach((comment) => {
    const author = (comment.author || '').trim();
    if (author) {
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    }
  });

  const topCommenter = Object.keys(authorCounts).length > 0
    ? Object.entries(authorCounts)
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)[0]
    : null;

  return (
    <div className="bg-cream text-bark font-sans min-h-screen flex flex-col relative selection:bg-primary-light/20 selection:text-primary">
      
      {/* Background soft botanical watermark detail */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full blur-[120px] bg-primary-light/5 -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[35vw] h-[35vw] rounded-full blur-[140px] bg-primary/5 -z-10 pointer-events-none" />

      {/* Embedded Ambient Soundscapes player at top, customizable and very cozy */}
      <div className="relative bg-primary text-cream/90 text-[11px] font-sans font-medium px-4 py-2 flex flex-col sm:flex-row gap-2 justify-between items-center z-50 border-b border-primary-light/10 select-none overflow-hidden min-h-[38px]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-moss-light animate-ping" />
          <span className="tracking-wide font-bold">사운드 보드</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSoundClick}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isPlaying
                ? 'bg-primary-light text-cream shadow-sm scale-105 border border-moss-light/30'
                : 'text-cream/70 bg-cream/5 hover:text-cream hover:bg-cream/15 border border-transparent'
            }`}
            title="BGM 재생/정지 전환"
          >
            <span>🎼 BGM</span>
            <span className="text-[8px] px-1 py-0.5 rounded bg-cream/10 text-cream/90 flex items-center justify-center">
              {isPlaying ? '정지 ⏸️' : '재생 ▶️'}
            </span>
          </button>
          <div className="h-3.5 w-[1px] bg-cream/20 hidden sm:block" />
          <audio 
            ref={audioRef}
            src={CLASSIC_BGM_URL} 
            controls 
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="h-5 w-32 filter invert brightness-150 opacity-60 hover:opacity-100 transition-opacity" 
            title="BGM 재생"
          />
        </div>
      </div>

      {/* Styled Top Header Sticky Bar */}
      <nav className="sticky top-0 z-40 bg-cream/80 backdrop-blur-md border-b border-cream-dark/80 px-margin-mobile md:px-margin-desktop py-4.5 transition-all">
        <div className="max-w-container-max mx-auto flex justify-between items-center">
          
          {/* Logo brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { setActiveCategory('전체'); }}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-cream shadow-md border border-primary-light/35">
              <span className="material-symbols-outlined text-[23px] text-moss-light"></span>
            </div>
            <div className="text-left font-sans select-none">
              <h1 className="font-serif text-base md:text-lg font-bold tracking-tight text-primary">당정중 힐링 스페이스</h1>
              <p className="text-[9px] uppercase tracking-wider text-bark/50 font-bold block">Digital Sanctuary</p>
            </div>
          </div>

          {/* Nav Links Desktop */}
          <div className="hidden md:flex items-center gap-5 text-xs font-semibold">

            {/* Identity Status */}
            {session.isLoggedIn ? (
              <div className="flex items-center gap-3.5 pl-2">
                <div className="text-right font-sans">
                  <p className="text-[10px] text-bark/40 font-bold leading-none">{session.role === 'admin' ? '총 관리자' : '당정인'}</p>
                  <p className="text-xs font-bold text-primary mt-0.5">{session.name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-50 text-bark/60 hover:text-red-600 rounded-lg transition-colors border border-outline-variant/10 active:scale-95"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="px-5 py-2 hover:bg-cream-dark text-primary border border-primary/20 rounded-full font-bold tracking-wide active:scale-95 transition-all"
              >
                인증
              </button>
            )}
          </div>

          {/* Quick status button for mobile */}
          <div className="md:hidden flex items-center gap-3">
            {session.isLoggedIn ? (
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                🌿 {session.name}
              </span>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="p-2 bg-primary/5 border border-primary-light/10 text-primary rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <User className="w-4 h-4" />
                인증
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow max-w-container-max w-full mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 space-y-10">
        
        {/* Poetic Jumbotron Welcome Section */}
        <section className="relative text-center overflow-hidden py-4 max-w-3xl mx-auto space-y-5">
          <div className="absolute inset-x-0 top-0 h-40 bg-ambient-glow -z-10 rounded-full blur-2xl" />
          


          <h2 className="font-serif text-[42px] md:text-5xl lg:text-6xl text-primary font-bold tracking-tight leading-tight pt-1">
            마음이 머무는 곳
          </h2>
          
          <p className="text-sm md:text-base text-bark/85 leading-relaxed max-w-2xl mx-auto font-sans font-medium">
            당정중학교의 따뜻한 디지털 안식처에 힘든 걸음을 가벼이 내려놓으세요.
          </p>



          {/* Friendly Guidance Label */}
          <div className="p-5 bg-primary-light/5 border border-primary-light/10 rounded-2xl flex flex-col md:flex-row items-center md:justify-between gap-5 text-left max-w-3xl mx-auto shadow-sm">
            <div className="flex gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-primary-light/10 text-primary-light flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-xs md:text-sm text-primary-light font-bold leading-relaxed">
                쉽게 접근할 수 있는 공간을 추천하고 위치를 핀으로 고정해주세요
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="w-full md:w-auto px-5 py-2.5 bg-primary hover:bg-primary-light text-cream rounded-xl text-xs font-bold whitespace-nowrap tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4.5 h-4.5 text-moss-light" />
              <span>등록</span>
            </button>
          </div>

          {/* Real-time popular themes briefing board */}
          <div className="p-5 bg-cream-dark/25 border border-cream-dark/75 rounded-2xl text-left max-w-3xl mx-auto space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-bold text-primary flex items-center gap-1.5 select-none animate-fade-in">
                <Sparkles className="w-4 h-4 text-primary-light animate-pulse" />
                <span>당정중 실시간 공감 & 소통 인기 테마 리포트</span>
              </h3>
              <span className="text-[10px] font-sans font-bold text-bark/40">실시간 순위 반영됨</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. 가장 많은 공감(하트)을 받은 테마 */}
              <div className="bg-cream/70 border border-outline-variant/15 p-3.5 rounded-xl flex items-start gap-2.5 shadow-sm transition-all hover:shadow-md">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-bark/40 font-bold">공감 최고 테마 (하트)</p>
                  <p className="text-xs font-black text-bark truncate">
                    {topLikedTheme ? (
                      <>
                        <span className="text-primary font-bold">[{topLikedTheme.category}]</span> 테마
                      </>
                    ) : (
                      "아직 공감 반응 없음"
                    )}
                  </p>
                  {topLikedTheme && (
                    <p className="text-[10px] text-bark/60 font-sans">
                      누적 공감 <span className="font-bold text-red-500">{topLikedTheme.likes}개</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 2. 가장 대화가 활발한(댓글) 테마 */}
              <div className="bg-cream/70 border border-outline-variant/15 p-3.5 rounded-xl flex items-start gap-2.5 shadow-sm transition-all hover:shadow-md">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-bark/40 font-bold">소통 활발 테마 (댓글)</p>
                  <p className="text-xs font-black text-bark truncate">
                    {topCommentedTheme ? (
                      <>
                        <span className="text-primary font-bold">[{topCommentedTheme.category}]</span> 테마
                      </>
                    ) : (
                      "아직 댓글이 없음"
                    )}
                  </p>
                  {topCommentedTheme && (
                    <p className="text-[10px] text-bark/60 font-sans">
                      누적 댓글 <span className="font-bold text-blue-500">{topCommentedTheme.comments}개</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 3. 명예의 베스트 쉼터 */}
              <div className="bg-cream/70 border border-outline-variant/15 p-3.5 rounded-xl flex items-start gap-2.5 shadow-sm transition-all hover:shadow-md">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center flex-shrink-0">
                  <Compass className="w-4 h-4 animate-spin-slow" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-bark/40 font-bold font-sans">명예의 베스트 쉼터</p>
                  {topSpot ? (
                    <>
                      <button 
                        onClick={() => setDetailSpotModal(topSpot)}
                        className="text-xs font-black text-bark truncate hover:text-primary cursor-pointer text-left w-full underline decoration-dotted block"
                        title="상세보기"
                      >
                        {topSpot.title}
                      </button>
                      <p className="text-[10px] text-bark/60 font-sans truncate">
                        💖 {topSpot.likes}개  💬 {topSpot.comments.length}개
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-bark/50">쉼터가 대기중입니다</p>
                  )}
                </div>
              </div>

              {/* 4. 최다 댓글 소통러 (소통왕) */}
              <div className="bg-cream/70 border border-outline-variant/15 p-3.5 rounded-xl flex items-start gap-2.5 shadow-sm transition-all hover:shadow-md">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-4 h-4 text-emerald-600 animate-bounce" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-bark/40 font-bold font-sans">명예의 소통왕 (댓글)</p>
                  {topCommenter ? (
                    <>
                      <p className="text-xs font-black text-emerald-800 truncate" title={`${topCommenter.author} 님`}>
                        {topCommenter.author} 님
                      </p>
                      <p className="text-[10px] text-bark/60 font-sans truncate">
                        누적 댓글 <span className="font-bold text-emerald-600">{topCommenter.count}개</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-bark/50">댓글을 남겨보세요!</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Categories Pill Bar */}
          <div className="pt-3 flex items-center justify-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
            {(['전체', '숲', '정원', '휴식 공간', '기타'] as const).map((cat) => (
              <button
                key={cat}
                onClick={(e) => {
                  triggerBotanicalConfetti(e.clientX, e.clientY);
                  setActiveCategory(cat);
                }}
                className={`px-4.5 py-1.8 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary text-cream border-primary shadow-sm'
                    : 'bg-cream-dark/30 hover:bg-cream-dark/60 text-bark/70 border-outline-variant/35'
                }`}
              >
                <span>{cat === '전체' ? '🌿 전체 영역' : cat}</span>
                {cat !== '전체' && topLikedTheme && topLikedTheme.category === cat && (
                  <span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold tracking-tight inline-flex items-center gap-0.5" title="실시간 공감(하트) 1위 테마">
                    💖 공감 1위
                  </span>
                )}
                {cat !== '전체' && topCommentedTheme && topCommentedTheme.category === cat && (
                  <span className="text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded font-bold tracking-tight inline-flex items-center gap-0.5" title="실시간 소통(댓글) 1위 테마">
                    💬 소통 1위
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Display Area (Spec: Map View or Gallery Grid Showcase) */}
        <section className="space-y-6">
          
          {/* Header row in interactive container board */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-cream-dark/30 p-3.5 rounded-2xl border border-cream-dark/80">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 pl-2 select-none">
              <Layers className="w-4 h-4 text-primary-light" />
              {activeCategory} 테마 쉼터 총 <span className="underline text-primary-light font-bold font-sans">{filteredSpots.length}곳</span> 정렬 중
            </span>

            {/* Premium Dual View Swapper */}
            <div className="flex items-center gap-1 p-1 bg-cream/90 backdrop-blur-sm rounded-xl border border-cream-dark/95 shadow-sm font-sans w-full sm:w-auto">
              <button
                onClick={() => setViewMode('gallery')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-black rounded-lg transition-all border cursor-pointer ${
                  viewMode === 'gallery'
                    ? 'bg-primary text-cream border-primary shadow-sm'
                    : 'text-bark/60 hover:text-primary hover:bg-cream-dark/40 border-transparent'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>힐링스페이스 앨범</span>
              </button>

              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-black rounded-lg transition-all border cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-primary text-cream border-primary shadow-sm'
                    : 'text-bark/60 hover:text-primary hover:bg-cream-dark/40 border-transparent'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>위치맵</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'gallery' ? (
              /* Polaroid photo catalog */
              <motion.div
                key="gallery-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-[24px] space-y-4"
              >
                {filteredSpots.map((spot, index) => (
                  <SpotCard
                    key={spot.id}
                    spot={spot}
                    index={index}
                    onLike={handleLike}
                    onSelect={(spot) => {
                      setDetailSpotModal(spot);
                    }}
                    isAdmin={session.role === 'admin' && session.isLoggedIn}
                    onDeleteAdmin={(id) => {
                      handleDeleteSpot(id);
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              /* Interlock Map Screen Canvas */
              <motion.div
                key="map-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="relative w-full aspect-[16/10] md:aspect-[21/9] min-h-[380px] bg-cream-dark/40 rounded-2xl overflow-hidden shadow-xl border-2 border-primary/20 select-none"
              >
                {/* Floating Navigation Guide Overlay Panel - STATIC (outside zoom/pan) */}
                <div className="absolute top-4 left-4 bg-primary/95 text-cream px-3 py-2 rounded-xl border border-primary-light/25 shadow-lg text-[10px] md:text-xs font-bold font-sans flex items-center gap-2 z-30 max-w-[90%] pointer-events-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping flex-shrink-0" />
                  <span className="truncate">마우스 드래그로 지도 이동이 가능하며, 우측 하단 컨트롤러로 확대/축소할 수 있습니다! 🗺️</span>
                </div>

                {/* Floating Landmark Guide Badge */}
                <span className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur text-cream text-[9px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/25 shadow z-30">
                  📍 당정 거점 1km 반경 동네 지도
                </span>

                {/* ZOOM & PAN CONTROLLER HUD - STATIC (outside zoom/pan) */}
                <div className="absolute bottom-4 right-4 flex items-center bg-primary/95 text-cream p-1.5 rounded-xl border border-primary-light/25 shadow-lg z-30 gap-1 font-sans">
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(prev => Math.min(prev + 0.25, 3));
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg active:scale-90 transition-all cursor-pointer text-cream"
                    title="지도 확대 (Zoom In)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono font-bold px-1.5 min-w-[36px] text-center bg-white/5 rounded">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(prev => {
                        const next = Math.max(prev - 0.25, 1);
                        if (next === 1) setPan({ x: 0, y: 0 }); // Reset offset on zoom out to center
                        return next;
                      });
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg active:scale-90 transition-all cursor-pointer text-cream"
                    title="지도 축소 (Zoom Out)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-white/20 mx-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setPan({ x: 0, y: 0 });
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg active:scale-90 transition-all cursor-pointer text-cream flex items-center gap-1 text-[10px] font-bold"
                    title="초기값 리셋"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>리셋</span>
                  </button>
                </div>

                {/* ZOOMABLE, PANNING VIEWPORT CANVAS WRAPPER */}
                <div
                  className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => {
                    setIsDragging(true);
                    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
                  }}
                  onMouseMove={(e) => {
                    if (!isDragging) return;
                    const nextX = e.clientX - dragStart.x;
                    const nextY = e.clientY - dragStart.y;
                    
                    // Bound container relative to current zoom factor
                    const maxPanX = (zoom - 1) * 380;
                    const maxPanY = (zoom - 1) * 260;
                    setPan({
                      x: Math.min(Math.max(nextX, -maxPanX - 100), maxPanX + 100),
                      y: Math.min(Math.max(nextY, -maxPanY - 100), maxPanY + 100)
                    });
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  <div
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className="absolute inset-0 w-full h-full"
                  >
                    {/* Simulated Grid backdrop Map */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center brightness-[82%] contrast-[105%]"
                      style={{ 
                        backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD79r_afFvoHlx2bUqbk_AnR0J_zU_YHg47HA5koeJuWUz4vbftSqY3iYSIYDRLuo4BVzeG9y252D2geQT5peTfNdY4_QIUYLiX09y2vCZloIi1Y1gydur6ztjHMHoOk-CZKMDP_4hlpSZCbckMX80u3v1G_GcQXIuAWEJ32OECSQabe0vVvRTl2-4gJNA52B1B9CCTgRr2n1DpcdVHz4xtVwIptzv9fHyd9NEepNFw-yWLgI7yed9lvya5RPKECQQ8MnrIsnvTaOY')`,
                      }}
                    />
                    
                    {/* Ambient overlay shadows */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[radial-gradient(#012d1d_1px,transparent_1px)] [background-size:12px_12px]" />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/15" />

                    {/* SURROUNDING ROADS, STREETS & GEOGRAPHIC VEINS (1KM RADIUS) */}
                    
                    {/* Gyeongbu Line Railway (경부선 철도) vector */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-35">
                      <line x1="84%" y1="0%" x2="68%" y2="100%" stroke="#1e293b" strokeWidth="6" strokeDasharray="10 5" />
                      <line x1="84%" y1="0%" x2="68%" y2="100%" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5 5" />
                    </svg>

                    {/* Singi Stream Canal Waterway (신기천 수변길) vector */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-25">
                      <path
                        d="M -20,86 Q 15,81 50,84 T 120,80"
                        fill="none"
                        stroke="#0d9488"
                        strokeWidth="7"
                        strokeLinecap="round"
                      />
                      <path
                        d="M -20,86 Q 15,81 50,84 T 120,80"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Surrounding Roads Vector Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-[0.18]">
                      {/* Hansei-ro (한세로) */}
                      <path d="M -10,24 Q 25,22 60,20 T 110,16" fill="none" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />
                      
                      {/* Dangjeong-ro (당정로) */}
                      <path d="M 31,0 L 31,100" fill="none" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />

                      {/* Gosan-ro (고산로) */}
                      <path d="M -5,55 L 105,48" fill="none" stroke="#fef08a" strokeWidth="6" strokeLinecap="round" />
                      <path d="M -5,55 L 105,48" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>

                    {/* Road Text Markers */}
                    <div style={{ left: '46%', top: '19%' }} className="absolute -translate-x-1/2 pointer-events-none z-15 opacity-55 text-[6px] text-cream bg-black/40 px-1 py-0.5 rounded font-bold">
                      Hansei-ro (한세로) 🛣️
                    </div>
                    <div style={{ left: '33%', top: '14%' }} className="absolute -translate-y-1/2 pointer-events-none z-15 opacity-55 text-[6px] text-cream bg-black/40 px-1 py-0.5 rounded font-bold rotate-90 origin-left">
                      Dangjeong-ro (당정로) 🛣️
                    </div>
                    <div style={{ left: '16%', top: '51%' }} className="absolute -translate-x-1/2 pointer-events-none z-15 opacity-55 text-[6px] text-cream bg-black/40 px-1 py-0.5 rounded font-bold -rotate-2">
                      Gosan-ro (고산로) 🛣️
                    </div>

                    {/* Water Resource labels */}
                    <div style={{ left: '48%', top: '85%' }} className="absolute -translate-x-1/2 pointer-events-none z-15 opacity-70 text-[6px] text-sky-200 bg-sky-950/65 border border-sky-450/20 px-2 py-0.5 rounded-full font-black tracking-wide flex items-center gap-1 shadow-sm">
                      <Waves className="w-2.5 h-2.5 text-sky-300" />
                      <span>신기천 수변 산책로 🌊</span>
                    </div>

                    {/* DANGJEONG SURROUNDING INTERACTIVE LANDMARKS */}
                    
                    {/* Landmark 1: Dangjeong Station (수도권 1호선 당정역) */}
                    <div
                      style={{ left: '74%', top: '68%' }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                    >
                      <div 
                        onClick={() => showToast('🚇 1호선 당정역: 당정중학교에서 도보 약 7~10분 거리에 있으며 전철 쉼과 접근성이 매우 좋습니다!')}
                        className="flex items-center gap-1 bg-slate-900/90 text-white hover:bg-emerald-800 hover:text-cream border border-slate-700/50 px-1.5 py-0.5 rounded-lg shadow-md transition-all cursor-pointer scale-75 select-none hover:scale-80"
                      >
                        <Train className="w-3 h-3 text-sky-400" />
                        <div className="text-left font-sans text-[8px] font-bold">당정역 (1호선) 🚉</div>
                      </div>
                    </div>

                    {/* Landmark 2: Hansei University (한세대학교) */}
                    <div
                      style={{ left: '60%', top: '22%' }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                    >
                      <div 
                        onClick={() => showToast('🎓 한세대학교: 당정중학교 옆에 인접해 지역 사회의 문화적 가치와 배움을 가꾸는 곳입니다.')}
                        className="flex items-center gap-1 bg-slate-900/90 text-white hover:bg-emerald-800 hover:text-cream border border-slate-700/50 px-1.5 py-0.5 rounded-lg shadow-md transition-all cursor-pointer scale-75 select-none hover:scale-80"
                      >
                        <School className="w-3 h-3 text-amber-400" />
                        <span className="text-[8px] font-bold">한세대학교 🎓</span>
                      </div>
                    </div>

                    {/* Landmark 3: Han-eol Park (한얼공원) */}
                    <div
                      style={{ left: '15%', top: '15%' }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                    >
                      <div 
                        onClick={() => showToast('🌲 한얼공원: 울창한 수림대와 둘레길 산책코스를 제공하는 인접 가치 명소입니다.')}
                        className="flex items-center gap-1 bg-slate-900/85 hover:bg-emerald-800 text-white border border-slate-700/40 px-1.5 py-0.5 rounded-lg shadow scale-75 cursor-pointer select-none"
                      >
                        <Trees className="w-2.5 h-2.5 text-emerald-400" />
                        <span className="text-[8px] font-bold">한얼공원 🌲</span>
                      </div>
                    </div>

                    {/* Landmark 4: Gunpo Citizens Sports Park (군포시민체육광장) */}
                    <div
                      style={{ left: '12%', top: '75%' }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                    >
                      <div 
                        onClick={() => showToast('⚽ 군포시민체육광장: 푸르른 트랙과 인조 잔디밭에서 마음껏 건강 증진을 누릴 수 있는 스포츠 파크입니다.')}
                        className="flex items-center gap-1 bg-slate-900/85 hover:bg-emerald-804 text-white border border-slate-700/40 px-1.5 py-0.5 rounded-lg shadow scale-75 cursor-pointer select-none"
                      >
                        <Compass className="w-2.5 h-2.5 text-emerald-400" />
                        <span className="text-[8px] font-bold">시민체육광장 ⚽</span>
                      </div>
                    </div>

                    {/* Landmark 5: Dangjeong Elementary School (당정초등학교) */}
                    <div
                      style={{ left: '42%', top: '78%' }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                    >
                      <div 
                        onClick={() => showToast('🎒 당정초등학교: 당정중과 함께 자라나는 아이들의 활기참이 느껴지는 이웃 배움원입니다.')}
                        className="flex items-center gap-1 bg-slate-900/80 hover:bg-emerald-800 text-white border border-slate-700/40 px-1.5 py-0.5 rounded-lg shadow scale-75 cursor-pointer select-none"
                      >
                        <span className="text-amber-400 text-[8px]">🎒</span>
                        <span className="text-[8px] font-bold">당정초등학교</span>
                      </div>
                    </div>

                    {/* Central School Campus Anchor Hub */}
                    <div
                      style={{ left: '28%', top: '35%' }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group z-30 cursor-pointer scale-200 origin-center transition-all duration-300"
                    >
                      {/* Glowing pulse aura */}
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-amber-500/20 group-hover:bg-amber-400/40 group-hover:scale-125 animate-ping transition-all duration-1000" />
                      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-500/30 animate-pulse transition-all duration-300" />
                      
                      {/* Shield/Orb badge with glowing school icon */}
                      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-amber-600 group-hover:bg-amber-500 border-2 border-white shadow-lg text-cream transition-all duration-300 transform group-hover:scale-110 active:scale-95 shadow-amber-600/55 animate-bounce">
                        <School className="w-5 h-5 text-white" />
                      </div>

                      {/* Visual hub title badge attached to the marker */}
                      <div className="absolute top-11 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-600/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-400 shadow-md pointer-events-none group-hover:bg-amber-500 transition-colors scale-75 origin-top">
                        🏫 당정중학교 거점 (본관)
                      </div>

                      {/* Popover detailed hub card */}
                      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md p-3 rounded-2xl border-2 border-amber-400/35 w-52 shadow-[0_12px_40px_-8px_rgba(180,100,0,0.3)] opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none z-40 font-sans text-left">
                        <div className="space-y-2">
                          <div className="bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                            <span className="text-[9px] font-black text-amber-700 tracking-wider">CAMPUS CENTER 🏛️</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-primary">당정중학교 안식처 본부</h4>
                            <p className="text-[10px] text-bark/70 leading-relaxed mt-1">
                              배움과 따뜻한 쉼이 공존하는 아름다운 배움터, 당정인 모두의 지친 하루를 달래주는 디지털 힐링 본부입니다. 🌱
                            </p>
                          </div>
                          <div className="pt-1.5 border-t border-cream-dark/60 text-[9px] text-amber-600 font-bold flex items-center gap-1">
                            <span>✨ 안식처 등록 쉼터: {filteredSpots.length}곳 활성화 중</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Plot Pins Loop */}
                    {filteredSpots.map((spot) => {
                      const hasCoords = spot.coordinates && typeof spot.coordinates.x === 'number' && typeof spot.coordinates.y === 'number';
                      if (!hasCoords) return null;

                      return (
                        <div
                          key={spot.id}
                          style={{ left: `${spot.coordinates.x}%`, top: `${spot.coordinates.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer"
                          onClick={() => setDetailSpotModal(spot)}
                        >
                          {/* Pulse Circle Wave */}
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500/25 group-hover:bg-amber-400/50 group-hover:scale-130 animate-pulse transition-all duration-300" />
                          
                          {/* Pin Main Orb */}
                          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary group-hover:bg-amber-500 border-2 border-cream shadow-md text-cream transition-all duration-300 transform group-hover:scale-115 active:scale-95 shadow-primary/30">
                            <MapPin className="w-4 h-4 text-moss-light group-hover:text-cream transition-colors" />
                          </div>

                          {/* Micro Popover Float Card on Hover */}
                          <div className="absolute bottom-11 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-primary-light/10 w-44 shadow-[0_10px_35px_-8px_rgba(0,0,0,0.25)] opacity-0 scale-95 translate-y-2 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-350 pointer-events-none group-hover:pointer-events-auto z-30 font-sans">
                            <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                              <div className="relative aspect-video rounded-lg overflow-hidden border border-cream-dark/40 bg-cream">
                                <img 
                                  src={spot.imageUrl} 
                                  alt={spot.title} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute bottom-1 left-1 bg-primary/90 text-cream text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                                  {spot.category}
                                </div>
                              </div>
                              <div className="text-left leading-none">
                                <h4 className="text-[11px] font-bold text-primary truncate">{spot.title}</h4>
                                <p className="text-[9px] text-bark/60 truncate mt-1">{spot.locationName}</p>
                              </div>
                              
                              {/* Map Pin Micro Controls */}
                              <div className="pt-1.5 border-t border-cream-dark/40 flex gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailSpotModal(spot);
                                    setIsEditingSpotLocation(true);
                                  }}
                                  className="flex items-center gap-0.5 px-1.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[8px] font-black tracking-tight active:scale-95 transition-all cursor-pointer"
                                >
                                  수정 📍
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSpots(prev => prev.map(s => {
                                      if (s.id === spot.id) {
                                        const { coordinates, ...rest } = s;
                                        return rest as any;
                                      }
                                      return s;
                                    }));
                                    showToast('위치 핀이 성공적으로 삭제되었습니다. 🗑️');
                                  }}
                                  className="flex items-center gap-0.5 px-1.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8px] font-black tracking-tight active:scale-95 transition-all cursor-pointer"
                                >
                                  삭제 🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>


          {/* Empty display helper */}
          {filteredSpots.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-cream-dark/20 border border-cream-dark max-w-sm mx-auto space-y-3">
              <p className="text-xs text-bark/40 font-bold italic">아직 {activeCategory} 영역에 등록된 카드가 없습니다.</p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-4 py-2 bg-primary text-cream text-[11px] font-bold rounded-full active:scale-95 transition-all shadow"
              >
                첫 번째 카드 올리기
              </button>
            </div>
          )}

        </section>

      </main>



      {/* Floating Sticky Bottom Mobile Indicators (Only on smaller layout) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-22 px-8 pb-3 bg-cream/95 backdrop-blur shadow-xl border-t border-cream-dark/90 z-[30] rounded-t-2xl select-none text-[10px]">
        <button 
          onClick={() => { setActiveCategory('전체'); }}
          className={`flex flex-col items-center justify-center ${activeCategory === '전체' ? 'text-primary font-bold' : 'text-bark/50'}`}
        >
          <Grid className="w-5.5 h-5.5 mb-1" />
          <span>전체보기</span>
        </button>

        <button 
          onClick={() => setIsUploadOpen(true)}
          className="relative -top-4 w-15 h-15 rounded-full bg-primary text-cream flex flex-col items-center justify-center shadow-xl border-2 border-moss-light/40 active:scale-95 transition-transform"
        >
          <PlusCircle className="w-7 h-7 text-moss-light animate-pulse" />
          <span className="text-[9px] font-extrabold text-cream leading-none mt-1">쉼터 등록</span>
        </button>

        <button 
          onClick={() => setIsLoginOpen(true)}
          className={`flex flex-col items-center justify-center ${session.isLoggedIn ? 'text-emerald-600' : 'text-bark/50'}`}
        >
          <User className="w-5.5 h-5.5 mb-1" />
          <span>{session.isLoggedIn ? '인증완료' : '식구인증'}</span>
        </button>
      </nav>

      {/* Footer Content */}
      <footer className="w-full pb-32 md:pb-12 pt-16 bg-cream-dark/40 border-t border-cream-dark/80 text-xs font-sans text-bark/60 font-medium">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-primary"></span>
            <span className="text-primary font-bold">2026 당정중학교 힐링 안식처</span>
          </div>

          <div className="flex gap-6 text-[11px] font-bold">
            <a href="#" className="hover:text-primary transition-colors">이용약관</a>
            <a href="#" className="hover:text-primary transition-colors">개인정보보호방침</a>
            <a href="#" className="hover:text-primary transition-colors">소중한 의견 제보</a>
          </div>

        </div>
      </footer>

      {/* Floating Toast Notification alerts */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary/95 text-cream border border-primary-light/40 px-5  py-3 rounded-xl shadow-2xl z-[150] text-xs font-sans font-bold flex items-center gap-2"
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-moss-light animate-ping" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals Mounting Anchor */}
      <AnimatePresence>
        {/* Upload Form Modal */}
        {isUploadOpen && (
          <UploadModal
            onClose={() => setIsUploadOpen(false)}
            onUpload={handleNewSpot}
            session={session}
          />
        )}

        {/* Access Code Member Log Gate */}
        {isLoginOpen && (
          <LoginModal
            onClose={() => setIsLoginOpen(false)}
            onSuccess={(newSession) => {
              setSession(newSession);
              setIsLoginOpen(false);
              showToast(`성공적으로 인증되었습니다! 반가워요, ${newSession.name} 님. 🌲`);
            }}
          />
        )}

        {/* Polished Big Detail Poetic Viewer Dialog */}
        {detailSpotModal && (
          <div className="fixed inset-0 bg-primary/30 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden shadow-2xl border border-primary/10 flex flex-col md:flex-row relative text-left"
            >
              
              {/* Close Button top edge right */}
              <button 
                onClick={() => {
                  setDetailSpotModal(null);
                  setIsEditingSpotLocation(false);
                }}
                className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/60 text-cream p-2 rounded-full transition-all active:scale-95 shadow"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Big Photo Section or Campus Pin Editing Canvas */}
              <div className="w-full md:w-1/2 relative bg-cream-dark h-64 md:h-auto min-h-[300px] flex flex-col justify-end">
                {!isEditingSpotLocation ? (
                  <>
                    <img 
                      src={detailSpotModal.imageUrl} 
                      alt={detailSpotModal.title}
                      className="w-full h-full object-cover absolute inset-0 transition-opacity duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Image overlay details */}
                    <div className="absolute bottom-6 left-6 right-6 text-cream space-y-2 select-none">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest font-bold bg-moss-light text-primary px-3 py-0.5 rounded-full border border-moss-light/30 shadow-sm">
                          {detailSpotModal.category}
                        </span>
                        <span className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded flex items-center gap-1 border border-white/20">
                          <MapPin className={`w-3.5 h-3.5 ${detailSpotModal.coordinates ? 'text-moss-light' : 'text-rose-400'}`} />
                          {detailSpotModal.locationName} {!detailSpotModal.coordinates && '(위치 미지정)'}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => setIsEditingSpotLocation(true)}
                          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full cursor-pointer flex items-center gap-1 transition-all shadow shadow-amber-500/25 ml-1"
                        >
                          <MapPin className="w-3 h-3 text-amber-200 animate-pulse" />
                          <span>위치 수정하기 📍</span>
                        </button>
                      </div>

                      <h3 className="font-serif text-2xl md:text-3xl font-extrabold leading-tight">
                        {detailSpotModal.title}
                      </h3>

                      <p className="text-[11px] text-cream/70 font-sans tracking-wide">
                        등록일: {detailSpotModal.createdAt} / {detailSpotModal.author} 님이 추천
                      </p>
                    </div>
                  </>
                ) : (
                  // INTERACTIVE CAMPUS PIN EDITING CANVAS
                  <div className="absolute inset-0 flex flex-col justify-between p-5 bg-primary text-cream select-none animate-fade-in">
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-sans font-extrabold uppercase bg-amber-400/25 text-amber-300 px-2.5 py-0.5 rounded-full tracking-wider">
                          CAMPUS MAP ADJUSTER
                        </span>
                        <button
                          onClick={() => setIsEditingSpotLocation(false)}
                          className="text-cream/60 hover:text-white text-[10px] font-bold px-2 py-0.5 bg-white/10 rounded-full cursor-pointer transition-colors"
                        >
                          인물화 모드로 돌아가기
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-cream flex items-center gap-1.5 mt-1.5">
                        <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
                        "{detailSpotModal.title}" 위치 정밀 수정
                      </h4>
                      <p className="text-[10px] text-cream/75 leading-relaxed">
                        아래 지도 위의 변경하고 싶은 새로운 위치를 탭/클릭해 주시면 핀이 즉시 배치됩니다.
                      </p>
                    </div>

                    {/* Interactive Click Canvas Container */}
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                        
                        // Update core spots state
                        setSpots(prev => {
                          const updated = prev.map(spot => {
                            if (spot.id === detailSpotModal.id) {
                              const newSpot = { ...spot, coordinates: { x, y } };
                              // Keep details modal synchronized in state
                              setDetailSpotModal(newSpot);
                              return newSpot;
                            }
                            return spot;
                          });
                          return updated;
                        });
                        showToast('안식처의 위치 핀 이동이 성공적으로 저장되었습니다! 🌳');
                      }}
                      className="relative w-full flex-1 min-h-[160px] bg-cream-dark/20 rounded-xl overflow-hidden cursor-crosshair border border-white/10 shadow-inner group mt-2"
                    >
                      <div 
                        className="absolute inset-0 bg-cover bg-center brightness-[65%] contrast-[105%]"
                        style={{ 
                          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD79r_afFvoHlx2bUqbk_AnR0J_zU_YHg47HA5koeJuWUz4vbftSqY3iYSIYDRLuo4BVzeG9y252D2geQT5peTfNdY4_QIUYLiX09y2vCZloIi1Y1gydur6ztjHMHoOk-CZKMDP_4hlpSZCbckMX80u3v1G_GcQXIuAWEJ32OECSQabe0vVvRTl2-4gJNA52B1B9CCTgRr2n1DpcdVHz4xtVwIptzv9fHyd9NEepNFw-yWLgI7yed9lvya5RPKECQQ8MnrIsnvTaOY')`,
                        }}
                      />
                      
                      {/* Grid Line Visualizers */}
                      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />

                      {/* Reference point of Dangjeong Middle School */}
                      <div
                        style={{ left: '28%', top: '35%' }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 opacity-95 scale-180 origin-center transition-transform"
                      >
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-500/30 animate-pulse" />
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 border border-white shadow text-cream">
                          <School className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-600/90 text-white text-[5px] leading-none font-black px-1.5 py-0.5 rounded-full border border-amber-400 shadow scale-90">
                          🏫 당정중학교 거점 (기준점)
                        </div>
                      </div>

                      {/* Display Pin Coords layout visually */}
                      {detailSpotModal.coordinates && (
                        <div 
                          style={{ left: `${detailSpotModal.coordinates.x}%`, top: `${detailSpotModal.coordinates.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                        >
                          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400/40 animate-ping" />
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-lg text-cream">
                            <MapPin className="w-4 h-4 animate-bounce" />
                          </div>
                        </div>
                      )}

                      {/* Coordinates Floating tag */}
                      <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[8px] text-cream font-mono">
                        X: {detailSpotModal.coordinates?.x ?? 0}%, Y: {detailSpotModal.coordinates?.y ?? 0}%
                      </div>
                    </div>

                    {/* Controls Footer */}
                    <div className="flex items-center justify-between gap-3 pt-3 mt-1.5 border-t border-white/10">
                      <span className="text-[10px] text-cream/65">
                        * 지도를 탭하여 설정
                      </span>
                      <div className="flex gap-2">
                        {detailSpotModal.coordinates && (
                          <button
                            type="button"
                            onClick={() => {
                              setSpots(prev => {
                                const updated = prev.map(spot => {
                                  if (spot.id === detailSpotModal.id) {
                                    const { coordinates, ...rest } = spot;
                                    setDetailSpotModal({ ...rest } as any);
                                    return rest as any;
                                  }
                                  return spot;
                                });
                                return updated;
                              });
                              showToast('위치 핀이 성공적으로 삭제되었습니다. 🗑️');
                              setIsEditingSpotLocation(false);
                            }}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow cursor-pointer flex items-center gap-1"
                          >
                            <span>위치 핀 삭제 🗑️</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsEditingSpotLocation(false)}
                          className="px-4 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow cursor-pointer"
                        >
                          수정 완료 💾
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Poetic description and Review commentary threads */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
                {isEditingSpotInfo ? (
                  /* Admin Editing Form panel */
                  <div className="space-y-4">
                    <div className="border-b border-cream-dark pb-3 mb-1">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-amber-600 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        총관리자 쉼터 정보 정밀 수정
                      </span>
                      <h3 className="font-serif text-lg font-bold text-primary mt-1">안식처 정보 정교화</h3>
                    </div>

                    {/* Image modification */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-bold text-primary">안식처 대표 사진 변경</label>
                      <div className="flex items-center gap-3 bg-cream/40 p-2.5 rounded-xl border border-cream-dark">
                        <img 
                          src={editImageUrl} 
                          className="w-14 h-14 object-cover rounded-md border shadow-sm flex-shrink-0" 
                          alt="preview" 
                        />
                        <div className="space-y-1">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleEditFileChange}
                            id="admin-image-edit"
                            className="hidden" 
                          />
                          <label 
                            htmlFor="admin-image-edit"
                            className="inline-flex items-center gap-1 cursor-pointer bg-primary text-cream text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-primary-light transition-all shadow-sm active:scale-95"
                          >
                            <Camera className="w-3 h-3 text-cream-dark" />
                            새 사진 업로드...
                          </label>
                          <p className="text-[9px] text-bark/40">기존 사진 파일을 다른 이미지 파일로 즉시 대체합니다.</p>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1 text-left">
                      <label className="block text-xs font-bold text-primary">안식처 이름 *</label>
                      <input 
                        type="text" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-cream/70 border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-sans text-bark"
                        placeholder="안식처 이름"
                        maxLength={20}
                      />
                    </div>

                    {/* Category & Location */}
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-primary">안식처 테마구조 *</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as Exclude<Category, '전체'>)}
                          className="w-full px-2 py-2 text-xs bg-cream/70 border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-sans text-bark"
                        >
                          <option value="숲">숲</option>
                          <option value="정원">정원</option>
                          <option value="휴식 공간">휴식 공간</option>
                          <option value="기타">기타</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-primary">위치 정보 *</label>
                        <input 
                          type="text" 
                          value={editLocationName}
                          onChange={(e) => setEditLocationName(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-cream/70 border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-sans text-bark"
                          placeholder="예: 3층 도서실 가온느티 쉼터"
                          maxLength={30}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1 text-left">
                      <label className="block text-xs font-bold text-primary">소감 및 설명 *</label>
                      <textarea 
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-xs bg-cream/70 border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-none leading-relaxed text-bark"
                        placeholder="힐링의 소감을 적어주세요."
                        maxLength={180}
                      />
                      <span className="text-[10px] text-bark/40 text-right block mt-1">최대 180자</span>
                    </div>

                    {/* Save / Cancel buttons */}
                    <div className="flex gap-2 pt-2 justify-end border-t border-cream-dark">
                      <button
                        type="button"
                        onClick={() => setIsEditingSpotInfo(false)}
                        className="px-4 py-2 bg-cream hover:bg-cream-dark text-bark rounded-full text-xs font-bold transition-all active:scale-95"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSpotInfo}
                        className="px-5 py-2 bg-primary hover:bg-primary-light text-cream rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow"
                      >
                        수정 내용 저장 💾
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal view: Poetic description and Comments */
                  <>
                    <div className="space-y-6">
                      {/* Admin Toolbar Quick Action Bar */}
                      {session.role === 'admin' && session.isLoggedIn && (
                        <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl flex items-center justify-between shadow-sm">
                          <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>총관리자 제어 센터</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditTitle(detailSpotModal.title);
                                setEditDescription(detailSpotModal.description);
                                setEditCategory(detailSpotModal.category as Exclude<Category, '전체'>);
                                setEditLocationName(detailSpotModal.locationName);
                                setEditImageUrl(detailSpotModal.imageUrl);
                                setIsEditingSpotInfo(true);
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-cream font-bold text-[10px] px-2.5 py-1 rounded-md cursor-pointer transition-all active:scale-95 shadow-sm"
                            >
                              정보 수정 ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSpot(detailSpotModal.id)}
                              className="bg-rose-600 hover:bg-rose-700 text-cream font-bold text-[10px] px-2.5 py-1 rounded-md cursor-pointer transition-all active:scale-95 shadow-sm"
                            >
                              카드 삭제 🗑️
                            </button>
                          </div>
                        </div>
                      )}

                      {/* description card quote */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-primary-light flex items-center gap-1">
                          <Bookmark className="w-3.5 h-3.5 text-primary-light" />
                          쉼터의 고유 소감록
                        </span>
                        <p className="font-serif text-sm text-bark/90 leading-relaxed italic bg-cream/50 p-4 border-l-4 border-primary rounded-r-xl shadow-inner">
                          "{detailSpotModal.description}"
                        </p>
                      </div>

                      {/* Comments lists */}
                      <div className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold text-primary tracking-wider uppercase border-b border-cream-dark pb-1.5 flex justify-between items-center">
                          <span>당정 가족들의 힐링 발자국 [{detailSpotModal.comments.length}]</span>
                          <button
                            onClick={(e) => handleLike(detailSpotModal.id, e)}
                            className="text-red-500 hover:scale-105 active:scale-95 transition-all text-[11px] font-bold flex items-center gap-1 bg-red-50 px-2 py-0.8 rounded-md border border-red-100"
                          >
                            <Heart className="w-3 h-3 fill-current" />
                            좋아요 {detailSpotModal.likes}
                          </button>
                        </h4>

                        <div className="space-y-3 max-h-40 overflow-y-auto pr-1 text-xs">
                          {detailSpotModal.comments.length === 0 ? (
                            <p className="text-[11px] text-bark/40 text-center py-6 italic">
                              이 위안의 보금자리에 아직 식구 한 마디가 남겨지지 않았습니다. <br />
                              오늘 이곳을 방문하신 감상을 제일 먼저 남기는 행운을 얻어보세요.
                            </p>
                          ) : (
                            detailSpotModal.comments.map((comment) => (
                              <div 
                                key={comment.id}
                                className="bg-cream/40 p-3 rounded-xl border border-cream-dark border-opacity-70 text-left space-y-1 transition-all hover:bg-cream-dark/20"
                              >
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-primary">{comment.author}</span>
                                  <span className="text-bark/40 font-medium font-sans">{comment.createdAt}</span>
                                </div>
                                <p className="text-[11px] text-bark/85 leading-relaxed">{comment.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submit New Comment Field Form */}
                    <form onSubmit={handleCommentSubmit} className="pt-6 border-t border-cream-dark mt-6 space-y-3">
                      <span className="text-[10px] font-sans font-bold text-primary tracking-wide block text-left">
                        나의 따스한 힐링 한마디 남기기
                      </span>
                      
                      <div className="flex gap-2">
                        {!session.isLoggedIn && (
                          <input
                            type="text"
                            value={newCommentAuthor}
                            onChange={(e) => setNewCommentAuthor(e.target.value)}
                            placeholder="작성자명"
                            maxLength={10}
                            className="w-24 px-2 py-2 bg-cream/70 border border-outline-variant/40 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary font-sans"
                          />
                        )}
                        <input
                          type="text"
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          placeholder={session.isLoggedIn ? `${session.name}님, 공간의 위안을 적어주세요..` : "여기에 쉼터 소성을 남겨주세요.."}
                          maxLength={100}
                          className="flex-1 px-3 py-2 bg-cream/75 border border-outline-variant/40 rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary font-sans placeholder:text-bark/30"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary hover:bg-primary-light text-cream rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          남기기
                        </button>
                      </div>
                      
                      <span className="text-[9px] text-bark/40 text-left block">
                        * 작성된 감평은 당정중 식구들과 따뜻하게 공유되며, 최대 100자까지 적으실 수 있습니다.
                      </span>
                    </form>
                  </>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
