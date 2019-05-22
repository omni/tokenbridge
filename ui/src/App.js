import React from 'react'
import {
  Header,
  Bridge,
  RelayEvents,
  Footer,
  SweetAlert,
  Loading,
  StatusPage,
  StatisticsPage
} from './components'
import { Route } from 'react-router-dom'
import './assets/stylesheets/application.css'
import { Disclaimer } from './components'
import { ModalContainer } from './components'
import { NoWallet } from './components'
import { setItem, getItem, DISCLAIMER_KEY } from './components/utils/localstorage'

export class App extends React.Component {
  state = {
    showDisclaimer: false,
    showMobileMenu: false
  }

  componentDidMount() {
    const disclaimerDisplayed = getItem(DISCLAIMER_KEY)

    if (!disclaimerDisplayed) {
      this.setState({ showDisclaimer: true })
    }
  }

  closeDisclaimer = () => {
    setItem(DISCLAIMER_KEY, true)
    this.setState({ showDisclaimer: false })
  }

  toggleMobileMenu = () => {
    this.setState(prevState => ({ showMobileMenu: !prevState.showMobileMenu }))
  }

  render() {
    const { showDisclaimer, showMobileMenu } = this.state
    return (
      <div className={showMobileMenu ? 'mobile-menu-is-open' : ''}>
        <Route component={Loading} />
        <Route component={SweetAlert} />
        <Route
          render={() => (
            <Header onMenuToggle={this.toggleMobileMenu} showMobileMenu={showMobileMenu} />
          )}
        />
        <div className="app-container">
          {showMobileMenu && <Route render={() => <div className="mobile-menu-open" />} />}
          <Route exact path="/" component={Bridge} />
          <Route exact path="/events" component={RelayEvents} />
          <Route exact path="/status" component={StatusPage} />
          <Route exact path="/statistics" component={StatisticsPage} />
        </div>
        <Route component={Footer} />
        <ModalContainer showModal={showDisclaimer}>
          <Disclaimer onConfirmation={this.closeDisclaimer} />
        </ModalContainer>
        <NoWallet showModal={!showDisclaimer} />
      </div>
    )
  }
}
