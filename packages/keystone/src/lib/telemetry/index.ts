import fetch from 'node-fetch';
import Conf from 'conf';
import { ListSchemaConfig } from '../../types';
import { defaults } from '../config/defaults';
import { deviceInfo } from './deviceInfo';
import { projectInfo } from './projectInfo';

const userConfig = new Conf();
const userTelemetryDisabled = userConfig.get('telemetry.disabled');

if (userTelemetryDisabled) {
  process.env.KEYSTONE_TELEMETRY_DISABLED = '1';
}

// If Keystone telemetry is disabled also disable
// NextJS & Prisma telemetry
if (process.env.KEYSTONE_TELEMETRY_DISABLED === '1') {
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.CHECKPOINT_DISABLE = '1';
}

export function sendTelemetryEvent(
  eventType: string,
  cwd: string,
  dbProvider?: string,
  lists?: ListSchemaConfig
) {
  try {
    if (process.env.KEYSTONE_TELEMETRY_DISABLED === '1') {
      return;
    }

    const eventData = {
      ...deviceInfo(),
      ...projectInfo(cwd, lists),
      dbProvider,
      eventType,
    };

    const telemetryEndpoint = process.env.KEYSTONE_TELEMETRY_ENDPOINT || defaults.telemetryEndpoint;
    const telemetryUrl = `${telemetryEndpoint}/v1/event`;

    if (process.env.KEYSTONE_TELEMETRY_DEBUG === '1') {
      console.log(`[Telemetry]: ${telemetryUrl}`);
      console.log(eventData);
    } else {
      // Do not `await` to keep non-blocking
      fetch(telemetryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })
        .then(
          () => {},
          () => {}
        )
        // Catch silently
        .catch(() => {});
    }
  } catch (err) {
    // Fail silently
  }
}
