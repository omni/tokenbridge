#!/bin/bash
cd $(dirname $0)
ansible-lint ./oracle/roles/**
