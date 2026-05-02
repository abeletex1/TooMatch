@echo off
title Instalando too-match
color 0A
echo.
echo ========================================
echo   Instalando dependencias de too-match
echo ========================================
echo.
echo Esto puede tardar 1-2 minutos. No cierres la ventana.
echo.

cd /d "%~dp0"

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se encontro Node.js / npm en tu sistema.
    echo.
    echo Por favor instala Node.js desde:
    echo    https://nodejs.org
    echo.
    echo Descarga la version LTS, instala con Siguiente-Siguiente,
    echo cierra esta ventana y vuelve a hacer doble clic en este archivo.
    echo.
    pause
    exit /b 1
)

call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Algo fallo durante la instalacion.
    echo Copia el mensaje rojo de arriba y compartelo con Claude.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Listo! Instalacion completada.
echo ========================================
echo.
echo Ahora haz doble clic en INICIAR.bat para arrancar el proyecto.
echo.
pause
