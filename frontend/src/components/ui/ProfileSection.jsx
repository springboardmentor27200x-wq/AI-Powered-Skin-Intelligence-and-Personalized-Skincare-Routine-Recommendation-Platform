import React from 'react';
import { Link } from 'react-router-dom';
import { Edit2 } from 'lucide-react';

/**
 * ProfileSection — labeled section with edit link per §23 spec.
 */
const ProfileSection = ({ title, editTo, editLabel = 'Edit', children }) => (
  <div className="bg-white border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border-light)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{title}</p>
      {editTo && (
        <Link
          to={editTo}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] transition-colors"
          aria-label={`${editLabel} ${title}`}
        >
          <Edit2 size={11} aria-hidden="true" />
          {editLabel}
        </Link>
      )}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default ProfileSection;
