#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
INSTALADOR DE TAREA PROGRAMADA - Traspaso Club ViveVerde
=============================================================================

Este script instala una tarea en el Programador de tareas de Windows
para ejecutar el script de traspaso diariamente.

Uso:
    python instalar_tarea_traspaso.py

O compilado a .exe:
    .\instalar_tarea_traspaso.exe

Autor: MiniMax Agent
Fecha: 2026-04-27
Versión: 1.0

=============================================================================
"""

import os
import sys
import subprocess
import shutil
from datetime import datetime

# ============================================================================
# CONFIGURACIÓN - EDITAR SI ES NECESARIO
# ============================================================================

# Ruta del directorio donde está el script de traspaso
DIRECTORIO_SCRIPT = r"C:\traspaso_clientes_a_fideliza"

# Nombre del script de traspaso
NOMBRE_SCRIPT = "traspaso_clientes.py"

# Ruta completa del script
RUTA_SCRIPT = os.path.join(DIRECTORIO_SCRIPT, NOMBRE_SCRIPT)

# Nombre de la tarea programada
NOMBRE_TAREA = "Traspaso_ClubViveVerde_a_Fideliza"

# Hora de ejecución (formato 24 horas)
HORA_EJECUCION = "21:05"

# Descripción de la tarea
DESCRIPCION_TAREA = "Traspasa usuarios diarios de Club ViveVerde a Fideliza - Se ejecuta automaticamente"

# ============================================================================
# FUNCIONES
# ============================================================================

def es_administrador():
    """Verifica si el script se ejecuta como administrador."""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False


def verificar_directorio():
    """
    Verifica que el directorio y el script existan.
    
    Returns:
        bool: True si todo está correcto, False si hay error
    """
    print("=" * 60)
    print("VERIFICACIÓN DEL ENTORNO")
    print("=" * 60)
    print()
    
    # Verificar directorio
    print(f"[1/2] Verificando directorio: {DIRECTORIO_SCRIPT}")
    if os.path.isdir(DIRECTORIO_SCRIPT):
        print(f"  ✓ Directorio encontrado")
    else:
        print(f"  ✗ ERROR: El directorio no existe")
        print(f"  Crear el directorio y copiar el archivo '{NOMBRE_SCRIPT}'")
        return False
    
    print()
    
    # Verificar script
    print(f"[2/2] Verificando script: {RUTA_SCRIPT}")
    if os.path.isfile(RUTA_SCRIPT):
        print(f"  ✓ Script encontrado")
    else:
        print(f"  ✗ ERROR: El script '{NOMBRE_SCRIPT}' no existe")
        print(f"  Copiar '{NOMBRE_SCRIPT}' en: {DIRECTORIO_SCRIPT}")
        return False
    
    print()
    return True


def crear_tarea_programada():
    """
    Crea la tarea programada en Windows Task Scheduler.
    
    Returns:
        bool: True si se creó correctamente, False si hubo error
    """
    print("=" * 60)
    print("CREANDO TAREA PROGRAMADA")
    print("=" * 60)
    print()
    
    # Primero, eliminar tarea existente si la hay
    print("[1/3] Eliminando tarea existente (si existe)...")
    try:
        subprocess.run([
            'schtasks', '/Delete', '/TN', NOMBRE_TAREA, '/F'
        ], capture_output=True, check=False)
        print("  ✓ Tarea anterior eliminada (si existía)")
    except Exception as e:
        print(f"  - No había tarea anterior")
    
    print()
    
    # Crear nueva tarea
    print("[2/3] Creando nueva tarea programada...")
    
    # Buscar Python
    python_path = sys.executable
    python_dir = os.path.dirname(python_path)
    print(f"  Python encontrado: {python_path}")
    
    # Comando a ejecutar
    comando = f'"{python_path}" "{RUTA_SCRIPT}"'
    
    # Crear tarea con schtasks
    # Formato: SCHTASKS /Create /SC DAILY /TN "nombre" /TR "comando" /ST HH:MM
    try:
        resultado = subprocess.run([
            'schtasks',
            '/Create',
            '/SC', 'DAILY',           # Frecuencia: diariamente
            '/TN', NOMBRE_TAREA,       # Nombre de la tarea
            '/TR', comando,            # Comando a ejecutar
            '/ST', HORA_EJECUCION,    # Hora de inicio
            '/RU', 'SYSTEM',           # Ejecutar como SYSTEM (no requiere usuario)
            '/F'                      # Forzar creación (sobrescribir si existe)
        ], capture_output=True, text=True)
        
        if resultado.returncode == 0:
            print(f"  ✓ Tarea creada exitosamente")
            print(f"  ✓ Se ejecutará a las {HORA_EJECUCION} diariamente")
        else:
            print(f"  ✗ Error al crear tarea: {resultado.stderr}")
            return False
            
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False
    
    print()
    
    # Verificar tarea creada
    print("[3/3] Verificando tarea creada...")
    try:
        resultado = subprocess.run([
            'schtasks',
            '/Query',
            '/TN', NOMBRE_TAREA
        ], capture_output=True, text=True)
        
        if resultado.returncode == 0:
            print("  ✓ Tarea verificada correctamente")
            print()
            print("  Detalles de la tarea:")
            print("  " + "-" * 50)
            # Mostrar información relevante
            lineas = resultado.stdout.split('\n')
            for linea in lineas:
                if 'Nombre de tarea' in linea or 'Próxima hora de ejecución' in linea or 'Estado' in linea:
                    print(f"  {linea.strip()}")
            print("  " + "-" * 50)
        else:
            print("  ⚠ No se pudo verificar la tarea")
            
    except Exception as e:
        print(f"  ⚠ Error al verificar: {e}")
    
    print()
    return True


def mostrar_resumen():
    """Muestra un resumen de la instalación."""
    print("=" * 60)
    print("INSTALACIÓN COMPLETADA")
    print("=" * 60)
    print()
    print("TAREA PROGRAMADA CONFIGURADA:")
    print()
    print(f"  Nombre:        {NOMBRE_TAREA}")
    print(f"  Frecuencia:   Diaria")
    print(f"  Hora:         {HORA_EJECUCION}")
    print(f"  Script:       {RUTA_SCRIPT}")
    print()
    print("OPCIONES DE GESTIÓN:")
    print()
    print("  Ver tarea:")
    print(f'    schtasks /Query /TN "{NOMBRE_TAREA}"')
    print()
    print("  Eliminar tarea:")
    print(f'    schtasks /Delete /TN "{NOMBRE_TAREA}" /F')
    print()
    print("  Ejecutar manualmente ahora:")
    print(f'    schtasks /Run /TN "{NOMBRE_TAREA}"')
    print()
    print("  Ver log de traspasos:")
    print(r'    notepad C:\Fideliza\traspaso_log.txt')
    print()
    print("=" * 60)
    input("Presiona ENTER para salir...")


def main():
    """Función principal."""
    
    print()
    print("*" * 60)
    print("  INSTALADOR DE TAREA PROGRAMADA")
    print("  Traspaso Diario - Club ViveVerde a Fideliza")
    print("*" * 60)
    print()
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Verificar entorno
    if not verificar_directorio():
        print()
        print("✗ ERROR: Verifica que el directorio y el script existan")
        input("Presiona ENTER para salir...")
        sys.exit(1)
    
    # Crear tarea
    if crear_tarea_programada():
        mostrar_resumen()
        sys.exit(0)
    else:
        print()
        print("✗ ERROR: No se pudo crear la tarea programada")
        print()
        print("POSIBLES SOLUCIONES:")
        print("  1. Ejecutar como Administrador (clic derecho > Ejecutar como administrador)")
        print("  2. Verificar que el script traspaso_clientes.py exista en el directorio")
        input("Presiona ENTER para salir...")
        sys.exit(1)


# ============================================================================
# PUNTO DE ENTRADA
# ============================================================================

if __name__ == "__main__":
    main()
