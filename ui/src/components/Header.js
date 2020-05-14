import React from 'react'
import yn from './utils/yn'
import { DailyQuotaModal } from './DailyQuotaModal'
import { HeaderMenu } from './HeaderMenu'
import { Link } from 'react-router-dom'
import { MobileMenu } from './MobileMenu'
import { MobileMenuButton } from './MobileMenuButton'
import { inject, observer } from 'mobx-react/index'
import { isMediatorMode } from 'commons'

@inject('RootStore')
@observer
export class Header extends React.Component {
  render() {
    const {
      showMobileMenu,
      onMenuToggle,
      RootStore: { alertStore, web3Store, bridgeMode }
    } = this.props
    const { REACT_APP_UI_HOME_WITHOUT_EVENTS: HOME, REACT_APP_UI_FOREIGN_WITHOUT_EVENTS: FOREIGN, REACT_APP_UI_STYLES } = process.env
    const withoutEvents = web3Store.isSelectedNetwork(web3Store.homeNet.id) ? yn(HOME) : yn(FOREIGN)
    const displayEventsTab = !isMediatorMode(bridgeMode)

    return (
      <header className={`header header-${REACT_APP_UI_STYLES}`}>
        {showMobileMenu ? <MobileMenu withoutEvents={withoutEvents} onMenuToggle={onMenuToggle} /> : null}
        <div className="container">
          <Link to="/" onClick={showMobileMenu ? onMenuToggle : null} className="header-logo" />
          <HeaderMenu withoutEvents={withoutEvents} onMenuToggle={onMenuToggle} displayEventsTab={displayEventsTab} />
          <MobileMenuButton onMenuToggle={onMenuToggle} showMobileMenu={showMobileMenu} />
        </div>
        {alertStore && alertStore.showDailyQuotaInfo && <DailyQuotaModal />}
      </header>
    )
  }
}
