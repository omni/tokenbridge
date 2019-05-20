FROM parity/parity:v2.3.3

WORKDIR /stuff

COPY . .

CMD ["--chain", "chain-foreign.json", "--network-id", "42", "--jsonrpc-apis", "all", "--jsonrpc-interface", "all", "--jsonrpc-cors", "all", "--jsonrpc-hosts", "all"]
