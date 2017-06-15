// tslint:disable:no-console
import { config } from 'aws-sdk';
import cruftDDB from 'cruft-ddb';
import uuid = require('uuid/v4');
import { Batch, MARKETPLACE_ID } from '@honesty-store/batch';
import { createMarketplaceBox, MarketplaceBoxSubmission } from '@honesty-store/box';
import { createServiceKey } from '@honesty-store/service/lib/key';

config.region = process.env.AWS_REGION;

const usage = (help): never => {
  // require: storeId, itemId, vat (assume 0?), userId, expiry
  console.error('Usage: path/to/script store-id user-id item-id total-cost count expiry dry-run');
  console.error(help);
  // tslint:disable-next-line:no-constant-condition
  while (true) {
    process.exit(2);
  }
};

const throwParseError = (type, name, str) => {
  throw new Error(`${name} not a ${type} (${str})`);
};

const maybeParseBool = (str, name) => {
  if (str === 'true') { return true; }
  if (str === 'false') { return false; }

  throwParseError('boolean', name, str);
};

const maybeParseInt = (str, name) => {
  const i = Number(str);
  if (Number.isInteger(i)) {
    return i;
  }

  throwParseError('number', name, str);
};

const createBatch = async (
  { userId, itemId, count, expiry, totalCost }: { userId: string, itemId: string, count: number, expiry: number, totalCost: number },
  isDryRun: boolean
) => {
  if (process.env.TABLE_NAME == null) {
    throw new Error('$TABLE_NAME not defined');
  }
  const cruft = cruftDDB<Batch>({
    tableName: process.env.TABLE_NAME
  });
  const batch: Batch & { version: 0 } = {
    id: uuid(),
    quantity: 1,
    itemQuantity: count,
    expiry,
    itemId,
    priceExcludingVAT: totalCost,
    VATRate: 0,
    supplier: MARKETPLACE_ID,
    supplierCode: userId,
    version: 0
  };

  if (isDryRun) {
    return batch;
  }
  return await cruft.create(batch);
};

const main = async (argv) => {
  if (argv.length !== 7) { usage('wrong number of arguments'); }

  const storeId = argv[0];
  const userId = argv[1];
  const itemId = argv[2];
  const totalCost = maybeParseInt(argv[3], 'total cost');
  const count = maybeParseInt(argv[4], 'count');
  const expiry = maybeParseInt(argv[5], 'expiry');
  const isDryRun = maybeParseBool(argv[6], 'dryrun');

  const batchDetails = {
    itemId,
    count,
    totalCost,
    expiry,
    userId
  };

  const batch = await createBatch(batchDetails, isDryRun);

  const key = createServiceKey({ service: 'marketplace-script' });

  const submission: MarketplaceBoxSubmission = {
    donationRate: 0,
    boxItem: {
      itemID: itemId,
      batches: [
        {
          id: batch.id,
          count
        }
      ]
    }
  };

  const box = await createMarketplaceBox(key, storeId, submission, isDryRun);

  const output = {
    batch,
    storeId,
    box
  };
  console.log(JSON.stringify(output, null, 2));
};

main(process.argv.slice(2))
  .then(() => void 0)
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
