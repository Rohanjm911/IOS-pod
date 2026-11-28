import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Made by Rohan JM aka TheRedDragon
export type DacSampleRate = 'native' | 44100 | 48000 | 88200 | 96000 | 176400 | 192000;

export type DacRoutingStatus = 'default' | 'routed' | 'unsupported' | 'error';

export type AudioDeviceKind = 'dac' | 'bluetooth' | 'system';

export interface AudioOutputDeviceInfo {
  deviceId: string;
  label: string;
  isLikelyDac: boolean;
  isLikelyBluetooth: boolean;
  connectionType: AudioDeviceKind;
  /** True when the browser redacted the device label due to missing media permission. */
  labelRedacted?: boolean;
}

const DAC_KEYWORDS = [
  // Generic & Transport
  'dac',
  'amp/dac',
  'dac/amp',
  'usb audio',
  'usb-audio',
  'usb-c audio',
  'type-c audio',
  'usb-c to 3.5',
  'uac1',
  'uac2',
  'spdif',
  's/pdif',
  'optical',
  'toslink',
  'coaxial',
  'asio',
  'wasapi',
  'hi-res',
  'hires',
  'headphone amp',
  'headphone amplifier',
  'line out',
  '24-bit',
  '32-bit',
  '192khz',
  '384khz',
  'dsd',
  'mqa',
  'r2r',
  // Dongles & Chi-Fi / Portable DACs
  'fiio',
  'ifi',
  'topping',
  'smsl',
  's.m.s.l',
  'shanling',
  'hiby',
  'moondrop',
  'truthear',
  'tanchjim',
  'tempotec',
  'hidizs',
  'xduoo',
  'cayin',
  'aune',
  'gustard',
  'singxer',
  'loxjie',
  'sabaj',
  'fosi',
  'aiyima',
  'jcally',
  'ddhifi',
  'questyle',
  'astell',
  'earmen',
  'zorloo',
  'khadas',
  'qudelix',
  'btr',
  'utws',
  'dragonfly',
  'meizu hifi',
  'apple usb-c',
  // Desktop / Audiophile DACs
  'schiit',
  'chord',
  'mojo',
  'qutest',
  'jds labs',
  'geshelli',
  'benchmark',
  'mytek',
  'rme',
  'adi-2',
  'denafrips',
  'holo audio',
  'soekris',
  'cambridge audio',
  'dacmagic',
  'arcam',
  'marantz',
  'denon',
  'rotel',
  'teac',
  'esoteric',
  'walkman',
  'meridian',
  'centrance',
  'burson',
  'audio-gd',
  'yulong',
  'pro-ject',
  'wiim',
  'audioquest',
  // Studio / Pro Audio Interfaces
  'focusrite',
  'scarlett',
  'clarett',
  'audient',
  'motu',
  'universal audio',
  'apollo',
  'presonus',
  'steinberg',
  'behringer',
  'native instruments',
  'komplete',
  'solid state logic',
  'arturia',
  'minifuse',
  'tascam',
  'apogee',
  'antelope',
  'babyface',
  'fireface',
  'm-audio',
  // DAC Chipsets
  'ab13x',
  'cx31993',
  'alc5686',
  'alc4050',
  'alc4080',
  'kt02h20',
  'cs43131',
  'cs43198',
  'cs4398',
  'es90',
  'es92',
  'sabre',
  'ak44',
  'akm',
  'pcm17',
  'pcm51',
  'burr-brown',
  'burr brown',
  'wolfson',
  'wm87',
];

const BUILTIN_EXCLUSIONS = [
  'realtek(r) audio',
  'built-in',
  'internal speakers',
  'nvidia high definition',
  'amd high definition',
  'intel(r) display audio',
];

const BLUETOOTH_KEYWORDS = [
  'bluetooth',
  'airpods',
  'buds',
  'galaxy buds',
  'oneplus buds',
  'nothing ear',
  'wh-1000',
  'wf-1000',
  'bose',
  'jbl',
  'beats',
  'boat',
  'noise ',
  'boult',
  'sennheiser',
  'marshall',
  'skullcandy',
  'soundcore',
  'jabra',
  'hands-free',
  'a2dp',
  'avrcp',
  'wireless',
  'tws',
  'earbuds',
  'neckband',
  'car audio',
  'bt-',
  'bt ',
];

