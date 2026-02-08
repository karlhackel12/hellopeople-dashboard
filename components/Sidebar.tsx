'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Target,
  Rocket,
  Users,
  MessageSquare,
  Lightbulb,
  Building2,
  FileText,
  GitPullRequest,
  Theater,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'The Stage', href: '/stage', icon: Theater },
  { name: 'Proposals', href: '/proposals', icon: GitPullRequest },
  { name: 'Missions', href: '/missions', icon: Rocket },
  { name: 'Objectives', href: '/objectives', icon: Target },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare },
  { name: 'Deliverables', href: '/deliverables', icon: FileText },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
  { name: 'Policies', href: '/policies', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-800">
        <Building2 className="h-8 w-8 text-blue-400" />
        <div>
          <h1 className="font-bold text-lg">HelloPeople</h1>
          <p className="text-xs text-gray-400">Autonomous Company</p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="px-4 py-3 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400">System Status</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">All Systems Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
