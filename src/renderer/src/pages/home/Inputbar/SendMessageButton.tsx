import { FC } from 'react'
import { Button } from '../../../../../../components'
import { classNames } from '@renderer/utils'

interface Props {
  disabled: boolean
  sendMessage: () => void
  buttonClass?: string
}

const SendMessageButton: FC<Props> = ({ disabled, sendMessage, buttonClass = 'rb-inputbar-tool-btn' }) => {
  return (
    <Button
      className={classNames(buttonClass, { 'active': !disabled })}
      onClick={sendMessage}
      disabled={disabled}
      type="text"
    >
      <i
        className="iconfont icon-ic_send"
        style={{
          fontSize: 22
        }}
      />
    </Button>
  )
}

export default SendMessageButton
