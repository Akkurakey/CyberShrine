import React, { useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { RoundedBox, Float, Html } from '@react-three/drei';

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
}

const DivineReliefMaterial = {
  uniforms: {
    map: { value: null },
    uTime: { value: 0 },
  },
  vertexShader: `
    uniform sampler2D map;
    uniform float uTime;
    varying vec2 vUv;
    varying float vElev;

    void main() {
      vUv = uv;
      vec4 texColor = texture2D(map, uv);
      float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
      float dist = distance(uv, vec2(0.5));
      float centerMask = smoothstep(0.8, 0.2, dist);
      float displacement = luminance * centerMask * 0.3;
      vElev = displacement;
      vec3 pos = position;
      pos.z += displacement; 
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D map;
    uniform float uTime;
    varying vec2 vUv;
    varying float vElev;

    void main() {
      vec4 texColor = texture2D(map, vUv);
      float luminance = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
      float alpha = smoothstep(0.05, 0.15, luminance);
      if (alpha < 0.05) discard;
      vec3 gold = vec3(1.0, 0.9, 0.5);
      vec3 darkGold = vec3(0.7, 0.5, 0.2);
      vec3 baseColor = mix(darkGold, gold, luminance);
      vec3 finalColor = mix(texColor.rgb, baseColor, 0.7); 
      float pulse = (sin(uTime * 1.5) * 0.5 + 0.5) * 0.15;
      finalColor += vec3(pulse, pulse * 0.8, 0.0);
      float rim = vElev * 3.0;
      finalColor += vec3(rim);
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
};

export const ShrineModel: React.FC<Props> = ({ uploadedImage, onUploadClick }) => {
  const [aspectRatio, setAspectRatio] = useState(1);

  const texture = useMemo(() => {
    if (uploadedImage) {
      const tex = new THREE.TextureLoader().load(uploadedImage, (t) => {
          setAspectRatio(t.image.width / t.image.height);
      });
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    }
    return null;
  }, [uploadedImage]);

  const reliefMaterial = useMemo(() => {
      return new THREE.ShaderMaterial({
          uniforms: THREE.UniformsUtils.clone(DivineReliefMaterial.uniforms),
          vertexShader: DivineReliefMaterial.vertexShader,
          fragmentShader: DivineReliefMaterial.fragmentShader,
          transparent: true,
          side: THREE.DoubleSide,
      });
  }, []);

  useEffect(() => {
    if (reliefMaterial && texture) {
        reliefMaterial.uniforms.map.value = texture;
    }
  }, [reliefMaterial, texture]);

  useEffect(() => {
      let frameId: number;
      const animate = () => {
          if (reliefMaterial) {
              reliefMaterial.uniforms.uTime.value = performance.now() / 1000;
          }
          frameId = requestAnimationFrame(animate);
      };
      animate();
      return () => cancelAnimationFrame(frameId);
  }, [reliefMaterial]);

  const woodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: "#380d0d", 
      roughness: 0.3,
      metalness: 0.2,
  }), []);

  const meshScale = useMemo(() => {
      // Fix the maximum dimension to fit inside the shrine box (approx 2.5 units max)
      const MAX_SIZE = 2.5;
      if (aspectRatio > 1) {
          // Landscape
          return [MAX_SIZE, MAX_SIZE / aspectRatio, 1] as [number, number, number];
      } else {
          // Portrait or Square
          return [MAX_SIZE * aspectRatio, MAX_SIZE, 1] as [number, number, number];
      }
  }, [aspectRatio]);

  return (
    <group position={[0, 0, -1]}>
      {/* Base */}
      <mesh position={[0, -0.2, 1]} receiveShadow>
        <boxGeometry args={[6, 0.4, 4]} />
        <meshStandardMaterial color="#1f0808" roughness={0.8} />
      </mesh>

      {/* Shrine Frame */}
      <group position={[0, 2, -1]}>
         <primitive object={woodMaterial} attach="material" />
         <RoundedBox args={[4.2, 4.2, 0.3]} radius={0.1} smoothness={4} castShadow receiveShadow>
            <primitive object={woodMaterial} attach="material" />
         </RoundedBox>
         <group position={[-2.2, 0, 1]}>
            <RoundedBox args={[0.3, 4.2, 2.4]} radius={0.1} smoothness={4} castShadow receiveShadow>
                 <primitive object={woodMaterial} attach="material" />
            </RoundedBox>
         </group>
         <group position={[2.2, 0, 1]}>
             <RoundedBox args={[0.3, 4.2, 2.4]} radius={0.1} smoothness={4} castShadow receiveShadow>
                 <primitive object={woodMaterial} attach="material" />
            </RoundedBox>
         </group>
      </group>
      
      {/* Tiered Roof */}
      <group position={[0, 4.3, 0]}>
          {/* Main Eave Layer - Wide and solid */}
          <group position={[0, 0, 0.5]}>
             <RoundedBox args={[5.2, 0.3, 3.2]} radius={0.05} smoothness={4} castShadow receiveShadow>
                <meshStandardMaterial color="#260f0f" roughness={0.4} />
             </RoundedBox>
             {/* Cyber Glow Line Under Eave */}
             <mesh position={[0, -0.16, 0]}>
                 <boxGeometry args={[5.3, 0.05, 3.3]} />
                 <meshBasicMaterial color="#ff0000" opacity={0.6} transparent />
             </mesh>
          </group>
          
          {/* Middle Layer */}
          <group position={[0, 0.35, 0.5]}>
             <RoundedBox args={[4.0, 0.3, 2.4]} radius={0.05} smoothness={4} castShadow receiveShadow>
                <meshStandardMaterial color="#380d0d" roughness={0.4} />
             </RoundedBox>
          </group>

          {/* Top Ridge Layer - Decorative */}
          <group position={[0, 0.65, 0.5]}>
             <RoundedBox args={[2.5, 0.3, 1.5]} radius={0.1} smoothness={4} castShadow receiveShadow>
                 <meshStandardMaterial color="#4a0404" roughness={0.3} />
             </RoundedBox>
              {/* Gold Ornaments on ends */}
             <mesh position={[-1.4, 0, 0]}>
                 <boxGeometry args={[0.3, 0.4, 1.6]} />
                 <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
             </mesh>
             <mesh position={[1.4, 0, 0]}>
                 <boxGeometry args={[0.3, 0.4, 1.6]} />
                 <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
             </mesh>
          </group>
      </group>

      {/* Offering Area */}
      <group position={[0, 1.5, 0]}>
        <group position={[0, -1.2, 0.5]}>
             <RoundedBox args={[3.4, 0.25, 1.8]} radius={0.05} smoothness={4} receiveShadow>
                <meshStandardMaterial color="#260f0f" roughness={0.5} />
             </RoundedBox>
        </group>
        
        <group position={[0, 0.5, 0.5]}>
            {/* Upload Hitbox */}
            <mesh 
                position={[0, 0, 1.0]} 
                onClick={(e) => { e.stopPropagation(); onUploadClick(); }}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
                visible={true}
            >
                <boxGeometry args={[1.5, 2.0, 0.5]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} color="green" />
            </mesh>

            {/* Visuals */}
            {texture ? (
                // GOLDEN SPIRIT RELIEF
                <group position={[0, 0.3, 0.5]}>
                    <Float speed={1.0} rotationIntensity={0.1} floatIntensity={0.1}>
                         <mesh material={reliefMaterial} scale={meshScale}>
                            <planeGeometry args={[1, 1, 128, 128]} />
                         </mesh>
                         {/* Uplight for God face */}
                         <pointLight position={[0, -1, 1]} color="#ffaa00" intensity={4} distance={3} />
                    </Float>
                </group>
            ) : (
                <group>
                    <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
                         {/* Moved HTML indicator slightly higher (y: 0.5 -> 0.8) */}
                         <Html position={[0, 0.8, 1]} center transform sprite scale={0.5} pointerEvents="none" zIndexRange={[100, 0]}>
                             <div className="flex flex-col items-center justify-center select-none opacity-80 hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 border border-[#ff3333] rounded-full flex items-center justify-center mb-1 shadow-[0_0_15px_#ff0000]">
                                    <span className="text-[#ff3333] text-lg">+</span>
                                </div>
                             </div>
                        </Html>
                        <pointLight position={[0, 0, 1]} intensity={2} color="#ff3333" distance={4} />
                    </Float>
                </group>
            )}
        </group>
      </group>
    </group>
  );
};
