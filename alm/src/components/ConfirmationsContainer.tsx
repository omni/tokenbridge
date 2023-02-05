import React, { useEffect, useState } from 'react'
import { TransactionReceipt } from 'web3-eth'
import { useMessageConfirmations } from '../hooks/useMessageConfirmations'
import { MessageObject } from '../utils/web3'
import styled from 'styled-components'
import { CONFIRMATIONS_STATUS, VALIDATOR_CONFIRMATION_STATUS } from '../config/constants'
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

const StatusWrapper = styled.div<{ status: string} >`
  text-align: center;
  background: rgb(255 239 209);
  padding: 8px 18px;
  border-radius: 5px;
  margin-bottom: 4px;
  display: inline-block;
  ${({status}) => {
    if (status === 'Success') {
      return 'background: rgb(191 237 205);'
    }
    if (status === 'Execution failed') {
      return 'background: rgb(255 209 209);'
    }
  }}}
`

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
  padding-top: 0px;
`

const StatusSection = styled.div`
  font-size: 14px;
`;

const ToggleShow = styled.div`
  color: #ccc;
  cursor: pointer;
`;

const Toggled = styled.div<{ isHidden: boolean }>`
  display: ${({isHidden}) => isHidden ? 'none' : 'block'};
`;

export interface ConfirmationsContainerParams {
  message: MessageObject
  receipt: Maybe<TransactionReceipt>
  fromHome: boolean
  homeStartBlock: Maybe<number>
  foreignStartBlock: Maybe<number>
}

export const ConfirmationsContainer = ({
  message,
  receipt,
  fromHome,
  homeStartBlock,
  foreignStartBlock
}: ConfirmationsContainerParams) => {
  const {
    home: { name: homeName },
    foreign: { name: foreignName }
  } = useStateProvider()
  const src = useValidatorContract(fromHome, receipt ? receipt.blockNumber : 0)
  const [executionBlockNumber, setExecutionBlockNumber] = useState(0)
  const dst = useValidatorContract(!fromHome, executionBlockNumber || 'latest')
  const { blockConfirmations } = useBlockConfirmations({ fromHome, receipt })
  const [toggle, setToggle] = useState<boolean>(true)
  const {
    confirmations,
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
    homeStartBlock,
    foreignStartBlock,
    requiredSignatures: src.requiredSignatures,
    validatorList: src.validatorList,
    targetValidatorList: dst.validatorList,
    blockConfirmations
  })

  useEffect(
    () => {
      if (executionBlockNumber || executionData.status !== VALIDATOR_CONFIRMATION_STATUS.EXECUTION_SUCCESS) return

      setExecutionBlockNumber(executionData.blockNumber)
    },
    [executionData.status, executionBlockNumber, executionData.blockNumber]
  )

  const handleToggle = () => {
    setToggle(!toggle)
  }

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
      <StatusSection>
        {console.log('tiglle', toggle)}
        <ToggleShow onClick={handleToggle}>- {toggle ? 'Show' : 'Hide'} Details -</ToggleShow>
        <Toggled isHidden={toggle}>
          {description}
          <ValidatorsConfirmations
            confirmations={fromHome ? confirmations.filter(c => dst.validatorList.includes(c.validator)) : confirmations}
            requiredSignatures={dst.requiredSignatures}
            validatorList={dst.validatorList}
            waitingBlocksResolved={waitingBlocksResolved}
          />
        </Toggled>
      </StatusSection>
    )
  }

  return (
    <div className="row is-center">
      <StyledConfirmationContainer>
        <StatusWrapper status={status ? statusLabel[status] : ''}>
          <StatusLabel>Status:</StatusLabel>
          <StatusResultLabel data-id="status">
            {status !== CONFIRMATIONS_STATUS.UNDEFINED ? statusLabel[status] : <SimpleLoading />}
          </StatusResultLabel>
        </StatusWrapper>
        <StatusDescription className="row is-center">
          <MultiLine>
            {status !== CONFIRMATIONS_STATUS.UNDEFINED ? parseDescription() : ''}
          </MultiLine>
        </StatusDescription>
        {signatureCollected && (
          <ExecutionConfirmation
            message={message}
            executionData={executionData}
            isHome={!fromHome}
            confirmations={confirmations}
            setExecutionData={setExecutionData}
            executionEventsFetched={executionEventsFetched}
            setPendingExecution={setPendingExecution}
            dstRequiredSignatures={dst.requiredSignatures}
            dstValidatorList={dst.validatorList}
          />
        )}
      </StyledConfirmationContainer>
    </div>
  )
}
