@echo off
echo Enhanced Animal Detection System - Package Installer
echo ===================================================

echo.
echo Installing essential packages...
python -m pip install opencv-python --user
python -m pip install numpy --user  
python -m pip install Pillow --user
python -m pip install scikit-learn --user

echo.
echo Installing optional high-performance packages...
python -m pip install ultralytics --user
python -m pip install torch torchvision --user

echo.
echo Installing monitoring packages...
python -m pip install psutil --user
python -m pip install matplotlib seaborn --user

echo.
echo Installation complete!
echo You can now run: python run_enhanced_detection.py --mode gui
pause