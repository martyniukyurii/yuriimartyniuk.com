"use client";

import React, { useRef, useState, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import { useGLTF as useGltfDrei } from "@react-three/drei";

import { AutoFitCamera } from "./AutoFitCamera";

interface SimplifiedModelViewerProps {
  modelPath: string;
  autoRotate?: boolean;
  backgroundColor?: string;
  environmentPreset?: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";
  lightIntensity?: number;
  fitOffset?: number; // Коефіцієнт підлаштування камери (більше = далі від моделі)
  className?: string;
  style?: React.CSSProperties;
}

function Model({ url, autoRotate, fitOffset }: { url: string; autoRotate?: boolean; fitOffset?: number }) {
  const { scene } = useGLTF(url, true);
  const modelRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const previousUrlRef = useRef(url);

  useEffect(() => {
    // Перевіряємо, чи змінився URL - якщо ні, не робимо зайвих дій
    if (previousUrlRef.current === url && modelLoaded && modelRef.current && 
        'children' in modelRef.current && modelRef.current.children.length > 0) {
      return;
    }
    
    // Оновлюємо посилання на поточний URL
    previousUrlRef.current = url;
    
    if (modelRef.current && scene) {
      console.log(`Loading model: ${url}, timestamp: ${Date.now()}`);
      
      // Очищаємо модель перед додаванням нової сцени
      while (modelRef.current.children.length > 0) {
        modelRef.current.remove(modelRef.current.children[0]);
      }
      
      try {
        // Клонуємо сцену для уникнення конфліктів
        const clonedScene = scene.clone();
        
        // Додаємо скопійовану сцену до нашої групи
        modelRef.current.add(clonedScene);
        
        // Встановлюємо налаштування для отримання тіней та покращення відображення
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Покращуємо матеріали для кращого відображення
            if (child.material) {
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.metalness = Math.min(child.material.metalness, 0.7);
                child.material.roughness = Math.max(child.material.roughness, 0.2);
              }
            }
          }
        });
        
        setModelLoaded(true);
      } catch (error) {
        console.error(`Error loading model: ${url}`, error);
      }
    }
    
    // Функція очищення
    return () => {
      console.log(`Unloading model: ${url}, timestamp: ${Date.now()}`);
      if (modelRef.current) {
        while (modelRef.current.children.length > 0) {
          const child = modelRef.current.children[0];

          modelRef.current.remove(child);
          
          // Додаткова очистка ресурсів Three.js
          if (child instanceof THREE.Object3D) {
            child.traverse((object) => {
              if (object instanceof THREE.Mesh) {
                if (object.geometry) {
                  object.geometry.dispose();
                }
                
                if (object.material) {
                  if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                  } else {
                    object.material.dispose();
                  }
                }
              }
            });
          }
        }
      }
      
      // Спробуємо очистити кеш для цієї моделі
      try {
        useGltfDrei.clear(url);
      } catch (e) {
        console.log("Error clearing GLTF cache", e);
      }
      
      setModelLoaded(false);
    };
  }, [scene, url]);

  return (
    <group ref={modelRef}>
      <AutoFitCamera 
        autoRotate={autoRotate} 
        enableZoom={false} // Вимикаємо масштабування 
        fitOffset={fitOffset} 
        modelRef={modelRef}
      />
    </group>
  );
}

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial transparent color="#2997ff" emissive="#2997ff" emissiveIntensity={0.8} metalness={0.8} opacity={0.7} roughness={0.2} />
    </mesh>
  );
}

// Додаємо мемоізований компонент для запобігання зайвих рендерингів
const MemoizedModel = React.memo(Model);

// Компонент для відображення моделі з автоматичним підлаштуванням
export default function SimplifiedModelViewer({
  modelPath,
  autoRotate = true,
  backgroundColor = "#f0f0f0",
  environmentPreset = "sunset", 
  lightIntensity = 0.5,
  fitOffset = 1.2,
  className = "",
  style
}: SimplifiedModelViewerProps) {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelKey, setModelKey] = useState(Date.now()); // Унікальний ключ для примусового оновлення
  
  // Перезавантаження моделі тільки при зміні шляху
  useEffect(() => {
    console.log(`Model path changed to: ${modelPath}`);
    setModelKey(Date.now());
    setIsLoading(true);
    setError(null);
  }, [modelPath]);
  
  const handleError = (error: Error) => {
    console.error("Error loading model:", error);
    setError(error);
    setIsLoading(false);
  };
  
  const handleModelLoad = () => {
    setIsLoading(false);
  };
  
  return (
    <div 
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{
        backgroundColor,
        borderRadius: '8px',
        ...style
      }}
    >
      <ErrorBoundary
        key={modelKey} // Додаємо ключ для повного оновлення ErrorBoundary
        fallback={<div className="w-full h-full flex items-center justify-center text-red-500">Помилка завантаження моделі</div>}
        onError={handleError}
      >
        <Canvas 
          key={modelKey} // Додаємо ключ для повного оновлення Canvas 
          shadows
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 2]} // Оптимізована щільність пікселів
          gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
          onCreated={() => {
            setTimeout(handleModelLoad, 500); // Невелика затримка для відображення завантаження
          }}
        >
          <Suspense fallback={<Loader />}>
            {/* Покращена система освітлення для більш яскравих моделей */}
            {/* Загальне навколишнє світло */}
            <ambientLight intensity={2.0} />
            
            {/* Головне верхнє світло справа */}
            <spotLight castShadow angle={0.3} intensity={2.0} penumbra={1} position={[10, 10, 10]} />
            
            {/* Додаткове верхнє світло зліва */}
            <spotLight castShadow angle={0.3} intensity={1.5} penumbra={1} position={[-10, 10, -10]} />
            
            {/* Нижні точкові світла */}
            <pointLight intensity={1.0} position={[-10, -10, -10]} />
            <pointLight intensity={1.0} position={[10, -10, 10]} />
            
            {/* Верхнє направлене світло */}
            <directionalLight castShadow intensity={1.5} position={[0, 10, 0]} />
            
            {/* Півсферичне світло */}
            <hemisphereLight groundColor="black" intensity={1.0} />
            
            <Environment preset={environmentPreset} />
            
            <MemoizedModel autoRotate={autoRotate} fitOffset={fitOffset} url={modelPath} />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          Завантаження...
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white p-2 text-sm">
          {error.message}
        </div>
      )}
    </div>
  );
} 