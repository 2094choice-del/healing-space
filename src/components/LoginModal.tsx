import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, ShieldAlert, Sparkles, Check, HelpCircle } from 'lucide-react';
import { UserSession } from '../types';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: (session: UserSession) => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [role, setRole] = useState<'studentOrTeacher' | 'admin'>('studentOrTeacher');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleLogin = () => {
    setError('');
    const trimmedInput = password.trim();

    if (role === 'admin') {
      if (trimmedInput === '3377') {
        setIsUnlocked(true);
        setTimeout(() => {
          onSuccess({
            role: 'admin',
            isLoggedIn: true,
            name: '당정중 총관리자',
          });
        }, 800);
      } else {
        setError('관리자 코드가 올바르지 않습니다. (비공개)');
      }
    } else {
      if (trimmedInput === 'heart') {
        setIsUnlocked(true);
        setTimeout(() => {
          onSuccess({
            role: 'studentOrTeacher',
            isLoggedIn: true,
            name: '당정인',
          });
        }, 800);
      } else {
        setError('당정인용 보완코드가 올바르지 않습니다. (가이드: "heart")');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/45 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative border border-primary/10 text-center space-y-6"
      >
        {/* Lock Anim Circle */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center bg-primary/5 rounded-full border border-primary-light/15">
          <motion.div
            animate={isUnlocked ? { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            {isUnlocked ? (
              <Unlock className="w-8 h-8 text-emerald-500" />
            ) : (
              <Lock className="w-8 h-8 text-primary-light animate-pulse" />
            )}
          </motion.div>
          {isUnlocked && (
            <span className="absolute inset-0 rounded-full border border-emerald-400 animate-ping" />
          )}
        </div>

        {/* Header Titles */}
        <div className="space-y-2">
          <h3 className="font-serif text-2xl font-bold text-primary">당정중 디지털 안식처 열기</h3>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1.5 p-1 bg-cream-dark/40 rounded-xl border border-outline-variant/30 font-sans">
          <button
            onClick={() => {
              setRole('studentOrTeacher');
              setError('');
              setPassword('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              role === 'studentOrTeacher'
                ? 'bg-primary text-cream shadow-sm font-bold'
                : 'text-bark/70 hover:bg-cream-dark/50'
            }`}
          >
            학생 / 선생님
          </button>
          <button
            onClick={() => {
              setRole('admin');
              setError('');
              setPassword('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              role === 'admin'
                ? 'bg-primary text-cream shadow-sm font-bold'
                : 'text-bark/70 hover:bg-cream-dark/50'
            }`}
          >
            총 관리자
          </button>
        </div>

        {/* Password input section */}
        <div className="space-y-2 font-sans text-left">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-bold text-primary">
              {role === 'admin' ? "관리자 권한 암호" : "안식처 입장코드"}
            </label>
            {role !== 'admin' && (
              <span className="text-[10px] text-primary/80 font-bold bg-primary-light/10 px-2 py-0.5 rounded-full border border-primary-light/15">
                입력: <span className="underline font-black text-primary">heart</span>
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={role === 'admin' ? "관리자 권한 암호 입력" : "안식처 입장코드 입력 (heart)"}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-3 bg-cream/70 border border-outline-variant/40 rounded-xl text-sm text-bark font-sans outline-none focus:ring-2 focus:ring-primary/80 focus:border-transparent transition-all placeholder:text-bark/30"
            />
          </div>



          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-1"
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="space-y-2 pt-2 font-sans">
          <button
            onClick={handleLogin}
            disabled={isUnlocked}
            className={`w-full py-3.5 text-xs font-bold rounded-full shadow-md active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 ${
              isUnlocked
                ? 'bg-emerald-600 text-cream'
                : 'bg-primary hover:bg-primary-light text-cream'
            }`}
          >
            {isUnlocked ? (
              <>
                입장 권한 해제 완료!
                <Check className="w-4 h-4 text-cream" />
              </>
            ) : (
              <>
                힐링터로 입장하기
                <Sparkles className="w-3.5 h-3.5 text-moss-light animate-pulse" />
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full text-xs text-bark/50 hover:text-primary transition-colors py-2 font-semibold"
          >
            뒤로 가기
          </button>
        </div>
      </motion.div>
    </div>
  );
}
