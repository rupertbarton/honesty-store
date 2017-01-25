import { config, DynamoDB } from 'aws-sdk';
import bodyParser = require('body-parser');
import express = require('express');
import { v4 as uuid } from 'uuid';
import isUUID = require('validator/lib/isUUID');
import * as stripeFactory from 'stripe';
import * as winston from 'winston';

import { TransactionDetails, createTransaction, getAccount, balanceLimit } from '../../transaction/src/client/index';
import { TopupAccount, TopupRequest } from './client/index';
import serviceRouter from '../../service/src/router';
import { Key } from '../../service/src/key';
import { error, info } from '../../service/src/log';

const fixedTopupAmount = 500; // £5

const stripeTest = stripeFactory(process.env.STRIPE_SECRET_KEY_TEST);
const stripeProd = stripeFactory(process.env.STRIPE_SECRET_KEY_LIVE);

config.region = process.env.AWS_REGION;

const createAssertValidUuid = (name) =>
    (uuid) => {
        if (uuid == null || !isUUID(uuid, 4)) {
            throw new Error(`Invalid ${name} ${uuid}`);
        }
    };


const assertValidAccountId = createAssertValidUuid('accountId');
const assertValidUserId = createAssertValidUuid('userId');

const assertValidTopupAccount = (topupAccount: TopupAccount) => {
    assertValidAccountId(topupAccount.accountId);
};

const stripeForUser = ({ test }) => {
    return test ? stripeTest : stripeProd;
};

const get = async ({ userId }): Promise<TopupAccount> => {
    assertValidUserId(userId);

    const queryResponse = await new DynamoDB.DocumentClient()
        .query({
            TableName: process.env.TABLE_NAME,
            IndexName: 'userId',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        })
        .promise();

    if (queryResponse.Items.length > 1) {
        throw new Error(`Too many database entries for userId '${userId}'`);
    }

    const indexItem = queryResponse.Items[0];

    if (indexItem == null) {
        throw new Error(`No topup account for ${userId}`);
    }

    const { id } = indexItem;

    const getResponse = await new DynamoDB.DocumentClient()
        .get({
            TableName: process.env.TABLE_NAME,
            Key: { id }
        })
        .promise();

    const item = <TopupAccount>getResponse.Item;

    if (item == null) {
        throw new Error(`Index lookup failed for ${userId} ${id}`);
    }

    return item;
};

const update = async ({ topupAccount }: { topupAccount: TopupAccount }) => {
    assertValidTopupAccount(topupAccount);

    const response = await new DynamoDB.DocumentClient()
        .update({
            TableName: process.env.TABLE_NAME,
            Key: {
                id: topupAccount.id
            },
            UpdateExpression:
                `set stripe = :stripe, accountId = :accountId, userId = :userId`,
            ExpressionAttributeValues: {
                ':stripe': topupAccount.stripe || {},
                ':accountId': topupAccount.accountId,
                ':userId': topupAccount.userId,
            },
        })
        .promise();

    return topupAccount;
};

const getOrCreate = async ({ key, accountId, userId }): Promise<TopupAccount> => {
    assertValidAccountId(accountId);
    assertValidUserId(userId);

    try {
        return await get({ userId });
    }
    catch (e) {
        info(key, 'TopupAccount lookup failed, creating account', e);
        return update({
            topupAccount: {
                id: uuid(),
                userId,
                accountId,
                test: false,
            }
        });
    }
};

const appendTopupTransaction = async ({ key, topupAccount, amount, data }: { key: Key, topupAccount: TopupAccount, amount: number, data: any }) => {
    const transactionDetails: TransactionDetails = {
        type: 'topup',
        amount,
        data: {
            ...data,
            topupAccountId: topupAccount.id,
            topupCustomerId: topupAccount.stripe.customer.id,
        }
    };

    try {
        return await createTransaction(key, topupAccount.accountId, transactionDetails);
    } catch (e) {
        error(key, `couldn't createTransaction()`, e);
        // remap error message
        throw new Error(`couldn't add transaction: ${e.message}`);
    }
};

