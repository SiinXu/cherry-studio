import { AtOutlined, PushpinOutlined } from '@ant-design/icons'
import ModelTags from '@renderer/components/ModelTags'
import { getModelLogo, isEmbeddingModel } from '@renderer/config/models'
import db from '@renderer/databases'
import { useProviders } from '@renderer/hooks/useProvider'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { getModelUniqId } from '@renderer/services/ModelService'
import { Model, Provider } from '@renderer/types'
import { Button, Dropdown, Tooltip, Avatar } from '../../../../../../components'
import { first, sortBy } from 'lodash'
import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { classNames } from '@renderer/utils'
import './MentionModelsButton.css'

interface Props {
  mentionModels: Model[]
  onMentionModel: (model: Model, fromKeyboard: boolean) => void
  buttonClass?: string
}

const MentionModelsButton: FC<Props> = ({ mentionModels, onMentionModel, buttonClass = 'rb-inputbar-tool-btn' }) => {
  const { providers } = useProviders()
  const [pinnedModels, setPinnedModels] = useState<string[]>([])
  const { t } = useTranslation()
  const dropdownRef = useRef<any>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [searchText, setSearchText] = useState('')
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])
  // Add a new state to track if menu was dismissed
  const [menuDismissed, setMenuDismissed] = useState(false)
  // Add a state to track if the model selector was triggered by keyboard
  const [fromKeyboard, setFromKeyboard] = useState(false)

  const setItemRef = (index: number, el: HTMLDivElement | null) => {
    itemRefs.current[index] = el
  }

  const togglePin = useCallback(
    async (modelId: string) => {
      const newPinnedModels = pinnedModels.includes(modelId)
        ? pinnedModels.filter((id) => id !== modelId)
        : [...pinnedModels, modelId]

      await db.settings.put({ id: 'pinned:models', value: newPinnedModels })
      setPinnedModels(newPinnedModels)
    },
    [pinnedModels]
  )

  const handleModelSelect = useCallback(
    (model: Model) => {
      // Check if model is already selected
      if (mentionModels.some((selected) => getModelUniqId(selected) === getModelUniqId(model))) {
        return
      }
      onMentionModel(model, fromKeyboard)
      setIsOpen(false)
    },
    [fromKeyboard, mentionModels, onMentionModel]
  )

  const modelMenuItems = useMemo(() => {
    const items = providers
      .filter((p) => p.models && p.models.length > 0)
      .map((p) => {
        const filteredModels = sortBy(p.models, ['group', 'name'])
          .filter((m) => !isEmbeddingModel(m))
          // Filter out pinned models from regular groups
          .filter((m) => !pinnedModels.includes(getModelUniqId(m)))
          // Filter by search text
          .filter((m) => {
            if (!searchText) return true
            return (
              m.name.toLowerCase().includes(searchText.toLowerCase()) ||
              m.id.toLowerCase().includes(searchText.toLowerCase())
            )
          })
          .map((m) => ({
            key: getModelUniqId(m),
            model: m,
            label: (
              <div className="rb-model-item">
                <div className="rb-model-name-row">
                  <span>{m?.name}</span> <ModelTags model={m} />
                </div>
                <span 
                  className={classNames('rb-pin-icon', { 'pinned': pinnedModels.includes(getModelUniqId(m)) })}
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePin(getModelUniqId(m))
                  }}
                >
                  <PushpinOutlined />
                </span>
              </div>
            ),
            icon: (
              <Avatar src={getModelLogo(m.id)} size={24}>
                {first(m.name)}
              </Avatar>
            ),
            onClick: () => handleModelSelect(m)
          }))

        return filteredModels.length > 0
          ? {
              key: p.id,
              label: p.isSystem ? t(`provider.${p.id}`) : p.name,
              type: 'group' as const,
              children: filteredModels
            }
          : null
      })
      .filter((group): group is NonNullable<typeof group> => group !== null)

    if (pinnedModels.length > 0) {
      const pinnedItems = providers
        .filter((p): p is Provider => p.models && p.models.length > 0)
        .flatMap((p) =>
          p.models
            .filter((m) => pinnedModels.includes(getModelUniqId(m)))
            .map((m) => ({
              key: getModelUniqId(m),
              model: m,
              provider: p
            }))
        )
        .map((m) => ({
          ...m,
          key: m.key + 'pinned',
          label: (
            <div className="rb-model-item">
              <div className="rb-model-name-row">
                <span>
                  {m.model?.name} | {m.provider.isSystem ? t(`provider.${m.provider.id}`) : m.provider.name}
                </span>{' '}
                <ModelTags model={m.model} />
              </div>
              <span 
                className="rb-pin-icon pinned"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePin(getModelUniqId(m.model))
                }}
              >
                <PushpinOutlined />
              </span>
            </div>
          ),
          icon: (
            <Avatar src={getModelLogo(m.model.id)} size={24}>
              {first(m.model.name)}
            </Avatar>
          ),
          onClick: () => handleModelSelect(m.model)
        }))

      if (pinnedItems.length > 0) {
        items.unshift({
          key: 'pinned',
          label: t('models.pinned'),
          type: 'group' as const,
          children: pinnedItems
        })
      }
    }

    // Remove empty groups
    return items.filter((group) => group.children.length > 0)
  }, [providers, pinnedModels, t, searchText, togglePin, handleModelSelect])

  // Get flattened list of all model items
  const flatModelItems = useMemo(() => {
    return modelMenuItems.flatMap((group) => group?.children || [])
  }, [modelMenuItems])

  useEffect(() => {
    const loadPinnedModels = async () => {
      const setting = await db.settings.get('pinned:models')
      setPinnedModels(setting?.value || [])
    }
    loadPinnedModels()
  }, [])

  useLayoutEffect(() => {
    if (isOpen && selectedIndex > -1 && itemRefs.current[selectedIndex]) {
      requestAnimationFrame(() => {
        itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' })
      })
    }
  }, [isOpen, selectedIndex])

  useEffect(() => {
    const showModelSelector = () => {
      dropdownRef.current?.click()
      itemRefs.current = []
      setIsOpen(true)
      setSelectedIndex(0)
      setSearchText('')
      setMenuDismissed(false) // Reset dismissed flag when manually showing selector
      setFromKeyboard(true) // Set fromKeyboard to true when triggered by keyboard
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => {
          const newIndex = prev < flatModelItems.length - 1 ? prev + 1 : 0
          itemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest' })
          return newIndex
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : flatModelItems.length - 1
          itemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest' })
          return newIndex
        })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < flatModelItems.length) {
          const selectedModel = flatModelItems[selectedIndex].model
          if (!mentionModels.some((selected) => getModelUniqId(selected) === getModelUniqId(selectedModel))) {
            flatModelItems[selectedIndex].onClick()
          }
          setIsOpen(false)
          setSearchText('')
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchText('')
        setMenuDismissed(true) // Set dismissed flag when Escape is pressed
      }
    }

    const handleTextChange = (e: Event) => {
      const textArea = e.target as HTMLTextAreaElement
      const cursorPosition = textArea.selectionStart
      const textBeforeCursor = textArea.value.substring(0, cursorPosition)
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')
      const textBeforeLastAt = textBeforeCursor.slice(0, lastAtIndex)
      if (lastAtIndex === -1 || textBeforeCursor.slice(lastAtIndex + 1).includes(' ')) {
        setIsOpen(false)
        setSearchText('')
        setMenuDismissed(false) // Reset dismissed flag when @ is removed
      } else {
        // Only open menu if it wasn't explicitly dismissed
        if (!menuDismissed && (textBeforeLastAt.slice(-1) === ' ' || lastAtIndex === 0)) {
          setIsOpen(true)
          const searchStr = textBeforeCursor.slice(lastAtIndex + 1)
          setSearchText(searchStr)
        }
      }
    }

    const textArea = document.querySelector('.inputbar textarea') as HTMLTextAreaElement
    if (textArea) {
      textArea.addEventListener('input', handleTextChange)
    }

    EventEmitter.on(EVENT_NAMES.SHOW_MODEL_SELECTOR, showModelSelector)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      EventEmitter.off(EVENT_NAMES.SHOW_MODEL_SELECTOR, showModelSelector)
      document.removeEventListener('keydown', handleKeyDown)
      if (textArea) {
        textArea.removeEventListener('input', handleTextChange)
      }
    }
  }, [isOpen, selectedIndex, flatModelItems, mentionModels, menuDismissed])

  useEffect(() => {
    const updateScrollbarClass = () => {
      requestAnimationFrame(() => {
        if (menuRef.current) {
          const hasScrollbar = menuRef.current.scrollHeight > menuRef.current.clientHeight
          menuRef.current.classList.toggle('has-scrollbar', hasScrollbar)
          menuRef.current.classList.toggle('no-scrollbar', !hasScrollbar)
        }
      })
    }

    // Update on initial render and whenever content changes
    const observer = new MutationObserver(updateScrollbarClass)
    const resizeObserver = new ResizeObserver(updateScrollbarClass)

    if (menuRef.current) {
      // Observe content changes
      observer.observe(menuRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })

      // Observe size changes
      resizeObserver.observe(menuRef.current)

      // Initial check after a short delay to ensure DOM is ready
      setTimeout(updateScrollbarClass, 0)
    }

    // Cleanup
    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
    }
  }, [isOpen, searchText, flatModelItems.length]) // Add dependencies that affect content

  const menu = (
    <div ref={menuRef} className="rb-mention-dropdown-menu ant-dropdown-menu">
      {flatModelItems.length > 0 ? (
        modelMenuItems.map((group, groupIndex) => {
          if (!group) return null

          // Calculate starting index for items in this group
          const startIndex = modelMenuItems.slice(0, groupIndex).reduce((acc, g) => acc + (g?.children?.length || 0), 0)

          return (
            <div key={group.key} className="ant-dropdown-menu-item-group">
              <div className="ant-dropdown-menu-item-group-title">{group.label}</div>
              <div>
                {group.children.map((item, idx) => (
                  <div
                    key={item.key}
                    ref={(el) => setItemRef(startIndex + idx, el)}
                    className={`ant-dropdown-menu-item ${
                      selectedIndex === startIndex + idx ? 'ant-dropdown-menu-item-selected' : ''
                    }`}
                    onClick={item.onClick}>
                    <span className="ant-dropdown-menu-item-icon">{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )
        })
      ) : (
        <div className="ant-dropdown-menu-item-group">
          <div className="ant-dropdown-menu-item no-results">{t('models.no_matches')}</div>
        </div>
      )}
    </div>
  )

  const onClick = () => {
    EventEmitter.emit(EVENT_NAMES.SHOW_MODEL_SELECTOR)
  }

  return (
    <Dropdown
      overlayStyle={{ marginBottom: 20 }}
      dropdownRender={() => menu}
      trigger={['click']}
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        open && setFromKeyboard(false) // Set fromKeyboard to false when opened by button click
      }}
      overlayClassName="mention-models-dropdown">
      <Tooltip placement="top" title={t('chat.input.mention')}>
        <Button
          className={classNames(buttonClass, { 'active': mentionModels.length > 0 })}
          type="text"
          ref={dropdownRef}
          onClick={onClick}
        >
          <AtOutlined />
        </Button>
      </Tooltip>
    </Dropdown>
  )
}

export default MentionModelsButton
