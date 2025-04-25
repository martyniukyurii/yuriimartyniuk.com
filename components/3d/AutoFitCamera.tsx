import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

// Допоміжна функція для логування тільки в режимі розробки
const logDebug = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message, ...args);
  }
};

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
  const { camera, gl } = useThree();
  // Використовуємо тип any для controlsRef, оскільки OrbitControls з drei має складну типізацію
  const controlsRef = useRef<any>(null);
  const targetRef = useRef(new THREE.Vector3()); // Додаємо реф для збереження центру моделі

  // Підлаштовуємо камеру після рендерингу
  useEffect(() => {
    if (!modelRef.current) return;
    
    // Логуємо інформацію про WebGL-контекст
    logDebug(`WebGL context info: `, {
      WebGLRenderer: gl.info,
      Canvas: `${gl.domElement.width}x${gl.domElement.height}`,
      CameraType: camera instanceof THREE.PerspectiveCamera ? 'PerspectiveCamera' : 
                 camera instanceof THREE.OrthographicCamera ? 'OrthographicCamera' : 'Unknown'
    });
    
    // Затримка для забезпечення завантаження геометрії перед обчисленням bounding box
    const processBoundingBox = () => {
      // Це важлива частина - оновлюємо матриці для правильного розрахунку розмірів
      modelRef.current?.updateMatrixWorld(true);
      
      // Створюємо обмежувальну коробку для моделі
      if (!modelRef.current) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Відсутній ref на модель, відкладаємо розрахунок bounding box');
        }
        setTimeout(processBoundingBox, 100);
        return;
      }
      
      const box = new THREE.Box3().setFromObject(modelRef.current);
      
      // Перевірка на валідність bounding box перед подальшими розрахунками
      if (box.isEmpty() || 
          !isFinite(box.min.x) || !isFinite(box.min.y) || !isFinite(box.min.z) ||
          !isFinite(box.max.x) || !isFinite(box.max.y) || !isFinite(box.max.z)) {
        
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Порожній або недійсний bounding box, спроба повторного розрахунку...');
        }
        
        // Спробуємо повторно через 100мс, можливо модель ще не встигла завантажитись
        setTimeout(processBoundingBox, 100);
        return;
      }
      
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      
      // Додаткова перевірка на валідність розмірів 
      if (size.length() === 0 || !isFinite(size.length())) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Модель має нульові розміри, встановлюємо стандартну відстань для камери');
        }
        
        // Якщо розміри некоректні, встановлюємо стандартні значення для центру та розміру
        center.set(0, 0, 0);
        size.set(1, 1, 1);
      }
      
      // Зберігаємо центр для використання в OrbitControls
      targetRef.current.copy(center);
      
      // Визначаємо найбільший розмір для розрахунку відстані до камери
      const maxSize = Math.max(size.x, size.y, size.z);
      
      // Для PerspectiveCamera використовуємо правильне обчислення відстані на основі FoV
      if (camera instanceof THREE.PerspectiveCamera) {
        const fov = camera.fov * (Math.PI / 180);
        const distance = Math.max((maxSize / 2) / Math.tan(fov / 2) * fitOffset, 1); // Мінімальна відстань 1
        
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
        
        logDebug(`Using PerspectiveCamera with fov=${camera.fov}°, distance=${distance.toFixed(2)}`);
      } else if ('fov' in camera) {
        // Запасний варіант для камер з fov, але які не є екземплярами PerspectiveCamera
        // Використовуємо приведення типів для властивості fov
        const cameraWithFov = camera as { fov: number };
        const fov = cameraWithFov.fov * (Math.PI / 180);
        const distance = Math.max((maxSize / 2) / Math.tan(fov / 2) * fitOffset, 1);
        
        camera.position.set(
          center.x, 
          center.y, 
          center.z + distance
        );
        
        logDebug(`Using unknown camera with fov property, fov=${cameraWithFov.fov}°, distance=${distance.toFixed(2)}`);
      } else {
        // Для OrthographicCamera та інших типів камер
        const distance = Math.max(maxSize * fitOffset, 1);
        camera.position.set(
          center.x, 
          center.y, 
          center.z + distance
        );
        
        logDebug(`Using non-perspective camera, distance=${distance.toFixed(2)}`);
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
      logDebug(`Model box: `, { 
        size: `${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}`,
        center: `${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`
      });
      logDebug(`Camera position: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}`);
      logDebug(`Camera distance: ${camera.position.distanceTo(center).toFixed(2)}`);
    };
    
    // Запускаємо процес налаштування камери з короткою затримкою,
    // щоб дати час на завантаження геометрії
    setTimeout(processBoundingBox, 10);
  }, [camera, modelRef, fitOffset, gl]);
  
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
      dampingFactor={0.05}
      autoRotate={autoRotate}
      autoRotateSpeed={6.0} // Збільшено швидкість обертання до 6
      enableZoom={enableZoom} // Вимикаємо масштабування
      enablePan={false} // Вимикаємо переміщення камери
      enableRotate={true} // Дозволяємо ручне обертання для кращого взаємодії
      target={targetRef.current}
      makeDefault
    />
  );
} 