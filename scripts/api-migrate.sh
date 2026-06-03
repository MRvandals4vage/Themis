#!/usr/bin/env sh
set -eu
cd apps/api
alembic upgrade head
