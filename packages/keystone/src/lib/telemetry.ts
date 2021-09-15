import os from 'os';
import { createHash } from 'crypto';
import fetch from 'node-fetch';
import { machineIdSync } from 'node-machine-id';
import { defaults } from './config/defaults';

const hashText = (text: string) => {
  return createHash('sha256').update(text).digest('hex');
};

export function sendTelemetryEvent(
  event: string,
  environment: string,
  cwd: string,
  prismaSchema?: string
) {
  try {
    if (process.env.TELEMETRY_DISABLED === 'true') {
      return;
    }

    const eventData = {
      device: machineIdSync(), // Will be hashed by default
      project: process.env.TELEMETRY_PROJECT || hashText(cwd),
      schema: prismaSchema && hashText(prismaSchema),
      // Will need to change this in a way that won't break when keystone isn't next anymore
      keystoneVersion: process.env.npm_package_dependencies__keystone_next_keystone,
      environment,
      os: os.platform(),
      osLanguage:
        process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || process.env.LANGUAGE,
      event,
    };

    const telemetryEndpoint = process.env.TELEMETRY_ENDPOINT || defaults.telemetryEndpoint;

    // Do not `await` to keep non-blocking
    fetch(`${telemetryEndpoint}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    })
      .then()
      // Catch silently
      .catch(() => {});
  } catch (err) {
    // Fail silently
  }
}