/** Returns true when an audio output label looks like a Bluetooth headset, earbuds, or speaker. */
export function isLikelyBluetoothDevice(label: string): boolean {
  const lower = label.toLowerCase().trim();
  if (!lower) return false;
  return BLUETOOTH_KEYWORDS.some((kw) => lower.includes(kw));
}

export function isWebBluetoothSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof (navigator as Navigator & { bluetooth?: { requestDevice?: unknown } }).bluetooth?.requestDevice === 'function';
}

/** Returns true when an audio output label looks like an external USB/desktop/studio DAC or hi-fi interface. */
export function isLikelyDacDevice(label: string): boolean {
  const lower = label.toLowerCase().trim();
  if (!lower) return false;
  if (DAC_KEYWORDS.some((kw) => lower.includes(kw))) return true;
  if (BUILTIN_EXCLUSIONS.some((ex) => lower.includes(ex))) return false;
  // Generic USB / External headphones or dongle adapters
  if (lower.includes('usb') && (lower.includes('headphone') || lower.includes('audio') || lower.includes('dongle'))) {
    return true;
  }
  return false;
}

export function isSinkSelectionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const proto = typeof HTMLMediaElement !== 'undefined' ? (HTMLMediaElement.prototype as { setSinkId?: unknown }) : null;
  const ctxProto = typeof AudioContext !== 'undefined' ? (AudioContext.prototype as { setSinkId?: unknown }) : null;
  return Boolean(proto?.setSinkId || ctxProto?.setSinkId);
}

export function isOsOutputPickerSupported(): boolean {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) return false;
  return typeof (navigator.mediaDevices as { selectAudioOutput?: unknown }).selectAudioOutput === 'function';
}

export function isWebUsbSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof (navigator as Navigator & { usb?: { getDevices?: unknown } }).usb?.getDevices === 'function';
}

interface UsbDeviceLike {
  vendorId: number;
  productId: number;
  productName?: string;
  manufacturerName?: string;
  configurations?: Array<{
    interfaces?: Array<{
      alternates?: Array<{ interfaceClass?: number }>;
    }>;
  }>;
}

/** Well-known USB DAC / Audio Interface Vendor IDs (works on Android Chrome & Desktop WebUSB). */
const USB_DAC_VENDOR_IDS = new Set<number>([
  0x05ac, // Apple USB-C / Lightning Audio
  0x0572, // Conexant / Synaptics / AB13X USB-C DAC
  0x2972, // FiiO
  0x20b1, // XMOS (iFi, Topping, SMSL, Focusrite, Chord)
  0x152a, // Thesycon (Topping, SMSL, Gustard, Singxer)
  0x262a, // Savitech (Shanling, Hidizs, TempoTec)
  0x2fc6, // Comtrue USB Audio
  0x2a70, // ESS Sabre USB
  0x0bda, // Realtek ALC4050/ALC4080/ALC5686 USB-C
  0x0d8c, // C-Media USB Audio
  0x1235, // Focusrite Scarlett
  0x0763, // M-Audio
  0x1397, // Behringer
  0x0499, // Yamaha / Steinberg
  0x16d0, // MCS / Open-source DACs
]);

export function isWebUsbAudioDevice(dev: UsbDeviceLike): boolean {
  if (USB_DAC_VENDOR_IDS.has(dev.vendorId)) return true;
  const hasAudioClass = dev.configurations?.some((cfg) =>
    cfg.interfaces?.some((iface) => iface.alternates?.some((alt) => alt.interfaceClass === 1)),
  );
  if (hasAudioClass) return true;
  const combined = `${dev.manufacturerName ?? ''} ${dev.productName ?? ''}`.trim();
  return isLikelyDacDevice(combined);
}

function formatUsbDeviceLabel(dev: UsbDeviceLike): string {
  const parts = [dev.manufacturerName?.trim(), dev.productName?.trim()].filter(Boolean);
  return parts.join(' ') || 'USB Audio DAC';
}

let registeredElements: HTMLAudioElement[] = [];
let getContextFn: (() => AudioContext | null) | null = null;
let deviceListenerAttached = false;

export function registerDacTargets(
  elements: HTMLAudioElement[],
  contextGetter: () => AudioContext | null,
): void {
  registeredElements = elements;
  getContextFn = contextGetter;
  attachDeviceChangeListener();
  void applyCurrentSinkRouting();
}

