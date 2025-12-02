import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Sparkles, Html, Cloud, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { ShrineModel } from './ShrineModel';
import { MoonBlocks3D } from './MoonBlocks3D';
import { FortuneStick3D } from './FortuneStick3D';
import { MoonBlockResult } from '../types';

// Fix for missing React Three Fiber element types in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      cylinderGeometry: any;
      torusGeometry: any;
      sphereGeometry: any;
      circleGeometry: any;
      primitive: any;
      pointLight: any;
      spotLight: any;
      ambientLight: any;
      fog: any;
      planeGeometry: any;
      // Add HTML elements
      div: any;
      span: any;
      p: any;
      h2: any;
      button: any;
      input: any;
      style: any;
    }
  }
}

interface Props {
  uploadedImage: string | null;
  onUploadClick: () => void;
  onBlockThrow: () => Promise<MoonBlockResult>;
  onBlockLand: (result: MoonBlockResult) => void;
  onBlockReset: () => void;
  onFortuneDraw: () => void;
  isBlockActive: boolean;
  isFortuneActive: boolean;
}

const Loader = () => (
  <Html center>
    <div className="flex flex-col items-center justify-center pointer-events-none">
      <div className="w-12 h-12 border-4 border-[#4a0404] border-t-[#d4af37] rounded-full animate-spin mb-4"></div>
      <div className="text-[#d4af37] font-serif text-sm tracking-widest animate-pulse">
        CONNECTING...
      </div>
    </div>
  </Html>
);

const CandleLights = () => {
    const light1 = useRef<THREE.PointLight>(null);
    const light2 = useRef<THREE.PointLight>(null);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (light1.current) {
            light1.current.intensity = 2 + Math.sin(t * 10) * 0.5 + Math.random() * 0.5;
        }
        if (light2.current) {
            light2.current.intensity = 2 + Math.cos(t * 8) * 0.5 + Math.random() * 0.5;
        }
    });

    return (
        <group>
            {/* Left Candle Light */}
            <pointLight ref={light1} position={[-3, 1.5, 2]} color="#ff3300" distance={6} decay={2} />
            {/* Right Candle Light */}
            <pointLight ref={light2} position={[3, 1.5, 2]} color="#ff3300" distance={6} decay={2} />
        </group>
    );
};

// Component to handle camera responsiveness
const ResponsiveCamera = () => {
  const { camera } = useThree();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // Combine Mobile (<768) and Tablet (<1024) into one logical view
      if (width < 1024) {
        setIsSmallScreen(true);
      } else {
        setIsSmallScreen(false);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useFrame(() => {
    let targetPos, targetLook;

    if (isSmallScreen) {
        // Unified Mobile & Tablet View (Z=14.0)
        targetPos = new THREE.Vector3(0, 2.5, 14.0);
        targetLook = new THREE.Vector3(0, 1.0, 0);
    } else {
        // Desktop (Z=8.0)
        // Adjusted from 1.6 to 1.3 to lower the camera slightly
        targetPos = new THREE.Vector3(0, 1.3, 8.0); 
        targetLook = new THREE.Vector3(0, 0.8, 0);
    }

    camera.position.lerp(targetPos, 0.1);
    camera.lookAt(targetLook);
  });

  return null;
};

export const CyberShrineScene: React.FC<Props> = ({
  uploadedImage,
  onUploadClick,
  onBlockThrow,
  onBlockLand,
  onBlockReset,
  onFortuneDraw,
  isBlockActive,
  isFortuneActive,
}) => {
  const [hoveredObject, setHoveredObject] = useState<'blocks' | 'stick' | null>(null);

  return (
    <div className="w-full h-screen absolute top-0 left-0 z-0 bg-[#000000]">
      <Canvas dpr={[1, 2]} shadows={false}>
        <PerspectiveCamera makeDefault fov={45} />
        <ResponsiveCamera />
        
        <fog attach="fog" args={['#000000', 8, 30]} />
        
        <Environment preset="night" environmentIntensity={0.6} />
        
        {/* LIGHTING SETUP */}
        <ambientLight intensity={0.4} color="#1a0505" />
        
        {/* Rim Light for outline */}
        <spotLight 
            position={[-5, 2, 5]} 
            intensity={5} 
            color="#aa00ff" 
            angle={0.6} 
            penumbra={1} 
            distance={20}
            shadow-bias={-0.0001}
        />
        <spotLight 
            position={[5, 2, 5]} 
            intensity={5} 
            color="#00aaff" 
            angle={0.6} 
            penumbra={1} 
            distance={20}
            shadow-bias={-0.0001}
        />

        {/* Main Shrine Interior Light */}
        <pointLight 
            position={[0, 3, 1]} 
            intensity={2.0} 
            color="#ffaa00" 
            distance={8} 
            decay={2}
        />

        {/* CENTER SPOTLIGHT - Highlighting the God/Offering */}
        <spotLight 
            position={[0, 2, 4]} 
            target-position={[0, 1.5, 0]}
            intensity={10} 
            color="#fff0aa" 
            angle={0.5} 
            penumbra={0.5} 
            distance={10}
            shadow-bias={-0.0001}
        />

        {/* Floor Light - Illuminating the Moon Blocks (Blended with Red) */}
        <pointLight 
            position={[0, 1.0, 4.0]} 
            intensity={2} 
            color="#ffccaa" 
            distance={6} 
            decay={2}
        />

        <CandleLights />

        {/* Interaction Highlights */}
        <pointLight 
          position={[-0.5, 0.5, 3.5]} 
          intensity={hoveredObject === 'blocks' || isBlockActive ? 6 : 0} 
          color="#ff3333" 
          distance={3} 
          decay={2}
        />
        <pointLight 
          position={[2.5, 1.5, 2]} 
          intensity={hoveredObject === 'stick' || isFortuneActive ? 8 : 0} 
          color="#d4af37" 
          distance={3} 
          decay={2}
        />
        
        <Suspense fallback={<Loader />}>
          <group position={[0, -1.2, 0]}>
            <ShrineModel uploadedImage={uploadedImage} onUploadClick={onUploadClick} />
            
            <MoonBlocks3D 
              onThrow={onBlockThrow} 
              onLand={onBlockLand}
              onReset={onBlockReset} 
              isActive={isBlockActive}
              onHoverChange={(hover) => setHoveredObject(hover ? 'blocks' : null)}
            />
            
            <FortuneStick3D 
              onDraw={onFortuneDraw} 
              isActive={isFortuneActive}
              onHoverChange={(hover) => setHoveredObject(hover ? 'stick' : null)}
            />
            
            {/* Pure Black Void Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[100, 100]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
            
          </group>
          
          {/* Atmospheric Effects */}
          <group position={[0, 0, 0]} raycast={() => null}>
             {/* Stars removed as requested */}

             <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.2}>
                <Cloud opacity={0.1} speed={0.02} bounds={[6, 2, 2.5]} segments={10} position={[0, 4, -5]} color="#661111" />
             </Float>
             <Cloud opacity={0.08} speed={0.015} bounds={[7.5, 2, 4]} segments={15} position={[-5, 1, -2]} color="#110505" />
             <Cloud opacity={0.08} speed={0.015} bounds={[7.5, 2, 4]} segments={15} position={[5, 1, -2]} color="#110505" />
          </group>

          <Sparkles count={200} scale={12} size={6} speed={0.2} opacity={0.6} color="#d4af37" position={[0, 2, 2]} raycast={() => null} />
        </Suspense>
      </Canvas>
    </div>
  );
};