#!/usr/bin/env bash
# =============================================================================
# Lucro Caseiro — API Integration Test Script
# Testa todos os endpoints da API com um usuario real do Supabase.
#
# Requisitos:
#   - API rodando em http://localhost:3001
#   - Supabase ativo com banco conectado
#   - curl e jq instalados
#
# Uso:
#   export TEST_EMAIL="test@lucrocaseiro.com"
#   export TEST_PASSWORD="Test1234!"
#   bash scripts/test-api-integration.sh
# =============================================================================

set -euo pipefail

BASE="http://localhost:3001/api/v1"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqd3h2cGNlcWlndnl4Y3FvbGNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzcyMzAsImV4cCI6MjA5MDExMzIzMH0.qRpkzvICKETn61bBIJfrka61wJD1nCmz8mKg6ALQEuE"
SUPABASE_URL="https://ujwxvpceqigvyxcqolch.supabase.co"
EMAIL="${TEST_EMAIL:-test@lucrocaseiro.com}"
PASSWORD="${TEST_PASSWORD:-Test1234!}"

PASS=0
FAIL=0
TOTAL=0

green() { echo -e "\033[32m$1\033[0m"; }
red() { echo -e "\033[31m$1\033[0m"; }
bold() { echo -e "\033[1m$1\033[0m"; }

