import { Outlet } from 'react-router-dom';
import { PageContainer } from '@components/ui';
import { useActiveBrand } from '@/contexts/BrandsContext';
import { NoActiveBrandState } from '@features/brands';

/* Route-level guard for pages that need an active brand.
 *
 * Pages don't have to (and shouldn't) repeat the `!activeBrand` check
 * themselves — they sit under this guard in the router and just assume
 * activeBrand is set.
 *
 * Three states it handles:
 *   loading       → empty PageContainer (keeps layout chrome stable)
 *   no brand      → NoActiveBrandState with the subject for this group
 *   has brand     → renders <Outlet/> (the matched child route)
 */
export default function RequireActiveBrand({ subject }) {
  const { activeBrand, loading } = useActiveBrand();

  if (loading) return <PageContainer />;
  if (!activeBrand) {
    return (
      <PageContainer>
        <NoActiveBrandState subject={subject} />
      </PageContainer>
    );
  }
  return <Outlet />;
}
