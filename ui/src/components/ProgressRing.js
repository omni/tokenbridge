import React, { Component } from 'react'

export class ProgressRing extends Component {
  state = {
    normalizedRadius: this.props.radius - this.props.stroke * 2,
    circumference: (this.props.radius - this.props.stroke * 2) * 2 * Math.PI
  }

  render() {
    const {
      radius,
      stroke,
      progress,
      confirmationNumber,
      requiredBlockConfirmations,
      hideConfirmationNumber
    } = this.props
    const { REACT_APP_UI_STYLES } = process.env
    const { circumference, normalizedRadius } = this.state
    const strokeDashoffset = circumference - (progress / 100) * circumference
    const confirmations = hideConfirmationNumber ? '' : `${confirmationNumber}/${requiredBlockConfirmations}`
    const strokeColor = REACT_APP_UI_STYLES === 'stake' ? '#E6ECF1' : '#7b5ab2'
    const strokeProgressColor = REACT_APP_UI_STYLES === 'stake' ? '#4DA9A6' : '#60dc97'

    let textParams
    if (REACT_APP_UI_STYLES === 'stake') {
      const xPosTextParam =
        requiredBlockConfirmations >= 10 && confirmationNumber >= 10
          ? '15'
          : requiredBlockConfirmations >= 10
            ? '20'
            : '22'
      textParams = { x: xPosTextParam, y: '38', font: 'Roboto', fontSize: '14', fill: '#242A31' }
    } else {
      const xPosTextParam =
        requiredBlockConfirmations >= 10 && confirmationNumber >= 10
          ? '16'
          : requiredBlockConfirmations >= 10
            ? '22'
            : '28'
      textParams = { x: xPosTextParam, y: '47', font: 'Nunito', fontSize: '18', fill: 'white' }
    }

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
