import FileManager from '@renderer/services/FileManager'
import { FileType } from '@renderer/types'
import { Upload } from '../../../../../../components'
import { UploadFile } from 'antd'
import { isEmpty } from 'lodash'
import { FC } from 'react'
import './AttachmentPreview.css'

interface Props {
  files: FileType[]
  setFiles: (files: FileType[]) => void
}

const AttachmentPreview: FC<Props> = ({ files, setFiles }) => {
  if (isEmpty(files)) {
    return null
  }

  return (
    <div className="rb-attachment-preview">
      <Upload
        className="rb-attachment-upload"
        listType={files.length > 20 ? 'text' : 'picture-card'}
        fileList={files.map(
          (file) =>
            ({
              uid: file.id,
              url: 'file://' + FileManager.getSafePath(file),
              status: 'done',
              name: file.name
            }) as UploadFile
        )}
        onRemove={(item) => setFiles(files.filter((file) => item.uid !== file.id))}
      />
    </div>
  )
}

export default AttachmentPreview
