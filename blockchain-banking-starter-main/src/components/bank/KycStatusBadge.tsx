/*
 * KycStatusBadge.tsx
 * Displays the current KYC verification status as a colored badge.
 */

import React from 'react';

interface KycStatusBadgeProps {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
}

function KycStatusBadge({ status }: KycStatusBadgeProps) {
  // Map status to display text and badge class
  const statusConfig = {
    not_submitted: { text: 'Not Submitted', className: 'badge-not-submitted' },
    pending: { text: 'Pending Review', className: 'badge-pending' },
    approved: { text: 'Approved', className: 'badge-approved' },
    rejected: { text: 'Rejected', className: 'badge-rejected' }
  };

  const config = statusConfig[status];

  return (
    <span className={`badge ${config.className}`}>
      {config.text}
    </span>
  );
}

export default KycStatusBadge;
