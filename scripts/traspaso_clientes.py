#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
SCRIPT DE TRASPASO DE USUARIOS - Club ViveVerde a Fideliza
=============================================================================

Objetivo: Transferir diariamente los usuarios nuevos dados de alta en 
Club Viveverde (MySQL) a Fideliza.mdb (Access).

Autor: MiniMax Agent
Fecha: 2026-04-27
Versión: 1.0

--------------------------------------------------------------------------
CONFIGURACIÓN NECESARIA
--------------------------------------------------------------------------

Antes de ejecutar, edita las variables de configuración:

1. CONFIGURACIÓN MySQL (Club ViveVerde):
   - MYSQL_HOST: Host del servidor MySQL
   - MYSQL_DATABASE: Nombre de la base de datos
   - MYSQL_USER: Usuario MySQL
   - MYSQL_PASSWORD: Contraseña MySQL
   - MYSQL_PORT: Puerto (por defecto 3306)

2. CONFIGURACIÓN ACCESS (Fideliza):
   - ACCESS_DB_PATH: Ruta completa al archivo Fideliza.mdb
   - ACCESS_TABLE: Nombre de la tabla destino (cliente)

3. CONFIGURACIÓN DEL TRASPASO:
   - CHECK_DUPLICATES: Verificar si el usuario ya existe antes de insertar
   - LOG_FILE: Archivo de log para registrar operaciones

--------------------------------------------------------------------------
INSTALACIÓN DE DEPENDENCIAS
--------------------------------------------------------------------------

Ejecuta estos comandos para instalar las dependencias:

    pip install mysql-connector-python pyodbc

En Windows, también necesitas el driver ODBC para Access:
    - Descarga Microsoft Access Database Engine 2010 Redistributable
    - URL: https://www.microsoft.com/en-us/download/details.aspx?id=13255

--------------------------------------------------------------------------
EJECUCIÓN
--------------------------------------------------------------------------

Ejecución manual:
    python traspaso_clientes.py

Ejecución programada (Windows Task Scheduler):
    1. Abre "Programador de tareas" (taskschd.msc)
    2. Crea una tarea nueva
    3. Acción: Iniciar un programa
    4. Programa: python
    5. Argumentos: ruta_completa\traspaso_clientes.py
    6. Desencadenador: Diariamente a las 23:00

