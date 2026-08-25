/**
 * Synthetic Data Generator (Build-Order Step 4)
 *
 * Populates the database with 200 invoices distributed across 8 specific
 * test scenarios. This forms the basis for the evaluation harness.
 *
 * Scenarios (03_IMPLEMENTATION_PLAN.md §2):
 * 1. Clean promise, kept on time (30%)
 * 2. Broken promise, no dispute (15%)
 * 3. Promise, then dispute within the same window (10%) - The Required Edge Case
 * 4. Direct dispute, no promise ever made (10%)
 * 5. Ghost (no reply at all) (15%)
 * 6. Ambiguous/vague reply (10%)
 * 7. Partial payment against a valid promise (5%)
 * 8. Unprompted direct payment, no negotiation (5%)
 *
 * IMPORTANT:
 * - Debtor names are realistic Indian business names (deterministic, not random)
 * - Invoice numbers are clean (INV-2001 format, no scenario suffix)
 * - Scenario metadata is stored ONLY in contact_ref for eval harness use
 * - Amounts are varied but deterministic (seeded from index)
 */

import { getServerClient } from '../src/infra/supabase-server-client';
import { v4 as uuidv4 } from 'uuid';

const TOTAL_INVOICES = 200;

// Distribution
const SCENARIO_DISTRIBUTION = {
  CLEAN_PROMISE: Math.round(TOTAL_INVOICES * 0.30),
  BROKEN_PROMISE: Math.round(TOTAL_INVOICES * 0.15),
  PROMISE_THEN_DISPUTE: Math.round(TOTAL_INVOICES * 0.10),
  DIRECT_DISPUTE: Math.round(TOTAL_INVOICES * 0.10),
  GHOST: Math.round(TOTAL_INVOICES * 0.15),
  AMBIGUOUS: Math.round(TOTAL_INVOICES * 0.10),
  PARTIAL_PAYMENT: Math.round(TOTAL_INVOICES * 0.05),
  UNPROMPTED_PAYMENT: Math.round(TOTAL_INVOICES * 0.05),
};

export type ScenarioType = keyof typeof SCENARIO_DISTRIBUTION;

// ─── 200 deterministic realistic Indian business names ─────────────────────
// These are user-facing — no scenario labels, no numbering.
const BUSINESS_NAMES: string[] = [
  'Nimbus Traders', 'Kaveri Foods', 'Aster Supplies', 'Aarav Enterprises',
  'Zenith Logistics', 'Priya Textiles', 'Horizon Metals', 'Sagar Industries',
  'Meera Exports', 'Pinnacle Pharma', 'Kiran Electronics', 'Jasmine Retail',
  'Banyan Agro', 'Coral Ventures', 'Disha Impex', 'Emerald Infotech',
  'Falcon Buildcon', 'Garnet Solutions', 'Helix Polymers', 'Indigo Fabrics',
  'Jade Autoparts', 'Kamal Steels', 'Lapis Chemicals', 'Maple Techserv',
  'Nova Ceramics', 'Opal Fisheries', 'Pearl Garments', 'Quartz Infracon',
  'Ruby Packaging', 'Sapphire Foods', 'Topaz Organics', 'Unity Agencies',
  'Vista Engineering', 'Willow Traders', 'Xenon Powertech', 'Yashvi Exports',
  'Zephyr Marine', 'Anvil Hardware', 'Bloom Florals', 'Cedar Timber',
  'Delta Paints', 'Eagle Transport', 'Flora Herbals', 'Globe Imports',
  'Harvest Grains', 'Icon Plastics', 'Jupiter Cables', 'Keystone Cement',
  'Lakshya Forge', 'Meridian Paper', 'Nexus Appliances', 'Orbit Solar',
  'Paragon Tyres', 'Quest Data', 'Radiant Silks', 'Summit Dairy',
  'Trident Oils', 'Uptown Decor', 'Vertex Glass', 'Wave Packaging',
  'Axis Alloys', 'Bravo Spices', 'Crest Leather', 'Dawn Fertilizers',
  'Ekta Textiles', 'Frost Beverages', 'Glow Cosmetics', 'Harbor Seafood',
  'Iris Biotech', 'Jewel Handicrafts', 'Kindle Paper Mills', 'Luna Ceramics',
  'Mantri Agritech', 'Noble Foods', 'Onyx Minerals', 'Presto Packaging',
  'Quasar IT Services', 'Rampart Steel', 'Stellar Optics', 'Titan Rubber',
  'Umbra Chemicals', 'Valor Electricals', 'Winsome Fabrics', 'Xcel Pharma',
  'Yuva Retail', 'Zinnia Organics', 'Almond Dairy', 'Bamboo Crafts',
  'Cascade Beverages', 'Dew Agro', 'Epoch Systems', 'Flame Ceramics',
  'Glacier Cold Chain', 'Helm Navigation', 'Ivory Exports', 'Jubilee Foods',
  'Kite Packaging', 'Lyric Textiles', 'Monsoon Spices', 'Nectar Juices',
  'Olive Trading', 'Pulse Healthcare', 'Quill Stationery', 'Reef Marine',
  'Spruce Timber', 'Tidal Logistics', 'Urban Supplies', 'Velvet Fabrics',
  'Wharf Shipping', 'Xander Tech', 'Yarn Traders', 'Zenith Cargo',
  'Astra Polymers', 'Bolt Fasteners', 'Crown Ceramics', 'Drift Logistics',
  'Elm Wood Industries', 'Forge Metals', 'Grain Harvest', 'Halo Lighting',
  'Inlet Fisheries', 'Joy Cosmetics', 'Knot Textiles', 'Leaf Organics',
  'Mesa Mining', 'Neem Agro', 'Oak Furniture', 'Pine Resin',
  'Quay Shipping', 'Ridge Construction', 'Sage Herbals', 'Thorn Chemicals',
  'Ursa Power', 'Vine Agriculture', 'Wren Exports', 'Yarrow Pharma',
  'Zeal Ventures', 'Arch Builders', 'Bay Traders', 'Cliff Minerals',
  'Dale Dairy', 'Edge Computing', 'Fern Botanicals', 'Gale Logistics',
  'Heath Foods', 'Isle Marine', 'Jute Textiles', 'Kirk Engineering',
  'Loom Fabrics', 'Marsh Grains', 'Nook Retail', 'Ore Metals',
  'Plume Fashion', 'Rill Beverages', 'Shore Seafood', 'Trail Outdoors',
  'Vale Organics', 'Weld Steel', 'Axis Finserv', 'Birch Paper',
  'Cove Marine', 'Dune Ceramics', 'Estuary Exports', 'Fjord Shipping',
  'Glen Dairy', 'Hill Farms', 'Inlet Trading', 'Jetty Logistics',
  'Kern Minerals', 'Lane Transport', 'Moor Agriculture', 'Narrows Impex',
  'Oasis Beverages', 'Peak Enterprises', 'Quarry Cement', 'Reef Exports',
  'Strait Shipping', 'Tor Mining', 'Upland Farms', 'Vane Instruments',
  'Weir Engineering', 'Yard Supplies', 'Arena Sports', 'Basin Water',
  'Canal Logistics', 'Dell Computing', 'Estuary Trading', 'Forge Works',
];

