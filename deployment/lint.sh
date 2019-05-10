#!/bin/bash
cd $(dirname $0)
ansible-lint -t idempotency ./oracle/roles/**
