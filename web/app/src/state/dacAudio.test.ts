// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applySinkToTargets,
  cleanAudioDeviceLabel,
  inferBluetoothProfile,
  isLikelyBluetoothDevice,
  isLikelyDacDevice,
  isWebUsbAudioDevice,
  useDacAudio,
} from './dacAudio';

describe('dacAudio', () => {
  beforeEach(() => {
    localStorage.clear();
    useDacAudio.setState({
      sinkId: 'default',
      dacDirectMode: false,
      lockUnityVolume: false,
      autoSwitchToDac: true,
      preferredSampleRate: 'native',
      devices: [],
      activeSampleRateHz: null,
      activeDeviceLabel: 'System Default',
    });
  });

  it('detects wide range of USB dongles, desktop DACs, and studio interfaces', () => {
    expect(isLikelyDacDevice('FiiO K3 USB Audio DAC')).toBe(true);
    expect(isLikelyDacDevice('iFi (by AMR) HD USB Audio')).toBe(true);
    expect(isLikelyDacDevice('Topping E30 II (USB Audio)')).toBe(true);
    expect(isLikelyDacDevice('Moondrop Dawn Pro CS43131')).toBe(true);
    expect(isLikelyDacDevice('CX31993 USB-C Audio Dongle')).toBe(true);
    expect(isLikelyDacDevice('Focusrite Scarlett 2i2')).toBe(true);
    expect(isLikelyDacDevice('Chord Mojo 2')).toBe(true);
    expect(isLikelyDacDevice('S/PDIF Optical Output')).toBe(true);
    expect(isLikelyDacDevice('Realtek(R) Audio Speakers')).toBe(false);
    expect(isLikelyDacDevice('MacBook Pro Speakers')).toBe(false);
  });

  it('routes HTMLAudioElement and AudioContext via setSinkId when supported', async () => {
    const elSink = vi.fn().mockResolvedValue(undefined);
    const ctxSink = vi.fn().mockResolvedValue(undefined);
    const fakeEl = { setSinkId: elSink, currentSrc: 'https://example.com/audio.mp3', readyState: 2 } as unknown as HTMLAudioElement;
    const fakeCtx = { setSinkId: ctxSink } as unknown as AudioContext;

    const res = await applySinkToTargets('dac-usb-1', [fakeEl], fakeCtx);
    expect(res.applied).toBe(true);
    expect(res.error).toBeNull();
    expect(elSink).toHaveBeenCalledWith('dac-usb-1');
    expect(ctxSink).toHaveBeenCalledWith('dac-usb-1');

    await applySinkToTargets('default', [fakeEl], fakeCtx);
    expect(elSink).toHaveBeenCalledWith('');
    expect(ctxSink).toHaveBeenCalledWith('');
  });

  it('ignores idle HTMLAudioElement and AbortError when AudioContext routes cleanly', async () => {
    const idleSink = vi.fn().mockRejectedValue(new DOMException('The operation could not be performed and was aborted', 'AbortError'));
    const ctxSink = vi.fn().mockResolvedValue(undefined);
    const idleEl = { setSinkId: idleSink, currentSrc: '', src: '', readyState: 0 } as unknown as HTMLAudioElement;
    const fakeCtx = { setSinkId: ctxSink } as unknown as AudioContext;

    const res = await applySinkToTargets('ab13x-dac', [idleEl], fakeCtx);
    expect(res.applied).toBe(true);
    expect(res.error).toBeNull();
    expect(idleSink).not.toHaveBeenCalled();
    expect(ctxSink).toHaveBeenCalledWith('ab13x-dac');
  });

  it('persists DAC direct mode, unity volume lock, auto-switch, and sample rate', () => {
    const store = useDacAudio.getState();
    store.setDacDirectMode(true);
    store.setLockUnityVolume(true);
    store.setAutoSwitchToDac(false);
    store.setPreferredSampleRate(192000);

    const next = useDacAudio.getState();
    expect(next.dacDirectMode).toBe(true);
    expect(next.lockUnityVolume).toBe(true);
    expect(next.autoSwitchToDac).toBe(false);
    expect(next.preferredSampleRate).toBe(192000);
  });

  it('recognizes WebUSB DACs across phones, tablets, and computers via vendor ID or audio class', () => {
    expect(isWebUsbAudioDevice({ vendorId: 0x0572, productId: 0x1b01 })).toBe(true); // AB13X
    expect(isWebUsbAudioDevice({ vendorId: 0x05ac, productId: 0x110a })).toBe(true); // Apple USB-C
    expect(isWebUsbAudioDevice({ vendorId: 0x2972, productId: 0x0047 })).toBe(true); // FiiO
    expect(
      isWebUsbAudioDevice({
        vendorId: 0x9999,
        productId: 0x0001,
        configurations: [{ interfaces: [{ alternates: [{ interfaceClass: 1 }] }] }],
      }),
    ).toBe(true); // Generic USB Audio Class 1
    expect(isWebUsbAudioDevice({ vendorId: 0x046d, productId: 0xc52b, productName: 'USB Mouse' })).toBe(false);
  });

  it('detects Bluetooth headsets, earbuds, and speakers and formats details cleanly', () => {
    expect(isLikelyBluetoothDevice('AirPods Pro')).toBe(true);
    expect(isLikelyBluetoothDevice('Sony WH-1000XM5 Stereo')).toBe(true);
    expect(isLikelyBluetoothDevice('boAt Rockerz 255 Bluetooth')).toBe(true);
    expect(isLikelyBluetoothDevice('JBL Flip 6 Wireless')).toBe(true);
    expect(isLikelyBluetoothDevice('MacBook Pro Speakers')).toBe(false);
    expect(cleanAudioDeviceLabel('Default - Sony WH-1000XM5 Stereo')).toBe('Sony WH-1000XM5 Stereo');
    expect(inferBluetoothProfile('Sony WH-1000XM5 Hands-Free')).toBe('Hands-Free (HFP)');
    expect(inferBluetoothProfile('AirPods Pro')).toBe('Stereo A2DP • AVRCP');
  });
});
