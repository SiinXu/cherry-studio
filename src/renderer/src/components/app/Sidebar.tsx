import {
  AppstoreOutlined,
  BookOutlined,
  ClockCircleOutlined,
  FileOutlined,
  HomeOutlined,
  SettingOutlined,
  TranslationOutlined
} from '@ant-design/icons';
import { Layout, Navigation, Button, Tooltip, Menu } from '../../../../../components';
import { useSettings } from '@renderer/hooks/useSettings';
import { useShortcut } from '@renderer/hooks/useShortcuts';
import { useShowAssistants } from '@renderer/hooks/useStore';
import { useUserProfile } from '@renderer/hooks/useUserProfile';
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService';
import { NavigationService } from '@renderer/services/NavigationService';
import { useAppDispatch } from '@renderer/store';
import { setTheme } from '@renderer/store/settings';
import { t } from 'i18next';
import { FC, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar: FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { showAssistants } = useShowAssistants();
  const { sidebarIcons, theme } = useSettings();
  const { userProfile } = useUserProfile();
  const dispatch = useAppDispatch();
  const [showContextMenu, setShowContextMenu] = useState(false);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setShowContextMenu(true);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useShortcut('toggle_theme', () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'));
  });

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleOpenDocs = useCallback(() => {
    NavigationService.openDocs();
  }, []);

  const handleEditProfile = useCallback(() => {
    EventEmitter.emit(EVENT_NAMES.EDIT_USER_PROFILE);
  }, []);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: t('sidebar.home'),
      onClick: () => handleNavigate('/')
    },
    {
      key: '/agents',
      icon: <AppstoreOutlined />,
      label: t('sidebar.agents'),
      onClick: () => handleNavigate('/agents')
    },
    {
      key: '/files',
      icon: <FileOutlined />,
      label: t('sidebar.files'),
      onClick: () => handleNavigate('/files')
    },
    {
      key: '/history',
      icon: <ClockCircleOutlined />,
      label: t('sidebar.history'),
      onClick: () => handleNavigate('/history')
    },
    {
      key: '/knowledge',
      icon: <BookOutlined />,
      label: t('sidebar.knowledge'),
      onClick: () => handleNavigate('/knowledge')
    },
    {
      key: '/translate',
      icon: <TranslationOutlined />,
      label: t('sidebar.translate'),
      onClick: () => handleNavigate('/translate')
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('sidebar.settings'),
      onClick: () => handleNavigate('/settings')
    }
  ];

  return (
    <Layout.Sidebar className="rb-sidebar" collapsed={!showAssistants}>
      <div className="rb-sidebar-container">
        <div className="rb-sidebar-header">
          <Tooltip title={t('profile.edit')} placement="right">
            <Button 
              className="rb-sidebar-avatar" 
              onClick={handleEditProfile}
              type="text"
            >
              {userProfile?.avatar?.startsWith('emoji:') ? (
                <span className="rb-sidebar-emoji">{userProfile.avatar.replace('emoji:', '')}</span>
              ) : (
                <img src={userProfile?.avatar} alt="avatar" />
              )}
            </Button>
          </Tooltip>
        </div>

        <Menu
          className="rb-sidebar-menu"
          selectedKeys={[pathname]}
          items={menuItems}
          mode="vertical"
        />

        <div className="rb-sidebar-footer">
          <Tooltip title={t('sidebar.docs')} placement="right">
            <Button
              className="rb-sidebar-icon"
              onClick={handleOpenDocs}
              type="text"
            >
              <i className="iconfont icon-docs" />
            </Button>
          </Tooltip>
          <Tooltip title={t('sidebar.theme')} placement="right">
            <Button
              className="rb-sidebar-icon"
              onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}
              type="text"
            >
              <i className={`iconfont icon-a-${theme}mode`} />
            </Button>
          </Tooltip>
        </div>
      </div>
    </Layout.Sidebar>
  );
};

export default Sidebar;
