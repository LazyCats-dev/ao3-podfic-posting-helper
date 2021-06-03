#!/bin/bash

set -o errexit

python3 firefox-extension/update-manifest.py
cd chrome-extension
rm -f ao3-podfic-posting-helper.zip
zip -r ao3-podfic-posting-helper.zip . -x "*.DS_Store"
