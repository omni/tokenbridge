import React from 'react'
import swal from 'sweetalert'
import { inject, observer } from 'mobx-react'

@inject('RootStore')
@observer
export class SweetAlert extends React.Component {
  componentWillReact() {
    const { alertStore } = this.props.RootStore
    if (alertStore.alerts.length > 0) {
      const alert = alertStore.alerts.slice()[0]
      swal(alert).then(() => {
        alertStore.remove(alert)
      })
    }
  }

  logErrors() {
    const { alertStore } = this.props.RootStore
    const errors = alertStore.alerts.filter(alert => alert.type === 'error')
    if (errors.length) {
      console.log('Found errors:', errors.length)
    }
  }

  render() {
    this.logErrors()
    return <div style={{ display: 'none' }} />
  }
}
