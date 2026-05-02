@echo off
title too-match - servidor de desarrollo
color 0B
echo.
echo ========================================
echo   Arrancando too-match
echo ========================================
echo.
echo Cuando veas "Local: http://localhost:3000"
echo abre esa direccion en tu navegador.
echo.
echo Para detener el servidor: pulsa Ctrl + C
echo y luego cierra esta ventana.
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo.
    echo [ERROR] Aun no has instalado las dependencias.
    echo Haz doble clic primero en INSTALAR.bat
    echo.
    pause
    exit /b 1
)

call npm run dev

pause
