#!/usr/bin/env python3
"""
Animal Detection Performance Optimizer
동물 탐지 성능 최적화 및 벤치마킹 도구
"""
import cv2
import numpy as np
import time
import json
import threading
from pathlib import Path
from collections import defaultdict, deque
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# 메모리 사용량 모니터링
try:
    import psutil
    import GPUtil
    MONITORING_AVAILABLE = True
except ImportError:
    MONITORING_AVAILABLE = False

class PerformanceOptimizer:
    """성능 최적화 및 벤치마킹 클래스"""
    
    def __init__(self):
        self.results = {
            'methods': {},
            'optimizations': {},
            'benchmarks': {},
            'memory_usage': {},
            'gpu_usage': {}
        }
        
        # 최적화 전략들
        self.optimization_strategies = {
            'image_resize': [0.5, 0.75, 1.0],
            'cascade_params': [
                {'scaleFactor': 1.05, 'minNeighbors': 3},
                {'scaleFactor': 1.1, 'minNeighbors': 4},
                {'scaleFactor': 1.2, 'minNeighbors': 5}
            ],
            'preprocessing': ['none', 'clahe', 'gaussian', 'bilateral'],
            'nms_thresholds': [0.3, 0.4, 0.5]
        }
        
        # 성능 모니터링
        self.monitoring = MONITORING_AVAILABLE
        if self.monitoring:
            self.process = psutil.Process()
    
    def benchmark_detection_methods(self, test_images, iterations=5):
        """탐지 방법들 벤치마킹"""
        print("="*60)
        print("🏁 Detection Methods Benchmarking")
        print("="*60)
        
        methods = {
            'haar_cascade': self._test_haar_cascade,
            'improved_haar': self._test_improved_haar,
            'contour_detection': self._test_contour_detection,
            'hough_circles': self._test_hough_circles,
            'template_matching': self._test_template_matching,
            'orb_features': self._test_orb_features
        }
        
        for method_name, method_func in methods.items():
            print(f"\n🧪 Testing {method_name}...")
            
            method_results = {
                'times': [],
                'detections': [],
                'accuracies': [],
                'memory_usage': [],
                'gpu_usage': []
            }
            
            for iteration in range(iterations):
                for img_path in test_images:
                    if not Path(img_path).exists():
                        continue
                    
                    # 메모리 사용량 측정 시작
                    if self.monitoring:
                        mem_before = self.process.memory_info().rss / 1024 / 1024  # MB
                        gpu_usage = self._get_gpu_usage()
                    
                    # 탐지 시간 측정
                    start_time = time.time()
                    detections = method_func(img_path)
                    end_time = time.time()
                    
                    detection_time = end_time - start_time
                    method_results['times'].append(detection_time)
                    method_results['detections'].append(len(detections))
                    
                    # 메모리 사용량 측정 종료
                    if self.monitoring:
                        mem_after = self.process.memory_info().rss / 1024 / 1024  # MB
                        method_results['memory_usage'].append(mem_after - mem_before)
                        method_results['gpu_usage'].append(gpu_usage)
            
            # 결과 저장
            self.results['methods'][method_name] = {
                'avg_time': np.mean(method_results['times']),
                'std_time': np.std(method_results['times']),
                'avg_detections': np.mean(method_results['detections']),
                'fps': 1.0 / np.mean(method_results['times']),
                'memory_usage': np.mean(method_results['memory_usage']) if self.monitoring else 0,
                'gpu_usage': np.mean(method_results['gpu_usage']) if self.monitoring else 0
            }
            
            # 실시간 결과 출력
            avg_time = np.mean(method_results['times'])
            avg_detections = np.mean(method_results['detections'])
            fps = 1.0 / avg_time
            
            print(f"  ⏱️  Average Time: {avg_time:.4f}s")
            print(f"  🎯 Average Detections: {avg_detections:.1f}")
            print(f"  📈 FPS: {fps:.1f}")
            if self.monitoring:
                print(f"  💾 Memory Usage: {np.mean(method_results['memory_usage']):.1f} MB")
        
        return self.results['methods']
    
    def optimize_cascade_parameters(self, test_images):
        """Cascade 매개변수 최적화"""
        print("\n🔧 Optimizing Cascade Parameters...")
        
        # OpenCV cascade 로드
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        cascade = cv2.CascadeClassifier(cascade_path)
        
        best_params = None
        best_score = 0
        
        scale_factors = [1.05, 1.1, 1.15, 1.2, 1.3]
        min_neighbors = [3, 4, 5, 6]
        min_sizes = [(20, 20), (30, 30), (40, 40)]
        
        total_combinations = len(scale_factors) * len(min_neighbors) * len(min_sizes)
        current = 0
        
        for scale in scale_factors:
            for neighbors in min_neighbors:
                for min_size in min_sizes:
                    current += 1
                    print(f"Progress: {current}/{total_combinations} ({current/total_combinations*100:.1f}%)", end='\r')
                    
                    params = {
                        'scaleFactor': scale,
                        'minNeighbors': neighbors,
                        'minSize': min_size
                    }
                    
                    scores = []
                    times = []
                    
                    for img_path in test_images[:5]:  # 처음 5개만 테스트
                        if not Path(img_path).exists():
                            continue
                        
                        image = cv2.imread(str(img_path))
                        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                        
                        start_time = time.time()
                        faces = cascade.detectMultiScale(gray, **params)
                        end_time = time.time()
                        
                        times.append(end_time - start_time)
                        
                        # 점수 계산 (탐지 수 + 속도 고려)
                        detection_score = len(faces) * 10  # 탐지 수에 가중치
                        speed_score = 1.0 / (end_time - start_time)  # 속도 점수
                        total_score = detection_score + speed_score
                        scores.append(total_score)
                    
                    avg_score = np.mean(scores) if scores else 0
                    
                    if avg_score > best_score:
                        best_score = avg_score
                        best_params = params.copy()
                        best_params['avg_time'] = np.mean(times) if times else 0
        
        print(f"\n✅ Best Parameters Found:")
        for key, value in best_params.items():
            print(f"  {key}: {value}")
        
        self.results['optimizations']['cascade_params'] = best_params
        return best_params
    
    def test_preprocessing_techniques(self, test_images):
        """전처리 기법 성능 테스트"""
        print("\n🎨 Testing Preprocessing Techniques...")
        
        techniques = {
            'original': lambda img: img,
            'clahe': self._apply_clahe,
            'gaussian_blur': lambda img: cv2.GaussianBlur(img, (5, 5), 0),
            'bilateral_filter': lambda img: cv2.bilateralFilter(img, 9, 75, 75),
            'median_blur': lambda img: cv2.medianBlur(img, 5),
            'histogram_eq': lambda img: cv2.equalizeHist(img),
            'morphology': self._apply_morphology,
            'sharpening': self._apply_sharpening
        }
        
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        cascade = cv2.CascadeClassifier(cascade_path)
        
        for technique_name, technique_func in techniques.items():
            print(f"Testing {technique_name}...", end=' ')
            
            times = []
            detections = []
            
            for img_path in test_images:
                if not Path(img_path).exists():
                    continue
                
                image = cv2.imread(str(img_path))
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                
                # 전처리 적용
                start_preprocess = time.time()
                processed = technique_func(gray)
                preprocess_time = time.time() - start_preprocess
                
                # 탐지
                start_detect = time.time()
                faces = cascade.detectMultiScale(processed, scaleFactor=1.1, minNeighbors=4)
                detect_time = time.time() - start_detect
                
                total_time = preprocess_time + detect_time
                times.append(total_time)
                detections.append(len(faces))
            
            avg_time = np.mean(times) if times else 0
            avg_detections = np.mean(detections) if detections else 0
            
            self.results['optimizations'][technique_name] = {
                'avg_time': avg_time,
                'avg_detections': avg_detections,
                'fps': 1.0 / avg_time if avg_time > 0 else 0
            }
            
            print(f"Time: {avg_time:.4f}s, Detections: {avg_detections:.1f}")
        
        return self.results['optimizations']
    
    def benchmark_real_time_performance(self, duration=30):
        """실시간 성능 벤치마킹"""
        print(f"\n🎥 Real-time Performance Benchmark ({duration}s)")
        
        cap = cv2.VideoCapture(0)  # 웹캠
        if not cap.isOpened():
            print("웹캠을 열 수 없습니다.")
            return None
        
        # 해상도 설정
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        # Cascade 로드
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        cascade = cv2.CascadeClassifier(cascade_path)
        
        start_time = time.time()
        frame_times = deque(maxlen=100)
        detection_counts = deque(maxlen=100)
        memory_usage = deque(maxlen=100)
        
        frame_count = 0
        
        while time.time() - start_time < duration:
            frame_start = time.time()
            
            ret, frame = cap.read()
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # 탐지
            faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)
            
            # 시각화
            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            
            frame_end = time.time()
            frame_time = frame_end - frame_start
            
            frame_times.append(frame_time)
            detection_counts.append(len(faces))
            
            # 메모리 사용량
            if self.monitoring:
                mem_usage = self.process.memory_info().rss / 1024 / 1024
                memory_usage.append(mem_usage)
            
            # FPS 표시
            if frame_times:
                fps = 1.0 / np.mean(frame_times)
                cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(frame, f"Faces: {len(faces)}", (10, 70), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            cv2.imshow('Real-time Benchmark', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            
            frame_count += 1
        
        cap.release()
        cv2.destroyAllWindows()
        
        # 결과 계산
        benchmark_results = {
            'total_frames': frame_count,
            'avg_fps': 1.0 / np.mean(frame_times) if frame_times else 0,
            'min_fps': 1.0 / max(frame_times) if frame_times else 0,
            'max_fps': 1.0 / min(frame_times) if frame_times else 0,
            'avg_detections': np.mean(detection_counts) if detection_counts else 0,
            'max_detections': max(detection_counts) if detection_counts else 0,
            'avg_memory': np.mean(memory_usage) if memory_usage else 0,
            'max_memory': max(memory_usage) if memory_usage else 0
        }
        
        self.results['benchmarks']['realtime'] = benchmark_results
        
        print("실시간 벤치마크 결과:")
        for key, value in benchmark_results.items():
            print(f"  {key}: {value:.2f}")
        
        return benchmark_results
    
    def generate_performance_report(self, output_dir="performance_reports"):
        """성능 보고서 생성"""
        print("\n📊 Generating Performance Report...")
        
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # JSON 보고서
        json_report = output_path / f"performance_report_{timestamp}.json"
        with open(json_report, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # 시각적 보고서 생성
        self._create_visual_report(output_path, timestamp)
        
        # 텍스트 보고서
        txt_report = output_path / f"performance_summary_{timestamp}.txt"
        self._create_text_report(txt_report)
        
        print(f"✅ 보고서 생성 완료: {output_path}")
        return output_path
    
    def _create_visual_report(self, output_path, timestamp):
        """시각적 보고서 생성"""
        if not self.results['methods']:
            return
        
        # 설정
        plt.style.use('seaborn-v0_8')
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('Animal Detection Performance Report', fontsize=16, fontweight='bold')
        
        # 1. 방법별 처리 시간
        methods = list(self.results['methods'].keys())
        times = [self.results['methods'][m]['avg_time'] for m in methods]
        
        axes[0, 0].bar(methods, times, color='skyblue')
        axes[0, 0].set_title('Average Processing Time by Method')
        axes[0, 0].set_ylabel('Time (seconds)')
        axes[0, 0].tick_params(axis='x', rotation=45)
        
        # 2. FPS 비교
        fps_values = [self.results['methods'][m]['fps'] for m in methods]
        
        axes[0, 1].bar(methods, fps_values, color='lightgreen')
        axes[0, 1].set_title('Frames Per Second (FPS) by Method')
        axes[0, 1].set_ylabel('FPS')
        axes[0, 1].tick_params(axis='x', rotation=45)
        
        # 3. 탐지 수 비교
        detections = [self.results['methods'][m]['avg_detections'] for m in methods]
        
        axes[1, 0].bar(methods, detections, color='orange')
        axes[1, 0].set_title('Average Detections by Method')
        axes[1, 0].set_ylabel('Number of Detections')
        axes[1, 0].tick_params(axis='x', rotation=45)
        
        # 4. 메모리 사용량 (가능한 경우)
        if self.monitoring:
            memory_usage = [self.results['methods'][m]['memory_usage'] for m in methods]
            axes[1, 1].bar(methods, memory_usage, color='coral')
            axes[1, 1].set_title('Memory Usage by Method')
            axes[1, 1].set_ylabel('Memory (MB)')
            axes[1, 1].tick_params(axis='x', rotation=45)
        else:
            axes[1, 1].text(0.5, 0.5, 'Memory monitoring\nnot available', 
                           ha='center', va='center', transform=axes[1, 1].transAxes)
            axes[1, 1].set_title('Memory Usage')
        
        plt.tight_layout()
        
        # 저장
        report_image = output_path / f"performance_chart_{timestamp}.png"
        plt.savefig(report_image, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"📈 차트 저장: {report_image}")
    
    def _create_text_report(self, output_file):
        """텍스트 보고서 생성"""
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("ANIMAL DETECTION PERFORMANCE REPORT\n")
            f.write("="*50 + "\n\n")
            
            # 메소드별 성능
            if self.results['methods']:
                f.write("METHOD PERFORMANCE COMPARISON\n")
                f.write("-"*30 + "\n")
                
                for method, stats in self.results['methods'].items():
                    f.write(f"\n{method.upper()}:\n")
                    f.write(f"  Average Time: {stats['avg_time']:.4f}s\n")
                    f.write(f"  FPS: {stats['fps']:.1f}\n")
                    f.write(f"  Average Detections: {stats['avg_detections']:.1f}\n")
                    if self.monitoring:
                        f.write(f"  Memory Usage: {stats['memory_usage']:.1f} MB\n")
                
                # 최고 성능 방법
                best_method = max(self.results['methods'].items(), 
                                key=lambda x: x[1]['fps'])
                f.write(f"\n🏆 BEST PERFORMING METHOD: {best_method[0]}\n")
                f.write(f"   FPS: {best_method[1]['fps']:.1f}\n")
            
            # 최적화 결과
            if self.results['optimizations']:
                f.write("\n\nOPTIMIZATION RESULTS\n")
                f.write("-"*20 + "\n")
                
                for opt, stats in self.results['optimizations'].items():
                    if isinstance(stats, dict) and 'avg_time' in stats:
                        f.write(f"\n{opt}: {stats['fps']:.1f} FPS\n")
            
            # 벤치마크 결과
            if self.results['benchmarks']:
                f.write("\n\nBENCHMARK RESULTS\n")
                f.write("-"*17 + "\n")
                
                for benchmark, stats in self.results['benchmarks'].items():
                    f.write(f"\n{benchmark.upper()}:\n")
                    for key, value in stats.items():
                        f.write(f"  {key}: {value:.2f}\n")
        
        print(f"📄 텍스트 보고서 저장: {output_file}")
    
    # 개별 테스트 방법들
    def _test_haar_cascade(self, image_path):
        """기본 Haar Cascade 테스트"""
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        cascade = cv2.CascadeClassifier(cascade_path)
        
        image = cv2.imread(str(image_path))
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)
        return [{'bbox': face} for face in faces]
    
    def _test_improved_haar(self, image_path):
        """개선된 Haar Cascade"""
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        cascade = cv2.CascadeClassifier(cascade_path)
        
        image = cv2.imread(str(image_path))
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # CLAHE 적용
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        faces = cascade.detectMultiScale(enhanced, scaleFactor=1.05, minNeighbors=3)
        return [{'bbox': face} for face in faces]
    
    def _test_contour_detection(self, image_path):
        """윤곽선 기반 탐지"""
        image = cv2.imread(str(image_path))
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                     cv2.THRESH_BINARY_INV, 11, 2)
        
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        detections = []
        height, width = gray.shape
        min_area = (width * height) * 0.01
        max_area = (width * height) * 0.3
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if min_area < area < max_area:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / h
                if 0.5 < aspect_ratio < 2.0:
                    detections.append({'bbox': (x, y, w, h)})
        
        return detections[:5]
    
    def _test_hough_circles(self, image_path):
        """Hough Circle 탐지"""
        image = cv2.imread(str(image_path))
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 30,
                                 param1=50, param2=30, minRadius=10, maxRadius=100)
        
        detections = []
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for (x, y, r) in circles:
                detections.append({'bbox': (x-r, y-r, 2*r, 2*r)})
        
        return detections
    
    def _test_template_matching(self, image_path):
        """템플릿 매칭 (간단한 예)"""
        # 실제로는 미리 준비된 템플릿이 필요함
        return []  # 데모용으로 빈 결과 반환
    
    def _test_orb_features(self, image_path):
        """ORB 특징점 기반 탐지"""
        image = cv2.imread(str(image_path))
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        orb = cv2.ORB_create(nfeatures=500)
        keypoints = orb.detect(gray, None)
        
        # 키포인트를 클러스터링하여 얼굴 영역 추정
        if len(keypoints) > 10:
            points = np.array([kp.pt for kp in keypoints])
            
            # 간단한 클러스터링
            from sklearn.cluster import KMeans
            try:
                kmeans = KMeans(n_clusters=min(3, len(points)//10))
                kmeans.fit(points)
                
                detections = []
                for center in kmeans.cluster_centers_:
                    x, y = int(center[0]), int(center[1])
                    # 임의의 크기로 바운딩 박스 생성
                    detections.append({'bbox': (x-25, y-25, 50, 50)})
                
                return detections
            except:
                pass
        
        return []
    
    # 유틸리티 함수들
    def _apply_clahe(self, image):
        """CLAHE 적용"""
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        return clahe.apply(image)
    
    def _apply_morphology(self, image):
        """형태학적 변환 적용"""
        kernel = np.ones((3,3), np.uint8)
        return cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel)
    
    def _apply_sharpening(self, image):
        """샤프닝 적용"""
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        return cv2.filter2D(image, -1, kernel)
    
    def _get_gpu_usage(self):
        """GPU 사용률 확인"""
        if MONITORING_AVAILABLE:
            try:
                gpus = GPUtil.getGPUs()
                if gpus:
                    return gpus[0].load * 100
            except:
                pass
        return 0


def create_test_dataset():
    """테스트 데이터셋 생성 (샘플 이미지 경로들)"""
    test_images = []
    
    # 샘플 이미지 디렉토리들
    sample_dirs = ['sample_animals', 'test_images', 'data']
    
    for dir_name in sample_dirs:
        dir_path = Path(dir_name)
        if dir_path.exists():
            for ext in ['*.jpg', '*.jpeg', '*.png', '*.bmp']:
                test_images.extend(list(dir_path.glob(ext)))
    
    # 절대 경로로 변환
    return [str(img.absolute()) for img in test_images[:10]]  # 최대 10개


def main():
    """메인 실행 함수"""
    print("🚀 Animal Detection Performance Optimizer")
    print("="*50)
    
    optimizer = PerformanceOptimizer()
    
    # 테스트 이미지들 수집
    test_images = create_test_dataset()
    
    if not test_images:
        print("❌ 테스트 이미지를 찾을 수 없습니다.")
        print("다음 중 하나의 디렉토리에 이미지를 넣어주세요:")
        print("  - sample_animals/")
        print("  - test_images/")
        print("  - data/")
        return
    
    print(f"📁 Found {len(test_images)} test images")
    
    try:
        # 1. 탐지 방법 벤치마킹
        print("\n🏁 Starting detection methods benchmark...")
        method_results = optimizer.benchmark_detection_methods(test_images, iterations=3)
        
        # 2. Cascade 매개변수 최적화
        print("\n🔧 Optimizing cascade parameters...")
        cascade_results = optimizer.optimize_cascade_parameters(test_images)
        
        # 3. 전처리 기법 테스트
        print("\n🎨 Testing preprocessing techniques...")
        preprocess_results = optimizer.test_preprocessing_techniques(test_images)
        
        # 4. 실시간 벤치마크 (선택사항)
        print("\n❓ Run real-time benchmark? (requires webcam) [y/N]: ", end='')
        import sys
        response = input()
        
        if response.lower() == 'y':
            print("\n🎥 Starting real-time benchmark...")
            realtime_results = optimizer.benchmark_real_time_performance(duration=15)
        
        # 5. 보고서 생성
        print("\n📊 Generating performance report...")
        report_path = optimizer.generate_performance_report()
        
        # 최종 요약
        print("\n" + "="*60)
        print("🎉 PERFORMANCE OPTIMIZATION COMPLETE!")
        print("="*60)
        
        if method_results:
            best_method = max(method_results.items(), key=lambda x: x[1]['fps'])
            print(f"🏆 Best Method: {best_method[0]} ({best_method[1]['fps']:.1f} FPS)")
        
        print(f"📁 Full report available at: {report_path}")
        
        # 권장사항
        print("\n💡 RECOMMENDATIONS:")
        if method_results:
            sorted_methods = sorted(method_results.items(), key=lambda x: x[1]['fps'], reverse=True)
            print("   For real-time applications:")
            for i, (method, stats) in enumerate(sorted_methods[:3], 1):
                print(f"   {i}. {method} - {stats['fps']:.1f} FPS")
        
        print("\n✨ Optimization complete! Check the reports for detailed analysis.")
        
    except KeyboardInterrupt:
        print("\n\n⏸️  Benchmark interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during benchmarking: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # 필요한 패키지 확인
    required_packages = [
        'opencv-python', 'numpy', 'matplotlib', 'seaborn', 
        'scikit-learn', 'psutil'
    ]
    
    print("Required packages:")
    for pkg in required_packages:
        print(f"  - {pkg}")
    
    print("\nInstall with: pip install " + " ".join(required_packages))
    print("Optional: pip install GPUtil (for GPU monitoring)")
    print("")
    
    main()