import React, { useState, useEffect } from 'react';
import { useSpring, animated, config } from '@react-spring/three';

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
  onDraw: () => void;
  isActive: boolean;
  onHoverChange: (isHovered: boolean) => void;
}

// Placeholder for MP3 Sound
const playBambooShake = () => {
    // TODO: Place your audio file at /public/sounds/stick_shake.mp3
    const audio = new Audio('/sounds/stick_shake.mp3');
    audio.volume = 0.8;
    audio.play().catch((e) => console.warn("Audio play failed (missing file?):", e));
};

// Memoized Geometry Mesh
const FortuneContainerMesh: React.FC = React.memo(() => {
    return (
        <group>
             <mesh position={[0, 1, 0]} castShadow>
                <cylinderGeometry args={[0.35, 0.35, 2, 32]} />
                <meshStandardMaterial color="#3d1f1f" roughness={0.5} />
            </mesh>
            <mesh position={[0, 2, 0]}>
                <torusGeometry args={[0.35, 0.03, 16, 32]} />
                <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 1.8, 16]} />
                <meshStandardMaterial color="#1a0a0a" />
            </mesh>
        </group>
    )
})

export const FortuneStick3D: React.FC<Props> = ({ onDraw, isActive, onHoverChange }) => {
  const [animating, setAnimating] = useState(false);

  // Z=1 matches the containerPos below
  const initialConfig = {
    containerPos: [2.5, 0, 1],
    containerRot: [0, 0, 0],
    stickPos: [0, 0, 0], 
  };

  const [springs, api] = useSpring(() => ({
    ...initialConfig,
    config: config.wobbly,
  }));

  useEffect(() => {
    if (!isActive && !animating) {
        api.start({
            ...initialConfig,
            config: { tension: 100, friction: 20 }
        });
    }
  }, [isActive, animating, api]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    // Stop immediate propagation to prevent triggering objects behind or overlapping
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();

    // Capture pointer to ensure interaction continues even if mouse/finger leaves the mesh bounds
    e.target.setPointerCapture(e.pointerId);

    if (animating || isActive) return;
    setAnimating(true);

    const tiltAngle = -Math.PI / 4; 

    // Tilt
    api.start({
        containerRot: [0, 0, tiltAngle],
        containerPos: [2.2, 0.5, 1],
        config: { tension: 100, friction: 20 }
    });

    let shakeCount = 0;
    const maxShakes = 10;
    
    const shake = () => {
        if (shakeCount >= maxShakes) {
            // Eject
            api.start({
                stickPos: [0, 2.5, 0], 
                config: { tension: 150, friction: 50 }
            });
            
            setTimeout(() => {
                onDraw();
                setAnimating(false);
            }, 800);
            return;
        }

        playBambooShake();

        shakeCount++;
        const offset = shakeCount % 2 === 0 ? 0.1 : -0.1;
        
        api.start({
            containerPos: [2.2 + offset, 0.5 + offset, 1],
            config: { duration: 100 },
            onRest: shake
        });

        api.start({
            stickPos: [0, shakeCount * 0.15, 0],
            config: { duration: 100 }
        });
    };

    setTimeout(shake, 400);
  };

  return (
    <group
        onPointerOver={(e) => { 
            e.stopPropagation(); 
            document.body.style.cursor = 'pointer'; 
            onHoverChange(true); 
        }}
        onPointerOut={(e) => { 
            e.stopPropagation(); 
            // Only stop highlighting if we aren't mid-animation
            if (!animating) {
                document.body.style.cursor = 'auto'; 
                onHoverChange(false); 
            }
        }}
        onPointerDown={handlePointerDown}
    >
        {/* HITBOX ALIGNED WITH VISUALS (Z=1.0) */}
        {/* Adjusted Z slightly forward to prioritize click capture over background objects */}
        <mesh 
            position={[2.5, 1, 1.2]} 
            visible={true}
            onClick={(e) => e.stopPropagation()} 
        >
            <cylinderGeometry args={[1.0, 1.0, 3, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} color="blue" />
        </mesh>

      <animated.group 
        position={springs.containerPos as any} 
        rotation={springs.containerRot as any}
      >
        <FortuneContainerMesh />

        <animated.mesh position={springs.stickPos as any}>
            <group position={[0, 0.5, 0]}> 
                <boxGeometry args={[0.04, 2.2, 0.04]} />
                <meshStandardMaterial color="#e0c090" />
                <mesh position={[0, 1, 0]}>
                     <boxGeometry args={[0.042, 0.2, 0.042]} />
                     <meshStandardMaterial color="#8a0000" />
                </mesh>
            </group>
        </animated.mesh>

        <mesh position={[0, 1, 0.36]}>
             <planeGeometry args={[0.4, 1.2]} />
             <meshStandardMaterial color="#8a0000" />
        </mesh>

      </animated.group>
    </group>
  );
};
