"use client";

import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Model3DProps {
  path: string;
  scale?: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
  hovered?: boolean;
}

// Трансформація моделі в залежності від типу
function getModelTransform(path: string) {
  // Базові налаштування (можна перезаписати)
  const defaultTransform = {
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 1,
  };
  
  return defaultTransform;
}

export function Model3D({ path, scale, rotation, position, hovered = false }: Model3DProps) {
  const modelRef = useRef<THREE.Group>(null);
  
  // Перевіряємо, що шлях не пустий
  const validPath = path || "/3D_models/fallback.glb";
  
  // Завантажуємо модель  
  const { scene } = useGLTF(validPath);
  
  // Отримуємо специфічні налаштування для моделі
  const modelTransform = getModelTransform(validPath);
  
  // Використовуємо налаштування з параметрів, або дефолтні, або специфічні для моделі
  const finalScale = scale || modelTransform.scale;
  const finalRotation = rotation || modelTransform.rotation;
  const finalPosition = position || modelTransform.position;
  
  // Ефект обертання при наведенні
  useFrame((state) => {
    if (!modelRef.current) return;
    
    // Додаємо невелике природне коливання для життєвості
    const time = state.clock.getElapsedTime();
    
    if (hovered) {
      // Більш виражені рухи при наведенні
      modelRef.current.rotation.y = THREE.MathUtils.lerp(
        modelRef.current.rotation.y,
        finalRotation[1] + Math.sin(time * 0.3) * 0.1,
        0.05
      );
    } else {
      // Менш виражені рухи в спокійному стані
      modelRef.current.rotation.y = THREE.MathUtils.lerp(
        modelRef.current.rotation.y,
        finalRotation[1] + Math.sin(time * 0.2) * 0.05,
        0.03
      );
    }
  });
  
  // Клонуємо сцену, щоб уникнути конфліктів з іншими екземплярами
  useEffect(() => {
    if (modelRef.current && scene) {
      try {
        const clonedScene = scene.clone();
        
        // Очищаємо перед додаванням нової сцени
        while (modelRef.current.children.length > 0) {
          modelRef.current.remove(modelRef.current.children[0]);
        }
        
        // Додаємо клоновану сцену
        modelRef.current.add(clonedScene);
      } catch (error) {
        console.error(`Помилка при клонуванні сцени для моделі ${validPath}:`, error);
      }
    }
  }, [scene, validPath]);
  
  return (
    <group 
      ref={modelRef}
      position={finalPosition}
      rotation={[finalRotation[0], finalRotation[1], finalRotation[2]]}
      scale={[finalScale, finalScale, finalScale]}
    />
  );
}

// Попереднє завантаження моделей для оптимізації
try {
  // Завантажуємо тільки невеликі моделі заздалегідь
  useGLTF.preload("/3D_models/origami_unicorn.glb");
  useGLTF.preload("/3D_models/chess_piece_knight_horse.glb");
  // Великі моделі будуть завантажені за потреби
  // useGLTF.preload("/3D_models/bicycle.glb"); // Відкладаємо через великий розмір (15MB)
  // useGLTF.preload("/3D_models/macbook_laptop.glb");
  
  // Також завантажуємо запасну модель, якщо потрібно
  useGLTF.preload("/3D_models/fallback.glb");
} catch (error) {
  console.warn("Помилка під час попереднього завантаження 3D моделей:", error);
} 