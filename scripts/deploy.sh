#!/bin/bash

# Script de despliegue para Static CMS
# Uso: ./scripts/deploy.sh [development|production]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar argumentos
ENVIRONMENT=${1:-production}
if [[ ! "$ENVIRONMENT" =~ ^(development|production)$ ]]; then
    error "Entorno inválido. Use 'development' o 'production'"
    exit 1
fi

log "Iniciando despliegue en modo: $ENVIRONMENT"

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js no está instalado"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm no está instalado"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        warning "Docker no está instalado. El despliegue será local."
    fi
    
    success "Dependencias verificadas"
}

# Backup antes del despliegue
backup() {
    log "Creando backup antes del despliegue..."
    
    mkdir -p backups
    BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup de base de datos
    if [ -f "api/data/cms.db" ]; then
        cp api/data/cms.db "$BACKUP_DIR/cms.db"
        log "Backup de base de datos creado"
    fi
    
    # Backup de uploads
    if [ -d "api/uploads" ]; then
        tar -czf "$BACKUP_DIR/uploads.tar.gz" -C api uploads/
        log "Backup de uploads creado"
    fi
    
    success "Backup completado en $BACKUP_DIR"
}

# Instalar dependencias
install_dependencies() {
    log "Instalando dependencias..."
    
    npm run install:all
    
    success "Dependencias instaladas"
}

# Configurar variables de entorno
setup_environment() {
    log "Configurando variables de entorno..."
    
    if [ ! -f "api/.env" ]; then
        cp api/.env.example api/.env
        warning "Archivo api/.env creado. Por favor configúralo antes de continuar."
    fi
    
    if [ ! -f "panel_admin/.env" ]; then
        cp panel_admin/env.example panel_admin/.env
        warning "Archivo panel_admin/.env creado. Por favor configúralo antes de continuar."
    fi
    
    success "Variables de entorno configuradas"
}

# Construir aplicación
build_application() {
    log "Construyendo aplicación..."
    
    npm run build
    
    success "Aplicación construida"
}

# Despliegue con Docker
deploy_docker() {
    log "Desplegando con Docker..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose --profile production up -d --build
    else
        docker-compose --profile development up -d --build
    fi
    
    success "Aplicación desplegada con Docker"
}

# Despliegue local
deploy_local() {
    log "Desplegando localmente..."
    
    # Inicializar base de datos
    cd api && npm run db:init && cd ..
    
    # Iniciar servicios
    if [ "$ENVIRONMENT" = "production" ]; then
        npm start &
        log "API iniciada en modo producción"
    else
        npm run dev &
        log "Servicios iniciados en modo desarrollo"
    fi
    
    success "Aplicación desplegada localmente"
}

# Verificar salud de la aplicación
health_check() {
    log "Verificando salud de la aplicación..."
    
    # Esperar a que la aplicación esté lista
    sleep 10
    
    # Verificar API
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        success "API está funcionando correctamente"
    else
        error "API no está respondiendo"
        exit 1
    fi
    
    # Verificar panel de administración (solo en desarrollo)
    if [ "$ENVIRONMENT" = "development" ]; then
        if curl -f http://localhost:3001 > /dev/null 2>&1; then
            success "Panel de administración está funcionando correctamente"
        else
            warning "Panel de administración no está respondiendo"
        fi
    fi
}

# Mostrar información del despliegue
show_info() {
    log "Información del despliegue:"
    echo "  - Entorno: $ENVIRONMENT"
    echo "  - API: http://localhost:3000"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        echo "  - Panel Admin: http://localhost:3001"
    else
        echo "  - Panel Admin: http://localhost/admin"
    fi
    
    echo "  - Documentación: ./documentacion/"
    echo ""
    success "¡Despliegue completado exitosamente!"
}

# Función principal
main() {
    log "=== Static CMS - Script de Despliegue ==="
    
    check_dependencies
    backup
    install_dependencies
    setup_environment
    build_application
    
    if command -v docker &> /dev/null; then
        deploy_docker
    else
        deploy_local
    fi
    
    health_check
    show_info
}

# Ejecutar función principal
main "$@" 