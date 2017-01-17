import express = require('express');
import bodyParser = require('body-parser');
import registerController from './controllers/register';
import sessionController from './controllers/session';
import signInController from './controllers/signin';
import topUpController from './controllers/topup';
import purchaseController from './controllers/purchase';
import storeController from './controllers/store';
import logoutController from './controllers/logout';
import transactionsController from './controllers/transactions';

const app = express();
const router = express.Router();

app.use(bodyParser.json());

registerController(router);
sessionController(router);
signInController(router);
topUpController(router);
purchaseController(router);
storeController(router);
logoutController(router);
transactionsController(router);

app.use('/api/v1', router);

// send healthy response to load balancer probes
app.get('/', (req, res) => {
  res.send(200);
});

app.listen(3000);