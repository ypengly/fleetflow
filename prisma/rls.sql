-- Row-Level Security: second layer of tenant isolation, independent of
-- application code. Run this after `prisma migrate deploy`.
-- Every tenant-scoped table gets a policy that only allows rows whose
-- companyId matches the session variable set by PrismaService.withTenant().

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'Customer', 'Order', 'Shipment', 'Driver', 'DriverLocation', 'Vehicle',
    'Route', 'Warehouse', 'Notification', 'ApiKey', 'Webhook', 'AuditLog'
  ]
  LOOP
    EXECUTE format('ALTER TABLE "%s" ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON "%s"
         USING ("companyId" = current_setting(''app.current_company_id'', true)::text);',
      tbl
    );
  END LOOP;
END $$;

-- Note: the application's database role should NOT have BYPASSRLS,
-- and SUPER_ADMIN cross-company access is handled explicitly at the
-- application layer (audited), not by disabling RLS.