export async function applySinkToTargets(
  sinkId: string,
  elements: HTMLAudioElement[],
  ctx: AudioContext | null,
): Promise<{ applied: boolean; error: string | null }> {
  const targetId = sinkId === 'default' ? '' : sinkId;
  let anyApplied = false;
  let realError: string | null = null;

  // 1. Route AudioContext first (all decks feed into AudioContext via MediaElementAudioSourceNode)
  if (ctx) {
    const sinkCtx = ctx as AudioContext & { setSinkId?: (id: string) => Promise<void> };
    if (typeof sinkCtx.setSinkId === 'function') {
      try {
        await sinkCtx.setSinkId(targetId);
        anyApplied = true;
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        // AbortError often happens when AudioContext is suspended/idle before first play; don't surface as fatal
        if (name !== 'AbortError') {
          realError = err instanceof Error ? err.message : String(err);
        }
        if (targetId && name !== 'AbortError') {
          try {
            await sinkCtx.setSinkId('');
          } catch {
            // ignore
          }
        }
      }
    }
  }

  // 2. Also route active HTMLAudioElements (skip idle/unloaded elements which throw AbortError in Chromium)
  for (const el of elements) {
    const mediaEl = el as HTMLMediaElement & { setSinkId?: (id: string) => Promise<void> };
    if (typeof mediaEl.setSinkId !== 'function') continue;
    if (!el.currentSrc && !el.src && el.readyState === 0) continue;
    try {
      await mediaEl.setSinkId(targetId);
      anyApplied = true;
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (!anyApplied && name !== 'AbortError') {
        realError = err instanceof Error ? err.message : String(err);
      }
    }
  }

  return { applied: anyApplied, error: anyApplied ? null : realError };
}

export async function applyCurrentSinkRouting(): Promise<void> {
  const state = useDacAudio.getState();
  if (!state.sinkSupported) {
    useDacAudio.setState({ routingStatus: 'unsupported', routingError: null });
    return;
  }
  const ctx = getContextFn?.() ?? null;
  if (registeredElements.length === 0 && !ctx) {
    useDacAudio.setState({
      routingStatus: state.sinkId === 'default' ? 'default' : 'routed',
      routingError: null,
    });
    return;
  }
  const { applied, error } = await applySinkToTargets(state.sinkId, registeredElements, ctx);
  if (error && state.sinkId !== 'default') {
    useDacAudio.setState({ routingStatus: 'error', routingError: error });
  } else {
    useDacAudio.setState({
      routingStatus: state.sinkId === 'default' ? 'default' : applied ? 'routed' : 'default',
      routingError: null,
    });
  }
}

export interface AudioToastDetails {
  label: string;
  detail: string;
  kind?: AudioDeviceKind;
  batteryPct?: number | null;
  sampleRateHz?: number | null;
  profile?: string | null;
  manufacturer?: string | null;
}

interface DacAudioState {
  sinkId: string;
  dacDirectMode: boolean;
  lockUnityVolume: boolean;
  autoSwitchToDac: boolean;
  bluetoothControlsEnabled: boolean;
  preferredSampleRate: DacSampleRate;
  devices: AudioOutputDeviceInfo[];
  activeSampleRateHz: number | null;
  activeDeviceLabel: string;
  usbHardwareLabel: string | null;
  bluetoothHardwareLabel: string | null;
  bluetoothBatteryPct: number | null;
  dacConnectedToast: AudioToastDetails | null;
  sinkSupported: boolean;
  osPickerSupported: boolean;
  webUsbSupported: boolean;
  webBluetoothSupported: boolean;
  labelsRedacted: boolean;
  routingStatus: DacRoutingStatus;
  routingError: string | null;
  setOutputDevice: (deviceId: string) => Promise<void>;
  selectViaOsPicker: () => Promise<boolean>;
  pairUsbDac: () => Promise<string | null>;
  pairBluetoothDevice: () => Promise<string | null>;
  dismissDacToast: () => void;
  setDacDirectMode: (enabled: boolean) => void;
  setLockUnityVolume: (enabled: boolean) => void;
  setAutoSwitchToDac: (enabled: boolean) => void;
  setBluetoothControlsEnabled: (enabled: boolean) => void;
  setPreferredSampleRate: (rate: DacSampleRate) => void;
  setActiveSampleRateHz: (hz: number | null) => void;
  refreshDevices: (requestLabelsIfHidden?: boolean, fromHotplug?: boolean) => Promise<AudioOutputDeviceInfo[]>;
}

