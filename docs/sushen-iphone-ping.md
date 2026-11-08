# Sushen iPhone Ping error (icloud3/find_iphone_alert)

**Date:** 2026-11-04
**Symptom:** Ping on the Sushen iPhone card (Devices view, Mobile Home dashboard) shows
"Failed to perform the action icloud3/find_iphone_alert. None". Paro's Ping works.

## Root cause

The Sushen card in the Devices view (`mobile-hub`, path `devices-mobile`) passed the
device ID `b4c6338c2f8906f56d55bb1d873be555` to `icloud3.find_iphone_alert`. That ID is
not a tracked iCloud3 device, so iCloud3 raised `KeyError: None` in
`find_iphone_alert_service_handler` (`service_handler.py` line 597).

## Fix

1. Mobile Home dashboard: Sushen card `variables.device` changed to
   `53d7d04e7b0b692b4f7ed3bfaf346cf7` (the Sushen iCloud3 tracker).
2. `scripts.yaml`, `lost_phone`: Sushen branch of `device_name` changed to `sushen_phone`.
   Not the cause of the Devices Ping error.

## Verification

Pending re-test of Devices Ping and the Lost Phone popup for Sushen.