assert_status() {
  local label="$1" expected="$2" actual="$3"
  TOTAL=$((TOTAL + 1))
  if [ "$expected" = "$actual" ]; then
    green "  PASS: $label (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $label — expected $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

# --- Auth ---
bold "=== AUTENTICACAO ==="

echo "Obtendo token..."
AUTH_RESULT=$(curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESULT" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')

if [ -z "$TOKEN" ]; then
  red "Falha ao obter token. Criando usuario..."
  curl -s "$SUPABASE_URL/auth/v1/signup" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"data\":{\"name\":\"Teste\"}}" > /dev/null

  AUTH_RESULT=$(curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

  TOKEN=$(echo "$AUTH_RESULT" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')
fi

if [ -z "$TOKEN" ]; then
  red "FATAL: Nao foi possivel obter token de autenticacao."
  exit 1
fi
green "  Token obtido (${#TOKEN} chars)"

AUTH="-H \"Authorization: Bearer $TOKEN\""

# Helper to make authenticated requests
api() {
  local method="$1" path="$2"
  shift 2
  curl -s -w "\n%{http_code}" -X "$method" "$BASE$path" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$@"
}

get_status() { echo "$1" | tail -1; }
get_body() { echo "$1" | head -n -1; }

# --- Health ---
bold ""
bold "=== HEALTH CHECK ==="
R=$(curl -s -w "\n%{http_code}" "$BASE/health")
assert_status "GET /health" "200" "$(get_status "$R")"

# --- Products ---
bold ""
bold "=== PRODUCTS ==="

R=$(api POST /products -d '{"name":"Brigadeiro Test","category":"Doces","salePrice":3.50}')
assert_status "POST /products (create)" "201" "$(get_status "$R")"
PRODUCT_ID=$(get_body "$R" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

R=$(api POST /products -d '{"name":"Bolo Test","category":"Bolos","salePrice":45.00}')
assert_status "POST /products (create 2)" "201" "$(get_status "$R")"
PRODUCT2_ID=$(get_body "$R" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

R=$(api GET /products)
assert_status "GET /products (list)" "200" "$(get_status "$R")"

R=$(api GET "/products/$PRODUCT_ID")
assert_status "GET /products/:id" "200" "$(get_status "$R")"

R=$(api PATCH "/products/$PRODUCT_ID" -d '{"salePrice":4.00}')
assert_status "PATCH /products/:id (update)" "200" "$(get_status "$R")"

R=$(api POST /products -d '{"category":"Doces","salePrice":3.50}')
assert_status "POST /products (reject no name)" "400" "$(get_status "$R")"

R=$(curl -s -w "\n%{http_code}" "$BASE/products")
assert_status "GET /products (no auth = 401)" "401" "$(get_status "$R")"

# --- Clients ---
bold ""
bold "=== CLIENTS ==="

R=$(api POST /clients -d '{"name":"Maria Teste","phone":"11999999999"}')
assert_status "POST /clients (create)" "201" "$(get_status "$R")"
CLIENT_ID=$(get_body "$R" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

R=$(api GET /clients)
assert_status "GET /clients (list)" "200" "$(get_status "$R")"

R=$(api GET "/clients/$CLIENT_ID")
assert_status "GET /clients/:id" "200" "$(get_status "$R")"

R=$(api GET "/clients?search=Maria")
assert_status "GET /clients (search)" "200" "$(get_status "$R")"

R=$(api GET /clients/birthdays)
assert_status "GET /clients/birthdays" "200" "$(get_status "$R")"

R=$(api PATCH "/clients/$CLIENT_ID" -d '{"phone":"11888888888"}')
assert_status "PATCH /clients/:id (update)" "200" "$(get_status "$R")"

R=$(api POST /clients -d '{"phone":"123"}')
assert_status "POST /clients (reject no name)" "400" "$(get_status "$R")"

# --- Sales ---
bold ""
bold "=== SALES ==="

R=$(api POST /sales -d "{\"paymentMethod\":\"pix\",\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2,\"unitPrice\":3.50}]}")
assert_status "POST /sales (create)" "201" "$(get_status "$R")"
SALE_ID=$(get_body "$R" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

R=$(api POST /sales -d "{\"clientId\":\"$CLIENT_ID\",\"paymentMethod\":\"cash\",\"items\":[{\"productId\":\"$PRODUCT2_ID\",\"quantity\":1,\"unitPrice\":45.00}]}")
assert_status "POST /sales (with client)" "201" "$(get_status "$R")"

R=$(api GET /sales)
assert_status "GET /sales (list)" "200" "$(get_status "$R")"

R=$(api GET "/sales/$SALE_ID")
assert_status "GET /sales/:id" "200" "$(get_status "$R")"

R=$(api GET /sales/summary/today)
assert_status "GET /sales/summary/today" "200" "$(get_status "$R")"

R=$(api PATCH "/sales/$SALE_ID/status" -d '{"status":"paid"}')
assert_status "PATCH /sales/:id/status" "200" "$(get_status "$R")"

R=$(api POST /sales -d '{"paymentMethod":"pix","items":[]}')
assert_status "POST /sales (reject empty items)" "400" "$(get_status "$R")"

# --- Finance ---
bold ""
bold "=== FINANCE ==="

R=$(api POST /finance -d '{"type":"income","category":"sale","amount":100.00,"description":"Venda de brigadeiros","date":"2026-04-09"}')
assert_status "POST /finance (income)" "201" "$(get_status "$R")"
FINANCE_ID=$(get_body "$R" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

R=$(api POST /finance -d '{"type":"expense","category":"material","amount":30.00,"description":"Compra de leite condensado","date":"2026-04-09"}')
assert_status "POST /finance (expense)" "201" "$(get_status "$R")"

R=$(api GET /finance)
assert_status "GET /finance (list)" "200" "$(get_status "$R")"

R=$(api GET /finance/summary)
assert_status "GET /finance/summary" "200" "$(get_status "$R")"

R=$(api PATCH "/finance/$FINANCE_ID" -d '{"amount":120.00}')
assert_status "PATCH /finance/:id (update)" "200" "$(get_status "$R")"

# --- Recipes ---
bold ""
bold "=== RECIPES ==="

R=$(api POST /ingredients -d '{"name":"Leite condensado","price":5.50,"quantityPerPackage":395,"unit":"g"}')
assert_status "POST /ingredients (create)" "201" "$(get_status "$R")"
INGREDIENT_ID=$(get_body "$R" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

R=$(api POST /recipes -d "{\"name\":\"Brigadeiro Gourmet\",\"category\":\"Doces\",\"yieldQuantity\":30,\"yieldUnit\":\"unidades\",\"ingredients\":[{\"ingredientId\":\"$INGREDIENT_ID\",\"quantity\":2,\"unit\":\"lata\"}]}")
assert_status "POST /recipes (create)" "201" "$(get_status "$R")"
RECIPE_ID=$(get_body "$R" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

R=$(api GET /recipes)
assert_status "GET /recipes (list)" "200" "$(get_status "$R")"

R=$(api GET "/recipes/$RECIPE_ID")
assert_status "GET /recipes/:id" "200" "$(get_status "$R")"

R=$(api GET "/recipes/$RECIPE_ID/scale?multiplier=2")
assert_status "GET /recipes/:id/scale" "200" "$(get_status "$R")"

# --- Pricing ---
bold ""
bold "=== PRICING ==="

R=$(api POST /pricing/calculate -d "{\"productId\":\"$PRODUCT_ID\",\"ingredientCost\":10.00,\"packagingCost\":2.00,\"laborCost\":5.00,\"fixedCostShare\":0,\"marginPercent\":50}")
assert_status "POST /pricing/calculate" "201" "$(get_status "$R")"

R=$(api GET /pricing)
assert_status "GET /pricing (list)" "200" "$(get_status "$R")"

R=$(api GET "/pricing/product/$PRODUCT_ID/history")
assert_status "GET /pricing/product/:id/history" "200" "$(get_status "$R")"

# --- Packaging ---
bold ""
bold "=== PACKAGING ==="

R=$(api POST /packaging -d '{"name":"Caixa kraft P","type":"box","unitCost":1.50}')
assert_status "POST /packaging (create)" "201" "$(get_status "$R")"
PACKAGING_ID=$(get_body "$R" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

R=$(api GET /packaging)
assert_status "GET /packaging (list)" "200" "$(get_status "$R")"

R=$(api GET "/packaging/$PACKAGING_ID")
assert_status "GET /packaging/:id" "200" "$(get_status "$R")"

R=$(api POST "/packaging/$PACKAGING_ID/products/$PRODUCT_ID")
assert_status "POST /packaging/:id/products/:pid (link)" "204" "$(get_status "$R")"

R=$(api DELETE "/packaging/$PACKAGING_ID/products/$PRODUCT_ID")
assert_status "DELETE /packaging/:id/products/:pid (unlink)" "204" "$(get_status "$R")"

# --- Labels ---
bold ""
bold "=== LABELS ==="

R=$(api POST /labels -d "{\"productId\":\"$PRODUCT_ID\",\"templateId\":\"classico\",\"name\":\"Rotulo Brigadeiro\",\"data\":{\"productName\":\"Brigadeiro Test\"}}")
assert_status "POST /labels (create)" "201" "$(get_status "$R")"
LABEL_ID=$(get_body "$R" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

R=$(api GET /labels)
assert_status "GET /labels (list)" "200" "$(get_status "$R")"

R=$(api GET /labels/templates)
assert_status "GET /labels/templates" "200" "$(get_status "$R")"

# --- Subscription ---
bold ""
bold "=== SUBSCRIPTION ==="

R=$(api GET /subscription/profile)
assert_status "GET /subscription/profile" "200" "$(get_status "$R")"

R=$(api PATCH /subscription/profile -d '{"name":"Teste Atualizado","businessName":"Doces do Teste"}')
assert_status "PATCH /subscription/profile (update)" "200" "$(get_status "$R")"

R=$(api GET /subscription/limits)
assert_status "GET /subscription/limits" "200" "$(get_status "$R")"

# --- Cleanup ---
bold ""
bold "=== CLEANUP ==="

R=$(api DELETE "/labels/$LABEL_ID"); assert_status "DELETE label" "204" "$(get_status "$R")"
R=$(api DELETE "/packaging/$PACKAGING_ID"); assert_status "DELETE packaging" "204" "$(get_status "$R")"
R=$(api DELETE "/recipes/$RECIPE_ID"); assert_status "DELETE recipe" "204" "$(get_status "$R")"
R=$(api DELETE "/products/$PRODUCT_ID"); assert_status "DELETE product 1" "204" "$(get_status "$R")"
R=$(api DELETE "/products/$PRODUCT2_ID"); assert_status "DELETE product 2" "204" "$(get_status "$R")"
R=$(api DELETE "/finance/$FINANCE_ID"); assert_status "DELETE finance entry" "204" "$(get_status "$R")"
R=$(api DELETE "/clients/$CLIENT_ID"); assert_status "DELETE client" "204" "$(get_status "$R")"

# --- Summary ---
bold ""
bold "=== RESULTADO ==="
echo "Total: $TOTAL | $(green "Pass: $PASS") | $(red "Fail: $FAIL")"

if [ "$FAIL" -gt 0 ]; then
  red "Alguns testes falharam!"
  exit 1
else
  green "Todos os testes passaram!"
  exit 0
fi
