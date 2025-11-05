#!/bin/bash

# detect-changes.sh - Detects which CRUD services have changed
# Always triggers full deploy if docker-compose.yml exists in repo root

set -e

# Service mapping - maps file paths to services
declare -A SERVICE_MAP=(
    ["frontend"]="frontend"
    ["backend"]="backend"
    ["docker-compose.yml"]="all"
    ["nginx/nginx.conf"]="frontend"
    [".env"]="all"
    ["database"]="all"
)

# Get changed files between current commit and previous commit
# Fallback to all tracked files if HEAD~1 is unavailable (e.g., first commit)
if git rev-parse HEAD~1 >/dev/null 2>&1; then
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
else
    CHANGED_FILES=$(git ls-files)
fi

echo "Changed files:"
echo "$CHANGED_FILES"
echo ""

SERVICES_TO_DEPLOY=""
DEPLOY_ALL=false

# Normalize and process each changed file
while IFS= read -r file; do
    # Skip empty lines
    [ -z "$file" ] && continue

    # Remove leading ./ for consistent matching
    file="${file#./}"
    echo "Analyzing: $file"

    # Check against service map
    for service_path in "${!SERVICE_MAP[@]}"; do
        if [[ "$file" == "$service_path" ]] || [[ "$file" == "$service_path/"* ]]; then
            services="${SERVICE_MAP[$service_path]}"
            if [ "$services" = "all" ]; then
                DEPLOY_ALL=true
                echo "→ Matched '$service_path' → triggering full deploy"
                break 2  # break both inner and outer loop
            else
                for service in $services; do
                    if [[ ! " $SERVICES_TO_DEPLOY " =~ " $service " ]]; then
                        SERVICES_TO_DEPLOY="$SERVICES_TO_DEPLOY $service"
                        echo "→ Matched '$service_path' → marking service '$service' for deploy"
                    fi
                done
            fi
            break
        fi
    done
done <<< "$(echo "$CHANGED_FILES" | sed 's|^\./||')"

# === CRITICAL POLICY: Always force full deploy if docker-compose.yml exists in repo root ===
if [ -f "docker-compose.yml" ]; then
    DEPLOY_ALL=true
    echo "→ docker-compose.yml exists in repo root — forcing full deploy"
fi

# Output results
if [ "$DEPLOY_ALL" = true ]; then
    echo "DEPLOY_ALL=true" >> "${GITHUB_OUTPUT:-/dev/null}"
    echo "SERVICES=" >> "${GITHUB_OUTPUT:-/dev/null}"
    echo "Deploying all services due to infrastructure changes or presence of docker-compose.yml"
else
    SERVICES_TO_DEPLOY=$(echo "$SERVICES_TO_DEPLOY" | xargs)
    echo "DEPLOY_ALL=false" >> "${GITHUB_OUTPUT:-/dev/null}"
    echo "SERVICES=$SERVICES_TO_DEPLOY" >> "${GITHUB_OUTPUT:-/dev/null}"
    if [ -n "$SERVICES_TO_DEPLOY" ]; then
        echo "Services to deploy: $SERVICES_TO_DEPLOY"
    else
        echo "No services to deploy"
    fi
fi