import cdk = require('@aws-cdk/core');
import { Configuration, Microservice } from '../Microservice';
import { MicroserviceRoleTableAccess } from '../MicroserviceRole';

export class Transaction extends Microservice {
  constructor(scope: cdk.Construct, id: string, configuration: Configuration) {
    super(scope, id, {
      hsPackageName: 'transaction',
      tableAcessLevel: MicroserviceRoleTableAccess.RW,
      lambdaTimeout: cdk.Duration.seconds(10)
    },    configuration);
  }
}
