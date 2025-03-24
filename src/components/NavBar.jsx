import React from 'react';
import { AppBar, Toolbar, IconButton, Avatar, Menu, MenuItem } from 'react-bits';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import Logo from '../assets/logo.svg';

const NavBar = ({
    title,
    user,
    onLogout,
    className,
    ...props
}) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleClose();
        if (onLogout) onLogout();
    };

    return (
        <AppBar position="fixed" className={className} {...props}>
            <Toolbar>
                <Link to="/" className="navbar-logo">
                    <img src={Logo} alt="Cherry Studio" height="32" />
                    {title && <span className="navbar-title">{title}</span>}
                </Link>

                <div className="navbar-spacer" />

                {user ? (
                    <>
                        <IconButton
                            onClick={handleClick}
                            aria-controls={open ? 'user-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={open ? 'true' : undefined}
                        >
                            <Avatar
                                src={user.avatar}
                                alt={user.name}
                                size="sm"
                            >
                                {user.name?.charAt(0)}
                            </Avatar>
                        </IconButton>
                        <Menu
                            id="user-menu"
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleClose}
                        >
                            <MenuItem component={Link} to="/profile" onClick={handleClose}>
                                个人资料
                            </MenuItem>
                            <MenuItem component={Link} to="/settings" onClick={handleClose}>
                                设置
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>退出登录</MenuItem>
                        </Menu>
                    </>
                ) : (
                    <Link to="/login" className="navbar-login-btn">
                        登录
                    </Link>
                )}
            </Toolbar>
        </AppBar>
    );
};

NavBar.propTypes = {
    title: PropTypes.string,
    user: PropTypes.shape({
        name: PropTypes.string,
        avatar: PropTypes.string
    }),
    onLogout: PropTypes.func,
    className: PropTypes.string
};

export default NavBar; 