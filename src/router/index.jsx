import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from '@layouts/AuthLayout';
import AppLayout from '@layouts/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import OnboardingGuard from './OnboardingGuard';
import RequireActiveBrand from './RequireActiveBrand';
import SignInPage from '@/pages/auth/SignInPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import TrialStartPage from '@/pages/trial/TrialStartPage';
import TrialIframeReturn from '@/pages/trial/TrialIframeReturn';
import ProjectsPage from '@/pages/app/ProjectsPage';
import NewProjectPage from '@/pages/app/projects/NewProjectPage';
import ProjectCreationPage from '@/pages/app/projects/ProjectCreationPage';
import ProjectDetailPage from '@/pages/app/projects/ProjectDetailPage';
import CreativeEditPage from '@/pages/app/projects/CreativeEditPage';
import BrandsPage from '@/pages/app/BrandsPage';
import AvatarsPage from '@/pages/app/AvatarsPage';
import CreativeScorePage from '@/pages/app/CreativeScorePage';
import InspiredCreationPage from '@/pages/app/InspiredCreationPage';
import AccountPage from '@/pages/app/settings/AccountPage';
import InvoicePage from '@/pages/app/settings/InvoicePage';
import PaymentPage from '@/pages/app/settings/PaymentPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ROUTES } from '@config/routes';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={ROUTES.auth.signUp} replace /> },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="sign-in" replace /> },
      {
        element: <PublicRoute />,
        children: [
          { path: 'sign-in', element: <SignInPage /> },
          { path: 'sign-up', element: <SignUpPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  /* Public Tranzila iframe return routes. The Tranzila iframe redirects
   * to these on success/failure; they postMessage the parent window
   * (StartTrialModal) and show minimal UI. They MUST be public — they
   * load inside the iframe without a JWT context, so ProtectedRoute
   * would bounce them to sign-in. */
  { path: '/trial/success', element: <TrialIframeReturn result="success" /> },
  { path: '/trial/failed',  element: <TrialIframeReturn result="failed" /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/trial', element: <TrialStartPage /> },
      {
        element: <OnboardingGuard />,
        children: [{
          path: '/app',
          element: <AppLayout />,
          children: [
            { index: true, element: <Navigate to="projects" replace /> },

            /* Brand-required routes are grouped under RequireActiveBrand
             * so no page repeats the !activeBrand check. The `subject`
             * prop drives the NoActiveBrandState copy when the user
             * lands on the page without an active brand. */
            {
              element: <RequireActiveBrand subject="הפרויקטים" />,
              children: [
                { path: 'projects', element: <ProjectsPage /> },
                { path: 'projects/new', element: <NewProjectPage /> },
                { path: 'projects/new/:projectType', element: <ProjectCreationPage /> },
                { path: 'projects/:projectId', element: <ProjectDetailPage /> },
                { path: 'projects/:projectId/variants/:variantId/edit', element: <CreativeEditPage /> },
              ],
            },
            {
              element: <RequireActiveBrand subject="ציון הקריאייטיב" />,
              children: [{ path: 'creative-score', element: <CreativeScorePage /> }],
            },
            {
              element: <RequireActiveBrand subject="היצירות מהשראה" />,
              children: [{ path: 'inspired-creation', element: <InspiredCreationPage /> }],
            },
            {
              element: <RequireActiveBrand subject="האווטארים" />,
              children: [{ path: 'avatars', element: <AvatarsPage /> }],
            },

            /* Brand-independent routes: brand management itself and settings. */
            { path: 'brands', element: <BrandsPage /> },
            {
              path: 'settings',
              children: [
                { index: true, element: <Navigate to="account" replace /> },
                { path: 'account', element: <AccountPage /> },
                { path: 'invoice', element: <InvoicePage /> },
                { path: 'payment', element: <PaymentPage /> },
              ],
            },
          ],
        }],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
