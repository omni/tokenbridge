#!/bin/bash
cd $(dirname $0)
ansible-lint -v -t bug ./oracle/roles/**