// ─── Deterministic amount generator ──────────────────────────────────────────
// Seeded from index to be reproducible, not random on each run.
function deterministicAmount(index: number): number {
  const base = [
    15000, 22500, 48000, 72000, 35000, 95000, 18000, 67500,
    42000, 88000, 12000, 55000, 31000, 79000, 26000, 63000,
  ];
  const multiplier = 1 + (index % 7) * 0.1; // vary by ±0-70%
  return Math.round(base[index % base.length] * multiplier);
}

async function generate() {
  const db = getServerClient();
  console.log('Generating synthetic data...');

  // 0. Clean up ALL previous data (complete reset)
  console.log('Cleaning up previous data...');
  await db.from('audit_events').delete().neq('id', 0);
  await db.from('commitments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('payment_links').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('reply_parses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('debtor_replies').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('outreach_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('recovery_cases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('processing_jobs').delete().neq('id', 0);
  await db.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('debtors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await db.from('merchants').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 1. Create a Merchant
  const merchantId = uuidv4();
  await db.from('merchants').insert({
    id: merchantId,
    name: 'Acme Corp',
  });
  console.log(`Created merchant ${merchantId}`);

  // 2. Distribute cases
  let debtorsToCreate: any[] = [];
  let invoicesToCreate: any[] = [];
  
  let invoiceCounter = 0;

  for (const [scenario, count] of Object.entries(SCENARIO_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      const debtorId = uuidv4();
      const businessName = BUSINESS_NAMES[invoiceCounter % BUSINESS_NAMES.length];
      const invoiceNum = `INV-${String(2001 + invoiceCounter).padStart(4, '0')}`;
      const amount = deterministicAmount(invoiceCounter);

      debtorsToCreate.push({
        id: debtorId,
        merchant_id: merchantId,
        name: businessName,
        // Scenario metadata stored ONLY in contact_ref — never displayed in UI
        contact_ref: `scenario:${scenario.toLowerCase()}:${invoiceCounter}@demo.recoup.internal`,
      });

      invoicesToCreate.push({
        id: uuidv4(),
        merchant_id: merchantId,
        debtor_id: debtorId,
        invoice_number: invoiceNum,
        original_amount: amount,
        outstanding_amount: amount,
        currency: 'INR',
        original_due_date: '2026-01-01', // Fixed past date so they are all overdue
        status: 'OVERDUE',
      });
      
      invoiceCounter++;
    }
  }

  // Insert in batches to avoid payload limits
  const BATCH_SIZE = 50;
  
  console.log(`Inserting ${debtorsToCreate.length} debtors...`);
  for (let i = 0; i < debtorsToCreate.length; i += BATCH_SIZE) {
    const batch = debtorsToCreate.slice(i, i + BATCH_SIZE);
    const { error } = await db.from('debtors').insert(batch);
    if (error) console.error(`Debtor batch ${i} error:`, error.message);
  }
  
  console.log(`Inserting ${invoicesToCreate.length} invoices...`);
  for (let i = 0; i < invoicesToCreate.length; i += BATCH_SIZE) {
    const batch = invoicesToCreate.slice(i, i + BATCH_SIZE);
    const { error } = await db.from('invoices').insert(batch);
    if (error) console.error(`Invoice batch ${i} error:`, error.message);
  }

  console.log(`\n✓ Synthetic data generation complete.`);
  console.log(`  ${invoiceCounter} invoices across ${Object.keys(SCENARIO_DISTRIBUTION).length} scenarios`);
  console.log(`  Invoice IDs: INV-2001 through INV-${String(2000 + invoiceCounter).padStart(4, '0')}`);
  console.log(`  Scenario metadata stored in contact_ref (not in debtor names or invoice numbers)`);
  console.log(`\nNext: Run the simulation to spawn recovery cases and advance the simulated clock.`);
}

// Run if called directly
if (require.main === module) {
  generate().catch((err) => {
    console.error('Fatal error during data generation:', err);
    process.exit(1);
  });
}
