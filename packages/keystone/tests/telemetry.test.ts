import fetch, { Response } from 'node-fetch';
import { sendTelemetryEvent } from '../src/lib/telemetry';

const eventData = {
  device: 'unique-device-id',
  project: 'unique-project',
  schema: 'unique-schema',
  keystoneVersion: '1.0.0',
  environment: 'development',
  os: 'keystone-os',
  osLanguage: 'keystone_AU',
  event: 'test-event',
};

const fetchOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const defaultFetchParam = {
  ...fetchOptions,
  body: JSON.stringify({
    ...eventData,
    project: `${eventData.project}-hashed`,
    schema: `${eventData.schema}-hashed`,
  }),
};

jest.mock('node-machine-id', () => {
  return {
    machineIdSync: () => eventData.device,
  };
});

jest.mock('os', () => {
  return { platform: () => eventData.os };
});

jest.mock('crypto', () => {
  return { createHash: () => ({ update: (text: string) => ({ digest: () => `${text}-hashed` }) }) };
});

jest.mock('node-fetch', () => jest.fn());

process.env.LC_ALL = eventData.osLanguage;
process.env.npm_package_dependencies__keystone_next_keystone = eventData.keystoneVersion;

describe('telemetry', () => {
  afterEach(() => {
    // Reset env variables
    delete process.env.TELEMETRY_DISABLED;
    delete process.env.TELEMETRY_ENDPOINT;

    // clear mocks (fetch specifically)
    jest.clearAllMocks();
  });

  test('sendTelemetryEvent calls with expected data', () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockImplementationOnce(async () => ({} as Response));
    sendTelemetryEvent('test-event', 'development', eventData.project, eventData.schema);

    expect(mockFetch).toHaveBeenCalledWith(`http://localhost:4000/event`, defaultFetchParam);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('sendTelemetryEvent uses endpoint override', () => {
    const endpoint = 'https://keylemetry.com';
    process.env.TELEMETRY_ENDPOINT = endpoint;
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockImplementationOnce(async () => ({} as Response));

    sendTelemetryEvent('test-event', 'development', eventData.project, eventData.schema);

    expect(mockFetch).toHaveBeenCalledWith(`${endpoint}/event`, defaultFetchParam);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("sendTelemetryEvent doesn't fetch when telemetry is disabled", () => {
    process.env.TELEMETRY_DISABLED = 'true';
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockImplementationOnce(async () => ({} as Response));
    sendTelemetryEvent('test', 'development', 'here', 'asd');
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });

  test('fetch throwing an error wont bubble up', () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockImplementationOnce(() => {
      throw new Error();
    });

    expect(sendTelemetryEvent).not.toThrow();
    sendTelemetryEvent('test-event', 'development', eventData.project, eventData.schema);
  });
});
