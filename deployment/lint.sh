#!/bin/bash
cd $(dirname $0)
ansible-lint -v -t idempotency ./oracle/roles/**
