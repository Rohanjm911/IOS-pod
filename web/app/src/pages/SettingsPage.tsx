import { ArrowDown, ArrowUp, Bluetooth, Check, ChevronRight, Globe, Headphones, Layers, Monitor, Moon, Palette, RefreshCw, Sun, Trash2, Users } from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { MdOutlineExtension } from 'react-icons/md';
import { SiApplemusic, SiDiscord, SiSpotify, SiYoutubemusic } from 'react-icons/si';
import { PageHeader } from '@/components/PageHeader';
import { PrefetchLink } from '@/components/PrefetchLink';
import type { AudioQualityTier } from '@/data/sources/addonClient';
import { useAddons } from '@/data/sources/addonsStore';
import { useDiscord } from '@/extension/useDiscord';
import { useExtension } from '@/extension/useExtension';
import { useYtAuth } from '@/extension/useYtAuth';
import { setProxyUrl, testProxyHealth, useProxyUrl } from '@/lib/iosProxy';
import { isIosDevice, isStandalonePwa } from '@/lib/platform';
import { THEME_PRESETS, useThemeSettings, type ColorSchemeMode } from '@/lib/theme';
import { useParty } from '@/party/useParty';
import { useHistorySettings } from '@/playback/historyReporting';
import { Select } from '@/components/Select';
import { AUTOMIX_BARS } from '@/playback/automix/choices';
import { CROSSFADE_CHOICES, syncDacVolume, usePlayer } from '@/state/player';
import { useDacAudio, type DacSampleRate } from '@/state/dacAudio';
import { syncEqualizerForDacMode } from '@/state/equalizer';
import { APP_UI_MODES, BRUTAL_PALETTES, PLAYER_STYLES, useUi } from '@/state/ui';
import { setAudioOnly, useVideo } from '@/state/video';
import { AppleMusicIntegration, AppleMusicToggles, CanvasToggle, DiscordIntegration, LyricSourcesAccess, SpotifyIntegration, Toggle } from './IntegrationSettings';
import { settingsUi } from './settingsStyles';

const LyricsSettings = lazy(() => import('@/shell/LyricsSettings').then((m) => ({ default: m.LyricsSettings })));

/** An integration's coloured glyph, as on the Extension page. */
function Glyph({ Icon, color, ink }: { Icon: ComponentType<{ size?: number }>; color: string; ink?: string }) {
  return (
    <span className={settingsUi.integrationIcon} style={{ backgroundColor: color, ...(ink && { color: ink }) }}>
      <Icon size={15} />
    </span>
  );
}

/** A row that opens a page of its own. */
function LinkRow({ to, icon, title, value }: { to: string; icon?: ReactNode; title: string; value?: string | null }) {
  return (
    <PrefetchLink to={to} className={`${icon ? settingsUi.integration : settingsUi.integrationPlain} ${settingsUi.linkRow}`}>
      {icon}
      <span className={settingsUi.integrationName}>{title}</span>
      <span className={settingsUi.value}>
        {value}
        <ChevronRight size={16} />
      </span>
    </PrefetchLink>
  );
}

function youtubeText(auth: ReturnType<typeof useYtAuth>): string {
  if (auth.state === 'checking') return 'Checking…';
  if (auth.state === 'unavailable') return 'Needs the extension';
  const { browserSignedIn, connected, active } = auth.auth;
  if (!browserSignedIn) return 'Not signed in';
  if (!connected) return 'Disconnected';
  return active ? active.name : 'Signed in';
}

const ios = isIosDevice();
const standalone = isStandalonePwa();

