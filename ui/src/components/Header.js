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
  render() {
    const {
      showMobileMenu,
      onMenuToggle,
      RootStore: { alertStore, web3Store }
    } = this.props
    const {
      REACT_APP_HOME_WITHOUT_EVENTS: HOME,
      REACT_APP_FOREIGN_WITHOUT_EVENTS: FOREIGN
    } = process.env
    const withoutEvents =
      web3Store.metamaskNet.id === web3Store.homeNet.id.toString() ? yn(HOME) : yn(FOREIGN)

    return (
      <header className="header">
        {showMobileMenu ? (
          <MobileMenu withoutEvents={withoutEvents} onMenuToggle={onMenuToggle} />
        ) : null}
        <div className="container">
          <Link to="/" onClick={showMobileMenu ? onMenuToggle : null} className="header-logo" />
          <HeaderMenu withoutEvents={withoutEvents} onMenuToggle={onMenuToggle} />
          <MobileMenuButton onMenuToggle={onMenuToggle} showMobileMenu={showMobileMenu} />
        </div>
        {alertStore && alertStore.showDailyQuotaInfo && <DailyQuotaModal />}
      </header>
    )
  }
}
