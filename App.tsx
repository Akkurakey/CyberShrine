import React, { useState, useRef } from 'react';
import { CyberShrineScene } from './components/CyberShrineScene';
import { UIOverlay } from './components/UIOverlay';
import { MoonBlockResult, Fortune } from './types';
import { generateFortune, regenerateDivineImage } from './services/geminiService';
import { Html } from '@react-three/drei';

const App: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isGeneratingGod, setIsGeneratingGod] = useState(false);
  const [blockResult, setBlockResult] = useState<MoonBlockResult | null>(null);
  const [fortune, setFortune] = useState<Fortune | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = async () => {
    // Check for AI Studio Key Selection environment
    if (window.aistudio) {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
        }
      } catch (error) {
        console.error("API Key selection failed or cancelled:", error);
        // Continue anyway to allow local dev fallback if configured manually
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsGeneratingGod(true);
      
      // 1. Convert to Base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalBase64 = reader.result as string;
        
        // 2. Call AI to regenerate
        // We set a temporary image first if we want, or just wait.
        // Let's show the original while processing, or a loader.
        // For mystery, let's wait for the "God" to appear.
        
        const divineImage = await regenerateDivineImage(originalBase64);
        setUploadedImage(divineImage);
        setIsGeneratingGod(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Calculate result immediately but don't show UI yet
  const handleBlockThrow = async (): Promise<MoonBlockResult> => {
    return new Promise((resolve) => {
        const rand = Math.random();
        let result: MoonBlockResult;
        
        // Probability Logic - Uniform 33% split for "more random" feel
        if (rand < 0.333) {
            result = MoonBlockResult.DIVINE; // One Up / One Down
        } else if (rand < 0.666) {
            result = MoonBlockResult.LAUGHING; // Two Flat Up
        } else {
            result = MoonBlockResult.YIN; // Two Round Up
        }

        // Return result to 3D model for animation
        setTimeout(() => {
            resolve(result);
        }, 50); 
    });
  };

  // 2. Show UI only after animation lands
  const handleBlockLand = (result: MoonBlockResult) => {
      setBlockResult(result);
  };

  const handleBlockReset = () => {
    setBlockResult(null);
  };

  const handleFortuneDraw = async () => {
    const text = await generateFortune();
    setFortune({ text, isGemini: true });
  };

  const handleCloseOverlay = () => {
    setBlockResult(null);
    setFortune(null);
  };

  return (
    <div className="relative w-full h-screen bg-[#050101] text-[#e0d0b0]">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      {isGeneratingGod && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
            <div className="text-[#d4af37] font-serif tracking-widest animate-pulse text-xl flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-t-[#d4af37] border-[#4a0404] rounded-full animate-spin"></div>
                MANIFESTING SPIRIT...
            </div>
        </div>
      )}

      <CyberShrineScene 
        uploadedImage={uploadedImage} 
        onUploadClick={handleUploadClick}
        onBlockThrow={handleBlockThrow}
        onBlockLand={handleBlockLand}
        onBlockReset={handleBlockReset}
        onFortuneDraw={handleFortuneDraw}
        isBlockActive={!!blockResult}
        isFortuneActive={!!fortune}
      />

      <UIOverlay 
        blockResult={blockResult} 
        fortune={fortune} 
        onCloseResult={handleCloseOverlay} 
      />
    </div>
  );
};

export default App;