function IosProxySettings() {
  const activeProxy = useProxyUrl();
  const [draft, setDraft] = useState(activeProxy ?? '');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = setProxyUrl(draft);
    if (!draft.trim()) {
      setStatus({ ok: true, message: 'Cleared custom proxy URL.' });
      return;
    }
    if (!saved) {
      setStatus({ ok: false, message: 'Enter a valid https:// worker URL.' });
      return;
    }
    setTesting(true);
    const result = await testProxyHealth(saved);
    setTesting(false);
    setStatus(result);
  };

  return (
    <>
      <h2 className={settingsUi.sectionHeader}>iOS &amp; Proxy Streaming</h2>
      <section className={settingsUi.group}>
        <div className={settingsUi.integration}>
          <Glyph Icon={Globe} color="#007aff" />
          <span className={settingsUi.integrationName}>Proxy Status</span>
          <span className={settingsUi.value}>
            {activeProxy === '/api/proxy' ? 'Built-in (/api/proxy)' : activeProxy ? 'Custom proxy' : ios ? 'Needed on iOS' : 'Optional'}
          </span>
        </div>
        <form className="relative flex flex-wrap items-center gap-2 px-4 py-3 hairline-[16px]" onSubmit={save}>
          <input
            type="url"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="https://isopod-ios-proxy.workers.dev"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="iOS Cloudflare Worker proxy URL"
            className="min-w-0 flex-1 rounded-[8px] border-0 bg-quaternary px-3 py-2 type-body text-primary placeholder:text-tertiary"
          />
          <button
            type="submit"
            disabled={testing}
            className="h-9 rounded-[8px] bg-key-bg px-3.5 type-body-emphasized text-white disabled:opacity-50"
          >
            {testing ? 'Testing…' : 'Save & Test'}
          </button>
        </form>
        {status && (
          <p className={`px-4 pb-3 type-callout ${status.ok ? 'text-green' : 'text-key'}`}>{status.message}</p>
        )}
      </section>
      <p className={settingsUi.footer}>
        Deploy <code>web/ios-proxy</code> to Cloudflare Workers so iPhone and iPad Safari can stream YouTube Music and lyrics without a desktop extension.
        {ios && !standalone && ' For the full-screen app experience, tap Share → Add to Home Screen in Safari.'}
      </p>
    </>
  );
}

