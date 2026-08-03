#!/bin/bash
cd services/backend-api && npm run start:dev &
BACKEND_PID=$!
cd apps/customer-web && npm run dev -- --port 3001 &
CUSTOMER_PID=$!
cd apps/chief-web && npm run dev -- --port 3002 &
CHIEF_PID=$!
cd apps/admin-web && npm run dev -- --port 3003 &
ADMIN_PID=$!

echo "Waiting for servers to boot..."
sleep 15

cd ../..
npx playwright test

kill $BACKEND_PID $CUSTOMER_PID $CHIEF_PID $ADMIN_PID
