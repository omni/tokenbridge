import React from 'react'
import yn from './utils/yn'
import { DailyQuotaModal } from './DailyQuotaModal'
import { HeaderMenu } from './HeaderMenu'
import { Link } from 'react-router-dom'
import { MobileMenu } from './MobileMenu'
import { MobileMenuButton } from './MobileMenuButton'
import { inject, observer } from 'mobx-react/index'

@inject('RootStore')
@observer
export class Header extends React.Component {
  state = {
    selected: '/'
  }

  componentDidMount() {
    this.setState({ selected: window.location.pathname })
  }

  changeSelectedMenuMobile = newSelected => {
    const { onMenuToggle } = this.props
    this.changeSelectedMenu(newSelected)
    onMenuToggle()
  }

  changeSelectedMenu = newSelected => {
    if (newSelected !== this.state.selected) {
      this.setState({ selected: newSelected })
    }
  }

  render() {
    const {
      showMobileMenu,
      onMenuToggle,
      RootStore: { alertStore, web3Store }
    } = this.props
    const { selected } = this.state
    const {
      REACT_APP_UI_HOME_WITHOUT_EVENTS: HOME,
      REACT_APP_UI_FOREIGN_WITHOUT_EVENTS: FOREIGN,
      REACT_APP_UI_STYLES
    } = process.env
    const withoutEvents = web3Store.isSelectedNetwork(web3Store.homeNet.id) ? yn(HOME) : yn(FOREIGN)
    const displayEventsTab = REACT_APP_UI_STYLES !== 'stake'

    return (
      <header className={`header header-${REACT_APP_UI_STYLES}`}>
        {showMobileMenu ? (
          <MobileMenu selected={selected} withoutEvents={withoutEvents} onMenuToggle={this.changeSelectedMenuMobile} />
        ) : null}
        <div className="container">
          <Link
            to="/"
            onClick={showMobileMenu ? onMenuToggle : () => this.changeSelectedMenu('/')}
            className="header-pumapay-logo"
          />
          <HeaderMenu
            selected={selected}
            withoutEvents={withoutEvents}
            onMenuToggle={this.changeSelectedMenu}
            displayEventsTab={displayEventsTab}
          />
          <MobileMenuButton onMenuToggle={onMenuToggle} showMobileMenu={showMobileMenu} />
        </div>
        {alertStore && alertStore.showDailyQuotaInfo && <DailyQuotaModal />}
      </header>
    )
  }
}
