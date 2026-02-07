#!/bin/bash
# Demo Script - Mini Service Desk

echo "=========================================="
echo "Mini Service Desk - Demo Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

step() {
    echo ""
    echo -e "${BLUE}>>> $1${NC}"
    echo ""
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 1: Check if Docker is running
step "Step 1: Checking Docker..."
if docker info > /dev/null 2>&1; then
    success "Docker is running"
else
    error "Docker is not running. Please start Docker first."
    exit 1
fi

# Step 2: Start the stack
step "Step 2: Starting services with Docker Compose..."
docker compose up -d

echo "Waiting for services to be ready..."
sleep 5

# Step 3: Check health
step "Step 3: Checking service health..."

HEALTH=$(curl -s http://localhost:8000/api/health)
if [[ $HEALTH == *"ok"* ]]; then
    success "Backend is healthy: $HEALTH"
else
    error "Backend is not healthy"
    exit 1
fi

# Step 4: Create a test user (or use existing)
step "Step 4: Setting up test user..."

# Try to register (might fail if user exists, that's ok)
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/users/ \
    -H "Content-Type: application/json" \
    -d '{"name": "Demo User", "email": "demo@example.com", "password": "DemoPass123!"}')

if [[ $REGISTER_RESPONSE == *"email"* ]]; then
    success "User ready (created or already exists)"
elif [[ $REGISTER_RESPONSE == *"already"* ]]; then
    success "User already exists"
else
    echo "Registration response: $REGISTER_RESPONSE"
fi

# Step 5: Login
step "Step 5: Logging in..."

TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/users/login \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=demo@example.com&password=DemoPass123!")

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    success "Login successful"
    echo "Token: ${TOKEN:0:30}..."
else
    error "Login failed"
    echo "Response: $TOKEN_RESPONSE"
    exit 1
fi

# Step 6: Create a ticket
step "Step 6: Creating a ticket..."

TICKET_RESPONSE=$(curl -s -X POST http://localhost:8000/api/tickets/ \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"description": "Demo ticket created by script", "request_type": "software", "urgency": "normal"}')

if [[ $TICKET_RESPONSE == *"id"* ]]; then
    success "Ticket created successfully"
    echo "Response: $TICKET_RESPONSE"
else
    error "Failed to create ticket"
    echo "Response: $TICKET_RESPONSE"
fi

# Step 7: Export tickets as CSV
step "Step 7: Exporting tickets to CSV..."

HTTP_CODE=$(curl -s -w "%{http_code}" -o tickets_export.csv \
    http://localhost:8000/api/export/tickets \
    -H "Authorization: Bearer $TOKEN")

if [ "$HTTP_CODE" = "200" ]; then
    success "CSV export complete"
    echo "CSV exported to: tickets_export.csv"
    echo ""
    echo "Preview:"
    head -5 tickets_export.csv
else
    error "Failed to export CSV (HTTP $HTTP_CODE)"
    cat tickets_export.csv
fi

# Step 8: Check security headers
step "Step 8: Verifying security headers..."

HEADERS=$(curl -s -I http://localhost:8000/)
echo "$HEADERS" | grep -E "(X-Content-Type|X-Frame|X-XSS|Content-Security)" || true
success "Security headers check complete"

# Summary
step "Demo Complete!"
echo "=========================================="
echo "Services running:"
echo "  - Frontend:  http://localhost:5173"
echo "  - Backend:   http://localhost:8000"
echo "  - API Docs:  http://localhost:8000/docs"
echo ""
echo "To stop services: docker compose down"
echo "=========================================="

