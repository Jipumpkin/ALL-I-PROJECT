#!/usr/bin/env python3
"""
ASCII Batch Animal Face Detector
Process multiple images in a folder without Unicode issues
"""

import cv2
import os
from pathlib import Path
import argparse

def find_image_files(folder_path):
    """Find image files in folder"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif'}
    
    image_files = []
    folder = Path(folder_path)
    
    if not folder.exists():
        print(f"ERROR: Folder not found: {folder_path}")
        return []
    
    if not folder.is_dir():
        print(f"ERROR: Not a directory: {folder_path}")
        return []
    
    # Collect image files
    for file_path in folder.iterdir():
        if file_path.is_file() and file_path.suffix.lower() in image_extensions:
            image_files.append(str(file_path))
    
    # Also search subfolders
    for subfolder in folder.iterdir():
        if subfolder.is_dir():
            for file_path in subfolder.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in image_extensions:
                    image_files.append(str(file_path))
    
    return sorted(image_files)

def process_folder(folder_path, detector=None):
    """Process all images in folder"""
    if detector is None:
        # Use simple detector
        try:
            from detector_ascii import SimpleFaceDetector
            detector = SimpleFaceDetector()
        except Exception as e:
            print(f"ERROR: Failed to load detector: {e}")
            return
    
    # Find image files
    image_files = find_image_files(folder_path)
    
    if not image_files:
        print(f"ERROR: No image files found in {folder_path}")
        return
    
    print(f"Folder: {folder_path}")
    print(f"Found images: {len(image_files)}")
    print("=" * 50)
    
    # Create results folder in source directory
    source_folder = Path(folder_path)
    output_folder = source_folder / "face_detection_results"
    output_folder.mkdir(exist_ok=True)
    
    total_faces = 0
    processed_count = 0
    
    # Process each image
    for i, image_file in enumerate(image_files, 1):
        print(f"\nProcessing ({i}/{len(image_files)}): {Path(image_file).name}")
        
        try:
            # Detect faces
            faces, result_img = detector.detect_faces(image_file)
            
            if faces:
                total_faces += len(faces)
                processed_count += 1
                
                # Save result image
                output_name = f"batch_{Path(image_file).stem}_faces.jpg"
                output_path = output_folder / output_name
                cv2.imwrite(str(output_path), result_img)
                
                print(f"  SUCCESS: {len(faces)} faces detected -> {output_path}")
                
                # Save individual faces
                original_image = cv2.imread(image_file)
                if original_image is not None:
                    faces_subfolder = output_folder / "individual_faces"
                    faces_subfolder.mkdir(exist_ok=True)
                    
                    for j, face in enumerate(faces, 1):
                        x1, y1, x2, y2 = face['bbox']
                        face_crop = original_image[y1:y2, x1:x2]
                        
                        if face_crop.size > 0:
                            face_name = f"{Path(image_file).stem}_face_{j}_{face['animal']}.jpg"
                            face_path = faces_subfolder / face_name
                            cv2.imwrite(str(face_path), face_crop)
            else:
                print("  No faces detected")
                
        except Exception as e:
            print(f"  ERROR: Processing failed: {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("Batch processing complete!")
    print(f"Processed images: {processed_count}/{len(image_files)}")
    print(f"Total faces detected: {total_faces}")
    print(f"Results saved in: {output_folder}")
    print("=" * 50)

def main():
    parser = argparse.ArgumentParser(description='Batch Animal Face Detection (ASCII)')
    parser.add_argument('folder', help='Folder path to process')
    parser.add_argument('--model', '-m', default='n', choices=['n', 's', 'm', 'l'],
                       help='YOLO model size')
    parser.add_argument('--confidence', '-c', type=float, default=0.5,
                       help='Confidence threshold')
    
    args = parser.parse_args()
    
    print("Batch Animal Face Detection")
    print("=" * 50)
    
    # Check folder exists
    if not os.path.exists(args.folder):
        print(f"ERROR: Folder not found: {args.folder}")
        return
    
    if not os.path.isdir(args.folder):
        print(f"ERROR: Not a directory: {args.folder}")
        return
    
    # Initialize detector
    try:
        from detector_ascii import SimpleFaceDetector
        detector = SimpleFaceDetector(
            model_size=args.model,
            confidence=args.confidence
        )
    except Exception as e:
        print(f"ERROR: Detector initialization failed: {e}")
        return
    
    # Start processing
    process_folder(args.folder, detector)

if __name__ == "__main__":
    main()