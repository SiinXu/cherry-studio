import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Tooltip } from '../../../../../../components';
import { formatNumerWithSymbol } from '@renderer/utils';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  estimateTokenCount?: number;
  inputTokenCount?: number;
  contextCount?: { current: number; max: number };
  buttonClass?: string;
  onClick?: () => void;
}

const TokenCount: FC<Props> = ({ estimateTokenCount = 0, inputTokenCount = 0, contextCount, buttonClass, onClick }) => {
  const { t } = useTranslation();

  const hasContextCount = contextCount && contextCount.max > 0;
  const tokenUsage = hasContextCount ? (contextCount.current / contextCount.max) * 100 : 0;
  const isOverLimit = hasContextCount && contextCount.current > contextCount.max;

  return (
    <Tooltip
      title={
        <>
          {estimateTokenCount > 0 && (
            <div>
              {t('chat.token.count.history')}: {formatNumerWithSymbol(estimateTokenCount)}
            </div>
          )}
          {inputTokenCount > 0 && (
            <div>
              {t('chat.token.count.input')}: {formatNumerWithSymbol(inputTokenCount)}
            </div>
          )}
          {hasContextCount && (
            <div>
              {t('chat.token.count.context')}: {formatNumerWithSymbol(contextCount.current)} /{' '}
              {formatNumerWithSymbol(contextCount.max)}
            </div>
          )}
        </>
      }
      placement="topRight"
    >
      <Button
        className={buttonClass}
        type="text"
        style={{ cursor: 'default' }}
        onClick={onClick}
      >
        {hasContextCount && !isOverLimit ? (
          <div style={{ width: 20, height: 20, position: 'relative' }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 36 36"
              style={{
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="3"
                strokeDasharray="100, 100"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="3"
                strokeDasharray={`${tokenUsage}, 100`}
              />
            </svg>
          </div>
        ) : (
          <InfoCircleOutlined
            style={{
              color: isOverLimit ? 'var(--color-error)' : 'var(--color-icon)'
            }}
          />
        )}
      </Button>
    </Tooltip>
  );
};

export default TokenCount;
