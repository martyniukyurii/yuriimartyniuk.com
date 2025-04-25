"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, useGLTF, Stats } from "@react-three/drei";
import { Model3D } from "./Model3D";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import { getModelSettings, analyzeModel, ModelSettings } from "./utils/model-analysis";

interface ModelViewerProps {
  modelPath: string;
  scale?: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
  autoRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  backgroundColor?: string;
  showGrid?: boolean;
  showDebug?: boolean;
  showWireframe?: boolean;
  useCameraSettings?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  autoFit?: boolean;
  environmentPreset?: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";
  style?: React.CSSProperties;
}

// Компонент-запасний варіант, якщо завантаження не вдалося
function ErrorFallback() {
  return null; // Повертаємо пустий елемент, основний компонент буде показувати запасні іконки
}

export default function ModelViewer({
  modelPath,
  scale,
  rotation,
  position,
  autoRotate = false,
  enableZoom = true,
  enablePan = false,
  backgroundColor = "#f0f0f0",
  showGrid = false,
  showDebug = false,
  showWireframe = false,
  useCameraSettings = true,
  castShadow = true,
  receiveShadow = true,
  autoFit = true,
  environmentPreset = "sunset",
  style,
}: ModelViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [cameraSettings, setCameraSettings] = useState({
    position: [10, 10, 10] as [number, number, number],
    fov: 35,
  });

  // Встановлюємо налаштування камери залежно від типу моделі
  useEffect(() => {
    if (!useCameraSettings) return;

    let newCameraPosition: [number, number, number] = [10, 10, 10];
    let newFov = 35;

    if (modelPath.includes("chess_piece_knight_horse")) {
      newCameraPosition = [0, 5, 15];
      newFov = 25;
    } else if (modelPath.includes("chess_piece_queen")) {
      newCameraPosition = [0, 5, 15];
      newFov = 25;
    } else if (modelPath.includes("bicycle")) {
      newCameraPosition = [5, 5, 15];
      newFov = 30;
    } else if (modelPath.includes("origami")) {
      newCameraPosition = [5, 5, 8];
      newFov = 20;
    } else if (modelPath.includes("macbook") || modelPath.includes("laptop")) {
      newCameraPosition = [5, 5, 10];
      newFov = 25;
    }

    setCameraSettings({ position: newCameraPosition, fov: newFov });
  }, [modelPath, useCameraSettings]);

  // Обробка завантаження моделі
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        // Це буде автоматично кероване useGLTF від drei
        // але ми можемо тут додатково обробити події завантаження
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading model:", err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    loadModel();
  }, [modelPath]);

  return (
    <div 
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "10px",
        backgroundColor,
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLoading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            color: "#888",
          }}
        >
          Завантаження моделі...
        </div>
      ) : error ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            color: "red",
          }}
        >
          Помилка завантаження: {error.message}
        </div>
      ) : (
        <ErrorBoundary
          fallback={
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                color: "red",
              }}
            >
              Помилка рендерингу моделі
            </div>
          }
        >
          <Canvas shadows>
            {showDebug && <Stats />}
            <Suspense
              fallback={
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color="gray" wireframe />
                </mesh>
              }
            >
              {scale && position && rotation ? (
                <Model3D
                  path={modelPath}
                  scale={scale}
                  position={position}
                  rotation={rotation}
                  hovered={isHovered}
                />
              ) : (
                <AutoFitModel modelPath={modelPath} hovered={isHovered} autoFit={autoFit} />
              )}
              <Environment preset={environmentPreset} />
            </Suspense>

            <PerspectiveCamera 
              makeDefault 
              position={cameraSettings.position}
              fov={cameraSettings.fov}
            />
            <OrbitControls
              autoRotate={autoRotate}
              autoRotateSpeed={0.5}
              enableZoom={enableZoom}
              enablePan={enablePan}
              minDistance={1}
              maxDistance={100}
              target={[0, 0, 0]}
            />

            {showGrid && <gridHelper args={[20, 20, 0x888888, 0x444444]} />}

            <ContactShadows 
              position={[0, -10, 0]}
              opacity={0.4}
              scale={40}
              blur={2} 
              far={40}
              resolution={256}
              color="#000000"
            />
            
            <ambientLight intensity={0.5} />
            <spotLight
              position={[10, 15, 10]}
              angle={0.3}
              penumbra={1}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
        </Canvas>
      </ErrorBoundary>
      )}
    </div>
  );
}

