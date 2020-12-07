import React from 'react'
import { TransactionReceipt } from 'web3-eth'
import { useMessageConfirmations } from '../hooks/useMessageConfirmations'
import { MessageObject } from '../utils/web3'
import styled from 'styled-components'
import { CONFIRMATIONS_STATUS } from '../config/constants'
import { CONFIRMATIONS_STATUS_LABEL, CONFIRMATIONS_STATUS_LABEL_HOME } from '../config/descriptions'
import { SimpleLoading } from './commons/Loading'
import { ValidatorsConfirmations } from './ValidatorsConfirmations'
import { getConfirmationsStatusDescription } from '../utils/networks'
import { useStateProvider } from '../state/StateProvider'
import { ExecutionConfirmation } from './ExecutionConfirmation'
import { useValidatorContract } from '../hooks/useValidatorContract'
import { useBlockConfirmations } from '../hooks/useBlockConfirmations'
import { MultiLine } from './commons/MultiLine'
import { ExplorerTxLink } from './commons/ExplorerTxLink'

const StatusLabel = styled.label`
  font-weight: bold;
  font-size: 18px;
`

const StatusResultLabel = styled.label`
  font-size: 18px;
  padding-left: 10px;
`

const StyledConfirmationContainer = styled.div`
  background-color: var(--bg-color);
  padding: 10px;
  border-radius: 4px;
`

const StatusDescription = styled.div`
  padding-top: 10px;
`

export interface ConfirmationsContainerParams {
  message: MessageObject
  receipt: Maybe<TransactionReceipt>
  fromHome: boolean
  timestamp: number
}

export const ConfirmationsContainer = ({ message, receipt, fromHome, timestamp }: ConfirmationsContainerParams) => {
  const {
    home: { name: homeName, confirmations },
    foreign: { name: foreignName }
  } = useStateProvider()
  const { requiredSignatures, validatorList } = useValidatorContract({ fromHome, receipt })
  const { blockConfirmations } = useBlockConfirmations({ fromHome, receipt })
  const {
    status,
    executionData,
    signatureCollected,
    waitingBlocksResolved,
    setExecutionData,
    executionEventsFetched,
    setPendingExecution
  } = useMessageConfirmations({
    message,
    receipt,
    fromHome,
    timestamp,
    requiredSignatures,
    validatorList,
    blockConfirmations
  })

  const statusLabel = fromHome ? CONFIRMATIONS_STATUS_LABEL_HOME : CONFIRMATIONS_STATUS_LABEL

  const parseDescription = () => {
    let description = getConfirmationsStatusDescription(status, homeName, foreignName, fromHome)
    let link
    const descArray = description.split('%link')
    if (descArray.length > 1) {
      description = descArray[0]
      link = (
        <ExplorerTxLink href={descArray[1]} target="_blank" rel="noopener noreferrer">
          {descArray[1]}
        </ExplorerTxLink>
      )
    }

    return (
      <div>
        {description}
        {link}
      </div>
    )
  }

  return (
    <div className="row is-center">
      <StyledConfirmationContainer className="col-9">
        <div className="row is-center">
          <StatusLabel>Status:</StatusLabel>
          <StatusResultLabel data-id="status">
            {status !== CONFIRMATIONS_STATUS.UNDEFINED ? statusLabel[status] : <SimpleLoading />}
          </StatusResultLabel>
        </div>
        <StatusDescription className="row is-center">
          <MultiLine className="col-10">
            {status !== CONFIRMATIONS_STATUS.UNDEFINED ? parseDescription() : ''}
          </MultiLine>
        </StatusDescription>
        <ValidatorsConfirmations
          confirmations={confirmations}
          requiredSignatures={requiredSignatures}
          validatorList={validatorList}
          waitingBlocksResolved={waitingBlocksResolved}
        />
        {signatureCollected && (
          <ExecutionConfirmation
            messageData={message.data}
            executionData={executionData}
            isHome={!fromHome}
            requiredSignatures={requiredSignatures}
            setExecutionData={setExecutionData}
            executionEventsFetched={executionEventsFetched}
            setPendingExecution={setPendingExecution}
          />
        )}
      </StyledConfirmationContainer>
    </div>
  )
}
