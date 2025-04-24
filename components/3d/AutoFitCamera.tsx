import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
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
  enableZoom = false, // Тепер за замовчуванням відключене збільшення
  fitOffset = 1.2
}: AutoFitCameraProps) {
  const { camera } = useThree();
  // Використовуємо тип any для controlsRef, оскільки OrbitControls з drei має складну типізацію
  const controlsRef = useRef<any>(null);
  const targetRef = useRef(new THREE.Vector3()); // Додаємо реф для збереження центру моделі

  // Підлаштовуємо камеру після рендерингу
  useEffect(() => {
    if (!modelRef.current) return;
    
    // Це важлива частина - оновлюємо матриці для правильного розрахунку розмірів
    modelRef.current.updateMatrixWorld(true);
    
    // Створюємо обмежувальну коробку для моделі
    const box = new THREE.Box3().setFromObject(modelRef.current);
    const size = new THREE.Vector3();

    box.getSize(size);
    const center = new THREE.Vector3();

    box.getCenter(center);
    
    // Зберігаємо центр для використання в OrbitControls
    targetRef.current.copy(center);
    
    // Визначаємо найбільший розмір для розрахунку відстані до камери
    const maxSize = Math.max(size.x, size.y, size.z);
    
    // Для PerspectiveCamera використовуємо правильне обчислення відстані на основі FoV
    if ('fov' in camera) {
      const fov = camera.fov * (Math.PI / 180);
      const distance = (maxSize / 2) / Math.tan(fov / 2) * fitOffset;
      
      // Встановлюємо позицію камери - відступаємо від центру моделі
      // Важливо: використовуємо фіксований напрямок для консистентності
      camera.position.set(
        center.x, 
        center.y, 
        center.z + distance
      );
      
      // Налаштовуємо near та far planes для уникнення z-fighting
      camera.near = distance / 100;
      camera.far = distance * 100;
    } else {
      // Для OrthographicCamera
      camera.position.set(
        center.x, 
        center.y, 
        center.z + maxSize * fitOffset
      );
    }
    
    // Дивимось на центр моделі
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    
    // Оновлюємо контроли OrbitControls
    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
    
    // Логуємо інформацію для налагодження
    if (process.env.NODE_ENV === 'development') {
      console.log(`Model box: `, { 
        size: `${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}`,
        center: `${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`
      });
      console.log(`Camera distance: ${camera.position.distanceTo(center).toFixed(2)}`);
    }
  }, [camera, modelRef, fitOffset]);
  
  // Забезпечуємо, що камера завжди дивиться на центр моделі
  useFrame(() => {
    if (controlsRef.current) {
      // Синхронізуємо target з нашим збереженим центром моделі
      controlsRef.current.target.copy(targetRef.current);
    }
  });
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      makeDefault
      autoRotate={autoRotate}
      autoRotateSpeed={6.0} // Збільшено швидкість обертання до 6
      dampingFactor={0.05}
      enablePan={false} // Вимикаємо переміщення камери
      enableRotate={false} // Вимикаємо ручне обертання
      enableZoom={enableZoom} // Вимикаємо масштабування
      target={targetRef.current}
    />
  );
} 