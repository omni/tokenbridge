import React, { Component } from 'react'

export class PreventExit extends Component {
  onUnload = e => {
    e.returnValue = 'Are you sure?'
  }

  componentDidMount() {
    window.addEventListener('beforeunload', this.onUnload)
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.onUnload)
  }

  render() {
    return <div />
  }
}
