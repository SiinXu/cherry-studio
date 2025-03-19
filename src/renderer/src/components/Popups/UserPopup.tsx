import DefaultAvatar from '@renderer/assets/images/avatar.png'
import useAvatar from '@renderer/hooks/useAvatar'
import { useSettings } from '@renderer/hooks/useSettings'
import ImageStorage from '@renderer/services/ImageStorage'
import { useAppDispatch } from '@renderer/store'
import { setAvatar } from '@renderer/store/runtime'
import { setUserName } from '@renderer/store/settings'
import { compressImage, isEmoji } from '@renderer/utils'
import { Avatar, Dropdown, Input, Modal, Popover, Upload } from 'antd'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import EmojiPicker from '../EmojiPicker'
import { Center, HStack, VStack } from '../Layout'
import { GradientText, SplitText, SpotlightCard } from '../ReactBits'
import { TopView } from '../TopView'

interface Props {
  resolve: (data: any) => void
}

const PopupContainer: React.FC<Props> = ({ resolve }) => {
  const [open, setOpen] = useState(true)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { t } = useTranslation()
  const { userName } = useSettings()
  const dispatch = useAppDispatch()
  const avatar = useAvatar()

  const onOk = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onClose = () => {
    resolve({})
  }

  const handleEmojiClick = async (emoji: string) => {
    try {
      // set emoji string
      await ImageStorage.set('avatar', emoji)
      // update avatar display
      dispatch(setAvatar(emoji))
      setEmojiPickerOpen(false)
    } catch (error: any) {
      window.message.error(error.message)
    }
  }
  const handleReset = async () => {
    try {
      await ImageStorage.set('avatar', DefaultAvatar)
      dispatch(setAvatar(DefaultAvatar))
      setDropdownOpen(false)
    } catch (error: any) {
      window.message.error(error.message)
    }
  }
  const items = [
    {
      key: 'upload',
      label: (
        <div style={{ width: '100%', textAlign: 'center' }}>
          <Upload
            customRequest={() => {}}
            accept="image/png, image/jpeg, image/gif"
            itemRender={() => null}
            maxCount={1}
            onChange={async ({ file }) => {
              try {
                const _file = file.originFileObj as File
                if (_file.type === 'image/gif') {
                  await ImageStorage.set('avatar', _file)
                } else {
                  const compressedFile = await compressImage(_file)
                  await ImageStorage.set('avatar', compressedFile)
                }
                dispatch(setAvatar(await ImageStorage.get('avatar')))
                setDropdownOpen(false)
              } catch (error: any) {
                window.message.error(error.message)
              }
            }}>
            {t('settings.general.image_upload')}
          </Upload>
        </div>
      )
    },
    {
      key: 'emoji',
      label: (
        <div
          style={{ width: '100%', textAlign: 'center' }}
          onClick={(e) => {
            e.stopPropagation()
            setEmojiPickerOpen(true)
            setDropdownOpen(false)
          }}>
          {t('settings.general.emoji_picker')}
        </div>
      )
    },
    {
      key: 'reset',
      label: (
        <div
          style={{ width: '100%', textAlign: 'center' }}
          onClick={(e) => {
            e.stopPropagation()
            handleReset()
          }}>
          {t('settings.general.avatar.reset')}
        </div>
      )
    }
  ]

  return (
    <Container>
      <Modal
        width={350}
        open={open}
        footer={null}
        onOk={onOk}
        onCancel={onCancel}
        afterClose={onClose}
        transitionName="ant-move-down"
        centered>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <SpotlightCard
            spotlightColor="rgba(82, 190, 255, 0.2)"
            spotlightSize={150}
            hoverScale={1.03}
            animationDuration={0.4}
            initialAnimation={true}
            onClick={() => {}}>
            <Center mt="20px">
              <VStack alignItems="center" gap="10px">
                <GradientText colors={['#4079ff', '#40c8ff', '#40ffaa']} animationSpeed={10} className="user-title">
                  <SplitText animationType="fade" delay={0.1} duration={0.6}>
                    {t('settings.general.user_settings')}
                  </SplitText>
                </GradientText>

                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                  <Dropdown
                    menu={{ items }}
                    trigger={['click']}
                    open={dropdownOpen}
                    align={{ offset: [0, 4] }}
                    placement="bottom"
                    onOpenChange={(visible) => {
                      setDropdownOpen(visible)
                      if (visible) {
                        setEmojiPickerOpen(false)
                      }
                    }}>
                    <Popover
                      content={<EmojiPicker onEmojiClick={handleEmojiClick} />}
                      trigger="click"
                      open={emojiPickerOpen}
                      onOpenChange={(visible) => {
                        setEmojiPickerOpen(visible)
                        if (visible) {
                          setDropdownOpen(false)
                        }
                      }}
                      placement="bottom">
                      {isEmoji(avatar) ? <EmojiAvatar>{avatar}</EmojiAvatar> : <UserAvatar src={avatar} />}
                    </Popover>
                  </Dropdown>
                </motion.div>
              </VStack>
            </Center>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}>
              <HStack alignItems="center" gap="10px" p="20px" pb="30px">
                <Input
                  placeholder={t('settings.general.user_name.placeholder')}
                  value={userName}
                  onChange={(e) => dispatch(setUserName(e.target.value.trim()))}
                  style={{ flex: 1, textAlign: 'center', width: '100%' }}
                  maxLength={30}
                  className="styled-input"
                />
              </HStack>
            </motion.div>
          </SpotlightCard>
        </motion.div>
      </Modal>
    </Container>
  )
}

const UserAvatar = styled(Avatar)`
  cursor: pointer;
  width: 85px;
  height: 85px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: 2px solid transparent;
  overflow: hidden;
  position: relative;
  z-index: 1;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.15) 100%);
    z-index: 2;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    border-color: #4079ff;
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 12px 24px rgba(64, 121, 255, 0.2);

    &::after {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  }
`

const EmojiAvatar = styled.div`
  cursor: pointer;
  width: 85px;
  height: 85px;
  border-radius: 22%;
  background-color: var(--color-background-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(64, 121, 255, 0.3), transparent);
    transform: rotate(45deg);
    transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    opacity: 0;
    z-index: 1;
  }

  &:hover {
    border-color: #4079ff;
    background-color: var(--color-background);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);

    &::before {
      opacity: 1;
      transform: translateX(60%) translateY(60%) rotate(45deg);
      filter: blur(2px);
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  }
`

const Container = styled.div`
  .user-title {
    margin: 5px 0 15px 0;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  .styled-input {
    border-radius: 10px;
    padding: 10px 16px;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    font-size: 15px;

    &:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &:focus {
      background: rgba(255, 255, 255, 1);
      box-shadow: 0 0 0 2px rgba(64, 121, 255, 0.2);
      border-color: rgba(64, 121, 255, 0.3);
    }
  }

  .ant-popover-inner {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }
`

export default class UserPopup {
  static topviewId = 0
  static hide() {
    TopView.hide('UserPopup')
  }
  static show() {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          resolve={(v) => {
            resolve(v)
            this.hide()
          }}
        />,
        'UserPopup'
      )
    })
  }
}
