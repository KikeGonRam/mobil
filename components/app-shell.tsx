import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const ICONS = {
  dashboard: 'view-dashboard-outline',
  discover: 'compass-outline',
  bookings: 'calendar-month-outline',
  account: 'account-circle-outline',
  chat: 'robot-outline',
  notifications: 'bell-outline',
  profile: 'account-edit-outline',
  appointments: 'calendar-text-outline',
  clients: 'account-multiple-outline',
  payments: 'cash-multiple',
  inventory: 'package-variant-closed',
  movement: 'swap-vertical',
  users: 'account-group-outline',
  barbers: 'content-cut',
  services: 'content-cut',
  reports: 'chart-line',
  settings: 'cog-outline',
  logs: 'script-text-outline',
  agenda: 'calendar-clock-outline',
  schedule: 'clock-outline',
  portfolio: 'image-multiple-outline',
} as const;

type IconName = keyof typeof ICONS;

type NavItem = {
  title: string;
  href: string;
  icon: IconName;
  roles?: string[];
};

const PUBLIC_ROUTES = new Set(['/landing', '/login', '/registro']);

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { user, signOut } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const normalizedPath = normalizePath(pathname);

  const isAuthenticatedView = !PUBLIC_ROUTES.has(normalizedPath);
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const isChatRoute = normalizedPath === '/chat';
  const sections = useMemo(() => buildSections(user?.roles ?? []), [user?.roles]);
  const primaryRole = user?.roles?.[0] ?? 'usuario';
  const currentTitle = useMemo(() => routeTitle(pathname), [pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (!isAuthenticatedView) {
    return <>{children}</>;
  }

  return (
    <ThemedView style={styles.screen}>
      <View style={[styles.shell, isDesktopWeb ? styles.shellDesktop : styles.shellMobile]}>
        {isDesktopWeb ? (
          <Sidebar
            title={currentTitle}
            primaryRole={primaryRole}
            sections={sections}
            userName={user?.name ?? 'Usuario'}
            userEmail={user?.email ?? ''}
            onSignOut={signOut}
            onNavigate={() => undefined}
          />
        ) : !isChatRoute ? (
          <View style={styles.mobileTopBar}>
            <Pressable onPress={() => setDrawerOpen(true)} style={styles.menuButton}>
              <MaterialCommunityIcons name="menu" size={24} color="#fff" />
            </Pressable>
            <View style={styles.mobileTopCopy}>
              <ThemedText style={styles.mobileTitle}>{currentTitle}</ThemedText>
              <ThemedText style={styles.mobileSubtitle}>{user?.roles?.[0] ?? 'usuario'}</ThemedText>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.main,
            isDesktopWeb ? styles.mainDesktop : styles.mainMobile,
            isChatRoute ? styles.mainChatRoute : null,
          ]}>
          <View style={styles.mainContent}>{children}</View>
        </View>
      </View>

      {!isDesktopWeb && drawerOpen && !isChatRoute ? (
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)} />
          <Sidebar
            title={currentTitle}
            primaryRole={primaryRole}
            sections={sections}
            userName={user?.name ?? 'Usuario'}
            userEmail={user?.email ?? ''}
            onSignOut={signOut}
            onNavigate={() => setDrawerOpen(false)}
            compact
          />
        </View>
      ) : null}

      {!isDesktopWeb && !drawerOpen && !isChatRoute ? (
        <Pressable onPress={() => router.push('/chat')} style={styles.mobileChatFab}>
          <MaterialCommunityIcons name="robot-outline" size={20} color="#000" />
          <ThemedText style={styles.mobileChatFabText}>Chat</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

function buildSections(roles: string[]) {
  const isAdmin = roles.includes('administrador');
  const isReception = roles.includes('recepcionista');
  const isBarber = roles.includes('barbero');
  const isClient = roles.includes('cliente');

  const roleOrder = isAdmin
    ? ['Gestion', 'Operacion', 'Perfil']
    : isReception
      ? ['Operacion', 'Perfil']
      : isBarber
        ? ['Barbero', 'Operacion', 'Perfil']
        : ['Operacion', 'Perfil'];

  const sections: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'Operacion',
      items: [
        { title: 'Panel', href: '/', icon: 'dashboard' },
        { title: 'Descubrir', href: '/explore', icon: 'discover' },
        { title: 'Reservas', href: '/reservas', icon: 'bookings', roles: ['cliente'] },
        { title: 'Citas', href: '/citas', icon: 'appointments', roles: ['administrador', 'recepcionista', 'barbero'] },
        { title: 'Clientes', href: '/clientes', icon: 'clients', roles: ['administrador', 'recepcionista'] },
        { title: 'Pagos', href: '/pagos', icon: 'payments', roles: ['administrador', 'recepcionista'] },
        { title: 'Movimientos', href: '/movimientos', icon: 'movement', roles: ['administrador', 'recepcionista'] },
        { title: 'Inventario', href: '/inventario', icon: 'inventory', roles: ['administrador', 'recepcionista'] },
      ],
    },
    {
      title: 'Gestion',
      items: [
        { title: 'Usuarios', href: '/usuarios', icon: 'users', roles: ['administrador'] },
        { title: 'Barberos', href: '/barberos', icon: 'barbers', roles: ['administrador'] },
        { title: 'Servicios', href: '/servicios', icon: 'services', roles: ['administrador'] },
        { title: 'Reportes', href: '/reportes', icon: 'reports', roles: ['administrador'] },
        { title: 'Configuracion', href: '/configuracion', icon: 'settings', roles: ['administrador'] },
        { title: 'Logs', href: '/logs', icon: 'logs', roles: ['administrador'] },
      ],
    },
    {
      title: 'Perfil',
      items: [
        { title: 'Notificaciones', href: '/notificaciones', icon: 'notifications' },
        { title: 'Perfil', href: '/perfil', icon: 'profile' },
        { title: 'Cuenta', href: '/cuenta', icon: 'account' },
        { title: 'Chat', href: '/chat', icon: 'chat' },
      ],
    },
    {
      title: 'Barbero',
      items: [
        { title: 'Agenda', href: '/agenda', icon: 'agenda', roles: ['barbero'] },
        { title: 'Horario', href: '/horario', icon: 'schedule', roles: ['barbero'] },
        { title: 'Portafolio', href: '/portafolio', icon: 'portfolio', roles: ['barbero'] },
      ],
    },
  ];

  const filteredSections = sections
    .map((section) => {
      const items = section.items
        .filter((item) => {
          if (!item.roles) {
            return true;
          }

          return item.roles.some((role) => roles.includes(role)) || (item.href === '/reservas' && isClient) || (item.href === '/citas' && (isAdmin || isReception || isBarber));
        })
        .sort((left, right) => navigationPriority(section.title, left.title, roles) - navigationPriority(section.title, right.title, roles));

      return {
        ...section,
        items,
      };
    })
    .filter((section) => section.items.length > 0);

  return roleOrder
    .map((sectionTitle) => filteredSections.find((section) => section.title === sectionTitle))
    .filter((section): section is { title: string; items: NavItem[] } => Boolean(section));
}

function navigationPriority(sectionTitle: string, itemTitle: string, roles: string[]) {
  const isAdmin = roles.includes('administrador');
  const isReception = roles.includes('recepcionista');
  const isBarber = roles.includes('barbero');
  const isClient = roles.includes('cliente');

  const orderBySection: Record<string, string[]> = {
    Operacion: isClient
      ? ['Reservas', 'Citas', 'Panel', 'Descubrir', 'Clientes', 'Pagos', 'Movimientos', 'Inventario']
      : isAdmin || isReception
        ? ['Citas', 'Clientes', 'Pagos', 'Movimientos', 'Inventario', 'Panel', 'Descubrir']
        : isBarber
          ? ['Citas', 'Panel', 'Descubrir']
          : ['Panel', 'Descubrir', 'Reservas'],
    Gestion: ['Usuarios', 'Barberos', 'Servicios', 'Reportes', 'Configuracion', 'Logs'],
    Perfil: ['Notificaciones', 'Perfil', 'Cuenta', 'Chat'],
    Barbero: ['Agenda', 'Horario', 'Portafolio'],
  };

  const sectionOrder = orderBySection[sectionTitle] ?? [];
  const index = sectionOrder.indexOf(itemTitle);

  return index === -1 ? sectionOrder.length + itemTitle.charCodeAt(0) : index;
}

function Sidebar({
  title,
  sections,
  primaryRole,
  userName,
  userEmail,
  onSignOut,
  onNavigate,
  compact = false,
}: {
  title: string;
  primaryRole: string;
  sections: Array<{ title: string; items: NavItem[] }>;
  userName: string;
  userEmail: string;
  onSignOut: () => void;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const pathname = normalizePath(usePathname());

  return (
    <View style={[styles.sidebar, compact ? styles.sidebarCompact : styles.sidebarDesktop]}>
      <View style={styles.sidebarHeader}>
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name="content-cut" size={20} color="#000" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <ThemedText style={styles.brandTitle}>BarberPro</ThemedText>
          <ThemedText style={styles.brandSubtitle}>Management System</ThemedText>
        </View>
      </View>

      <View style={styles.roleBanner}>
        <ThemedText style={styles.roleBannerLabel}>Rol actual</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.roleBannerValue}>{primaryRole}</ThemedText>
      </View>

      <View style={styles.currentTitleWrap}>
        <ThemedText style={styles.currentTitleLabel}>Vista actual</ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.currentTitleValue}>{title}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} style={styles.sectionBlock}>
            <ThemedText style={styles.sectionLabel}>{section.title}</ThemedText>
            <View style={styles.sectionItems}>
              {section.items.map((item) => {
                const active = pathname === normalizePath(item.href);
                return (
                  <Pressable
                    key={item.href}
                    onPress={() => {
                      router.push(item.href as never);
                      onNavigate();
                    }}
                    style={[styles.navItem, active ? styles.navItemActive : null]}>
                    <MaterialCommunityIcons
                      name={ICONS[item.icon]}
                      size={18}
                      color={active ? Brand.gold : '#9aa0a6'}
                    />
                    <ThemedText style={[styles.navItemText, active ? styles.navItemTextActive : null]}>
                      {item.title}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <ThemedText style={styles.userAvatarText}>{userName.slice(0, 2).toUpperCase()}</ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="defaultSemiBold" style={styles.userName}>{userName}</ThemedText>
            <ThemedText style={styles.userEmail}>{userEmail}</ThemedText>
          </View>
        </View>

        <Pressable onPress={onSignOut} style={styles.logoutButton}>
          <MaterialCommunityIcons name="logout" size={18} color={Brand.gold} />
          <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function routeTitle(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  const map: Record<string, string> = {
    '/': 'Panel',
    '/index': 'Panel',
    '/explore': 'Descubrir',
    '/reservas': 'Reservas',
    '/cuenta': 'Cuenta',
    '/agenda': 'Agenda',
    '/horario': 'Horario',
    '/portafolio': 'Portafolio',
    '/reportes': 'Reportes',
    '/configuracion': 'Configuracion',
    '/usuarios': 'Usuarios',
    '/clientes': 'Clientes',
    '/inventario': 'Inventario',
    '/pagos': 'Pagos',
    '/chat': 'Chat',
    '/notificaciones': 'Notificaciones',
    '/perfil': 'Perfil',
    '/citas': 'Citas',
    '/servicios': 'Servicios',
    '/barberos': 'Barberos',
    '/movimientos': 'Movimientos',
    '/logs': 'Logs',
  };

  return map[normalizedPath] ?? 'BarberPro';
}

function normalizePath(pathname: string) {
  if (pathname === '/(tabs)/index' || pathname === '/index') {
    return '/';
  }

  if (pathname === '/(tabs)/cuenta') {
    return '/cuenta';
  }

  return pathname.replace('/(tabs)', '');
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bgMain,
  },
  shell: {
    flex: 1,
  },
  shellDesktop: {
    flexDirection: 'row',
  },
  shellMobile: {
    flexDirection: 'column',
  },
  sidebar: {
    backgroundColor: Brand.bgCard,
    borderColor: Brand.line,
    borderWidth: 1,
  },
  sidebarDesktop: {
    width: 320,
    margin: 16,
    borderRadius: 28,
    padding: 16,
  },
  sidebarCompact: {
    position: 'absolute',
    top: 12,
    left: 12,
    bottom: 12,
    width: 320,
    borderRadius: 28,
    padding: 16,
    zIndex: 30,
    elevation: 24,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: Brand.muted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontWeight: '800',
  },
  currentTitleWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 12,
    marginBottom: 12,
  },
  currentTitleLabel: {
    color: Brand.muted,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  currentTitleValue: {
    color: '#fff',
  },
  sidebarContent: {
    gap: 12,
    paddingBottom: 16,
  },
  roleBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(212,175,55,0.1)',
    padding: 12,
    marginBottom: 12,
  },
  roleBannerLabel: {
    color: Brand.muted,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 3,
  },
  roleBannerValue: {
    color: Brand.gold,
    textTransform: 'capitalize',
  },
  sectionBlock: {
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    padding: 12,
  },
  sectionLabel: {
    color: Brand.gold,
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  sectionItems: {
    gap: 6,
  },
  navItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navItemActive: {
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderColor: 'rgba(212,175,55,0.25)',
  },
  navItemText: {
    color: Brand.muted,
    fontWeight: '700',
  },
  navItemTextActive: {
    color: '#fff',
  },
  sidebarFooter: {
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    paddingTop: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Brand.bgAccent,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: Brand.gold,
    fontWeight: '900',
  },
  userName: {
    color: '#fff',
  },
  userEmail: {
    color: Brand.muted,
    fontSize: 11,
  },
  logoutButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.bgAccent,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    textTransform: 'uppercase',
    fontWeight: '800',
    fontSize: 11,
  },
  main: {
    flex: 1,
  },
  mainDesktop: {
    marginRight: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  mainMobile: {
    marginTop: 12,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  mainChatRoute: {
    marginTop: 0,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  mainContent: {
    flex: 1,
  },
  mobileTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  mobileTopCopy: {
    flex: 1,
  },
  mobileTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  mobileSubtitle: {
    color: Brand.muted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '800',
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Brand.bgCard,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Brand.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileChatFab: {
    position: 'absolute',
    right: 16,
    bottom: 18,
    borderRadius: 999,
    backgroundColor: Brand.gold,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    zIndex: 40,
  },
  mobileChatFabText: {
    color: '#000',
    textTransform: 'uppercase',
    fontWeight: '900',
    fontSize: 11,
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.54)',
  },
});
