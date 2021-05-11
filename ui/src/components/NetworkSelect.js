import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'

@inject('RootStore')
@observer
export default class NetworkSelect extends Component {
  state = {
    displayList: false
  }

  changeNetworkRPC = e => {
    const { web3Store } = this.props.RootStore
    const newNetworkName = e.target.innerHTML
    web3Store.setSelectedNetwork(newNetworkName)
    this.hideList()
  }

  displayList = () => {
    this.setState({ displayList: true })
  }

  hideList = () => {
    this.setState({ displayList: false })
  }

  render() {
    const { web3Store } = this.props.RootStore
    const { displayList } = this.state
    let currentNetworkFullName = ''

    const networks = web3Store.homeNet.id && web3Store.foreignNet.id ? [web3Store.homeNet, web3Store.foreignNet] : []
    let selectedNetworkIndex = -1

    networks.forEach((network, i) => {
      if (web3Store.isSelectedNetwork(network.id)) {
        currentNetworkFullName = network.name
        selectedNetworkIndex = i
      }
    })

    if (selectedNetworkIndex === -1) {
      selectedNetworkIndex = 0
      currentNetworkFullName = networks[0] ? networks[0].name : ''
    }

    const listItems = networks.map((network, index) => {
      let className = ''
      if (index === selectedNetworkIndex) {
        className = 'currentNetwork'
      }
      return (
        <li key={network.name} className={className}>
          <button onClick={e => this.changeNetworkRPC(e)}>{network.name}</button>
        </li>
      )
    })

    const displayListClass = displayList ? 'Show-NetworkSelect_List' : ''

    return (
      <div
        onMouseEnter={this.displayList}
        onMouseLeave={this.hideList}
        className={`NetworkSelect nl-NavigationLinks_Link opacityFull`}
      >
        <div className={`NetworkSelect_Top`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20.5714 11.1429C20.5714 15.8767 16.7339 19.7143 12 19.7143M20.5714 11.1429C20.5714 6.40899 16.7339 2.57143 12 2.57143M20.5714 11.1429H3.42857M12 19.7143C7.26613 19.7143 3.42857 15.8767 3.42857 11.1429M12 19.7143C14.144 17.3671 15.3624 14.3211 15.4286 11.1429C15.3624 7.9646 14.144 4.91859 12 2.57143M12 19.7143C9.85605 17.3671 8.63764 14.3211 8.57143 11.1429C8.63764 7.9646 9.85605 4.91859 12 2.57143M3.42857 11.1429C3.42857 6.40899 7.26613 2.57143 12 2.57143"
              stroke="#677294"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span className={`nl-NavigationLinks_Text`}>{currentNetworkFullName}</span>
          <svg className={`nl-IconNetwork_Arrow`} xmlns="http://www.w3.org/2000/svg" width="8" height="4">
            <path d="M0 0h8L4 4 0 0z" />
          </svg>
        </div>
        <ul className={`NetworkSelect_List  ${displayListClass}`}>{listItems}</ul>
      </div>
    )
  }
}
