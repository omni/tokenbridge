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
          <svg className={`nl-IconNetwork`} xmlns="http://www.w3.org/2000/svg" width="18" height="18">
            <path
              className={`nl-IconNetwork_Path`}
              d="M9 18a9 9 0 0 1-9-9 9 9 0 0 1 9-9 9 9 0 0 1 9 9 9 9 0 0 1-9 9zm6.923-8h-1.974c-.116 1.85-.525 3.539-1.167 4.876A6.993 6.993 0 0 0 15.923 10zM9 16c1.51 0 2.747-2.612 2.957-6H6.043c.21 3.388 1.447 6 2.957 6zm-3.782-1.124C4.576 13.539 4.167 11.85 4.051 10H2.077a6.993 6.993 0 0 0 3.141 4.876zM2.077 8h1.974c.116-1.85.525-3.538 1.167-4.876A6.993 6.993 0 0 0 2.077 8zM9 2C7.49 2 6.253 4.612 6.043 8h5.914C11.747 4.612 10.51 2 9 2zm3.782 1.124C13.424 4.462 13.833 6.15 13.949 8h1.974a6.993 6.993 0 0 0-3.141-4.876z"
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
