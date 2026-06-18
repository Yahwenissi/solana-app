#!/usr/bin/env bash
# SolanaChat Protocol — Integration Test Runner
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
PROGRAM_DIR="$PROJECT_DIR/programs/solanachat-protocol"
DEPLOY_DIR="$PROGRAM_DIR/target/deploy"
LOG_DIR="$PROJECT_DIR/target"
VALIDATOR_LOG="$LOG_DIR/validator.log"

# ── Config ────────────────────────────────────
SBF_ARCH="${1:-v0}"          # default to v0 for local testing
PROGRAM_SO="$DEPLOY_DIR/solanachat_protocol.so"
PROGRAM_KEY="$DEPLOY_DIR/solanachat_protocol-keypair.json"

mkdir -p "$LOG_DIR" "$DEPLOY_DIR"

# ── Build ─────────────────────────────────────
echo "==> Building for SBF $SBF_ARCH..."
(cd "$PROGRAM_DIR" && cargo build-sbf --optimize-size --arch "$SBF_ARCH")

echo "==> Program: $(solana-keygen pubkey "$PROGRAM_KEY")"
echo "==> .so size: $(wc -c < "$PROGRAM_SO") bytes"

# ── Start Validator ───────────────────────────
echo "==> Starting solana-test-validator..."
solana-test-validator \
  --reset \
  --quiet \
  --bpf-program "$(solana-keygen pubkey "$PROGRAM_KEY")" "$PROGRAM_SO" \
  > "$VALIDATOR_LOG" 2>&1 &
VALIDATOR_PID=$!

# Wait for validator
for i in $(seq 1 30); do
  if solana config get --url http://127.0.0.1:8899 &>/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# ── Run Tests ─────────────────────────────────
echo "==> Running tests..."
set +e
(cd "$PROJECT_DIR/../.." && npx tsx "$PROJECT_DIR/tests/solanachat.test.ts")
EXIT_CODE=$?
set -e

# ── Cleanup ───────────────────────────────────
echo "==> Stopping validator (PID $VALIDATOR_PID)..."
kill "$VALIDATOR_PID" 2>/dev/null || true
wait "$VALIDATOR_PID" 2>/dev/null || true

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "=== Last 30 lines of validator log ==="
  tail -30 "$VALIDATOR_LOG"
  echo "========================================"
fi

exit $EXIT_CODE