let bootToastShown = false;
let toastTimer: ReturnType<typeof setTimeout> | null = null;
function showDacConnectedToast(
  label: string,
  detail: string,
  kind: AudioDeviceKind = 'dac',
  extra?: Partial<Omit<AudioToastDetails, 'label' | 'detail' | 'kind'>>,
) {
  if (toastTimer) clearTimeout(toastTimer);
  const state = useDacAudio.getState();
  useDacAudio.setState({
    dacConnectedToast: {
      label,
      detail,
      kind,
      sampleRateHz: extra?.sampleRateHz ?? state.activeSampleRateHz ?? 48000,
      batteryPct: extra?.batteryPct ?? (kind === 'bluetooth' ? state.bluetoothBatteryPct : null),
      profile: extra?.profile ?? (kind === 'bluetooth' ? 'A2DP • AVRCP' : null),
      manufacturer: extra?.manufacturer ?? null,
    },
  });
  toastTimer = setTimeout(() => {
    useDacAudio.setState({ dacConnectedToast: null });
    toastTimer = null;
  }, 5500);
}

export function cleanAudioDeviceLabel(label: string): string {
  return label.replace(/^(Default|Communications)\s*-\s*/i, '').trim() || label;
}

export function inferBluetoothProfile(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('hands-free') || lower.includes('hfp')) return 'Hands-Free (HFP)';
  if (lower.includes('headset')) return 'Headset • AVRCP';
  return 'Stereo A2DP • AVRCP';
}

