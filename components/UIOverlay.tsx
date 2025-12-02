import React from 'react';
import { MoonBlockResult, Fortune } from '../types';

// Fix for missing SVG element types in JSX due to global overrides in other files
declare global {
  namespace JSX {
    interface IntrinsicElements {
      svg: any;
      circle: any;
      path: any;
      line: any;
    }
  }
}

interface Props {
  blockResult: MoonBlockResult | null;
  fortune: Fortune | null;
  onCloseResult: () => void;
}

export const UIOverlay: React.FC<Props> = ({ blockResult, fortune, onCloseResult }) => {
  
  const getBlockContent = (result: MoonBlockResult) => {
    switch (result) {
      case MoonBlockResult.DIVINE:
        return { 
          title: "【 聖杯 】 Divine", 
          desc: "神明答應、贊同或可行\n(The gods agree or approve.)",
          icon: "☯",
          color: "#d4af37"
        };
      case MoonBlockResult.LAUGHING:
        return { 
          title: "【 笑杯 】 Laughing", 
          desc: "神明無法裁示，需要重新請示\n(The gods smile; unclear, please ask again.)",
          // Using SVG to prevent Safari from rendering text as Emoji
          icon: (
            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          ),
          color: "#e0d0b0"
        };
      case MoonBlockResult.YIN:
        return { 
          title: "【 怒杯 】 Yin", 
          desc: "神明否定或對所求的事不應許\n(The gods deny or disapprove.)",
          icon: "☾",
          color: "#8a2a2a"
        };
      default: return null;
    }
  };

  const blockContent = blockResult ? getBlockContent(blockResult) : null;

  // No text instructions when idle, just return null if no result
  if (!blockContent && !fortune) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none p-4 md:p-8">
      {/* Modal Container */}
      <div className="bg-black/90 border border-[#4a0404] p-6 md:p-8 w-[90%] md:max-w-md text-center relative pointer-events-auto backdrop-blur-md animate-fade-in shadow-[0_0_50px_rgba(100,20,20,0.4)] rounded-lg flex flex-col justify-center">
        
        {/* Close Button */}
        <button 
          onClick={onCloseResult}
          className="absolute top-2 right-3 md:top-3 md:right-3 text-[#666] hover:text-[#d4af37] transition-colors text-xl md:text-base p-2"
        >
          ✕
        </button>

        {/* Content for Moon Blocks */}
        {blockContent && (
          <div className="flex flex-col items-center gap-2 md:gap-4">
            <div className="text-5xl md:text-6xl animate-bounce-slow drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{color: blockContent.color}}>
                {blockContent.icon}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#e0d0b0] font-serif tracking-widest">{blockContent.title}</h2>
            <div className="w-full h-px bg-gradient-to-r from-transparent via-[#4a0404] to-transparent my-3 md:my-4" />
            <p className="text-gray-300 font-serif text-base md:text-lg whitespace-pre-line leading-relaxed">
                {blockContent.desc}
            </p>
          </div>
        )}

        {/* Content for Fortune */}
        {fortune && (
          <div className="flex flex-col items-center gap-3 md:gap-4">
             <h2 className="text-lg md:text-xl font-bold text-[#d4af37] font-serif mb-1 md:mb-2 border-b border-[#4a0404] pb-1 tracking-widest">灵 签  /  FORTUNE</h2>
             
             {/* Text Container */}
             <div className="text-base md:text-lg text-white font-serif leading-relaxed glow-text whitespace-pre-line">
                {fortune.text}
             </div>
             
             <p className="text-xs text-[#666] mt-2 md:mt-4 italic">
                 {fortune.isGemini ? "Echoes from the Digital Void" : "Ancient Wisdom"}
             </p>
          </div>
        )}

        {/* Action Button */}
        <button 
            onClick={onCloseResult}
            className="mt-6 md:mt-8 px-6 md:px-8 py-2 md:py-2 border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition-all duration-300 font-serif uppercase tracking-widest text-sm rounded-sm"
        >
            Received / 领 受
        </button>
      </div>

      <style>{`
        .glow-text { text-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
        @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
};