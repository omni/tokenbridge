import React, { Component } from 'react'

export class ProgressRing extends Component {
  state = {
    normalizedRadius: this.props.radius - this.props.stroke * 2,
    circumference: (this.props.radius - this.props.stroke * 2) * 2 * Math.PI
  }

  render() {
    const { radius, stroke, progress, confirmationNumber, hideConfirmationNumber } = this.props
    const { REACT_APP_UI_STYLES } = process.env
    const { circumference, normalizedRadius } = this.state
    const strokeDashoffset = circumference - (progress / 100) * circumference
    const confirmations = hideConfirmationNumber ? '' : `${confirmationNumber}/8`
    const strokeColor = REACT_APP_UI_STYLES === 'stake' ? '#E6ECF1' : '#7b5ab2'
    const strokeProgressColor = REACT_APP_UI_STYLES === 'stake' ? '#4DA9A6' : '#60dc97'
    const textParams =
      REACT_APP_UI_STYLES === 'stake'
        ? { x: '22', y: '38', font: 'Roboto', fontSize: '14', fill: '#242A31' }
        : { x: '28', y: '47', font: 'Nunito', fontSize: '18', fill: 'white' }
    const progressTransform = REACT_APP_UI_STYLES === 'stake' ? 'rotate(-90 33 33)' : ''

    return (
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset: 0 }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={strokeProgressColor}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={progressTransform}
        />
        <text
          x={textParams.x}
          y={textParams.y}
          fontFamily={textParams.font}
          fontSize={textParams.fontSize}
          fill={textParams.fill}
        >
          {confirmations}
        </text>
      </svg>
    )
  }
}