// Компонент для автоматичного масштабування та центрування моделі
function AutoFitModel({ modelPath, hovered, autoFit = true }: { modelPath: string, hovered: boolean, autoFit?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const [modelSettings, setModelSettings] = useState<ModelSettings | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ефект для автоматичного масштабування моделі після завантаження
  useEffect(() => {
    if (groupRef.current) {
      // Клонуємо сцену
      const clonedScene = scene.clone();
      
      // Очищаємо групу перед додаванням
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      
      // Додаємо клоновану сцену до групи
      groupRef.current.add(clonedScene);
      
      // Спочатку отримуємо попередньо налаштовані параметри для моделі
      let settings = getModelSettings(modelPath);
      
      // Створюємо обмежувальну коробку для аналізу моделі
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Логуємо інформацію про модель для налагодження
      if (process.env.NODE_ENV === 'development') {
        console.log(`Model: ${modelPath}`);
        console.log(`Size: X=${size.x.toFixed(2)}, Y=${size.y.toFixed(2)}, Z=${size.z.toFixed(2)}`);
        console.log(`Center: X=${center.x.toFixed(2)}, Y=${center.y.toFixed(2)}, Z=${center.z.toFixed(2)}`);
        console.log(`Using preset: ${JSON.stringify(settings)}`);
      }
      
      // Якщо немає попередньо налаштованих параметрів, аналізуємо модель
      if (!settings) {
        settings = analyzeModel(groupRef.current);
        if (process.env.NODE_ENV === 'development') {
          console.log(`Generated settings: ${JSON.stringify(settings)}`);
        }
      }
      
      // Автоматичне центрування моделі
      if (autoFit) {
        // Визначаємо зміщення для центрування
        settings.position = {
          x: settings.position.x - center.x,
          y: settings.position.y - center.y,
          z: settings.position.z - center.z
        };
        
        // Коригування масштабу для конкретних моделей з урахуванням розмірів
        // Визначаємо співвідношення сторін моделі
        const aspectRatio = Math.max(size.x, size.y, size.z) / Math.min(size.x, size.y, size.z);
        
        // Коригуємо масштаб для моделей з неправильними пропорціями
        if (modelPath.includes('bicycle')) {
          // Велосипед плоский - зробимо його більшим
          settings.scale = Math.min(settings.scale, 0.03);
        } else if (modelPath.includes('origami')) {
          // Орігамі - зробимо його більшим
          settings.scale = Math.max(settings.scale, 4);
        } else if (modelPath.includes('macbook')) {
          // Макбук - робимо його видимим ближче
          settings.scale = Math.max(settings.scale, 4);
          settings.rotation.x = 0.3; // Нахилимо вперед для кращого огляду
        } else if (modelPath.includes('chess')) {
          // Шахові фігури - зменшимо щоб бачити повністю
          settings.scale = Math.min(settings.scale, 2.5);
        }
      }
      
      // Зберігаємо налаштування для використання в анімації
      setModelSettings(settings);
      
      // Застосовуємо налаштування масштабу
      groupRef.current.scale.set(settings.scale, settings.scale, settings.scale);
      
      // Застосовуємо налаштування повороту
      groupRef.current.rotation.set(settings.rotation.x, settings.rotation.y, settings.rotation.z);
      
      // Застосовуємо налаштування позиції
      groupRef.current.position.set(
        settings.position.x, 
        settings.position.y, 
        settings.position.z
      );
      
      // Зберігаємо початкові позиції для анімації
      groupRef.current.userData.initialPosition = {
        x: groupRef.current.position.x,
        y: groupRef.current.position.y,
        z: groupRef.current.position.z
      };
    }
  }, [scene, modelPath, autoFit]);
  
  // Ефект анімації при наведенні
  useFrame((state) => {
    if (!groupRef.current || !modelSettings?.animation) return;
    
    const time = state.clock.getElapsedTime();
    const animation = modelSettings.animation;
    const initialPosition = groupRef.current.userData.initialPosition || { x: 0, y: 0, z: 0 };
    
    if (hovered && animation.enabled) {
      // Обертання з налаштованою швидкістю
      groupRef.current.rotation.y += animation.speed;
      
      // Підстрибування з налаштованою амплітудою (якщо bounce > 0)
      if (animation.bounce > 0) {
        groupRef.current.position.y = initialPosition.y + Math.sin(time * 2) * animation.bounce;
      }
    } else {
      // Повільне обертання коли немає наведення
      groupRef.current.rotation.y += animation.speed * 0.2;
      
      // Плавне повернення до початкової позиції
      if (Math.abs(groupRef.current.position.y - initialPosition.y) > 0.01) {
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          initialPosition.y,
          0.1
        );
      }
    }
  });
  
  return <group ref={groupRef} />;
} 