export const useDacAudio = create<DacAudioState>()(
  persist(
    (set, get) => ({
      sinkId: 'default',
      dacDirectMode: false,
      lockUnityVolume: false,
      autoSwitchToDac: true,
      bluetoothControlsEnabled: true,
      preferredSampleRate: 'native',
      devices: [],
      activeSampleRateHz: null,
      activeDeviceLabel: 'System Default',
      usbHardwareLabel: null,
      bluetoothHardwareLabel: null,
      bluetoothBatteryPct: null,
      dacConnectedToast: null,
      sinkSupported: isSinkSelectionSupported(),
      osPickerSupported: isOsOutputPickerSupported(),
      webUsbSupported: isWebUsbSupported(),
      webBluetoothSupported: isWebBluetoothSupported(),
      labelsRedacted: false,
      routingStatus: isSinkSelectionSupported() ? 'default' : 'unsupported',
      routingError: null,

      dismissDacToast() {
        if (toastTimer) {
          clearTimeout(toastTimer);
          toastTimer = null;
        }
        set({ dacConnectedToast: null });
      },

      async pairUsbDac() {
        const navUsb = (navigator as Navigator & {
          usb?: { requestDevice: (opts: { filters: Array<{ classCode?: number }> }) => Promise<UsbDeviceLike> };
        }).usb;
        if (!navUsb?.requestDevice) return null;
        try {
          const dev = await navUsb.requestDevice({ filters: [{ classCode: 1 }] });
          const label = formatUsbDeviceLabel(dev);
          set({ usbHardwareLabel: label });
          showDacConnectedToast(label, get().sinkSupported ? 'USB DAC paired' : 'OS Auto-Routed (Mobile Hi-Fi)');
          await get().refreshDevices(false, true);
          return label;
        } catch {
          return null;
        }
      },

      async setOutputDevice(deviceId) {
        const list = get().devices;
        const found = list.find((d) => d.deviceId === deviceId);
        const label =
          deviceId === 'default' ? 'System Default' : (found?.label || 'External Audio Device');
        set({ sinkId: deviceId, activeDeviceLabel: label, routingError: null });
        await applyCurrentSinkRouting();
      },

      async selectViaOsPicker() {
        const mediaDevices = navigator.mediaDevices as MediaDevices & {
          selectAudioOutput?: () => Promise<MediaDeviceInfo>;
        };
        if (typeof mediaDevices?.selectAudioOutput !== 'function') return false;
        try {
          const picked = await mediaDevices.selectAudioOutput();
          if (!picked?.deviceId) return false;
          const label = picked.label?.trim() || 'Selected DAC Output';
          const info: AudioOutputDeviceInfo = {
            deviceId: picked.deviceId,
            label,
            isLikelyDac: isLikelyDacDevice(label),
            isLikelyBluetooth: isLikelyBluetoothDevice(label),
            connectionType: isLikelyDacDevice(label)
              ? 'dac'
              : isLikelyBluetoothDevice(label)
                ? 'bluetooth'
                : 'system',
          };
          const existing = get().devices.filter((d) => d.deviceId !== info.deviceId);
          set({
            devices: [info, ...existing],
            sinkId: info.deviceId,
            activeDeviceLabel: info.label,
            labelsRedacted: false,
            routingError: null,
          });
          await applyCurrentSinkRouting();
          return true;
        } catch {
          return false;
        }
      },

      async pairBluetoothDevice() {
        interface BtGattChar {
          readValue: () => Promise<DataView>;
        }
        interface BtGattService {
          getCharacteristic: (uuid: string) => Promise<BtGattChar>;
        }
        interface BtDeviceLike {
          name?: string;
          gatt?: {
            connect: () => Promise<{
              getPrimaryService: (uuid: string) => Promise<BtGattService>;
              disconnect?: () => void;
            }>;
          };
        }
        const navBt = (navigator as Navigator & {
          bluetooth?: {
            requestDevice: (opts: {
              acceptAllDevices: boolean;
              optionalServices?: string[];
            }) => Promise<BtDeviceLike>;
          };
        }).bluetooth;
        if (!navBt?.requestDevice) return null;
        try {
          const dev = await navBt.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service', 'device_information'],
          });
          const label = dev.name?.trim() || 'Bluetooth Audio Device';
          let batteryPct: number | null = null;
          let manufacturer: string | null = null;

          if (dev.gatt) {
            try {
              const server = await Promise.race([
                dev.gatt.connect(),
                new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 2500)),
              ]);
              try {
                const batSvc = await server.getPrimaryService('battery_service');
                const batChar = await batSvc.getCharacteristic('battery_level');
                const dv = await batChar.readValue();
                const val = dv.getUint8(0);
                if (val >= 0 && val <= 100) batteryPct = val;
              } catch {
                // Device doesn't expose BLE Battery Service
              }
              try {
                const infoSvc = await server.getPrimaryService('device_information');
                const mfgChar = await infoSvc.getCharacteristic('manufacturer_name_string');
                const dv = await mfgChar.readValue();
                const decoded = new TextDecoder().decode(dv.buffer).replace(/\0/g, '').trim();
                if (decoded) manufacturer = decoded;
              } catch {
                // Device doesn't expose Device Information Service
              }
              server.disconnect?.();
            } catch {
              // GATT connect optional; continue with device name
            }
          }

          set({ bluetoothHardwareLabel: label, bluetoothBatteryPct: batteryPct });
          showDacConnectedToast(label, 'Bluetooth connected • Controls ready', 'bluetooth', {
            batteryPct,
            manufacturer,
            profile: inferBluetoothProfile(label),
          });
          await get().refreshDevices(false, true);
          return label;
        } catch {
          return null;
        }
      },

      setDacDirectMode(dacDirectMode) {
        set({ dacDirectMode });
      },

      setLockUnityVolume(lockUnityVolume) {
        set({ lockUnityVolume });
      },

      setAutoSwitchToDac(autoSwitchToDac) {
        set({ autoSwitchToDac });
      },

      setBluetoothControlsEnabled(bluetoothControlsEnabled) {
        set({ bluetoothControlsEnabled });
      },

      setPreferredSampleRate(preferredSampleRate) {
        set({ preferredSampleRate });
      },

      setActiveSampleRateHz(activeSampleRateHz) {
        if (get().activeSampleRateHz !== activeSampleRateHz) {
          set({ activeSampleRateHz });
        }
      },

      async refreshDevices(requestLabelsIfHidden = false, fromHotplug = false) {
        const supported = isSinkSelectionSupported();
        const osPickerSupported = isOsOutputPickerSupported();
        const webUsbSupported = isWebUsbSupported();

        // Check already-paired WebUSB audio devices (works on Android Chrome & Desktop)
        let usbLabel: string | null = get().usbHardwareLabel;
        if (webUsbSupported) {
          try {
            const navUsb = (navigator as Navigator & { usb?: { getDevices: () => Promise<UsbDeviceLike[]> } }).usb;
            const usbDevs = (await navUsb?.getDevices()) ?? [];
            const audioUsb = usbDevs.find(isWebUsbAudioDevice);
            usbLabel = audioUsb ? formatUsbDeviceLabel(audioUsb) : null;
          } catch {
            // ignore WebUSB read error
          }
        }

        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
          set({ sinkSupported: supported, osPickerSupported, webUsbSupported, usbHardwareLabel: usbLabel, devices: [] });
          return [];
        }
        try {
          const prevDeviceIds = new Set(get().devices.map((d) => d.deviceId));
          let all = await navigator.mediaDevices.enumerateDevices();
          let rawOutputs = all.filter((d) => d.kind === 'audiooutput');
          let hasHiddenLabels = rawOutputs.length > 0 && rawOutputs.every((d) => !d.label?.trim());

          // Only request temporary audio permission when user explicitly taps Scan DACs and browser hid labels
          if (requestLabelsIfHidden && hasHiddenLabels && navigator.mediaDevices.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach((t) => t.stop());
              all = await navigator.mediaDevices.enumerateDevices();
              rawOutputs = all.filter((d) => d.kind === 'audiooutput');
              hasHiddenLabels = rawOutputs.length > 0 && rawOutputs.every((d) => !d.label?.trim());
            } catch {
              // Permission denied; proceed with available device IDs
            }
          }

          const outputs: AudioOutputDeviceInfo[] = rawOutputs.map((d, idx) => {
            const rawLabel = d.label?.trim() ?? '';
            const label =
              rawLabel || (d.deviceId === 'default' ? 'System Default' : `Audio Output ${idx + 1}`);
            const dac = isLikelyDacDevice(rawLabel);
            const bt = !dac && isLikelyBluetoothDevice(rawLabel);
            return {
              deviceId: d.deviceId || (idx === 0 ? 'default' : `out-${idx}`),
              label,
              isLikelyDac: dac,
              isLikelyBluetooth: bt,
              connectionType: dac ? 'dac' : bt ? 'bluetooth' : 'system',
              labelRedacted: !rawLabel && d.deviceId !== 'default',
            };
          });

          const prevSink = get().sinkId;
          const activeMatch = outputs.find((d) => d.deviceId === prevSink);
          const defaultDev = outputs.find((d) => d.deviceId === 'default');
          let nextSink = activeMatch ? prevSink : 'default';
          let nextLabel = activeMatch?.label ?? defaultDev?.label ?? usbLabel ?? 'System Default';

          // Auto-switch only when a physical (non-default, non-communications) USB DAC appears
          // and the OS default isn't already that DAC
          if (get().autoSwitchToDac && prevSink === 'default' && !defaultDev?.isLikelyDac) {
            const firstDac = outputs.find(
              (d) => d.isLikelyDac && d.deviceId !== 'default' && d.deviceId !== 'communications',
            );
            if (firstDac) {
              nextSink = firstDac.deviceId;
              nextLabel = firstDac.label;
            }
          }

          set({
            sinkSupported: supported,
            osPickerSupported,
            webUsbSupported,
            usbHardwareLabel: usbLabel,
            devices: outputs,
            sinkId: nextSink,
            activeDeviceLabel: nextLabel,
            labelsRedacted: hasHiddenLabels,
          });

          if (fromHotplug || !bootToastShown) {
            const newlyConnectedDac = outputs.find(
              (d) => d.isLikelyDac && d.deviceId !== 'communications' && (!prevDeviceIds.has(d.deviceId) || !bootToastShown),
            );
            const newlyConnectedBt = outputs.find(
              (d) => d.isLikelyBluetooth && d.deviceId !== 'communications' && (!prevDeviceIds.has(d.deviceId) || !bootToastShown),
            );
            if (newlyConnectedDac) {
              bootToastShown = true;
              showDacConnectedToast(
                newlyConnectedDac.label,
                supported ? 'Auto-detected & routed' : 'OS Auto-Routed (Hi-Fi)',
                'dac',
              );
            } else if (newlyConnectedBt) {
              bootToastShown = true;
              const cleanBtName = cleanAudioDeviceLabel(newlyConnectedBt.label);
              showDacConnectedToast(
                cleanBtName,
                supported ? 'Bluetooth Audio Routed' : 'Bluetooth Connected (OS Audio)',
                'bluetooth',
                { profile: inferBluetoothProfile(newlyConnectedBt.label) },
              );
            } else if (defaultDev?.isLikelyDac && (prevDeviceIds.size === 0 || !bootToastShown)) {
              bootToastShown = true;
              showDacConnectedToast(cleanAudioDeviceLabel(defaultDev.label), 'DAC active on system default', 'dac');
            } else if (defaultDev?.isLikelyBluetooth && (prevDeviceIds.size === 0 || !bootToastShown)) {
              bootToastShown = true;
              const cleanBtName = cleanAudioDeviceLabel(defaultDev.label);
              showDacConnectedToast(
                cleanBtName,
                'Bluetooth active on system default',
                'bluetooth',
                { profile: inferBluetoothProfile(defaultDev.label) },
              );
            } else if (usbLabel && (fromHotplug || !bootToastShown)) {
              bootToastShown = true;
              showDacConnectedToast(usbLabel, supported ? 'USB DAC connected' : 'OS Auto-Routed (Mobile Hi-Fi)', 'dac');
            }
          }

          if (nextSink !== prevSink) {
            await applyCurrentSinkRouting();
          }
          return outputs;
        } catch {
          set({ sinkSupported: supported, osPickerSupported, webUsbSupported, usbHardwareLabel: usbLabel });
          return get().devices;
        }
      },
    }),
    {
      name: 'isopod:dac-audio',
      version: 2,
      partialize: (state) => ({
        sinkId: state.sinkId,
        dacDirectMode: state.dacDirectMode,
        lockUnityVolume: state.lockUnityVolume,
        autoSwitchToDac: state.autoSwitchToDac,
        bluetoothControlsEnabled: state.bluetoothControlsEnabled,
        preferredSampleRate: state.preferredSampleRate,
      }),
    },
  ),
);

