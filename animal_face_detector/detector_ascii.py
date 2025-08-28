#!/usr/bin/env python3
"""
ASCII-only Animal Face Detector
Stable version without Korean text or emojis
"""

import cv2
import numpy as np
from pathlib import Path
import argparse
import os

class SimpleFaceDetector:
    """Simple and stable face detector"""
    
    # COCO animal classes
    ANIMAL_CLASSES = {
        15: 'cat',
        16: 'dog',
        17: 'horse',
        18: 'sheep',
        19: 'cow',
        20: 'elephant',
        21: 'bear',
        22: 'zebra',
        23: 'giraffe'
    }
    
    def __init__(self, model_size='n', confidence=0.5, 
                 min_face_size=30, max_face_size=1000, 
                 overlap_threshold=0.5, quality_threshold=0.3):
        """Initialize detector with filtering options"""
        from ultralytics import YOLO
        
        self.confidence = confidence
        self.min_face_size = min_face_size
        self.max_face_size = max_face_size
        self.overlap_threshold = overlap_threshold
        self.quality_threshold = quality_threshold
        
        print(f"Loading YOLO {model_size}...")
        self.yolo_model = YOLO(f'yolov8{model_size}.pt')
        print("YOLO loaded successfully!")
        print(f"Filter settings: size({min_face_size}-{max_face_size}), overlap({overlap_threshold}), quality({quality_threshold})")
        
    def detect_faces(self, image_path):
        """Detect animal faces in image"""
        print(f"Processing: {image_path}")
        
        # Validate file path
        if not os.path.exists(image_path):
            print(f"ERROR: File not found: {image_path}")
            return [], None
            
        if os.path.isdir(image_path):
            print(f"ERROR: Path is a directory, not a file: {image_path}")
            print("Use folder_detector.py for batch processing")
            return [], None
        
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            print(f"ERROR: Cannot load image: {image_path}")
            return [], None
            
        print(f"Image loaded: {image.shape}")
        
        # YOLO detection
        results = self.yolo_model(image, conf=self.confidence, verbose=False)
        
        detected_faces = []
        result_image = image.copy()
        
        # Process detections
        for result in results:
            if result.boxes is not None:
                for box in result.boxes:
                    # Get class ID
                    class_id = int(box.cls[0])
                    
                    if class_id in self.ANIMAL_CLASSES:
                        # Get bounding box
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        confidence = float(box.conf[0])
                        animal_type = self.ANIMAL_CLASSES[class_id]
                        
                        # Estimate face region
                        face_bbox = self.estimate_face_bbox((x1, y1, x2, y2), animal_type)
                        fx1, fy1, fx2, fy2 = face_bbox
                        
                        # Add to results
                        detected_faces.append({
                            'bbox': face_bbox,
                            'confidence': confidence,
                            'animal': animal_type,
                            'body_bbox': (x1, y1, x2, y2)
                        })
                        
                        # Draw on result image
                        # Body bounding box (blue)
                        cv2.rectangle(result_image, (x1, y1), (x2, y2), (255, 0, 0), 2)
                        cv2.putText(result_image, f'{animal_type} {confidence:.2f}', 
                                  (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
                        
                        # Face bounding box (red)
                        cv2.rectangle(result_image, (fx1, fy1), (fx2, fy2), (0, 0, 255), 2)
                        cv2.putText(result_image, 'FACE', 
                                  (fx1, fy1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        # Apply filtering
        print(f"Found {len(detected_faces)} raw detections")
        filtered_faces = self.filter_faces(detected_faces, image.shape)
        print(f"After filtering: {len(filtered_faces)} faces")
        
        # Redraw with filtered results
        result_image = image.copy()
        for face in filtered_faces:
            x1, y1, x2, y2 = face['body_bbox']
            fx1, fy1, fx2, fy2 = face['bbox']
            
            # Draw body bounding box (blue)
            cv2.rectangle(result_image, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(result_image, f"{face['animal']} {face['confidence']:.2f}", 
                      (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
            
            # Draw face bounding box (red)
            cv2.rectangle(result_image, (fx1, fy1), (fx2, fy2), (0, 0, 255), 2)
            cv2.putText(result_image, f"FACE Q:{face.get('quality', 0):.2f}", 
                      (fx1, fy1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        return filtered_faces, result_image
    
    def estimate_face_bbox(self, body_bbox, animal_type):
        """Estimate face region within body bounding box"""
        x1, y1, x2, y2 = body_bbox
        width = x2 - x1
        height = y2 - y1
        
        # Face region configurations for different animals
        face_configs = {
            'dog': {'x_offset': 0.3, 'y_offset': 0.15, 'w_ratio': 0.4, 'h_ratio': 0.35},
            'cat': {'x_offset': 0.25, 'y_offset': 0.1, 'w_ratio': 0.5, 'h_ratio': 0.4},
            'horse': {'x_offset': 0.2, 'y_offset': 0.1, 'w_ratio': 0.6, 'h_ratio': 0.5},
            'cow': {'x_offset': 0.25, 'y_offset': 0.2, 'w_ratio': 0.5, 'h_ratio': 0.4},
            'sheep': {'x_offset': 0.25, 'y_offset': 0.15, 'w_ratio': 0.5, 'h_ratio': 0.4},
        }
        
        # Use default config if animal type not found
        config = face_configs.get(animal_type, face_configs['dog'])
        
        # Calculate face bounding box
        face_x = x1 + int(width * config['x_offset'])
        face_y = y1 + int(height * config['y_offset'])
        face_w = int(width * config['w_ratio'])
        face_h = int(height * config['h_ratio'])
        
        # Ensure within image bounds
        face_x1 = max(0, face_x)
        face_y1 = max(0, face_y)
        face_x2 = min(x2, face_x + face_w)
        face_y2 = min(y2, face_y + face_h)
        
        return (face_x1, face_y1, face_x2, face_y2)
    
    def filter_faces(self, faces, image_shape):
        """Apply comprehensive filtering to detected faces"""
        if not faces:
            return faces
        
        print("Applying filters...")
        
        # Step 1: Size filtering
        size_filtered = self.filter_by_size(faces)
        print(f"Size filter: {len(faces)} -> {len(size_filtered)}")
        
        # Step 2: Quality filtering
        quality_filtered = self.filter_by_quality(size_filtered, image_shape)
        print(f"Quality filter: {len(size_filtered)} -> {len(quality_filtered)}")
        
        # Step 3: Overlap filtering (remove duplicates)
        final_filtered = self.filter_by_overlap(quality_filtered)
        print(f"Overlap filter: {len(quality_filtered)} -> {len(final_filtered)}")
        
        return final_filtered
    
    def filter_by_size(self, faces):
        """Filter faces by size constraints"""
        filtered = []
        for face in faces:
            fx1, fy1, fx2, fy2 = face['bbox']
            face_width = fx2 - fx1
            face_height = fy2 - fy1
            face_size = min(face_width, face_height)
            
            if self.min_face_size <= face_size <= self.max_face_size:
                face['size'] = face_size
                filtered.append(face)
            else:
                print(f"  Filtered out: size {face_size} (range: {self.min_face_size}-{self.max_face_size})")
                
        return filtered
    
    def filter_by_quality(self, faces, image_shape):
        """Filter faces by quality metrics"""
        filtered = []
        for face in faces:
            quality_score = self.calculate_quality_score(face, image_shape)
            face['quality'] = quality_score
            
            if quality_score >= self.quality_threshold:
                filtered.append(face)
            else:
                print(f"  Filtered out: quality {quality_score:.2f} (threshold: {self.quality_threshold})")
                
        return filtered
    
    def calculate_quality_score(self, face, image_shape):
        """Calculate quality score for a face detection"""
        score = 0.0
        
        # Base confidence score (0.4 weight)
        score += face['confidence'] * 0.4
        
        # Size score - prefer medium-sized faces (0.3 weight)
        fx1, fy1, fx2, fy2 = face['bbox']
        face_area = (fx2 - fx1) * (fy2 - fy1)
        image_area = image_shape[0] * image_shape[1]
        area_ratio = face_area / image_area
        
        # Optimal face size is 2-20% of image
        if 0.02 <= area_ratio <= 0.2:
            size_score = 1.0
        elif 0.01 <= area_ratio <= 0.4:
            size_score = 0.5
        else:
            size_score = 0.1
            
        score += size_score * 0.3
        
        # Aspect ratio score - faces should be roughly square (0.2 weight)
        face_width = fx2 - fx1
        face_height = fy2 - fy1
        aspect_ratio = face_width / max(face_height, 1)
        
        if 0.7 <= aspect_ratio <= 1.5:  # Good aspect ratio
            aspect_score = 1.0
        elif 0.5 <= aspect_ratio <= 2.0:  # Acceptable
            aspect_score = 0.6
        else:  # Poor aspect ratio
            aspect_score = 0.2
            
        score += aspect_score * 0.2
        
        # Position score - prefer faces not at edges (0.1 weight)
        center_x = (fx1 + fx2) / 2
        center_y = (fy1 + fy2) / 2
        img_center_x = image_shape[1] / 2
        img_center_y = image_shape[0] / 2
        
        distance_to_center = np.sqrt((center_x - img_center_x)**2 + (center_y - img_center_y)**2)
        max_distance = np.sqrt(img_center_x**2 + img_center_y**2)
        position_score = 1.0 - (distance_to_center / max_distance)
        
        score += position_score * 0.1
        
        return min(1.0, max(0.0, score))
    
    def filter_by_overlap(self, faces):
        """Remove overlapping face detections (Non-Maximum Suppression)"""
        if len(faces) <= 1:
            return faces
        
        # Sort by confidence descending
        faces_sorted = sorted(faces, key=lambda x: x['confidence'], reverse=True)
        
        filtered = []
        for face in faces_sorted:
            should_keep = True
            
            for kept_face in filtered:
                overlap = self.calculate_overlap(face['bbox'], kept_face['bbox'])
                if overlap > self.overlap_threshold:
                    print(f"  Filtered out: overlap {overlap:.2f} with higher confidence detection")
                    should_keep = False
                    break
            
            if should_keep:
                filtered.append(face)
        
        return filtered
    
    def calculate_overlap(self, bbox1, bbox2):
        """Calculate IoU (Intersection over Union) between two bounding boxes"""
        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2
        
        # Calculate intersection area
        x1_i = max(x1_1, x1_2)
        y1_i = max(y1_1, y1_2)
        x2_i = min(x2_1, x2_2)
        y2_i = min(y2_1, y2_2)
        
        if x2_i < x1_i or y2_i < y1_i:
            return 0.0
        
        intersection_area = (x2_i - x1_i) * (y2_i - y1_i)
        
        # Calculate union area
        area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
        area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
        union_area = area1 + area2 - intersection_area
        
        return intersection_area / max(union_area, 1)
    
    def save_results(self, image_path, faces, result_image):
        """Save detection results"""
        if not faces:
            print("No faces to save")
            return
            
        # Get source directory
        source_path = Path(image_path)
        source_dir = source_path.parent
        
        # Save main result image
        main_output_name = f"{source_path.stem}_faces_detected.jpg"
        main_output_path = source_dir / main_output_name
        cv2.imwrite(str(main_output_path), result_image)
        print(f"Saved result: {main_output_path}")
        
        # Save individual faces
        faces_dir = source_dir / "extracted_faces"
        faces_dir.mkdir(exist_ok=True)
        
        # Load original image for cropping
        original_image = cv2.imread(image_path)
        
        for i, face in enumerate(faces, 1):
            x1, y1, x2, y2 = face['bbox']
            face_crop = original_image[y1:y2, x1:x2]
            
            if face_crop.size > 0:
                face_name = f"{source_path.stem}_face_{i}_{face['animal']}.jpg"
                face_path = faces_dir / face_name
                cv2.imwrite(str(face_path), face_crop)
                print(f"Saved face: {face_path}")

def main():
    parser = argparse.ArgumentParser(description='Animal Face Detection (ASCII version)')
    parser.add_argument('--image', help='Path to image file')
    parser.add_argument('--model', '-m', default='n', choices=['n', 's', 'm', 'l'],
                       help='YOLO model size')
    parser.add_argument('--confidence', '-c', type=float, default=0.5,
                       help='Confidence threshold')
    
    args = parser.parse_args()
    
    if not args.image:
        print("ERROR: Please provide an image file with --image")
        print("Example: python detector_ascii.py --image test_images/sample_dog.jpg")
        return
    
    print("Animal Face Detection System")
    print("=" * 40)
    
    try:
        # Initialize detector
        detector = SimpleFaceDetector(
            model_size=args.model,
            confidence=args.confidence
        )
        
        # Process image
        faces, result_image = detector.detect_faces(args.image)
        
        if faces:
            # Save results
            detector.save_results(args.image, faces, result_image)
            print(f"\nSUCCESS: Detected {len(faces)} faces")
        else:
            print("\nNo animal faces detected")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    main()