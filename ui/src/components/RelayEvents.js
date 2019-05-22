import React from 'react'
import { inject, observer } from 'mobx-react'
import { EventsListHeader } from './index'
import { Event } from './index'
import yn from './utils/yn'
import { Redirect } from 'react-router'

const WAIT_INTERVAL = 700
const ENTER_KEY = 13

@inject('RootStore')
@observer
export class RelayEvents extends React.Component {
  constructor(props) {
    super(props)
    this.timer = null
    this.colors = {
      UserRequestForSignature: 'green',
      RelayedMessage: 'green',
      UserRequestForAffirmation: 'red',
      AffirmationCompleted: 'red',
      SignedForUserRequest: 'purple',
      SignedForAffirmation: 'purple',
      CollectedSignatures: 'blue'
    }
    this.homeValue = '0'
    this.foreingValue = '1'
    this.state = {
      selectedList: '0'
    }
  }

  onHomeBlockFilter = async value => {
    const { alertStore, homeStore, foreignStore } = this.props.RootStore
    alertStore.setLoading(true)
    if (value.substr(0, 2) === '0x') {
      homeStore.setFilter(true)
      foreignStore.setFilter(true)
      await homeStore.filterByTxHash(value)
    } else {
      if (Number(value) > 0) {
        homeStore.setFilter(true)
        foreignStore.setFilter(true)
        await homeStore.setBlockFilter(value)
      } else {
        foreignStore.setBlockFilter(0)
        homeStore.setBlockFilter(0)
        homeStore.setFilter(false)
        foreignStore.setFilter(false)
      }
    }
    alertStore.setLoading(false)
  }

  onForeignBlockFilter = async value => {
    const { alertStore, homeStore, foreignStore } = this.props.RootStore
    alertStore.setLoading(true)
    if (value.substr(0, 2) === '0x') {
      homeStore.setFilter(true)
      foreignStore.setFilter(true)
      await foreignStore.filterByTxHash(value)
    } else {
      if (Number(value) > 0) {
        homeStore.setFilter(true)
        foreignStore.setFilter(true)
        await foreignStore.setBlockFilter(value)
      } else {
        foreignStore.setBlockFilter(0)
        homeStore.setBlockFilter(0)
        homeStore.setFilter(false)
        foreignStore.setFilter(false)
      }
    }
    alertStore.setLoading(false)
  }

  handleChangeHome = async e => {
    const value = e.target.value
    window.clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.onHomeBlockFilter(value)
    }, WAIT_INTERVAL)
  }

  handleChangeForeign = async e => {
    const value = e.target.value
    window.clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.onForeignBlockFilter(value)
    }, WAIT_INTERVAL)
  }

  handleKeyDownHome = e => {
    const value = e.target.value
    window.clearTimeout(this.timer)
    if (e.keyCode === ENTER_KEY && value) {
      this.onHomeBlockFilter(value)
    }
  }

  handleKeyDownForeign = e => {
    const value = e.target.value
    window.clearTimeout(this.timer)
    if (e.keyCode === ENTER_KEY && value) {
      this.onForeignBlockFilter(value)
    }
  }

  getHomeEvents = homeStore => {
    return homeStore.events
      .slice()
      .map(({ event, transactionHash, blockNumber, returnValues }) => ({
        color: this.colors[event],
        eventName: event,
        transactionHash,
        recipient: returnValues.recipient,
        value: returnValues.value,
        blockNumber
      }))
  }

  getForeignEvents = foreignStore => {
    return foreignStore.events
      .slice()
      .map(({ event, transactionHash, signedTxHash, blockNumber, returnValues }) => {
        return {
          color: this.colors[event],
          eventName: event,
          transactionHash,
          recipient: returnValues.recipient,
          value: returnValues.value,
          blockNumber
        }
      })
  }

  onChangeList = e => {
    this.setState({ selectedList: e.target.value })
  }

  render() {
    const { homeStore, foreignStore, web3Store } = this.props.RootStore
    const { selectedList } = this.state
    const home = this.getHomeEvents(homeStore, foreignStore)
    const foreign = this.getForeignEvents(foreignStore, homeStore)
    const {
      REACT_APP_HOME_WITHOUT_EVENTS: HOME,
      REACT_APP_FOREIGN_WITHOUT_EVENTS: FOREIGN
    } = process.env
    const withoutEvents =
      web3Store.metamaskNet.id === web3Store.homeNet.id.toString() ? yn(HOME) : yn(FOREIGN)

    return withoutEvents ? (
      <Redirect to="/" />
    ) : (
      <div className="events-page">
        <div className="events-container">
          <EventsListHeader
            handleChange={
              selectedList === this.homeValue ? this.handleChangeHome : this.handleChangeForeign
            }
            handleKeyDown={
              selectedList === this.homeValue ? this.handleKeyDownHome : this.handleKeyDownForeign
            }
            onChangeList={this.onChangeList}
            selected={selectedList}
            homeName={homeStore.networkName}
            homeValue={this.homeValue}
            foreignName={foreignStore.networkName}
            foreignValue={this.foreingValue}
          />
          {selectedList === this.homeValue &&
            home.map(event => (
              <Event
                txUrl={homeStore.getExplorerTxUrl(event.transactionHash)}
                accountUrl={homeStore.getExplorerAddressUrl(event.recipient)}
                key={event.transactionHash + event.eventName}
                {...event}
              />
            ))}
          {selectedList === this.foreingValue &&
            foreign.map(event => (
              <Event
                txUrl={foreignStore.getExplorerTxUrl(event.transactionHash)}
                accountUrl={foreignStore.getExplorerAddressUrl(event.recipient)}
                key={event.transactionHash + event.eventName}
                {...event}
              />
            ))}
        </div>
      </div>
    )
  }
}
