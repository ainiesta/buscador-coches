#!/bin/bash

# Setup Validation Script for BuscaCoches
# This script validates that your development environment is correctly configured

set -e

echo "🚗 BuscaCoches Setup Validation"
echo "=============================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "✓ Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
else
    echo -e "${RED}✗ Node.js 18+ required (found $(node -v))${NC}"
    exit 1
fi

# Check npm version
echo "✓ Checking npm version..."
NPM_VERSION=$(npm -v | cut -d'.' -f1)
if [ "$NPM_VERSION" -ge 9 ]; then
    echo -e "${GREEN}✓ npm $(npm -v)${NC}"
else
    echo -e "${RED}✗ npm 9+ required (found $(npm -v))${NC}"
    exit 1
fi

# Check if package.json exists
echo "✓ Checking project files..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ package.json found${NC}"
else
    echo -e "${RED}✗ package.json not found${NC}"
    exit 1
fi

# Check if .env.local exists
echo "✓ Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local found${NC}"

    # Check required variables
    if grep -q "DATABASE_URL" .env.local; then
        echo -e "${GREEN}✓ DATABASE_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠ DATABASE_URL not set in .env.local${NC}"
    fi

    if grep -q "NEXT_PUBLIC_APP_URL" .env.local; then
        echo -e "${GREEN}✓ NEXT_PUBLIC_APP_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠ NEXT_PUBLIC_APP_URL not set in .env.local${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env.local not found (copy from .env.example)${NC}"
fi

# Check if node_modules exists
echo "✓ Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Dependencies not installed, running npm install...${NC}"
    npm install
fi

# Check Prisma setup
echo "✓ Checking database setup..."
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${GREEN}✓ Prisma schema found${NC}"
else
    echo -e "${RED}✗ Prisma schema not found${NC}"
    exit 1
fi

# Try to access database
if [ -f "dev.db" ]; then
    echo -e "${GREEN}✓ SQLite database exists${NC}"
else
    echo -e "${YELLOW}⚠ SQLite database not initialized${NC}"
    echo "Run: npx prisma db push"
fi

# Check TypeScript configuration
echo "✓ Checking TypeScript..."
if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✓ TypeScript configured${NC}"
else
    echo -e "${RED}✗ tsconfig.json not found${NC}"
    exit 1
fi

# Check Next.js configuration
echo "✓ Checking Next.js..."
if [ -f "next.config.ts" ] || [ -f "next.config.js" ]; then
    echo -e "${GREEN}✓ Next.js configured${NC}"
else
    echo -e "${YELLOW}⚠ No next.config found (optional)${NC}"
fi

# Try TypeScript compilation
echo "✓ Checking TypeScript compilation..."
if npx tsc --noEmit 2>/dev/null; then
    echo -e "${GREEN}✓ No TypeScript errors${NC}"
else
    echo -e "${RED}✗ TypeScript compilation errors found${NC}"
    echo "Run: npm run tsc"
    exit 1
fi

# Summary
echo ""
echo "=============================="
echo -e "${GREEN}✓ All checks passed!${NC}"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. Initialize database: npx prisma db push"
echo "2. Start dev server: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For more details, see DEVELOPMENT.md"
