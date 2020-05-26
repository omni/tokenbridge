#!/usr/bin/python3

from yaml import safe_load, safe_dump
from argparse import ArgumentParser
from os.path import basename
import sys

parser = ArgumentParser()
parser.add_argument('composefile', type=str, nargs=1, metavar='compose-file', help='docker-compose.yml')
parser.add_argument('-d', action='store_true', help='output result instead of writing the file', dest='debug')

if basename(sys.argv[0]) == "ipykernel_launcher.py":
    args = parser.parse_args(['docker-compose.yml'])
else:
    args = parser.parse_args()
    
file_to_operate = args.composefile[0]

with open(file_to_operate) as composefile:
    composecnt=composefile.read()
yml = safe_load(composecnt)
for i in yml['services']:
    yml['services'][i]['logging'] = {'driver': 'syslog','options': {'tag': '{{.Name}}/{{.ID}}'}}
if args.debug or (basename(sys.argv[0]) == "ipykernel_launcher.py"):
    print(safe_dump(yml))
else:
    with open(file_to_operate, 'w') as composefile:
        safe_dump(yml, composefile, explicit_start=True)