// src/components/Sidebar.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, ListCollapse, Wrench, Globe, ShieldCheck, Settings, Zap } from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incident Management', icon: ListCollapse },
  { id: 'resources', label: 'Resource Hub', icon: Wrench },
  { id: 'geocode', label: 'Geocode Tool', icon: Globe },
  { id: 'verification', label: 'Verification Tool', icon: ShieldCheck },
  { id: 'admin', label: 'Admin Panel', icon: Settings },
];

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoContainer}>
        <Zap size={32} color="#ff7a00" />
        <h1 style={styles.logoTitle}>Response<span style={{color: 'var(--primary-blue)'}}>Grid</span></h1>
      </div>
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            onClick={() => setActiveView(item.id)}
          />
        ))}
      </nav>
      <div style={styles.footer}>
        <p>&copy; 2025 ResponseGrid</p>
      </div>
    </aside>
  );
};

const NavItem = ({ item, isActive, onClick }: any) => {
  return (
    <motion.a
      href="#"
      onClick={onClick}
      style={{ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) }}
      whileHover={{ backgroundColor: 'rgba(0, 82, 204, 0.1)' }}
      transition={{ duration: 0.2 }}
    >
      <item.icon size={20} />
      <span>{item.label}</span>
      {isActive && (
        <motion.div
          layoutId="active-nav-indicator"
          style={styles.activeIndicator}
        />
      )}
    </motion.a>
  );
};

// Inline styles for simplicity, can be moved to a CSS file
const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    width: '260px',
    flexShrink: 0,
    backgroundColor: '#ffffff',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1rem',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 0.5rem 1.5rem',
    borderBottom: '1px solid var(--border-color)',
  },
  logoTitle: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#172b4d',
    margin: 0,
  },
  nav: {
    flexGrow: 1,
    marginTop: '1.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--neutral-dark)',
    textDecoration: 'none',
    fontWeight: 500,
    position: 'relative',
    marginBottom: '0.25rem'
  },
  navItemActive: {
    color: 'var(--primary-blue)',
    backgroundColor: 'rgba(0, 82, 204, 0.05)',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '15%',
    bottom: '15%',
    width: '4px',
    backgroundColor: 'var(--primary-blue)',
    borderRadius: '0 4px 4px 0',
  },
  footer: {
    fontSize: '0.8rem',
    color: 'var(--neutral-medium)',
    textAlign: 'center',
    paddingTop: '1rem',
  }
};

export default Sidebar;