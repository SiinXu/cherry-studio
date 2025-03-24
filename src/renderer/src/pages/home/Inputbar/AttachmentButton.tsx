import { FileAddOutlined } from '@ant-design/icons'
import { Button, Tooltip } from '../../../../../../components'
import { isVisionModel } from '@renderer/config/models'
import { useRuntime } from '@renderer/hooks/useRuntime'
import type { FileType, Model } from '@renderer/types'
import { getFileExtension } from '@renderer/utils'
import { documentExts, imageExts, textExts } from '@shared/config/constant'
import { FC, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  model?: Model
  files?: FileType[]
  setFiles: (files: FileType[]) => void
  supportExts?: string[]
  disabled?: boolean
  buttonClass?: string
}

const AttachmentButton: FC<Props> = ({
  model,
  files = [],
  setFiles,
  supportExts = [...textExts, ...documentExts],
  disabled,
  buttonClass
}) => {
  const inputFileRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation()
  const { loading } = useRuntime()
  const supportsImages = model ? isVisionModel(model) : false

  const extensions = supportsImages ? [...supportExts, ...imageExts] : supportExts

  const onSelect = useCallback(() => {
    inputFileRef.current?.click()
  }, [])

  const onChangeFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = event.target.files
      if (!fileList) return

      const promises = []
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const extension = getFileExtension(file.name)
        if (extensions.includes(extension)) {
          promises.push(window.api.file.get(file.path))
        }
      }

      Promise.all(promises)
        .then((selectedFiles) => {
          const filtered = selectedFiles.filter(Boolean) as FileType[]
          setFiles([...files, ...filtered])
        })
        .catch(() => {})
        .finally(() => {
          if (inputFileRef.current) {
            inputFileRef.current.value = ''
          }
        })
    },
    [extensions, files, setFiles]
  )

  return (
    <Tooltip placement="top" title={t('chat.input.attachment')}>
      <Button
        className={buttonClass}
        type="text"
        onClick={onSelect}
        disabled={disabled || loading}
      >
        <FileAddOutlined />
        <input
          type="file"
          multiple
          ref={inputFileRef}
          style={{ display: 'none' }}
          onChange={onChangeFile}
          accept={extensions.map((ext) => `.${ext}`).join(',')}
        />
      </Button>
    </Tooltip>
  )
}

export default AttachmentButton
