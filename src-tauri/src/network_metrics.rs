#![cfg(target_os = "windows")]

use serde::Serialize;
use std::collections::HashMap;
use std::ffi::c_void;
use std::ptr::null_mut;
use windows::Win32::Foundation::HANDLE;
use windows::Win32::NetworkManagement::IpHelper::{FreeMibTable, GetIfTable2, GetBestInterface, MIB_IF_ROW2, MIB_IF_TABLE2};
use windows::Win32::NetworkManagement::IpHelper::{IF_TYPE_IEEE80211, IF_TYPE_ETHERNET_CSMACD};
use windows::Win32::NetworkManagement::WiFi::*;

#[derive(Debug, Serialize, Clone, PartialEq, Eq)]
pub enum InterfaceKind {
    Ethernet,
    Wifi,
    Other,
}

#[derive(Debug, Serialize, Clone)]
pub struct InterfaceMetrics {
    pub name: String,
    pub kind: InterfaceKind,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
    pub signal_quality: Option<u32>, // 0..=100 for Wi‑Fi when connected
}

fn map_if_type_to_kind(if_type: u32) -> InterfaceKind {
    match if_type {
        IF_TYPE_ETHERNET_CSMACD => InterfaceKind::Ethernet,
        IF_TYPE_IEEE80211 => InterfaceKind::Wifi,
        _ => InterfaceKind::Other,
    }
}

unsafe fn collect_wlan_signal_by_guid() -> Result<HashMap<String, u32>, String> {
    let mut negotiated_version: u32 = 0;
    let mut client_handle: HANDLE = HANDLE::default();

    // Open WLAN handle
    let open = WlanOpenHandle(2, None, &mut negotiated_version, &mut client_handle);
    if open != 0 {
        return Err(format!("WlanOpenHandle failed: {}", open));
    }

    let mut iface_list_ptr: *mut WLAN_INTERFACE_INFO_LIST = null_mut();
    let enum_res = WlanEnumInterfaces(client_handle, None, &mut iface_list_ptr);
    if enum_res != 0 {
        let _ = WlanCloseHandle(client_handle, None);
        return Err(format!("WlanEnumInterfaces failed: {}", enum_res));
    }

    let mut map = std::collections::HashMap::new();

    if !iface_list_ptr.is_null() {
        let iface_list = &*iface_list_ptr;
        let count = iface_list.dwNumberOfItems as usize;
        let base_ptr = iface_list.InterfaceInfo.as_ptr();
        let infos: &[WLAN_INTERFACE_INFO] = std::slice::from_raw_parts(base_ptr, count);
        for info in infos {
            // Query current connection to get signal quality
            let mut data_size: u32 = 0;
            let mut data_ptr: *mut c_void = std::ptr::null_mut();
            let query_res = WlanQueryInterface(
                client_handle,
                &info.InterfaceGuid,
                wlan_intf_opcode_current_connection,
                None,
                &mut data_size,
                &mut data_ptr,
                None,
            );

            if query_res == 0 && !data_ptr.is_null() {
                // Interpret as WLAN_CONNECTION_ATTRIBUTES
                let attrs = &*(data_ptr as *const WLAN_CONNECTION_ATTRIBUTES);
                let signal = attrs.wlanAssociationAttributes.wlanSignalQuality;
                let guid_key = format!("{:?}", info.InterfaceGuid);
                map.insert(guid_key, signal);
                WlanFreeMemory(data_ptr);
            } else if !data_ptr.is_null() {
                WlanFreeMemory(data_ptr);
            }
        }

        WlanFreeMemory(iface_list_ptr as *mut c_void);
    }

    let _ = WlanCloseHandle(client_handle, None);
    Ok(map)
}

#[tauri::command]
#[allow(clippy::uninit_assumed_init)]
pub async fn get_network_metrics() -> Result<InterfaceMetrics, String> {
    // SAFETY: We are using Windows API which is unsafe; we wrap and validate pointers/lengths.
    unsafe {
        // Build map of Wi‑Fi signal qualities by interface GUID using WLAN API
        let wifi_signal_by_guid = collect_wlan_signal_by_guid().unwrap_or_default();

        // Retrieve interface table for rx/tx counters
        let mut table_ptr: *mut MIB_IF_TABLE2 = null_mut();
        let status = GetIfTable2(&mut table_ptr);
        if status.0 != 0 {
            return Err(format!("GetIfTable2 failed: {:?}", status));
        }
        if table_ptr.is_null() {
            return Err("GetIfTable2 returned null table".to_string());
        }

        let table_ref = &*table_ptr;
        let num = table_ref.NumEntries as usize;
        let rows: &[MIB_IF_ROW2] = std::slice::from_raw_parts(table_ref.Table.as_ptr(), num);

        // Determine best/active interface via routing decision to 8.8.8.8
        let mut best_index: u32 = 0;
        let dest_ipv4: u32 = 0x08080808; // 8.8.8.8 in network byte order
        let best_res = GetBestInterface(dest_ipv4, &mut best_index);

        // Helper to build InterfaceMetrics from a row
        fn build_metrics(row: &MIB_IF_ROW2, wifi_map: &HashMap<String, u32>) -> InterfaceMetrics {
            let kind = map_if_type_to_kind(row.Type);
            let rx = row.InOctets;
            let tx = row.OutOctets;
            let name = {
                fn wchar_array_to_string(buf: &[u16]) -> String {
                    let end = buf.iter().position(|&ch| ch == 0).unwrap_or(buf.len());
                    String::from_utf16_lossy(&buf[..end])
                }
                let alias = wchar_array_to_string(&row.Alias);
                if !alias.is_empty() { alias } else { wchar_array_to_string(&row.Description) }
            };
            let signal_quality = if matches!(kind, InterfaceKind::Wifi) {
                let guid_key = format!("{:?}", row.InterfaceGuid);
                wifi_map.get(&guid_key).copied()
            } else { None };
            InterfaceMetrics { name, kind, rx_bytes: rx, tx_bytes: tx, signal_quality }
        }

        // Try to find the row matching best_index
        if best_res == 0 {
            if let Some(row) = rows.iter().find(|r| r.InterfaceIndex == best_index) {
                let metrics = build_metrics(row, &wifi_signal_by_guid);
                let _ = FreeMibTable(table_ptr as *mut c_void);
                return Ok(metrics);
            }
        }

        // Fallback: pick first Ethernet or Wi‑Fi interface as active; otherwise first entry
        if let Some(row) = rows.iter().find(|r| {
            matches!(map_if_type_to_kind(r.Type), InterfaceKind::Ethernet | InterfaceKind::Wifi)
        }) {
            let metrics = build_metrics(row, &wifi_signal_by_guid);
            let _ = FreeMibTable(table_ptr as *mut c_void);
            return Ok(metrics);
        }

        // Last resort: use the very first row if present
        if let Some(row) = rows.first() {
            let metrics = build_metrics(row, &wifi_signal_by_guid);
            let _ = FreeMibTable(table_ptr as *mut c_void);
            return Ok(metrics);
        }

        let _ = FreeMibTable(table_ptr as *mut c_void);
        Err("No network interfaces found".to_string())
    }
}
