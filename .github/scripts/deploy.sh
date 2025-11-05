#!/bin/bash

# deploy.sh - Main deployment script for CRUD application

set -e

DEPLOY_ALL=${1:-false}
SERVICES=${2:-""}
APP_DIR="/opt/crud-app"

echo "=== CRUD Application Deployment ==="
echo "Deploy All: $DEPLOY_ALL"
echo "Services: $SERVICES"
echo "Working Directory: $APP_DIR"
echo ""

# Change to application directory
cd "$APP_DIR"

# Pull latest code
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/main
echo "✓ Code updated"

# Function to wait for service health
wait_for_service() {
   local service=$1
   local max_attempts=30
   local attempt=1
   
   echo "Waiting for $service to be healthy..."
   
   while [ $attempt -le $max_attempts ]; do
       if docker compose ps | grep "$service" | grep -q "Up"; then
           echo "✓ $service is healthy"
           return 0
       fi
       
       echo "Attempt $attempt/$max_attempts: $service not ready yet..."
       sleep 10
       attempt=$((attempt + 1))
   done
   
   echo "❌ $service failed to become healthy within timeout"
   return 1
}

# Function to deploy all services
deploy_all_services() {
   echo "Deploying all services..."
   
   echo "Stopping all services..."
   docker compose down
   
   echo "Removing old volumes (if any)..."
   docker compose down -v 2>/dev/null || true
   
   echo "Pulling latest images..."
   docker compose pull 2>/dev/null || echo "Building images locally..."
   
   echo "Building and starting all services..."
   docker compose up -d --build
   
   # Wait for core services
   wait_for_service "db"
   wait_for_service "redis"
   wait_for_service "backend"
   wait_for_service "frontend"
   
   echo "✓ All services deployed"
}

# Function to deploy specific services
deploy_specific_services() {
   local services=($1)
   
   echo "Deploying specific services: ${services[*]}"
   
   for service in "${services[@]}"; do
       if [ -z "$service" ]; then
           continue
       fi
       
       echo "Deploying service: $service"
       
       # Handle service dependencies
       if [ "$service" = "backend" ]; then
           # Ensure database and redis are running
           docker compose up -d db redis
           wait_for_service "db"
           wait_for_service "redis"
       fi
       
       # Pull latest image for the service
       docker compose pull "$service" 2>/dev/null || echo "No pre-built image for $service, will build locally"
       
       # Build and restart the service
       docker compose up -d --build --no-deps "$service"
       
       # Wait for service to be ready
       wait_for_service "$service"
       
       echo "✓ Service $service deployed"
   done
}

# Execute deployment
if [ "$DEPLOY_ALL" = "true" ]; then
   deploy_all_services
else
   if [ -n "$SERVICES" ]; then
       deploy_specific_services "$SERVICES"
   else
       echo "No services to deploy"
   fi
fi

echo ""
echo "=== Deployment completed successfully ==="

# Show running services
echo ""
echo "Running services:"
docker compose ps