#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/core');
import { HonestyStore } from '../lib/honesty-store';

const app = new cdk.App();
new HonestyStore(app, 'zr-hs');