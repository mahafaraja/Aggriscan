#!/bin/bash

# Agriscan Frontend Build Script
# Builds two versions: Local Backend and Render Backend
# Each version has unique package name and backend URL

set -e

echo "========================================="
echo "Agriscan Frontend Build Script"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to build with specific configuration
build_version() {
    local profile=$1
    local version_name=$2
    local version_code=$3
    local package_name=$4
    
    echo -e "${BLUE}Building ${version_name}...${NC}"
    echo -e "${YELLOW}Profile: ${profile}${NC}"
    echo -e "${YELLOW}Package: ${package_name}${NC}"
    echo -e "${YELLOW}Version Code: ${version_code}${NC}"
    echo ""
    
    # Build the app with EAS
    eas build --platform android --profile "$profile"
    
    echo -e "${GREEN}${version_name} build completed!${NC}"
    echo ""
}

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
fi

# Check if user is logged in to EAS
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to EAS first:${NC}"
    eas login
fi

echo "Select build type:"
echo ""
echo "1) Build Local Backend Version - LOCAL BUILD (com.agriscan.local)"
echo "   - Backend: http://127.0.0.1:8000"
echo "   - Version Code: 100"
echo "   - Build: Local (no EAS credits used)"
echo ""
echo "2) Build Render Backend Version - LOCAL BUILD (com.agriscan.cloud)"
echo "   - Backend: https://aggriscan.onrender.com"
echo "   - Version Code: 200"
echo "   - Build: Local (no EAS credits used)"
echo ""
echo "3) Build Both Versions - LOCAL BUILD"
echo ""
echo "4) Build Local Backend - EAS CLOUD (requires credits)"
echo ""
echo "5) Build Render Backend - EAS CLOUD (requires credits)"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        build_version "local-backend-dev" "Local Backend Version" "100" "com.agriscan.local"
        ;;
    2)
        build_version "render-backend-dev" "Render Backend Version" "200" "com.agriscan.cloud"
        ;;
    3)
        build_version "local-backend-dev" "Local Backend Version" "100" "com.agriscan.local"
        build_version "render-backend-dev" "Render Backend Version" "200" "com.agriscan.cloud"
        ;;
    4)
        build_version "local-backend" "Local Backend Version" "100" "com.agriscan.local"
        ;;
    5)
        build_version "render-backend" "Render Backend Version" "200" "com.agriscan.cloud"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo "========================================="
echo -e "${GREEN}All builds completed successfully!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Download APK(s) from EAS build dashboard"
echo "2. Install on Android device(s)"
echo "3. Test the app with appropriate backend"
echo ""
echo "For Local Backend version:"
echo "  - Ensure backend is running at http://127.0.0.1:8000"
echo "  - Use demo phone: +256762000000, code: 123456"
echo ""
echo "For Render Backend version:"
echo "  - Ensure backend is deployed at https://aggriscan.onrender.com"
echo "  - Check health: https://aggriscan.onrender.com/health"
echo ""