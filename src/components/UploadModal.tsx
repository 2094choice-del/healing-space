import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, MapPin, Check, Image, Leaf, HelpCircle, Sparkles } from 'lucide-react';
import { HealingSpot, Category, UserSession } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (newSpot: Omit<HealingSpot, 'id' | 'likes' | 'comments' | 'createdAt'>) => void;
  session: UserSession;
}

export default function UploadModal({ onClose, onUpload, session }: UploadModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Exclude<Category, '전체'>>('숲');
  const [locationName, setLocationName] = useState('');
  const [authorName, setAuthorName] = useState(session.name || '당정중 지킴이');
  
  // Coordinates X & Y % initialization (Default right in the center)
  const [coords, setCoords] = useState({ x: 50, y: 50 });
  const [customFile, setCustomFile] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Info & Photo, Step 2: Pin Location on map

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomFile(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleCoordsPick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setCoords({ x, y });
  };

  const handleSubmit = () => {
    if (!title || !description || !locationName) {
      alert('모든 필수 항목을 기입해 주세요!');
      return;
    }
    if (!customFile) {
      alert('나만의 안식처를 보여줄 힐링 사진을 첨부해 주세요! (사진 업로드는 필수입니다)');
      return;
    }

    onUpload({
      title,
      description,
      category,
      locationName,
      author: authorName.trim() || '익명 식구',
      role: session.role === 'admin' ? '관리자' : session.role === 'studentOrTeacher' ? '선생님/학생' : '방문자',
      imageUrl: customFile,
      coordinates: coords,
    });
  };

  return (
    <div className="fixed inset-0 bg-primary/45 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative border border-primary/10 max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Navigation Indicator / Header */}
        <div className="flex justify-between items-start border-b border-cream-dark pb-4">
          <div className="text-left">
            <span className="text-[10px] font-sans font-extrabold uppercase bg-primary-light/10 text-primary-light px-2.5 py-1 rounded-full tracking-wider">
              Healing Recommender
            </span>
            <h3 className="font-serif text-xl md:text-2xl font-bold text-primary mt-1.5 flex items-center gap-1.5">
              <Leaf className="w-5 h-5 text-primary-light animate-pulse" />
              당정 힐링 안식처 추천하기
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-bark/50 hover:text-primary transition-colors p-1 bg-cream rounded-full active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Step Panels */}
        <div className="flex-1 py-5 space-y-5 text-left font-sans">
          {step === 1 ? (
            <div className="space-y-4">
              {/* Categories & Author */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">안식처 테마구조 *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['숲', '정원', '휴식 공간', '기타'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                          category === cat
                            ? 'bg-primary text-cream shadow-sm font-bold'
                            : 'bg-cream-dark/40 text-bark/80 hover:bg-cream-dark/80'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">작성자 닉네임 *</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="예: 2학년 김당정, 미술쌤 등"
                    className="w-full px-3 py-2 text-xs bg-cream/70 border border-outline-variant/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Title & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">안식처 이름 *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="감성을 담아 명명해 보세요 (예: 아침의 투영)"
                    maxLength={20}
                    className="w-full px-3 py-2 text-xs bg-cream/70 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-bark/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary mb-1.5">위치 *</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="예: 3층 도서실 가온느티 쉼터"
                    maxLength={30}
                    className="w-full px-3 py-2 text-xs bg-cream/70 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-bark/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-primary mb-1.5">안식처 힐링 소감 및 설명 *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="이 공간에서 어떤 마음의 위안을 느끼셨나요? 다른 학우들과 나누고 싶은 힐링의 순간을 시적으로 표현해 주시면 더 좋습니다."
                  rows={3}
                  maxLength={180}
                  className="w-full px-3 py-2 text-xs bg-cream/70 border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-bark/30 resize-none leading-relaxed"
                />
                <span className="text-[10px] text-bark/40 text-right block mt-1">최대 180자</span>
              </div>

              {/* Image Drag & Drop Selector */}
              <div>
                <label className="block text-xs font-bold text-primary mb-2">힐링 사진 업로드 혹은 엠블럼 프리셋 선택 *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Drop zone area */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed h-40 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? 'border-primary-light bg-primary-light/10 text-primary-light'
                        : customFile
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant bg-cream-dark/20 text-bark/60 hover:bg-cream-dark/40'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    {customFile ? (
                      <div className="relative w-full h-full flex flex-col items-center justify-center gap-1.5">
                        <img
                          src={customFile}
                          alt="Uploaded thumb"
                          className="w-16 h-16 object-cover rounded-md border border-primary/20 shadow-sm"
                        />
                        <p className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          나만의 사진 업로드 완료!
                        </p>
                        <p className="text-[9px] text-bark/40 underline rounded">다른 사진으로 변경하기</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 mb-2 text-primary-light/80 animate-bounce" />
                        <p className="text-xs font-bold text-primary">이곳에 힐링 안식처 사진 드래그</p>
                        <p className="text-[10px] text-bark/40 mt-1">또는 클릭하여 디바이스 이미지 선택</p>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Presets removed */}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // STEP 2: MAP PIN POINTING INTERACTIVE
            <div className="space-y-4">
              <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/10 flex gap-2 items-start">
                <MapPin className="w-5 h-5 text-primary-light flex-shrink-0 mt-0.5 animate-bounce" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-primary">지도를 클릭하여 안식처 핀 위치 지정 *</p>
                  <p className="text-bark/60 leading-relaxed">
                    아래 캠퍼스 힐링 가이드맵 바탕 위를 원하시는 위치만큼 가볍게 클릭해 주세요. 그곳에 잎사귀 핀이 꽂히게 됩니다.
                  </p>
                </div>
              </div>

              {/* Map Canvas click pointing area */}
              <div 
                onClick={handleCoordsPick}
                className="relative w-full aspect-[21/9] bg-cream-dark rounded-xl overflow-hidden cursor-crosshair border border-primary/20 shadow-md select-none group"
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center brightness-75 grayscale-[20%]"
                  style={{ 
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD79r_afFvoHlx2bUqbk_AnR0J_zU_YHg47HA5koeJuWUz4vbftSqY3iYSIYDRLuo4BVzeG9y252D2geQT5peTfNdY4_QIUYLiX09y2vCZloIi1Y1gydur6ztjHMHoOk-CZKMDP_4hlpSZCbckMX80u3v1G_GcQXIuAWEJ32OECSQabe0vVvRTl2-4gJNA52B1B9CCTgRr2n1DpcdVHz4xtVwIptzv9fHyd9NEepNFw-yWLgI7yed9lvya5RPKECQQ8MnrIsnvTaOY')`,
                  }}
                />
                
                {/* Simulated Grid overlay */}
                <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#012d1d_1px,transparent_1px)] [background-size:12px_12px]" />

                {/* Grid guidelines for reference */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="text-[10px] text-cream font-bold uppercase tracking-wider bg-black/40 px-2 py-1 rounded">
                    DANGJEONG MAP INTERACTION
                  </div>
                </div>

                {/* Target Pin */}
                <div 
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                >
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400/40 animate-ping" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 border border-amber-300 shadow-md text-cream">
                    <MapPin className="w-4 h-4 animate-bounce" />
                  </div>
                </div>

                {/* Floating guide label */}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] text-cream font-mono">
                  X: {coords.x}%, Y: {coords.y}%
                </div>
              </div>

              <div className="bg-cream p-3 rounded-lg border border-outline-variant/30 text-left">
                <p className="text-[11px] font-bold text-primary flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary-light" />
                  스팟 미리보기 카드 요약
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-bark/80 font-sans">
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-cream-dark">
                    <img src={customFile || ''} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <p className="font-bold text-primary">{title || '(스팟 이름 무제)'}</p>
                    <p className="text-[10px] text-bark/50">{locationName || '(위치 정보 미입력)'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex gap-3 justify-end border-t border-cream-dark pt-4 bg-white">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 bg-cream hover:bg-cream-dark text-bark rounded-full text-xs font-bold transition-all active:scale-95"
            >
              이전 단계
            </button>
          )}

          {step === 1 ? (
            <button
              onClick={() => {
                if (!title || !description || !locationName) {
                  alert('모든 필수 항목을 기입해 주세요!');
                  return;
                }
                setStep(2);
              }}
              className="px-6 py-2.5 bg-primary hover:bg-primary-light text-cream rounded-full text-xs font-bold transition-all active:scale-95 shadow-md flex items-center gap-1"
            >
              다음: 지도 위에 핀 꽂기
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-primary hover:bg-primary-light text-cream rounded-full text-xs font-bold transition-all active:scale-95 shadow-md flex items-center gap-1.5"
            >
              당정 안식처 지도 등록 완료
              <Sparkles className="w-3.5 h-3.5 text-moss-light animate-pulse" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