=============================================================================
"""

import os
import sys
import logging
from datetime import datetime, date
import pymysql
pymysql.install_as_MySQLdb()
from pymysql import OperationalError

# ============================================================================
# CONFIGURACIÓN - EDITAR ESTOS VALORES
# ============================================================================

# Configuración MySQL (Club ViveVerde)
MYSQL_HOST = "2.59.133.246"
MYSQL_DATABASE = "Club ViveVerde"
MYSQL_USER = "root"
MYSQL_PASSWORD = "TU_CONTRASEÑA_MYSQL_AQUI"
MYSQL_PORT = 3306

# Configuración Access (Fideliza)
# Usar raw string (r"") para rutas de Windows
ACCESS_DB_PATH = r"C:\Fideliza\Fideliza.mdb"
ACCESS_TABLE = "cliente"

# Configuración del traspaso
CHECK_DUPLICATES = True  # Verificar si el usuario ya existe antes de insertar
LOG_FILE = r"C:\Fideliza\traspaso_log.txt"

# ============================================================================
# CONFIGURACIÓN DE LOGGING
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# ============================================================================
# FUNCIONES DE CONEXIÓN A MySQL
# ============================================================================

def conectar_mysql():
    """
    Establece conexión con la base de datos MySQL de Club ViveVerde.
    
    Returns:
        pymysql.Connection: Objeto de conexión MySQL
        None: Si hay error en la conexión
    """
    try:
        connection = pymysql.connect(
            host=MYSQL_HOST,
            database=MYSQL_DATABASE,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            port=MYSQL_PORT,
            cursorclass=pymysql.cursors.DictCursor
        )
        
        if connection.open:
            db_info = connection.get_server_info()
            logger.info(f"[OK] Conectado a MySQL - Server version: {db_info}")
            return connection
            
    except OperationalError as e:
        logger.error(f"[ERROR] Error al conectar a MySQL: {e}")
        return None

def extraer_usuarios_hoy(connection):
    """
    Extrae los usuarios dados de alta hoy de Club ViveVerde.
    
    Realiza un JOIN entre personas y direcciones para obtener
    todos los datos necesarios para el traspaso.
    
    Args:
        connection: Objeto de conexión MySQL
        
    Returns:
        list: Lista de diccionarios con los datos de los usuarios
    """
    try:
        with connection.cursor() as cursor:
            # Consulta para obtener usuarios dados de alta hoy
            query = """
                SELECT 
                    p.dni,
                    p.apellidos,
                    p.nombres,
                    d.direccion,
                    d.codpostal,
                    d.ciudad,
                    d.provincia,
                    p.mail,
                    p.telefono,
                    p.fecha_nacimiento,
                    p.creado_en
                FROM personas p
                LEFT JOIN direcciones d ON p.codigo = d.codigo
                WHERE DATE(p.creado_en) = CURDATE()
                ORDER BY p.creado_en DESC
            """
            
            cursor.execute(query)
            usuarios = cursor.fetchall()
            
            logger.info(f"[OK] Extraidos {len(usuarios)} usuarios dados de alta hoy")
            
            return usuarios
        
    except OperationalError as e:
        logger.error(f"[ERROR] Error al extraer usuarios: {e}")
        return []

# ============================================================================
# FUNCIONES DE CONEXIÓN A ACCESS
# ============================================================================

def conectar_access():
    """
    Establece conexión con la base de datos Access (Fideliza.mdb).
    
    Returns:
        pyodbc.Connection: Objeto de conexión ODBC
        None: Si hay error en la conexión
    """
    try:
        import pyodbc
        
        # String de conexión para Access
        # Provider Microsoft Access
        connection_string = (
            r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};"
            f"DBQ={ACCESS_DB_PATH};"
        )
        
        connection = pyodbc.connect(connection_string)
        logger.info("✓ Conectado a Fideliza.mdb (Access)")
        return connection
        
    except Exception as e:
        logger.error(f"✗ Error al conectar a Access: {e}")
        logger.error("Asegúrate de tener instalado Microsoft Access Database Engine")
        return None

def verificar_existe_usuario(connection, dni):
    """
    Verifica si un usuario ya existe en Fideliza.
    
    Args:
        connection: Objeto de conexión ODBC
        dni: DNI del usuario a verificar
        
    Returns:
        bool: True si el usuario existe, False en caso contrario
    """
    try:
        cursor = connection.cursor()
        
        # Verificar en los tres campos donde se guarda el DNI
        query = """
            SELECT COUNT(*) FROM cliente 
            WHERE codigo = ? OR carnet = ? OR cif = ?
        """
        
        cursor.execute(query, (dni, dni, dni))
        result = cursor.fetchone()
        
        existe = result[0] > 0 if result else False
        
        return existe
        
    except Exception as e:
        logger.error(f"✗ Error al verificar usuario: {e}")
        return False

def insertar_usuario(connection, usuario):
    """
    Inserta un nuevo usuario en Fideliza.mdb
    
    Args:
        connection: Objeto de conexión ODBC
        usuario: Diccionario con los datos del usuario
        
    Returns:
        bool: True si la inserción fue exitosa, False en caso contrario
    """
    try:
        cursor = connection.cursor()
        
        # Formatear fechas para Access
        # Access espera formato: #YYYY-MM-DD# para fechas
        fecha_alta = usuario.get('creado_en')
        if isinstance(fecha_alta, datetime):
            faalta = fecha_alta.strftime('%Y-%m-%d')
        elif isinstance(fecha_alta, date):
            faalta = fecha_alta.strftime('%Y-%m-%d')
        else:
            faalta = str(fecha_alta)[:10] if fecha_alta else ''
        
        fanacimiento = usuario.get('fecha_nacimiento')
        if isinstance(fanacimiento, (datetime, date)):
            fanacimiento = fanacimiento.strftime('%Y-%m-%d')
        else:
            fanacimiento = str(fanacimiento)[:10] if fanacimiento else ''
        
        # Preparar datos para inserción
        # Según la relación: codigo, carnet, cif = dni
        dni = usuario.get('dni', '')
        
        # Query de inserción
        query = """
            INSERT INTO cliente (
                codigo,
                carnet,
                cif,
                apellidos,
                nombres,
                direccion,
                codpostal,
                poblacion,
                provincia,
                faalta,
                movil,
                mail,
                fanacimiento,
                estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        valores = (
            dni,           # codigo
            dni,           # carnet
            dni,           # cif
            usuario.get('apellidos', ''),
            usuario.get('nombres', ''),
            usuario.get('direccion', ''),
            usuario.get('codpostal', ''),
            usuario.get('ciudad', ''),
            usuario.get('provincia', ''),
            faalta,        # faalta (fecha de alta)
            usuario.get('telefono', ''),
            usuario.get('mail', ''),
            fanacimiento,   # fanacimiento
            1              # estado = 1 (activo)
        )
        
        cursor.execute(query, valores)
        connection.commit()
        
        logger.info(f"  ✓ Insertado: {usuario.get('nombres', '')} {usuario.get('apellidos', '')} ({dni})")
        return True
        
    except Exception as e:
        logger.error(f"  ✗ Error al insertar usuario {usuario.get('dni', '')}: {e}")
        return False

# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

def main():
    """
    Función principal del script de traspaso.
    
    Flujo:
    1. Conectar a MySQL (Club ViveVerde)
    2. Extraer usuarios dados de alta hoy
    3. Conectar a Access (Fideliza)
    4. Para cada usuario:
       - Verificar si ya existe (opcional)
       - Insertar en Fideliza
    5. Mostrar resumen
    """
    
    print("=" * 70)
    print("TRASPASO DE USUARIOS - Club ViveVerde a Fideliza")
    print("=" * 70)
    print()
    
    fecha_hoy = date.today().strftime('%Y-%m-%d')
    logger.info(f"Iniciando traspaso - Fecha: {fecha_hoy}")
    print(f"Fecha de traspaso: {fecha_hoy}")
    print()
    
    # ============================================
    # PASO 1: Conectar a MySQL
    # ============================================
    print("[1/4] Conectando a MySQL (Club ViveVerde)...")
    mysql_conn = conectar_mysql()
    
    if not mysql_conn:
        logger.error("No se pudo conectar a MySQL. Saliendo.")
        sys.exit(1)
    
    print("✓ Conexión MySQL establecida")
    print()
    
    # ============================================
    # PASO 2: Extraer usuarios de hoy
    # ============================================
    print("[2/4] Extrayendo usuarios dados de alta hoy...")
    usuarios = extraer_usuarios_hoy(mysql_conn)
    
    if not usuarios:
        logger.info("No hay usuarios nuevos para traspasar hoy.")
        print("✓ No hay usuarios nuevos para traspasar")
        mysql_conn.close()
        sys.exit(0)
    
    print(f"✓ {len(usuarios)} usuarios encontrados para traspasar")
    print()
    
    # Cerrar conexión MySQL
    mysql_conn.close()
    logger.info("Conexión MySQL cerrada")
    
    # ============================================
    # PASO 3: Conectar a Access
    # ============================================
    print("[3/4] Conectando a Access (Fideliza.mdb)...")
    access_conn = conectar_access()
    
    if not access_conn:
        logger.error("No se pudo conectar a Access. Saliendo.")
        sys.exit(1)
    
    print("✓ Conexión Access establecida")
    print()
    
    # ============================================
    # PASO 4: Insertar usuarios en Fideliza
    # ============================================
    print("[4/4] Insertando usuarios en Fideliza...")
    print("-" * 70)
    
    insertados = 0
    omitidos = 0
    errores = 0
    
    for usuario in usuarios:
        dni = usuario.get('dni', '')
        
        # Verificar si ya existe
        if CHECK_DUPLICATES:
            if verificar_existe_usuario(access_conn, dni):
                logger.info(f"  - Omitido (ya existe): {dni}")
                omitidos += 1
                continue
        
        # Insertar usuario
        if insertar_usuario(access_conn, usuario):
            insertados += 1
        else:
            errores += 1
    
    # Cerrar conexión Access
    access_conn.close()
    logger.info("Conexión Access cerrada")
    
    # ============================================
    # RESUMEN
    # ============================================
    print()
    print("=" * 70)
    print("RESUMEN DEL TRASPASO")
    print("=" * 70)
    print(f"Fecha:                {fecha_hoy}")
    print(f"Usuarios encontrados:  {len(usuarios)}")
    print(f"Insertados:           {insertados}")
    print(f"Omitidos (duplicados):{omitidos}")
    print(f"Errores:              {errores}")
    print("=" * 70)
    print()
    
    logger.info(f"TRASPASO COMPLETADO - Insertados: {insertados}, Omitidos: {omitidos}, Errores: {errores}")
    
    # Devolver código de salida
    if errores > 0:
        sys.exit(1)
    else:
        sys.exit(0)

# ============================================================================
# PUNTO DE ENTRADA
# ============================================================================

if __name__ == "__main__":
    main()
