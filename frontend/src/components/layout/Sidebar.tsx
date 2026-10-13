import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  FileQuestion,
  TrendingUp,
  History,
  GraduationCap,
  UserRound,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type NavChild = { name: string; href: string };
type NavItem = {
  name: string;
  icon: React.ElementType;
  href?: string;
  children?: NavChild[];
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Learn',
    icon: BookOpen,
    children: [
      { name: 'Practice', href: '/learn/practice/setup' },
      { name: 'English Teacher', href: '/learn/english' },
      { name: 'Conversation', href: '/learn/english/conversation' },
      { name: 'Vocabulary', href: '/learn/vocabulary' },
      { name: 'Grammar', href: '/learn/grammar' },
    ],
  },
  {
    name: 'Interview',
    icon: MessageSquare,
    children: [
      { name: 'Mock Interview', href: '/interview/setup' },
      { name: 'History', href: '/interview/history' },
      { name: 'Analytics', href: '/interview/analytics' },
    ],
  },
  {
    name: 'Question Bank',
    icon: FileQuestion,
    children: [
      { name: 'My Questions', href: '/questions' },
      { name: 'Upload', href: '/questions/upload' },
    ],
  },
  {
    name: 'Progress',
    icon: TrendingUp,
    children: [
      { name: 'Performance', href: '/progress' },
      { name: 'Weak Areas', href: '/progress/weak-areas' },
    ],
  },
  { name: 'History', href: '/history', icon: History },
  {
    name: 'Account',
    icon: UserRound,
    children: [
      { name: 'Profile', href: '/profile' },
      { name: 'Settings', href: '/settings' },
    ],
  },
];

function pathMatches(pathname: string, href: string) {
  if (pathname === href) return true;
  // Practice sessions live under /learn/practice/:id
  if (href === '/learn/practice/setup' && pathname.startsWith('/learn/practice')) return true;
  if (href === '/questions' && pathname.startsWith('/questions/') && !pathname.startsWith('/questions/upload')) {
    return true;
  }
  if (href === '/learn/english' && pathname === '/learn/english') return true;
  return false;
}

function groupContainsPath(item: NavItem, pathname: string) {
  return item.children?.some((c) => pathMatches(pathname, c.href) || pathname.startsWith(c.href)) ?? false;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenMenus((prev) => {
      const next = { ...prev };
      for (const item of navigation) {
        if (item.children && groupContainsPath(item, location.pathname)) {
          next[item.name] = true;
        }
      }
      return next;
    });
  }, [location.pathname]);

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isActive = (href: string) => pathMatches(location.pathname, href);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">AI Teacher</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const expanded = Boolean(openMenus[item.name]);
              const childActive = hasChildren && groupContainsPath(item, location.pathname);

              if (!hasChildren && item.href) {
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.name)}
                    aria-expanded={expanded}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      childActive
                        ? 'bg-accent/80 text-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform duration-200',
                        expanded && 'rotate-180'
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      'grid transition-[grid-template-rows] duration-200 ease-out',
                      expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    )}
                  >
                    <ul className="overflow-hidden">
                      <li className="mt-1 space-y-0.5 border-l border-border/70 ml-5 pl-2">
                        {item.children!.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={onClose}
                            className={cn(
                              'block rounded-md px-3 py-2 text-sm transition-colors',
                              isActive(child.href)
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </li>
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
