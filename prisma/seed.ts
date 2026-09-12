import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSIONS = [
  'order:create', 'order:read', 'order:assign', 'order:transition',
  'driver:read', 'driver:availability:update', 'driver:performance:read',
  'vehicle:read', 'vehicle:create',
  'route:read', 'route:optimize',
  'warehouse:read', 'warehouse:create',
  'inventory:read', 'inventory:movement:create',
  'analytics:read', 'audit:read',
  'webhook:read', 'webhook:create',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS,
  COMPANY_ADMIN: PERMISSIONS,
  OPERATIONS_MANAGER: PERMISSIONS.filter((p) => !['webhook:create'].includes(p)),
  DISPATCHER: ['order:create', 'order:read', 'order:assign', 'order:transition', 'driver:read', 'vehicle:read', 'route:read', 'route:optimize'],
  DRIVER: ['order:transition', 'driver:availability:update'],
  CUSTOMER: [],
};

async function main() {
  console.log('Seeding roles & permissions...');

  const permissionRecords = await Promise.all(
    PERMISSIONS.map((key) => prisma.permission.upsert({ where: { key }, update: {}, create: { key } })),
  );

  for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({ where: { name: roleName }, update: {}, create: { name: roleName } });
    for (const key of keys) {
      const permission = permissionRecords.find((p) => p.key === key)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seeding demo company...');

  const company = await prisma.company.upsert({
    where: { slug: 'demo-logistics' },
    update: {},
    create: { name: 'Demo Logistics Co', slug: 'demo-logistics' },
  });

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'COMPANY_ADMIN' } });
  const passwordHash = await bcrypt.hash('DemoPass123!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: '[email protected]' },
    update: {},
    create: { email: '[email protected]', name: 'Demo Admin', passwordHash },
  });

  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company.id, userId: adminUser.id } },
    update: {},
    create: { companyId: company.id, userId: adminUser.id, roleId: adminRole.id },
  });

  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      name: 'Central Warehouse',
      address: { line1: '1 Logistics Way', city: 'Metropolis', country: 'US', lat: 40.71, lng: -74.0 },
      capacity: 10000,
    },
  });

  const driverUser = await prisma.user.create({
    data: { email: '[email protected]', name: 'Alex Johnson', passwordHash },
  });
  const driverRole = await prisma.role.findUniqueOrThrow({ where: { name: 'DRIVER' } });
  await prisma.companyMember.create({
    data: { companyId: company.id, userId: driverUser.id, roleId: driverRole.id },
  });
  const driver = await prisma.driver.create({
    data: { companyId: company.id, userId: driverUser.id, availability: 'AVAILABLE' },
  });

  const vehicle = await prisma.vehicle.create({
    data: { companyId: company.id, licensePlate: 'FF-1001', type: 'Van', capacityKg: 800, status: 'AVAILABLE' },
  });

  const customer = await prisma.customer.create({
    data: { companyId: company.id, name: 'Jordan Rivera', email: '[email protected]' },
  });

  await prisma.order.create({
    data: {
      companyId: company.id,
      customerId: customer.id,
      pickupAddress: { line1: '1 Logistics Way', city: 'Metropolis', country: 'US', lat: 40.71, lng: -74.0 },
      deliveryAddress: { line1: '99 Market St', city: 'Metropolis', country: 'US', lat: 40.73, lng: -73.99 },
      packageInfo: { description: 'Electronics parcel' },
      weightKg: 4.5,
      deliveryFee: 12.5,
      priority: 'STANDARD',
    },
  });

  console.log(`Seed complete. Demo login: [email protected] / DemoPass123!`);
  console.log(`Warehouse: ${warehouse.name}, Driver: ${driver.id}, Vehicle: ${vehicle.licensePlate}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
