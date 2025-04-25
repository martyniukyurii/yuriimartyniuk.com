"use client";

import React, { useRef, useState, Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, useGLTF, useGLTF as useGltfDrei } from "@react-three/drei";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";

import { AutoFitCamera } from "./AutoFitCamera";

interface SimplifiedModelViewerProps {
  modelPath: string;
  autoRotate?: boolean;
  backgroundColor?: string;
  environmentPreset?: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";
  fitOffset?: number; // Коефіцієнт підлаштування камери (більше = далі від моделі)
  className?: string;
  style?: React.CSSProperties;
}

function Model({ url, autoRotate, fitOffset }: { url: string; autoRotate?: boolean; fitOffset?: number }) {
  const gltfResult = useGLTF(url, true) as any; // Використовуємо any для доступу до властивостей
  const { scene } = gltfResult;
  const modelRef = useRef<THREE.Group>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const previousUrlRef = useRef(url);
  const { gl, camera } = useThree(); // Додаємо доступ до WebGL рендерера та камери

  const logDebug = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, ...args);
    }
  };

  useEffect(() => {
    // Додаємо детальне логування
    logDebug(`Model loading process started: ${url}, timestamp: ${Date.now()}, attempt: ${loadAttempts + 1}`);
    logDebug(`Camera type: ${camera instanceof THREE.PerspectiveCamera ? 'PerspectiveCamera' : 'Other'}`);
    logDebug(`Renderer info:`, gl.info); 

    // Перевіряємо наявність помилок у завантаженні
    if (gltfResult.error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`Error loading GLTF model: ${url}`, gltfResult.error);
      }
      
      // Спробуємо повторно завантажити модель до 3 разів
      if (loadAttempts < 3) {
        logDebug(`Retrying model load (${loadAttempts + 1}/3): ${url}`);
        const retryTimer = setTimeout(() => {
          setLoadAttempts(prev => prev + 1);
          // Очищаємо кеш перед повторною спробою
          try {
            useGltfDrei.clear(url);
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn("Error clearing GLTF cache before retry", e);
            }
          }
        }, 1000);
        
        return () => clearTimeout(retryTimer);
      }
      
      return;
    }

    // Перевіряємо, чи змінився URL - якщо ні, не робимо зайвих дій
    if (previousUrlRef.current === url && modelLoaded && modelRef.current && 
        'children' in modelRef.current && modelRef.current.children.length > 0) {
      logDebug(`Model already loaded and not changed: ${url}`);
      return;
    }
    
    // Оновлюємо посилання на поточний URL
    previousUrlRef.current = url;
    
    // Скидаємо лічильник спроб на новому URL
    if (loadAttempts > 0) {
      setLoadAttempts(0);
    }
    
    if (modelRef.current && scene) {
      logDebug(`Loading model: ${url}, timestamp: ${Date.now()}`);
      
      // Очищаємо модель перед додаванням нової сцени
      while (modelRef.current.children.length > 0) {
        modelRef.current.remove(modelRef.current.children[0]);
      }
      
      try {
        // Перевіряємо стан поточної сцени
        logDebug(`Scene status before cloning:`, {
          uuid: scene.uuid,
          childCount: scene.children.length,
          animations: scene.animations?.length || 0
        });
        
        // Клонуємо сцену для уникнення конфліктів
        const clonedScene = scene.clone();
        
        // Додаємо скопійовану сцену до нашої групи
        modelRef.current.add(clonedScene);
        logDebug(`Cloned scene added to model group, children: ${modelRef.current.children.length}`);
        
        // Перевіряємо, чи є у моделі хоча б один mesh з геометрією та матеріалом
        let hasMesh = false;
        let geometryCount = 0;
        let materialCount = 0;
        
        // Встановлюємо налаштування для отримання тіней та покращення відображення
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            hasMesh = true;
            
            if (child.geometry) {
              geometryCount++;
              child.castShadow = true;
              child.receiveShadow = true;
            }
            
            // Покращуємо матеріали для кращого відображення
            if (child.material) {
              materialCount++;
              if (child.material instanceof THREE.MeshStandardMaterial) {
                child.material.metalness = Math.min(child.material.metalness, 0.7);
                child.material.roughness = Math.max(child.material.roughness, 0.2);
              }
            }
          }
        });
        
        logDebug(`Model analysis: hasMesh=${hasMesh}, geometryCount=${geometryCount}, materialCount=${materialCount}`);
        
        if (!hasMesh || geometryCount === 0) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`Модель не містить Mesh об'єктів з геометрією: ${url}`);
          }
          
          // Створюємо запасну геометрію для діагностики
          const fallbackMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ 
              color: 0xff0000,
              transparent: true,
              opacity: 0.7,
              wireframe: true
            })
          );
          fallbackMesh.position.set(0, 0, 0);
          modelRef.current.add(fallbackMesh);
          logDebug('Додано резервну геометрію для діагностики');
        }
        
        // Спробуємо проаналізувати обмежувальну коробку моделі
        if (!modelRef.current) return;
        
        const box = new THREE.Box3().setFromObject(modelRef.current);
        if (box.isEmpty() || !isFinite(box.min.x) || !isFinite(box.max.x)) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`Invalid bounding box for model: ${url}`, box);
          }
          
          // Якщо bounding box недійсний, додамо механізм повторних спроб
          const retryBoundingBox = (attempts = 0) => {
            if (attempts >= 3) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn(`Не вдалося отримати коректний bounding box після ${attempts} спроб`);
              }
              return;
            }
            
            // Повторно обчислюємо матрицю світу для всіх об'єктів
            if (!modelRef.current) return;
            
            modelRef.current.traverse(child => {
              child.updateMatrixWorld(true);
            });
            
            if (!modelRef.current) return;
            
            const retryBox = new THREE.Box3().setFromObject(modelRef.current);
            if (retryBox.isEmpty() || !isFinite(retryBox.min.x) || !isFinite(retryBox.max.x)) {
              logDebug(`Повторна спроба #${attempts + 1} отримати bounding box...`);
              setTimeout(() => retryBoundingBox(attempts + 1), 200);
            } else {
              // Успішно отримали bounding box
              const size = new THREE.Vector3();
              retryBox.getSize(size);
              const center = new THREE.Vector3();
              retryBox.getCenter(center);
              logDebug(`Повторна спроба bounding box успішна: size=${size.toArray()}, center=${center.toArray()}`);
            }
          };
          
          // Запускаємо механізм повторних спроб
          setTimeout(() => retryBoundingBox(), 200);
        } else {
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);
          logDebug(`Model bounding box: size=${size.toArray()}, center=${center.toArray()}`);
        }
        
        setModelLoaded(true);
        logDebug(`Model loaded successfully: ${url}`);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`Error loading model: ${url}`, error);
        }
      }
    }
    
    // Функція очищення
    return () => {
      logDebug(`Unloading model: ${url}, timestamp: ${Date.now()}`);
      if (modelRef.current) {
        // Перед очищенням, кешуємо кількість дітей для логування
        const childCount = modelRef.current.children.length;
        
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
        
        // Викликаємо збирання сміття вручну для THREE.js
        if (typeof window !== 'undefined') {
          if (window.gc) {
            try {
              window.gc();
              logDebug(`Manual garbage collection triggered`);
            } catch (e) {
              logDebug(`Failed to trigger manual GC`, e);
            }
          }
        }
        
        logDebug(`Cleaned up ${childCount} child objects from model`);
      }
      
      // Спробуємо очистити кеш для цієї моделі
      try {
        useGltfDrei.clear(url);
        logDebug(`GLTF cache cleared for: ${url}`);
      } catch (e) {
        logDebug("Error clearing GLTF cache", e);
      }
      
      setModelLoaded(false);
    };
  }, [scene, url, camera, gl, loadAttempts, gltfResult]);

  return (
    <group ref={modelRef}>
      <AutoFitCamera 
        modelRef={modelRef} 
        autoRotate={autoRotate} 
        fitOffset={fitOffset} 
        enableZoom={false} // Вимикаємо масштабування
      />
    </group>
  );
}

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial color="#2997ff" emissive="#2997ff" emissiveIntensity={0.8} roughness={0.2} metalness={0.8} transparent opacity={0.7} />
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
  fitOffset = 1.2,
  className = "",
  style
}: SimplifiedModelViewerProps) {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelKey, setModelKey] = useState(Date.now()); // Унікальний ключ для примусового оновлення
  
  // Допоміжна функція для логування тільки в режимі розробки
  const logDebug = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message, ...args);
    }
  };
  
  // Перезавантаження моделі тільки при зміні шляху
  useEffect(() => {
    logDebug(`Model path changed to: ${modelPath}, starting load process at ${Date.now()}`);
    setModelKey(Date.now());
    setIsLoading(true);
    setError(null);
  }, [modelPath]);
  
  const handleError = (error: Error) => {
    logDebug("Error loading model:", error);
    setError(error);
    setIsLoading(false);
  };
  
  const handleModelLoad = () => {
    logDebug(`Model load event triggered: ${modelPath} at ${Date.now()}`);
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
        fallback={<div className="w-full h-full flex items-center justify-center text-red-500">Помилка завантаження моделі</div>}
        onError={handleError}
        key={modelKey} // Додаємо ключ для повного оновлення ErrorBoundary
      >
        <Canvas 
          shadows 
          gl={{ 
            preserveDrawingBuffer: true, 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance' // Додано для кращої продуктивності
          }}
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 2]} // Оптимізована щільність пікселів
          onCreated={({ gl, camera }) => {
            // Реєструємо обробник втрати контексту
            gl.domElement.addEventListener('webglcontextlost', (event: Event) => {
              if (event.preventDefault) {
                event.preventDefault();
              }
              logDebug('WebGL context lost', event);
              setError(new Error('Втрачено контекст WebGL. Спробуйте перезавантажити сторінку.'));
            });

            gl.domElement.addEventListener('webglcontextrestored', () => {
              logDebug('WebGL context restored');
              setError(null);
            });
            
            // Обробка помилок WebGL
            try {
              gl.getContext().getExtension('WEBGL_lose_context');
              logDebug('WEBGL_lose_context extension:', 
                        gl.getContext().getExtension('WEBGL_lose_context') ? 'available' : 'not available');
            } catch (e) {
              logDebug('Error checking WebGL extensions:', e);
            }
            
            // Логуємо інформацію про створений контекст
            logDebug(`Canvas created for model: ${modelPath}`);
            logDebug(`Renderer info:`, gl.info);
            logDebug(`Camera type: ${camera instanceof THREE.PerspectiveCamera ? 'PerspectiveCamera' : 'Other'}`);
            
            // Невелика затримка для відображення завантаження
            setTimeout(handleModelLoad, 500);
          }}
          key={modelKey} // Додаємо ключ для повного оновлення Canvas
        >
          <Suspense fallback={<Loader />}>
            {/* Покращена система освітлення для більш яскравих моделей */}
            {/* Загальне навколишнє світло */}
            <ambientLight intensity={2.5} />
            
            {/* Головне верхнє світло справа */}
            <spotLight 
              position={[10, 10, 10]} 
              angle={0.3} 
              penumbra={1} 
              intensity={2.5} 
              castShadow 
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0001}
            />
            
            {/* Додаткове верхнє світло зліва */}
            <spotLight 
              position={[-10, 10, -10]} 
              angle={0.3} 
              penumbra={1} 
              intensity={2.0} 
              castShadow 
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            
            {/* Нижні точкові світла для заповнення тіней */}
            <pointLight position={[-10, -10, -10]} intensity={1.5} />
            <pointLight position={[10, -10, 10]} intensity={1.5} />
            
            {/* Верхнє направлене світло */}
            <directionalLight 
              position={[0, 10, 0]} 
              intensity={2.0} 
              castShadow 
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            
            {/* Півсферичне світло для м'якого освітлення */}
            <hemisphereLight intensity={1.5} groundColor="black" />
            
            {/* Підсвічування знизу для кращої видимості деталей */}
            <pointLight position={[0, -15, 0]} intensity={1.0} color="#a0a0ff" />
            
            <Environment preset={environmentPreset} />
            
            <MemoizedModel url={modelPath} autoRotate={autoRotate} fitOffset={fitOffset} />
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