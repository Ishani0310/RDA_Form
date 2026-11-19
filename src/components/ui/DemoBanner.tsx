import React from "react";

interface DemoBannerProps {
  compact?: boolean;
}

/**
 * DemoBanner
 * 
 * Disabled: All demo data and prototype notices have been removed.
 * Returns null to maintain backward compatibility with any components calling <DemoBanner />.
 */
export const DemoBanner: React.FC<DemoBannerProps> = () => {
  return null;
};
