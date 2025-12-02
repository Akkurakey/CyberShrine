import React, { useState, useMemo, useEffect } from 'react';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';
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
  onThrow: () => Promise<MoonBlockResult>;
  onLand: (result: MoonBlockResult) => void;
  onReset: () => void;
  isActive: boolean;
  onHoverChange: (isHovered: boolean) => void;
}

// Placeholder for MP3 Sound
const playHeavyImpact = (intensity: number = 1) => {
    // TODO: Place your audio file at /public/sounds/moonblock.mp3
    const audio = new Audio('/sounds/moonblock.mp3');
    audio.volume = Math.min(1, intensity);
    audio.play().catch((e) => console.warn("Audio play failed (missing file?):", e));
};

// Component defined outside to prevent re-renders
const MoonBlockMesh = ({ position, rotation }: { position: any; rotation: any }) => {
  const { sphereGeo, circleGeo, materialRed, materialWood } = useMemo(() => {
    // GEOMETRY DEFINITION:
    // 1. The Red Curved Bottom (Half Sphere)
    const sGeo = new THREE.SphereGeometry(0.35, 32, 32, 0, Math.PI);
    sGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.4, 0.5, 0.6));
    sGeo.rotateX(Math.PI); 
    
    // 2. The Wood Flat Top
    const cGeo = new THREE.CircleGeometry(0.35, 32);
    cGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.4, 0.6, 1));
    cGeo.rotateX(-Math.PI / 2); // Rotate to face UP (+Y)

    const matRed = new THREE.MeshStandardMaterial({
      color: "#c93838",
      roughness: 0.2,
      metalness: 0.1,
    });

    const matWood = new THREE.MeshStandardMaterial({
      color: "#e3cba8",
      roughness: 0.8,
      metalness: 0.0,
    });

    return { sphereGeo: sGeo, circleGeo: cGeo, materialRed: matRed, materialWood: matWood };
  }, []);

  return (
    <animated.group position={position} rotation={rotation}>
        <mesh geometry={sphereGeo} material={materialRed} castShadow receiveShadow />
        <mesh geometry={circleGeo} material={materialWood} receiveShadow />
    </animated.group>
  );
};

export const MoonBlocks3D: React.FC<Props> = ({ onThrow, onLand, onReset, isActive, onHoverChange }) => {
  const [animating, setAnimating] = useState(false);
  
  // Z=2.5 matches the scene depth better
  const initialConfig = {
    pos1: [-0.6, 0.05, 2.5],
    rot1: [Math.PI, -0.4, 0], 
    pos2: [0.6, 0.05, 2.5],
    rot2: [Math.PI, 0.4, 0],   
  };

  const [springs, api] = useSpring(() => ({
    ...initialConfig,
    config: config.default,
  }));

  // RESET LOGIC: Only happens when UI closes (isActive false) and we are not animating
  useEffect(() => {
    if (!isActive && !animating) {
        api.start({
            ...initialConfig,
            config: { tension: 60, friction: 20 } // Gentler return
        });
    }
  }, [isActive, animating, api]);

  useEffect(() => {
    if (isActive) {
        setAnimating(false);
    }
  }, [isActive]);

  const handlePointerDown = async (e: any) => {
    e.stopPropagation();
    // Prevent event bubbling to avoid triggering overlapping elements
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();

    if (animating || isActive) return; 
    
    onReset();
    setAnimating(true);

    // --- PHASE 1: THE TOSS ---
    const spinBase = 2 * Math.PI; 
    
    api.start({
      pos1: [-0.4, 2.5, 2.5], 
      rot1: [spinBase + (Math.random() * Math.PI), Math.random(), Math.random()], 
      pos2: [0.4, 2.5, 2.5],
      rot2: [spinBase + (Math.random() * Math.PI), Math.random(), Math.random()],
      config: { duration: 500, easing: (t) => 1 - Math.pow(1 - t, 2) } 
    });

    await new Promise(r => setTimeout(r, 450));

    // Calculate Result
    const result = await onThrow();
    
    // Determine Landing Targets
    let target1X = 0;
    let target2X = 0;

    if (result === MoonBlockResult.DIVINE) {
       target1X = 0;       
       target2X = Math.PI; 
    } else if (result === MoonBlockResult.LAUGHING) {
       target1X = 0;
       target2X = 0;
    } else {
       target1X = Math.PI;
       target2X = Math.PI;
    }

    const getFinalRot = (base: number) => (2 * Math.PI) + base; 
    const landRot1X = getFinalRot(target1X);
    const landRot2X = getFinalRot(target2X);
    
    const landYaw1 = (Math.random() - 0.5) * 1.5; 
    const landYaw2 = (Math.random() - 0.5) * 1.5;

    // --- PHASE 2: IMPACT ---
    api.start({
      pos1: [-0.6, 0.14, 2.5], 
      rot1: [landRot1X, landYaw1, 0],
      pos2: [0.6, 0.14, 2.5],
      rot2: [landRot2X, landYaw2, 0],
      config: { duration: 350, easing: (t) => t * t }
    });

    await new Promise(r => setTimeout(r, 350));
    playHeavyImpact(1.0);

    // --- PHASE 3: BOUNCE ---
    api.start({
        pos1: [-0.65, 0.4, 2.6], 
        rot1: [landRot1X + (Math.random()-0.5)*0.1, landYaw1 + 0.1, 0],
        config: { tension: 200, friction: 15 }
    });
    
    setTimeout(() => {
        playHeavyImpact(0.6);
        api.start({
            pos2: [0.65, 0.3, 2.6],
            rot2: [landRot2X + (Math.random()-0.5)*0.1, landYaw2 - 0.1, 0],
            config: { tension: 180, friction: 15 }
        });
    }, 80);

    await new Promise(r => setTimeout(r, 150));

    // --- PHASE 4: SETTLE ---
    api.start({
      pos1: [-0.7, 0.05, 2.65], 
      rot1: [landRot1X, landYaw1, 0], 
      pos2: [0.7, 0.05, 2.65],
      rot2: [landRot2X, landYaw2, 0],
      config: { tension: 150, friction: 20 }
    });

    // Wait 2 seconds (2000ms) before showing UI to let user see the result clearly
    setTimeout(() => {
        onLand(result);
    }, 2000);
  };

  return (
    <group 
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; onHoverChange(true); }}
        onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; onHoverChange(false); }}
        onPointerDown={handlePointerDown}
    >
        {/* HITBOX ALIGNED WITH VISUALS (Z=2.5) */}
        {/* Reduced width from 2.8 to 2.5 to verify separation from side objects */}
        <mesh 
            position={[0, 0.5, 2.5]} 
            visible={true} 
            onPointerDown={handlePointerDown}
        >
            <boxGeometry args={[2.5, 2.0, 2.5]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} color="red" />
        </mesh>

      <MoonBlockMesh position={springs.pos1} rotation={springs.rot1} />
      <MoonBlockMesh position={springs.pos2} rotation={springs.rot2} />
    </group>
  );
};