const createStripeCharge = async ({ key, topupAccount, amount }: { key: Key, topupAccount: TopupAccount, amount: number }) => {
    try {
        return await stripeForUser(topupAccount).charges.create({
            amount,
            currency: 'gbp',
            customer: topupAccount.stripe.customer.id,
            description: `topup for ${topupAccount.accountId}`,
            metadata: {
                accountId: topupAccount.accountId
            },
            expand: ['balance_transaction'],
        },
        {
            idempotency_key: topupAccount.stripe.nextChargeToken,
        });
    } catch (e) {
        error(key, `couldn't create stripe charge`, e);
        if (e.message === 'Must provide source or customer.') {
            /* Note to future devs: this error appears to be a bug with stripe's API.
             *
             * We've correctly provided a customer, so the error seems odd. I
             * believe it's to do with the idempotency_key being incorrect, so
             * that's the first place to start looking. */
            throw new Error(`${e.message} (from topup: or the idempotency_key has already been used)`);
        }

        throw e;
    }
};

const stripeDetailsValid = (topupAccount: TopupAccount) => {
    return topupAccount.stripe
        && topupAccount.stripe.customer
        && topupAccount.stripe.nextChargeToken;
};

const assertBalanceWithinLimit = async ({ key, accountId, amount }) => {
    const currentBalance = (await getAccount(key, accountId)).balance;

    if (currentBalance + amount > balanceLimit) {
        throw new Error(`topping up would increase balance over the limit of £${balanceLimit / 100}`);
    }
};

const topupExistingAccount = async ({ key, topupAccount, amount }: { key: Key, topupAccount: TopupAccount, amount: number }) => {
    if (!stripeDetailsValid(topupAccount)) {
        throw new Error(`No stripe details registered for ${topupAccount.test ? 'test ' : ''}account ${topupAccount.accountId} - please provide stripeToken`);
    }

    await assertBalanceWithinLimit({ key, accountId: topupAccount.accountId, amount });

    const charge = await createStripeCharge({ key, topupAccount, amount });

    const transactionDetails = await appendTopupTransaction({
        key,
        amount,
        topupAccount,
        data: {
            stripeFee: String(charge.balance_transaction.fee),
            chargeId: String(charge.id),
        }
    });

    topupAccount.stripe.nextChargeToken = uuid();
    await update({ topupAccount });

    return transactionDetails;
};

const recordCustomerDetails = async ({ customer, topupAccount }): Promise<TopupAccount> => {
    if (stripeDetailsValid(topupAccount)) {
        throw new Error(`Already have stripe details for '${topupAccount.accountId}'`);
    }

    const newAccount = {
        ...topupAccount,
        stripe: {
            customer,
            nextChargeToken: uuid(),
        }
    }

    return update({ topupAccount: newAccount });
};

const addStripeTokenToAccount = async ({ topupAccount, stripeToken }): Promise<TopupAccount> => {
    const customer = await stripeForUser(topupAccount)
        .customers
        .create({
            source: stripeToken,
            description: `registration for ${topupAccount.accountId}`,
            metadata: {
                accountId: topupAccount.accountId
            }
        });

    return await recordCustomerDetails({ customer, topupAccount });
};

const assertValidTopupAmount = (amount) => {
    if (amount !== fixedTopupAmount) {
        throw new Error(`topup amount must be £${fixedTopupAmount / 100}`);
    }
};

const attemptTopup = async ({ key, accountId, userId, amount, stripeToken }: TopupRequest & { key: Key }) => {
    assertValidTopupAmount(amount);

    let topupAccount = await getOrCreate({ key, accountId, userId });

    if (stripeToken) {
        if (stripeDetailsValid(topupAccount)) {
            throw new Error(`Already have stripe details for '${accountId}'`);
        }

        topupAccount = await addStripeTokenToAccount({ topupAccount, stripeToken });
    }

    return topupExistingAccount({ key, topupAccount, amount })
};

const assertDynamoConnectivity = async () => {
    await new DynamoDB.DocumentClient()
        .get({
            TableName: process.env.TABLE_NAME,
            Key: {
                id: 'non-existent-id'
            },
        })
        .promise();
};

const assertStripeConnectivity = async ({ test }) => {
    await stripeForUser({ test })
        .balance
        .retrieve()
};

const assertConnectivity = async () => {
    await assertDynamoConnectivity();
    await assertStripeConnectivity({ test: false });
    await assertStripeConnectivity({ test: true });
};

const app = express();

app.use(bodyParser.json());

const router = serviceRouter('topup');

router.post(
    '/',
    1,
    async (key, {}, { accountId, userId, amount, stripeToken }) =>
        attemptTopup({ key, accountId, userId, amount, stripeToken })
);

app.use(router);

// send healthy response to load balancer probes
app.get('/', (req, res) => {
    assertConnectivity()
        .then(() => res.sendStatus(200))
        .catch(() => res.sendStatus(500));
});

app.listen(3000);
