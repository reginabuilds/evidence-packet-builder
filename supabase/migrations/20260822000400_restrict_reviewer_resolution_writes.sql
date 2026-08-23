-- Resolution writes move through the authenticated server workflow. The existing
-- client insert policy is removed so no browser client can create a verification record.
drop policy if exists "review resolutions: assigned reviewer creates" on public.review_resolutions;

-- Review status and evidence verification status have no client update policies.
-- Only the server's reviewer-resolution route can perform these writes after role and
-- assignment checks, and every resolution is followed by an audit event.
