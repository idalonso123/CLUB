@echo off
title Club ViveVerde TPV - Instalador
color 07

echo.
echo ========================================
echo  Club ViveVerde TPV - Instalador
echo ========================================
echo.
echo Este script instalara el sistema TPV.
echo Si aparece un error, la ventana permanecera abierta para que puedas verlo.
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

echo.
echo [INFO] Ejecutando instalador de PowerShell...
echo.

powershell -ExecutionPolicy Bypass -NoExit -File "%~dp0install-tpv-windows.ps1"

if errorlevel 1 (
    echo.
    echo [ERROR] El instalador encontro errores.
    echo.
    echo Presiona cualquier tecla para salir...
    pause >nul
)