import { prisma } from '../src/server/db.js';
import { reconcileReferralRewards } from '../src/server/referral-reconciliation.js';

function readFlag(name: string) {
  return process.argv.includes(name);
}

function readOption(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const dryRun = !readFlag('--write');
  const referrerId = readOption('--referrer');
  const refereeId = readOption('--referee');

  const summary = await reconcileReferralRewards({
    dryRun,
    referrerId,
    refereeId,
  });

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? 'dry-run' : 'write',
        scannedPairs: summary.scannedPairs,
        creditedPairs: summary.creditedPairs,
        overpaidPairs: summary.overpaidPairs,
        totalCredited: summary.totalCredited,
        rows: summary.rows.filter((row) => row.status !== 'ok'),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