function AudioSourcesSettings() {
  const { addons, quality, losslessOutput, addAddon, removeAddon, toggleAddon, moveAddon, testAddon, setQuality, setLosslessOutput } =
    useAddons();
  const [urlInput, setUrlInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setAdding(true);
    setFeedback(null);
    try {
      const added = await addAddon(urlInput);
      setUrlInput('');
      setFeedback({ ok: true, message: `Added ${added.name} (v${added.version}).` });
    } catch (error) {
      setFeedback({ ok: false, message: error instanceof Error ? error.message : String(error) });
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <h2 className={settingsUi.sectionHeader}>Audio Sources</h2>
      <section className={settingsUi.group}>
        <label className={settingsUi.controlRow}>
          <span>Preferred Quality</span>
          <Select<AudioQualityTier>
            label="Preferred Quality"
            value={quality}
            options={[
              { value: 'LOSSLESS', label: 'Hi-Res Lossless' },
              { value: 'HIGH', label: 'High (320kbps)' },
              { value: 'LOW', label: 'Data Saver' },
            ]}
            onChange={setQuality}
          />
        </label>
        <Toggle
          label="My output supports lossless"
          detail="Allow lossless streams from sources that require lossless capability checks."
          checked={losslessOutput}
          onChange={setLosslessOutput}
        />
        {addons.map((addon, idx) => (
          <div key={addon.id} className="relative flex flex-wrap items-center justify-between gap-2 px-4 py-3 hairline-[16px]">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Glyph Icon={Layers} color="#5856d6" />
              <div className="min-w-0 flex-1">
                <div className="truncate type-title-3 text-primary">
                  {addon.name} <span className="type-callout text-secondary">v{addon.version}</span>
                </div>
                <div className="truncate type-callout text-secondary">{addon.url}</div>
                {addon.lastError && <div className="truncate type-callout text-key">{addon.lastError}</div>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="grid size-8 place-items-center rounded-[6px] text-secondary hover:bg-quaternary hover:text-primary disabled:opacity-30"
                aria-label={`Move ${addon.name} up`}
                disabled={idx === 0}
                onClick={() => moveAddon(idx, -1)}
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-[6px] text-secondary hover:bg-quaternary hover:text-primary disabled:opacity-30"
                aria-label={`Move ${addon.name} down`}
                disabled={idx === addons.length - 1}
                onClick={() => moveAddon(idx, 1)}
              >
                <ArrowDown size={15} />
              </button>
              <button
                type="button"
                className={settingsUi.inlineButton}
                onClick={async () => {
                  const res = await testAddon(addon.id);
                  setFeedback(res);
                }}
              >
                Test
              </button>
              <button
                type="button"
                className="grid size-8 place-items-center rounded-[6px] text-secondary hover:bg-quaternary hover:text-key"
                aria-label={`Remove ${addon.name}`}
                onClick={() => removeAddon(addon.id)}
              >
                <Trash2 size={15} />
              </button>
              <input
                type="checkbox"
                className={settingsUi.switch}
                aria-label={`Enable ${addon.name}`}
                checked={addon.enabled}
                onChange={() => toggleAddon(addon.id)}
              />
            </div>
          </div>
        ))}
        <form className="relative flex flex-wrap items-center gap-2 px-4 py-3 hairline-[16px]" onSubmit={handleAdd}>
          <input
            type="url"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="https://your-addon-source.example.com"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            aria-label="Add audio source module URL"
            className="min-w-0 flex-1 rounded-[8px] border-0 bg-quaternary px-3 py-2 type-body text-primary placeholder:text-tertiary"
          />
          <button
            type="submit"
            disabled={adding || !urlInput.trim()}
            className="h-9 rounded-[8px] bg-key-bg px-3.5 type-body-emphasized text-white disabled:opacity-50"
          >
            {adding ? 'Adding…' : 'Add Source'}
          </button>
        </form>
        {feedback && (
          <p className={`px-4 pb-3 type-callout ${feedback.ok ? 'text-green' : 'text-key'}`}>{feedback.message}</p>
        )}
      </section>
      <p className={settingsUi.footer}>
        Pluggable HTTP audio sources are tried in order for Hi-Res FLAC/ALAC playback, with YouTube Music as automatic fallback.
      </p>
    </>
  );
}

function DacOutputSettings() {
  const {
    sinkId,
    dacDirectMode,
    lockUnityVolume,
    autoSwitchToDac,
    bluetoothControlsEnabled,
    preferredSampleRate,
    devices,
    activeSampleRateHz,
    activeDeviceLabel,
    usbHardwareLabel,
    bluetoothHardwareLabel,
    sinkSupported,
    osPickerSupported,
    webUsbSupported,
    webBluetoothSupported,
    labelsRedacted,
    routingStatus,
    routingError,
    setOutputDevice,
    selectViaOsPicker,
    pairUsbDac,
    pairBluetoothDevice,
    setDacDirectMode,
    setLockUnityVolume,
    setAutoSwitchToDac,
    setBluetoothControlsEnabled,
    setPreferredSampleRate,
    refreshDevices,
  } = useDacAudio();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void refreshDevices(false);
  }, [refreshDevices]);

  const detectedDac = devices.find((d) => d.isLikelyDac);
  const detectedBt = devices.find((d) => d.isLikelyBluetooth);
  const connectedBtList = devices.filter((d) => d.isLikelyBluetooth && d.deviceId !== 'communications');
  const defaultOutput = devices.find((d) => d.deviceId === 'default');
  const deviceOptions = [
    {
      value: 'default',
      label: defaultOutput?.label && defaultOutput.label !== 'System Default'
        ? defaultOutput.label
        : 'System Default Output',
    },
    ...devices
      .filter((d) => d.deviceId !== 'default' && d.deviceId !== 'communications')
      .map((d) => ({
        value: d.deviceId,
        label: d.isLikelyDac ? `${d.label} (DAC)` : d.isLikelyBluetooth ? `${d.label} (Bluetooth)` : d.label,
      })),
  ];

  const rateMismatch =
    preferredSampleRate !== 'native' &&
    activeSampleRateHz !== null &&
    activeSampleRateHz !== preferredSampleRate;

  return (
    <>
      <h2 className={settingsUi.sectionHeader}>USB DAC, Bluetooth &amp; Hi-Res Output</h2>
      <section className={settingsUi.group}>
        <div className={settingsUi.integration}>
          <Glyph
            Icon={detectedBt && !detectedDac ? Bluetooth : Headphones}
            color={detectedDac || dacDirectMode || routingStatus === 'routed' ? '#30d158' : '#0a84ff'}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate type-body text-primary">
              {detectedDac
                ? `DAC Detected: ${detectedDac.label}`
                : detectedBt
                  ? `Bluetooth Connected: ${detectedBt.label}`
                  : usbHardwareLabel
                    ? `USB DAC Detected: ${usbHardwareLabel}`
                    : bluetoothHardwareLabel
                      ? `Bluetooth: ${bluetoothHardwareLabel}`
                      : activeDeviceLabel}
            </div>
            <div className="truncate type-callout text-secondary">
              {activeSampleRateHz ? `${+(activeSampleRateHz / 1000).toFixed(1)} kHz engine` : 'Ready'}
              {dacDirectMode ? ' · Bit-Transparent Direct' : ' · Standard DSP'}
              {bluetoothControlsEnabled ? ' · BT Controls On' : ''}
              {routingStatus === 'routed' ? ' · Routed' : !sinkSupported ? ' · OS Auto-Routed (Mobile/Safari)' : ''}
            </div>
            {routingError && <div className="truncate type-callout text-key">{routingError}</div>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {webBluetoothSupported && (
              <button
                type="button"
                className={settingsUi.inlineButton}
                onClick={() => void pairBluetoothDevice()}
              >
                Pair Bluetooth
              </button>
            )}
            {webUsbSupported && !detectedDac && (
              <button
                type="button"
                className={settingsUi.inlineButton}
                onClick={() => void pairUsbDac()}
              >
                Pair USB DAC
              </button>
            )}
            {osPickerSupported && (
              <button
                type="button"
                className={settingsUi.inlineButton}
                onClick={() => void selectViaOsPicker()}
              >
                OS Picker
              </button>
            )}
            <button
              type="button"
              className={settingsUi.inlineButton}
              disabled={refreshing}
              onClick={async () => {
                setRefreshing(true);
                await refreshDevices(true);
                setRefreshing(false);
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Scanning…' : 'Scan Devices'}
              </span>
            </button>
          </div>
        </div>
        {(connectedBtList.length > 0 || bluetoothHardwareLabel) && (
          <div className="relative flex flex-wrap items-center gap-2 px-4 py-2.5 hairline-[16px]">
            <span className="inline-flex items-center gap-1.5 type-callout text-secondary">
              <Bluetooth size={14} className="text-[#0a84ff]" />
              Connected Bluetooth:
            </span>
            {connectedBtList.map((bt) => (
              <button
                key={bt.deviceId}
                type="button"
                onClick={() => void setOutputDevice(bt.deviceId)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  sinkId === bt.deviceId
                    ? 'bg-[#0a84ff] text-white'
                    : 'bg-quaternary text-primary hover:bg-quinary'
                }`}
              >
                {bt.label}
              </button>
            ))}
            {connectedBtList.length === 0 && bluetoothHardwareLabel && (
              <span className="rounded-full bg-[#0a84ff]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#0a84ff]">
                {bluetoothHardwareLabel}
              </span>
            )}
          </div>
        )}
        {labelsRedacted && (
          <p className="px-4 py-2 type-callout text-secondary hairline-[16px]">
            Browser hid USB device names. Tap <strong>Scan DACs</strong>{osPickerSupported ? ' or OS Picker' : ''} to reveal your DAC model.
          </p>
        )}
        {sinkSupported && (
          <label className={settingsUi.controlRow}>
            <span>Output Device</span>
            <Select<string>
              label="Output Device"
              value={deviceOptions.some((o) => o.value === sinkId) ? sinkId : 'default'}
              options={deviceOptions}
              onChange={(val) => void setOutputDevice(val)}
            />
          </label>
        )}
        <label className={settingsUi.controlRow}>
          <span>Target Sample Rate</span>
          <div className="flex items-center gap-2">
            {rateMismatch && (
              <button
                type="button"
                className={settingsUi.inlineButton}
                onClick={() => window.location.reload()}
              >
                Apply Now
              </button>
            )}
            <Select<string>
              label="Target Sample Rate"
              value={String(preferredSampleRate)}
              options={[
                { value: 'native', label: 'Native / Auto' },
                { value: '44100', label: '44.1 kHz (CD)' },
                { value: '48000', label: '48 kHz' },
                { value: '88200', label: '88.2 kHz (Hi-Res)' },
                { value: '96000', label: '96 kHz (Hi-Res)' },
                { value: '176400', label: '176.4 kHz (Studio)' },
                { value: '192000', label: '192 kHz (Studio DAC)' },
              ]}
              onChange={(val) => {
                const next: DacSampleRate =
                  val === 'native' ? 'native' : (Number(val) as Exclude<DacSampleRate, 'native'>);
                setPreferredSampleRate(next);
              }}
            />
          </div>
        </label>
        {sinkSupported && (
          <Toggle
            label="Auto-Switch When USB DAC Plugged In"
            detail="Automatically route playback to a detected external USB DAC when connected."
            checked={autoSwitchToDac}
            onChange={setAutoSwitchToDac}
          />
        )}
        <Toggle
          label="Bluetooth Hardware Controls (AVRCP)"
          detail="Use Play/Pause, Next, Previous, Stop, and Seek buttons on Bluetooth headphones & speakers."
          checked={bluetoothControlsEnabled}
          onChange={setBluetoothControlsEnabled}
        />
        <Toggle
          label="DAC Direct Mode (Bypass EQ & DSP)"
          detail="Disables equalizer & bass boost coloration for clean, uncolored DAC playback."
          checked={dacDirectMode}
          onChange={(on) => {
            setDacDirectMode(on);
            syncEqualizerForDacMode();
            syncDacVolume();
          }}
        />
        {dacDirectMode && (
          <Toggle
            label="Unity Hardware Volume Lock (0 dB)"
            detail="Keeps browser digital gain at 100% so you control volume directly on your DAC knob."
            checked={lockUnityVolume}
            onChange={(on) => {
              setLockUnityVolume(on);
              syncDacVolume();
            }}
          />
        )}
      </section>
      <p className={settingsUi.footer}>
        {sinkSupported
          ? 'Supports USB-C dongles, desktop DACs, and studio audio interfaces via Web Audio setSinkId & OS Output Picker.'
          : 'Your browser uses the OS default audio output device. Select your USB DAC in system sound settings to play through it.'}
      </p>
    </>
  );
}

/** Appearance mode (System/Light/Dark), AMOLED black, Glassmorphism, and live colour-scheme presets. */
function AppearanceThemeSettings() {
  const {
    scheme,
    preset,
    amoled,
    glass,
    customAccent,
    systemDark,
    setColorScheme,
    setThemePreset,
    setAmoledBlack,
    setGlassmorphism,
    setCustomAccent,
  } = useThemeSettings();
  const isDarkActive = scheme === 'dark' || (scheme === 'system' && systemDark);
  const playerStyle = useUi((s) => s.playerStyle);
  const setPlayerStyle = useUi((s) => s.setPlayerStyle);
  const uiMode = useUi((s) => s.uiMode);
  const requestUiModeSwitch = useUi((s) => s.requestUiModeSwitch);
  const brutalPalette = useUi((s) => s.brutalPalette);
  const customBrutalPrimary = useUi((s) => s.customBrutalPrimary);
  const customBrutalSecondary = useUi((s) => s.customBrutalSecondary);
  const setBrutalPalette = useUi((s) => s.setBrutalPalette);
  const setCustomBrutalColors = useUi((s) => s.setCustomBrutalColors);
  const schemeOptions: { id: ColorSchemeMode; label: string; Icon: typeof Sun }[] = [
    { id: 'system', label: `System · ${systemDark ? 'Dark' : 'Light'}`, Icon: Monitor },
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
  ];

  const glassOptions = [
    { id: 'default', label: 'Apple Glass (32px)' },
    { id: 'frosted', label: 'Ultra Frosted (48px)' },
    { id: 'subtle', label: 'Subtle Glass (12px)' },
    { id: 'none', label: 'Solid / Flat (0px)' },
  ] as const;

  const activeModeMeta = APP_UI_MODES.find((m) => m.id === uiMode) ?? APP_UI_MODES[0]!;
  const windowShellStyle =
    uiMode === 'editorial'
      ? 'rounded-[4px] border-2 border-primary/80'
      : uiMode === 'bento'
        ? 'rounded-[24px]'
        : uiMode === 'retro'
          ? 'rounded-[14px]'
          : uiMode === 'anime'
            ? 'rounded-[20px]'
            : uiMode === 'secondary'
              ? 'rounded-[8px]'
              : 'rounded-[18px] backdrop-blur-xl';

  return (
    <>
      <h2 className={settingsUi.sectionHeader}>App UI Look</h2>
      <section className={`${settingsUi.group} ${windowShellStyle} transition-all`}>
        <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex flex-col">
            {uiMode === 'editorial' && (
              <span className="mb-0.5 text-[10px] font-bold tracking-[0.18em] text-[#DC2626] uppercase">
                Active Interface
              </span>
            )}
            <span
              className="type-title-3 text-primary"
              style={
                uiMode === 'editorial'
                  ? { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900 }
                  : uiMode === 'anime'
                    ? { fontFamily: "'M PLUS Rounded 1c', 'DM Sans', sans-serif", fontWeight: 800 }
                    : undefined
              }
            >
              {uiMode === 'editorial' ? activeModeMeta.label : `Active Interface: ${activeModeMeta.label}`}
            </span>
            <span className="type-callout text-secondary">
              Switch the entire app UI look (asks confirmation &amp; restarts app).
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex flex-wrap gap-1 p-1 ${
                uiMode === 'editorial'
                  ? 'rounded-[4px] border border-divider bg-quinary'
                  : uiMode === 'bento'
                    ? 'rounded-[14px] bg-quaternary'
                    : uiMode === 'retro'
                      ? 'rounded-[10px] border border-divider bg-quaternary shadow-inner'
                      : 'rounded-[10px] bg-quaternary'
              }`}
            >
              {APP_UI_MODES.map((opt) => {
                const active = uiMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => requestUiModeSwitch(opt.id)}
                    style={active ? { background: activeModeMeta.accentBg } : undefined}
                    className={[
                      'inline-flex h-8 cursor-pointer items-center px-2.5 type-callout transition-all',
                      uiMode === 'editorial' ? 'rounded-[2px]' : uiMode === 'bento' ? 'rounded-[10px]' : 'rounded-[7px]',
                      active ? 'font-semibold text-white shadow-sm' : 'text-secondary hover:text-primary',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                const idx = APP_UI_MODES.findIndex((m) => m.id === uiMode);
                const next = APP_UI_MODES[(idx + 1) % APP_UI_MODES.length]?.id ?? 'primary';
                requestUiModeSwitch(next);
              }}
              style={{ background: activeModeMeta.accentBg }}
              className={`inline-flex h-9 cursor-pointer items-center px-3.5 type-callout-medium text-white shadow-sm hover:opacity-90 transition-opacity ${
                uiMode === 'editorial' ? 'rounded-[4px]' : uiMode === 'bento' ? 'rounded-[12px]' : 'rounded-[9px]'
              }`}
            >
              Switch UI Style
            </button>
          </div>
        </div>

        {/* Fixed Theme Colour Scheme Summary */}
        <div className="relative flex flex-wrap items-center justify-between gap-2 px-4 py-3 hairline-[16px]">
          <div className="flex flex-col">
            <span className="type-callout-medium text-primary">Theme Colour Scheme</span>
            <span className="type-caption-1 text-secondary">{activeModeMeta.schemeName}</span>
          </div>
          <div className="flex items-center gap-1.5" aria-label={`${activeModeMeta.label} colour palette`}>
            {activeModeMeta.swatches.map((hex) => (
              <span
                key={hex}
                title={hex}
                className="size-5 rounded-full border border-white/20 shadow-xs"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      </section>

      <h2 className={settingsUi.sectionHeader}>Appearance &amp; Colour Scheme</h2>
      <section className={settingsUi.group}>
        <div className={`${settingsUi.row} flex-wrap gap-3`}>
          <span className="flex items-center gap-2">
            <Palette size={16} className="text-key" aria-hidden />
            <span className={settingsUi.rowText}>
              <span>Theme Mode</span>
              <span className={settingsUi.rowDetail}>Follows iOS/system appearance or pins Light/Dark.</span>
            </span>
          </span>
          <div className="flex flex-wrap gap-1 rounded-[10px] bg-quaternary p-1" role="group" aria-label="Theme mode">
            {schemeOptions.map(({ id, label, Icon }) => {
              const active = scheme === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setColorScheme(id)}
                  className={[
                    'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[7px] px-2.5 type-callout transition-colors',
                    active ? 'bg-key-bg font-semibold text-white shadow-sm' : 'text-secondary hover:text-primary',
                  ].join(' ')}
                >
                  <Icon size={14} aria-hidden />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pure AMOLED Black Mode */}
        <div className="relative flex items-center justify-between px-4 py-3 hairline-[16px]">
          <div className="flex min-w-0 flex-1 flex-col pr-4">
            <div className="flex items-center gap-2">
              <span className="type-title-3 text-primary">Pure AMOLED Pitch Black</span>
              <span className="rounded bg-black px-1.5 py-0.5 text-[10px] font-bold text-white border border-white/20">
                OLED
              </span>
            </div>
            <span className="type-callout text-secondary">
              True #000000 black background for maximum contrast and battery efficiency on OLED displays.
            </span>
          </div>
          <input
            type="checkbox"
            className={settingsUi.switch}
            aria-label="Pure AMOLED Pitch Black"
            checked={amoled}
            onChange={(e) => setAmoledBlack(e.target.checked)}
          />
        </div>

        {/* Background Glassmorphism */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-3 hairline-[16px]">
          <div className="flex flex-col">
            <span className="type-title-3 text-primary">Glassmorphism Intensity</span>
            <span className="type-callout text-secondary">Adjust background blur and translucency.</span>
          </div>
          <div className="flex flex-wrap gap-1 rounded-[10px] bg-quaternary p-1">
            {glassOptions.map((opt) => {
              const active = glass === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGlassmorphism(opt.id)}
                  className={[
                    'inline-flex h-8 cursor-pointer items-center rounded-[7px] px-2.5 type-callout transition-colors',
                    active ? 'bg-key-bg font-semibold text-white shadow-sm' : 'text-secondary hover:text-primary',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Player Bar Style */}
        <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-3 hairline-[16px]">
          <div className="flex flex-col">
            <span className="type-title-3 text-primary">Player Bar Style</span>
            <span className="type-callout text-secondary">Switch between Apple Glass, Compact Pill, Studio Dock, and Neon Glow.</span>
          </div>
          <div className="flex flex-wrap gap-1 rounded-[10px] bg-quaternary p-1">
            {PLAYER_STYLES.map((opt) => {
              const active = playerStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPlayerStyle(opt.id)}
                  className={[
                    'inline-flex h-8 cursor-pointer items-center rounded-[7px] px-2.5 type-callout transition-colors',
                    active ? 'bg-key-bg font-semibold text-white shadow-sm' : 'text-secondary hover:text-primary',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fixed Signature Color Scheme */}
        <div className="relative p-4 hairline-[16px]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="type-callout text-secondary">Signature Color Scheme</p>
            <span className="rounded-[6px] bg-key-bg/15 px-2 py-0.5 text-[11px] font-semibold text-key">
              Fixed
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-[10px] border border-key bg-quaternary px-3.5 py-3">
            <span
              className="relative flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-white/15 shadow-inner"
              style={{
                background: `linear-gradient(135deg, ${activeModeMeta.swatches[0]} 48%, ${activeModeMeta.swatches[1]} 48%)`,
              }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate type-body-emphasized text-primary">
                {activeModeMeta.label} • {activeModeMeta.schemeName}
              </span>
              <span className="block truncate type-callout text-secondary">
                Fixed signature palette locked for {activeModeMeta.label} UI.
              </span>
            </span>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-key-bg text-white" aria-hidden>
              <Check size={12} strokeWidth={3} />
            </span>
          </div>
        </div>
      </section>
      <p className={settingsUi.footer}>
        Changes apply immediately across the player, navigation bar, and ambient artwork controls and are saved for future sessions.
      </p>
    </>
  );
}

/**
 * Settings (SettingsSheet on the phone): the account and its integrations,
 * Listen Together, playback and lyrics, in the same grouped rows.
 */
export default function SettingsPage() {
  const extension = useExtension();
  const yt = useYtAuth();
  const discord = useDiscord();
  const party = useParty();
  const autoplay = usePlayer((s) => s.autoplay);
  const crossfadeSec = usePlayer((s) => s.crossfadeSec);
  const automix = usePlayer((s) => s.automix);
  const automixBars = usePlayer((s) => s.automixBars);
  const showNerdStats = usePlayer((s) => s.showNerdStats);
  const skipIntroOutro = usePlayer((s) => s.skipIntroOutro);
  const audioOnly = useVideo((s) => s.audioOnly);
  const shareHistory = useHistorySettings((s) => s.share);
  const setShareHistory = useHistorySettings((s) => s.setShare);
  const { setAutoplay, setCrossfade, setAutomix, setAutomixBars, setShowNerdStats, setSkipIntroOutro } = usePlayer.getState();
  const [lyrics, setLyrics] = useState(false);
  const present = extension.state === 'present';
  const discordText =
    discord.state === 'ready' && discord.discord.connected
      ? discord.discord.enabled
        ? 'On'
        : 'Off'
      : discord.state === 'ready' && discord.discord.available
        ? 'Not connected'
        : null;

  return (
    <div className={settingsUi.centered}>
      <PageHeader title="Settings" />
      <div className={settingsUi.body}>
        <AppearanceThemeSettings />
        <IosProxySettings />
        <AudioSourcesSettings />
        <DacOutputSettings />
        <h2 className={settingsUi.sectionHeader}>Account & Integrations</h2>
        <section className={settingsUi.group}>
          <div className={settingsUi.integration}>
            <Glyph Icon={SiYoutubemusic} color="#ffffff" ink="#ff0033" />
            <span className={settingsUi.integrationName}>YouTube Music</span>
            <span className={settingsUi.value}>{youtubeText(yt)}</span>
          </div>
          <div className={settingsUi.integration}>
            <Glyph Icon={SiSpotify} color="#1ed760" />
            <span className={settingsUi.integrationName}>Spotify</span>
            {present ? <SpotifyIntegration /> : <span className={settingsUi.value}>Needs the extension</span>}
          </div>
          {present && discord.state === 'ready' && discord.discord.available && (
            <LinkRow to="/settings/discord" icon={<Glyph Icon={SiDiscord} color="#5865f2" />} title="Discord" value={discordText} />
          )}
          <LinkRow
            to="/extension"
            icon={<Glyph Icon={MdOutlineExtension} color="#636366" />}
            title="ISO pod Extension"
            value={present ? `v${extension.extension.info.version}` : 'Not installed'}
          />
        </section>
        <section className={`${settingsUi.group} mt-3 empty:hidden`}>
          <Toggle
            label="Share Listening Activity to YouTube"
            detail={
              present && !extension.extension.info.capabilities.includes('yt.stats')
                ? 'Update the ISO pod extension to share: this version can’t send plays to YouTube.'
                : 'Songs you play here go to your YouTube Music history and shape its recommendations.'
            }
            checked={shareHistory}
            onChange={setShareHistory}
          />
          <CanvasToggle />
        </section>

        <h2 className={settingsUi.sectionHeader}>Apple Music</h2>
        <section className={settingsUi.group}>
          <div className={settingsUi.integration}>
            <Glyph Icon={SiApplemusic} color="#fa2d48" />
            <span className={settingsUi.integrationName}>Extension Access</span>
            {present ? <AppleMusicIntegration /> : <span className={settingsUi.value}>Needs the extension</span>}
          </div>
          <AppleMusicToggles />
        </section>
        <p className={settingsUi.footer}>From Apple Music’s public pages. No Apple Music account or sign-in needed.</p>

        <h2 className={settingsUi.sectionHeader}>Listen Together</h2>
        <section className={settingsUi.group}>
          <LinkRow
            to="/settings/listen-together"
            icon={<Glyph Icon={Users} color="#fa2d48" />}
            title="Listen Together"
            value={party.code ? `In party ${party.code}` : 'Listen in sync with friends'}
          />
        </section>

        <h2 className={settingsUi.sectionHeader}>Playback</h2>
        <section className={settingsUi.group}>
          <Toggle
            label="Audio-Only Mode"
            detail="Plays music videos as audio only and auto-imports square album cover art instead of streaming video."
            checked={audioOnly}
            onChange={setAudioOnly}
          />
          <Toggle
            label="AutoPlay"
            detail="When the queue ends, keep playing similar music."
            checked={autoplay}
            onChange={setAutoplay}
          />
          <label className={settingsUi.controlRow}>
            <span>Crossfade</span>
            <Select<number | 'automix'>
              label="Crossfade"
              value={automix ? 'automix' : crossfadeSec}
              options={[
                ...CROSSFADE_CHOICES.map((seconds) => ({ value: seconds, label: seconds === 0 ? 'Off' : `${seconds} seconds` })),
                { value: 'automix', label: 'Automix' },
              ]}
              onChange={(value) => (value === 'automix' ? setAutomix(true) : setCrossfade(value))}
            />
          </label>
          {automix && (
            <label className={settingsUi.controlRow}>
              <span>Blend Length</span>
              <Select
                label="Blend Length"
                value={automixBars}
                options={AUTOMIX_BARS.map((bars) => ({ value: bars, label: `Up to ${bars} bars` }))}
                onChange={setAutomixBars}
              />
            </label>
          )}
          <Toggle
            label="Auto-Skip Intros & End Credits"
            detail="Automatically detects and skips long non-music intros, skits, and end credits for YouTube Music tracks using SponsorBlock, synced lyrics, and audio silence."
            checked={skipIntroOutro}
            onChange={setSkipIntroOutro}
          />
          <Toggle
            label="Show Stats for Nerds"
            detail="Codec, bitrate and sample rate under the artist in the full-screen player, and what Automix is doing."
            checked={showNerdStats}
            onChange={setShowNerdStats}
          />
        </section>
        {automix && (
          <p className={settingsUi.footer}>
            Automix finds each song’s tempo, key and phrases, then blends on the beat: the next song is time-stretched to match, and
            the bass swaps over halfway. Where it can, it loops a few instrumental bars of each song and ramps the tempo between
            them. Songs it can’t read in time play to the end and crossfade. Based on AutoMix by David Finnegan (AGPL-3.0).
          </p>
        )}

        <h2 className={settingsUi.sectionHeader}>Lyrics</h2>
        <section className={settingsUi.group}>
          <button className={`${settingsUi.integrationPlain} ${settingsUi.linkRow}`} onClick={() => setLyrics(true)}>
            <span className={settingsUi.integrationName}>Lyric Sources</span>
            <span className={settingsUi.value}>
              Order, sources, syllable timing
              <ChevronRight size={16} />
            </span>
          </button>
          <div className={settingsUi.integrationPlain}>
            <span className={settingsUi.integrationName}>Lyric Sources Access</span>
            {present ? <LyricSourcesAccess /> : <span className={settingsUi.value}>Needs the extension</span>}
          </div>
        </section>
      </div>
      {lyrics && (
        <Suspense fallback={null}>
          <LyricsSettings onClose={() => setLyrics(false)} />
        </Suspense>
      )}
    </div>
  );
}