/**
 * Starts global, cross-platform DAC hot-plug detection across:
 * - Desktop & Android: navigator.mediaDevices 'devicechange' + WebUSB 'connect'/'disconnect'
 * - Phones & Tablets (iOS Safari / Android): window 'focus' & document 'visibilitychange'
 */
export function initDacAutoDetection(): () => void {
  if (typeof window === 'undefined') return () => {};

  const onHotplug = () => {
    void useDacAudio.getState().refreshDevices(false, true).then(() => applyCurrentSinkRouting());
  };

  const onVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      void useDacAudio.getState().refreshDevices(false, true).then(() => applyCurrentSinkRouting());
    }
  };

  const mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
  mediaDevices?.addEventListener?.('devicechange', onHotplug);
  window.addEventListener('focus', onVisibilityOrFocus);
  document.addEventListener('visibilitychange', onVisibilityOrFocus);

  const navUsb = (typeof navigator !== 'undefined'
    ? (navigator as Navigator & {
        usb?: {
          addEventListener?: (type: string, cb: (ev: { device?: UsbDeviceLike }) => void) => void;
          removeEventListener?: (type: string, cb: (ev: { device?: UsbDeviceLike }) => void) => void;
        };
      }).usb
    : undefined);

  const onUsbConnect = (ev: { device?: UsbDeviceLike }) => {
    if (ev.device && isWebUsbAudioDevice(ev.device)) {
      const label = formatUsbDeviceLabel(ev.device);
      useDacAudio.setState({ usbHardwareLabel: label });
      showDacConnectedToast(label, useDacAudio.getState().sinkSupported ? 'USB DAC connected' : 'OS Auto-Routed (Mobile Hi-Fi)');
    }
    onHotplug();
  };

  const onUsbDisconnect = () => {
    useDacAudio.setState({ usbHardwareLabel: null });
    onHotplug();
  };

  navUsb?.addEventListener?.('connect', onUsbConnect);
  navUsb?.addEventListener?.('disconnect', onUsbDisconnect);

  // Initial scan at app boot
  void useDacAudio.getState().refreshDevices(false, false);

  return () => {
    mediaDevices?.removeEventListener?.('devicechange', onHotplug);
    window.removeEventListener('focus', onVisibilityOrFocus);
    document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    navUsb?.removeEventListener?.('connect', onUsbConnect);
    navUsb?.removeEventListener?.('disconnect', onUsbDisconnect);
  };
}

function attachDeviceChangeListener(): void {
  if (deviceListenerAttached) return;
  deviceListenerAttached = true;
  initDacAutoDetection();
}
