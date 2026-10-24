#!/usr/bin/env node
import { execFile, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const execFileAsync = promisify(execFile);

const SDK_ROOT =
  process.env.ANDROID_SDK_ROOT ??
  process.env.ANDROID_HOME ??
  join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk');

const isWindows = process.platform === 'win32';
const ADB = join(SDK_ROOT, 'platform-tools', `adb${isWindows ? '.exe' : ''}`);
const EMULATOR = join(SDK_ROOT, 'emulator', `emulator${isWindows ? '.exe' : ''}`);
const APPIUM_URL = process.env.APPIUM_URL ?? 'http://127.0.0.1:4723';
const APP_PACKAGE = process.env.APP_PACKAGE ?? 'com.shop.mobile';

async function adb(args, timeout = 60_000) {
  const { stdout, stderr } = await execFileAsync(ADB, args, { timeout, maxBuffer: 20 * 1024 * 1024 });
  return (stdout || stderr).trim();
}

const server = new Server(
  { name: 'android-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const TOOLS = [
  {
    name: 'list_avds',
    description: 'List the Android virtual devices available on this machine.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_devices',
    description: 'List attached devices/emulators and their state.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'start_emulator',
    description:
      'Boot an AVD in the background. Always follow with wait_for_boot before doing anything else.',
    inputSchema: {
      type: 'object',
      properties: {
        avd: { type: 'string', description: 'AVD name, e.g. shop_test' },
        coldBoot: { type: 'boolean', description: 'Skip the saved snapshot' },
      },
      required: ['avd'],
    },
  },
  {
    name: 'wait_for_boot',
    description:
      'MANDATORY after start_emulator. Polls sys.boot_completed until the device is genuinely usable. The boot sequence reports "device offline" then empty then 1; acting before this returns is the single largest source of flake.',
    inputSchema: {
      type: 'object',
      properties: {
        timeoutSeconds: { type: 'number', description: 'Default 180' },
      },
    },
  },
  {
    name: 'install_apk',
    description: 'Install (or reinstall) an APK on the running device.',
    inputSchema: {
      type: 'object',
      properties: {
        apkPath: { type: 'string' },
      },
      required: ['apkPath'],
    },
  },
  {
    name: 'clear_app_data',
    description: 'Wipe the app\'s data, which is the fastest way to reach a signed-out state.',
    inputSchema: {
      type: 'object',
      properties: { appPackage: { type: 'string' } },
    },
  },
  {
    name: 'screenshot',
    description:
      'Capture the screen. Uses screencap plus pull, never a shell redirect, which corrupts the PNG on Windows.',
    inputSchema: {
      type: 'object',
      properties: { outputPath: { type: 'string' } },
      required: ['outputPath'],
    },
  },
  {
    name: 'tail_logcat',
    description: 'Return the last N lines of logcat, optionally filtered.',
    inputSchema: {
      type: 'object',
      properties: {
        lines: { type: 'number', description: 'Default 200' },
        filter: { type: 'string', description: 'Substring to match' },
      },
    },
  },
  {
    name: 'dump_ui',
    description:
      'Dump the current view hierarchy and return the resource-ids present. Use to confirm which screen is showing before asserting.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_appium_status',
    description: 'Check whether an Appium server is reachable.',
    inputSchema: { type: 'object', properties: {} },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

const ok = (payload) => ({
  content: [{ type: 'text', text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2) }],
});
const fail = (message) => ({ content: [{ type: 'text', text: `ERROR: ${message}` }], isError: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    switch (name) {
      case 'list_avds': {
        const { stdout } = await execFileAsync(EMULATOR, ['-list-avds'], { timeout: 30_000 });
        return ok({ sdkRoot: SDK_ROOT, avds: stdout.trim().split(/\r?\n/).filter(Boolean) });
      }

      case 'list_devices':
        return ok(await adb(['devices', '-l']));

      case 'start_emulator': {
        const emulatorArgs = ['-avd', args.avd, '-no-boot-anim', '-gpu', 'swiftshader_indirect'];
        if (args.coldBoot) emulatorArgs.push('-no-snapshot-load');

        const child = spawn(EMULATOR, emulatorArgs, { detached: true, stdio: 'ignore' });
        child.unref();
        return ok({ started: args.avd, note: 'Call wait_for_boot before doing anything else.' });
      }

      case 'wait_for_boot': {
        const timeoutMs = (args.timeoutSeconds ?? 180) * 1000;
        const deadline = Date.now() + timeoutMs;
        let last = '';
        while (Date.now() < deadline) {
          try {
            last = await adb(['shell', 'getprop', 'sys.boot_completed'], 10_000);
            if (last === '1') {
              await adb(['shell', 'input', 'keyevent', 'KEYCODE_WAKEUP']).catch(() => {});
              return ok({ booted: true, waitedMs: timeoutMs - (deadline - Date.now()) });
            }
          } catch (err) {
            last = err.message;
          }
          await sleep(3000);
        }
        return fail(`Emulator did not report sys.boot_completed=1 within ${args.timeoutSeconds ?? 180}s (last: ${last})`);
      }

      case 'install_apk': {
        if (!existsSync(args.apkPath)) return fail(`No APK at ${args.apkPath}`);
        return ok(await adb(['install', '-r', args.apkPath], 300_000));
      }

      case 'clear_app_data':
        return ok(await adb(['shell', 'pm', 'clear', args.appPackage ?? APP_PACKAGE]));

      case 'screenshot': {
        await adb(['shell', 'screencap', '-p', '/sdcard/mcp-shot.png']);
        await adb(['pull', '/sdcard/mcp-shot.png', args.outputPath]);
        return ok({ saved: args.outputPath });
      }

      case 'tail_logcat': {
        const out = await adb(['logcat', '-d', '-t', String(args.lines ?? 200)]);
        const lines = out.split(/\r?\n/);
        const filtered = args.filter
          ? lines.filter((l) => l.toLowerCase().includes(args.filter.toLowerCase()))
          : lines;
        return ok(filtered.join('\n'));
      }

      case 'dump_ui': {
        await adb(['shell', 'uiautomator', 'dump', '/sdcard/mcp-ui.xml']);
        const xml = await adb(['shell', 'cat', '/sdcard/mcp-ui.xml']);
        const ids = [...xml.matchAll(/resource-id="([^"]+)"/g)].map((m) => m[1]);
        return ok({ resourceIds: [...new Set(ids)].sort() });
      }

      case 'get_appium_status': {
        try {
          const response = await fetch(`${APPIUM_URL}/status`);
          return ok({ url: APPIUM_URL, reachable: response.ok, body: await response.json() });
        } catch (err) {
          return ok({ url: APPIUM_URL, reachable: false, error: err.message });
        }
      }

      default:
        return fail(`Unknown tool '${name}'`);
    }
  } catch (err) {
    return fail(err.message);
  }
});

await server.connect(new StdioServerTransport());
