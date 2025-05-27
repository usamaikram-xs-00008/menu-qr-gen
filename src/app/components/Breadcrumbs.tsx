'use client';

import Link from 'next/link';
import { FiChevronRight, FiHome } from 'react-icons/fi';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1 text-sm text-gray-500">
        <li>
          <Link 
            href="/me" 
            className="text-gray-400 hover:text-gray-600 flex items-center"
          >
            <FiHome className="mr-1" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <FiChevronRight className="text-gray-400 mx-1" aria-hidden="true" />
            {item.href ? (
              <Link 
                href={item.href}
                className="hover:text-gray-700"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-800 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}