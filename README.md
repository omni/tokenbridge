[![CircleCI](https://circleci.com/gh/poanetwork/tokenbridge.svg?style=svg)](https://circleci.com/gh/poanetwork/tokenbridge)
[![Gitter](https://badges.gitter.im/poanetwork/poa-bridge.svg)](https://gitter.im/poanetwork/poa-bridge?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License: LGPL v3.0](https://img.shields.io/badge/License-LGPL%20v3-blue.svg)](https://www.gnu.org/licenses/lgpl-3.0)

# Tokenbridge
Monorepository for the token bridge.

## Structure

Sub-repositories maintained within this monorepo are listed below.

| Sub-repository | Description |
| --- | --- |
| [oracle](oracle/README.md) | Oracle responsible for listening to bridge related events and authorizing asset transfers |

## Building, running, linting & tests

To install dependencies:

`yarn install`

Running linter for all JS projects:

`yarn lint`

Running linter for all Ansible playbooks:

- [ansible-lint](https://github.com/ansible/ansible-lint) is required

`yarn ansible-lint`

Running run tests for all projects:

`yarn test`

For details on building, running and developing please refer to respective READMEs in sub-repositories.

## Contributing

See the [CONTRIBUTING](CONTRIBUTING.md) document for contribution, testing and pull request protocol.

## License

This project is licensed under the GNU Lesser General Public License v3.0. See the [LICENSE](LICENSE) file for details.

## References

* [Additional Documentation](https://forum.poa.network/c/tokenbridge)
* [POA Bridge FAQ](https://poanet.zendesk.com/hc/en-us/categories/360000349273-POA-Bridge)
