#!/usr/bin/env python3
"""
Script para analizar la estructura de una base de datos Access (.mdb)
"""

import struct
import os

def analyze_mdb(file_path):
    """Analiza la estructura de un archivo MDB"""
    
    if not os.path.exists(file_path):
        print(f"Error: El archivo {file_path} no existe")
        return
    
    print(f"Analizando archivo: {file_path}")
    print(f"Tamaño: {os.path.getsize(file_path)} bytes")
    print("=" * 60)
    
    with open(file_path, 'rb') as f:
        # Leer el magic number (primeros 4 bytes)
        magic = f.read(4)
        print(f"Magic number: {magic.hex()}")
        
        if magic == b'\x00\x01\x00\x00' or magic == b'\x00\x00\x01\x00':
            print("✓ Formato Jet 3.x (Access 97)")
        elif magic == b'\x00\x00\x00\x00':
            print("✓ Formato Jet 4.x (Access 2000+)")
        else:
            print("? Formato desconocido")
        
        print()
        
        # Intentar leer más información del encabezado
        f.seek(0)
        header = f.read(512)
        
        print("Encabezado del archivo (primeros 512 bytes):")
        print("-" * 40)
        
        # Mostrar información relevante
        print(f"Versión de Engine: {header[0x14]:02x}")
        print(f"Formato archivo: {header[0x15]:02x}")
        
    print()
    print("=" * 60)
    print("Nota: Para ver las tablas y columnas de la base de datos,")
    print("se necesitan herramientas específicas como mdb-tools (Linux)")
    print("o el driver ODBC de Microsoft (Windows).")
    print()
    print("Alternativas para analizar el MDB:")
    print("1. En Windows: Abrir con Microsoft Access")
    print("2. En Linux: Instalar mdb-tools (sudo apt-get install mdb-tools)")
    print("3. En Linux: mdb-tables archivo.mdb  - lista tablas")
    print("4. En Linux: mdb-schema archivo.mdb  - muestra estructura")
    print("5. En Linux: mdb-export archivo.mdb tabla  - exporta datos")

if __name__ == "__main__":
    import sys
    
    mdb_file = "/workspace/user_input_files/Fideliza.mdb"
    
    if len(sys.argv) > 1:
        mdb_file = sys.argv[1]
    
    analyze_mdb(mdb_file)