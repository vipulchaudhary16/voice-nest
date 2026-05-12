#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="development"

for arg in "$@"; do
  case "$arg" in
    --env=*)
      ENVIRONMENT="${arg#*=}"
      ;;
  esac
done

case "$ENVIRONMENT" in
  development|dev|staging|prod|production)
    ;;
  *)
    echo "Invalid env: $ENVIRONMENT"
    echo "Use one of: development, staging, prod"
    exit 1
    ;;
esac

flutter run --dart-define=ENV="$ENVIRONMENT"
