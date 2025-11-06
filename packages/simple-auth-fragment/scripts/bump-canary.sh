#!/bin/bash

set -ex

pnpm add @fragno-dev/db@canary \
         @fragno-dev/core@canary

pnpm add -D @fragno-dev/test@canary \
            @fragno-dev/cli@canary
