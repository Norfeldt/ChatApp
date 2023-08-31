#!/bin/bash

printf "checking for gitignore files: "
set -e

if [ ! -f "android/app/google-services.json" ]; then
  echo "Error: google-services.json not found"
  exit 1
fi

if [ ! -f "ios/GoogleService-Info.plist" ]; then
  echo "Error: GoogleService-Info.plist not found"
  exit 1
fi

if [ ! -f ".env" ]; then
  echo "Error: .env file not found"
  exit 1
fi

echo "✅"