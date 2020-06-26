import React, { useState } from 'react'
import { Button } from './commons/Button'
import { RadioButtonLabel, RadioButtonContainer } from './commons/RadioButton'
import { useWindowWidth } from '@react-hook/window-size'
import { formatTxHashExtended } from '../utils/networks'
import { MessageObject } from '../utils/web3'

export interface MessageSelectorParams {
  messages: Array<MessageObject>
  onMessageSelected: (index: number) => void
}

export const MessageSelector = ({ messages, onMessageSelected }: MessageSelectorParams) => {
  const [messageIndex, setMessageIndex] = useState(0)
  const windowWidth = useWindowWidth()

  const onSelect = () => {
    onMessageSelected(messageIndex)
  }

  return (
    <div className="row is-center">
      <div className="col-7-lg col-12 is-marginless">
        {messages.map((message, i) => (
          <RadioButtonContainer className="row is-center is-vertical-align" key={i} onClick={() => setMessageIndex(i)}>
            <input
              className="is-marginless"
              type="radio"
              name="message"
              value={i}
              checked={i === messageIndex}
              onChange={() => setMessageIndex(i)}
            />
            <RadioButtonLabel htmlFor={i.toString()}>
              {windowWidth < 700 ? formatTxHashExtended(message.id) : message.id}
            </RadioButtonLabel>
          </RadioButtonContainer>
        ))}
      </div>
      <div className="col-1-lg col-12 is-marginless">
        <Button className="button outline" onClick={onSelect}>
          Select
        </Button>
      </div>
    </div>
  )
}
