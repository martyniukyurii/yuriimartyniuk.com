import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

// Компонент для автоматичного підлаштування камери під розмір моделі
interface AutoFitCameraProps {
  modelRef: React.RefObject<THREE.Group>;
  autoRotate?: boolean;
  enableZoom?: boolean;
  fitOffset?: number; // Коефіцієнт масштабування (більше = далі від моделі)
}

export function AutoFitCamera({
  modelRef,
  autoRotate = false,
  enableZoom = true,
  fitOffset = 1.2
}: AutoFitCameraProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetRef = useRef(new THREE.Vector3());
  const [previousBoundingBox, setPreviousBoundingBox] = useState<THREE.Box3 | null>(null);
  
  // Діагностичний лог при ініціалізації компонента
  useEffect(() => {
    console.log(`[Diagnostics] AutoFitCamera initialized, autoRotate: ${autoRotate}, enableZoom: ${enableZoom}, fitOffset: ${fitOffset}`);
    console.log(`[Diagnostics] modelRef exists: ${!!modelRef}, modelRef.current exists: ${!!modelRef?.current}`);
    
    return () => {
      console.log('[Diagnostics] AutoFitCamera unmounted');
    };
  }, [autoRotate, enableZoom, fitOffset, modelRef]);

  // Функція для розрахунку розмірів об'єкта та налаштування камери
  useFrame((state) => {
    if (controlsRef.current && modelRef.current) {
      try {
        const box = new THREE.Box3().setFromObject(modelRef.current);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Перевіряємо чи box не пустий і чи є в ньому дані
        const isValidBox = !size.equals(new THREE.Vector3(0, 0, 0)) && 
                          isFinite(size.x) && isFinite(size.y) && isFinite(size.z);
        
        // Перевіряємо чи змінився bounding box суттєво
        const hasBoundingBoxChanged = !previousBoundingBox || 
                                      !previousBoundingBox.equals(box);
                                      
        // Вивести діагностичну інформацію тільки якщо bounding box валідний і змінився
        if (isValidBox && hasBoundingBoxChanged) {
          console.log(`[Diagnostics] AutoFitCamera: object size (${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`);
          console.log(`[Diagnostics] AutoFitCamera: object center (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
          
          // Зберігаємо поточний bounding box для порівняння в наступних фреймах
          setPreviousBoundingBox(box.clone());
          
          // Розрахунок відстані до камери
          const maxDim = Math.max(size.x, size.y, size.z);
          
          // Перевіряємо, чи камера це PerspectiveCamera
          let cameraDistance = maxDim * 2; // Значення за замовчуванням
          if (state.camera instanceof THREE.PerspectiveCamera) {
            const fov = state.camera.fov * (Math.PI / 180);
            cameraDistance = (maxDim / 2) / Math.tan(fov / 2);
          }
          
          // Додаємо offset для кращого фокусування
          cameraDistance *= fitOffset;
          
          console.log(`[Diagnostics] AutoFitCamera: max dimension ${maxDim.toFixed(2)}, camera distance ${cameraDistance.toFixed(2)}`);
          console.log(`[Diagnostics] AutoFitCamera: camera type: ${state.camera instanceof THREE.PerspectiveCamera ? 'Perspective' : 'Other'}`);
          
          // Налаштовуємо OrbitControls
          if (controlsRef.current.target) {
            controlsRef.current.target.copy(center);
            state.camera.position.copy(center.clone().add(new THREE.Vector3(0, 0, cameraDistance)));
            state.camera.lookAt(center);
            controlsRef.current.update();
            
            console.log(`[Diagnostics] AutoFitCamera: camera position set to (${state.camera.position.x.toFixed(2)}, ${state.camera.position.y.toFixed(2)}, ${state.camera.position.z.toFixed(2)})`);
          } else {
            console.error('[Diagnostics] AutoFitCamera: controlsRef.target is undefined');
          }
        }
      } catch (error) {
        console.error('[Diagnostics] AutoFitCamera: Error adjusting camera:', error);
      }
    } else {
      if (!controlsRef.current) {
        console.warn('[Diagnostics] AutoFitCamera: controlsRef.current is not available');
      }
      if (!modelRef.current) {
        console.warn('[Diagnostics] AutoFitCamera: modelRef.current is not available');
      }
    }
  });

  return (
    <OrbitControls
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      enableZoom={enableZoom}
      maxDistance={100}
      minDistance={0.1}
      ref={controlsRef}
    />
  );
} 