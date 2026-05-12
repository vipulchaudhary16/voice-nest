class CampaignDetail {
  CampaignDetail({
    required this.id,
    required this.name,
    required this.status,
    required this.campaignType,
    required this.flowType,
    required this.url,
    required this.readViaText,
    required this.exotelSid,
    required this.callerPhoneNo,
    required this.listNames,
    required this.retryCount,
    required this.scheduleSendAt,
    required this.scheduleEndAt,
  });

  final String id;
  final String name;
  final String status;
  final String campaignType;
  final String flowType;
  final String url;
  final String readViaText;
  final String exotelSid;
  final String callerPhoneNo;
  final List<String> listNames;
  final int? retryCount;
  final String scheduleSendAt;
  final String scheduleEndAt;

  factory CampaignDetail.fromJson(Map<String, dynamic> json) {
    final lists = (json['lists'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map((item) => item['name']?.toString() ?? '')
        .where((name) => name.isNotEmpty)
        .toList();
    return CampaignDetail(
      id: json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Created',
      campaignType: json['campaign_type']?.toString() ?? 'static',
      flowType: json['flow_type']?.toString() ?? 'ivr',
      url: json['url']?.toString() ?? '',
      readViaText: json['read_via_text']?.toString() ?? '',
      exotelSid: json['exotel_sid']?.toString() ?? '',
      callerPhoneNo: (json['caller_id'] as Map<String, dynamic>?)?['phone_no']?.toString() ?? '',
      listNames: lists,
      retryCount: ((json['retries'] as Map<String, dynamic>?)?['number_of_retries'] as num?)?.toInt(),
      scheduleSendAt: (json['schedule'] as Map<String, dynamic>?)?['send_at']?.toString() ?? '',
      scheduleEndAt: (json['schedule'] as Map<String, dynamic>?)?['end_at']?.toString() ?? '',
    );
  }
}

class CampaignCallRow {
  CampaignCallRow({
    required this.number,
    required this.name,
    required this.status,
    required this.duration,
    required this.dateCreated,
    required this.callSid,
    required this.raw,
  });

  final String number;
  final String name;
  final String status;
  final String duration;
  final String dateCreated;
  final String callSid;
  final Map<String, dynamic> raw;

  List<MapEntry<String, String>> get allDetails {
    final entries = raw.entries
        .where((entry) => !_hiddenDetailKeys.contains(entry.key))
        .map((entry) => MapEntry(_prettifyKey(entry.key), _formatDetailValue(entry.key, entry.value)))
        .where((entry) => entry.value.isNotEmpty && entry.value != '-')
        .toList();
    entries.sort((a, b) => a.key.compareTo(b.key));
    return entries;
  }

  factory CampaignCallRow.fromJson(Map<String, dynamic> json) => CampaignCallRow(
        number: json['number']?.toString() ?? '-',
        name: json['name']?.toString() ?? '-',
        status: json['status']?.toString() ?? '-',
        duration: json['duration']?.toString() ?? '-',
        dateCreated: json['date_created']?.toString() ?? '',
        callSid: json['call_sid']?.toString() ?? '-',
        raw: json,
      );
}

String _stringify(dynamic value) {
  if (value == null) return '';
  if (value is List) {
    return value.map(_stringify).where((item) => item.isNotEmpty).join(', ');
  }
  if (value is Map) {
    return value.entries.map((entry) => '${entry.key}: ${_stringify(entry.value)}').join(', ');
  }
  return value.toString();
}

String _formatDetailValue(String key, dynamic value) {
  final text = _stringify(value).trim();
  if (text.isEmpty) return '';
  final lowerKey = key.toLowerCase();
  final looksLikeDateKey =
      lowerKey.contains('time') || lowerKey.contains('date') || lowerKey.endsWith('_at');
  if (looksLikeDateKey) {
    final parsed = _parseFlexibleDate(text);
    if (parsed != null) {
      final local = parsed.toLocal();
      final month = local.month.toString().padLeft(2, '0');
      final day = local.day.toString().padLeft(2, '0');
      final hour = local.hour.toString().padLeft(2, '0');
      final minute = local.minute.toString().padLeft(2, '0');
      final second = local.second.toString().padLeft(2, '0');
      return '${local.year}-$month-$day $hour:$minute:$second';
    }
  }
  return text;
}

DateTime? _parseFlexibleDate(String raw) {
  final candidates = <String>{raw};
  final normalizedSpace = raw.replaceAll(' ', 'T');
  candidates.add(normalizedSpace);
  candidates.add(normalizedSpace.replaceFirst(RegExp(r'([+-]\d{2}):?(\d{2})$'), r'$1:$2'));
  candidates.add(normalizedSpace.replaceFirst(RegExp(r'([+-]\d{2}):(\d)$'), r'$1:0$2'));
  candidates.add(normalizedSpace.replaceFirst(RegExp(r'([+-]\d{2})(\d{2})$'), r'$1:$2'));
  candidates.add(normalizedSpace.replaceAll(RegExp(r'([+-]\d{2}):(\d)$'), r'$1:0$2'));
  for (final candidate in candidates) {
    final parsed = DateTime.tryParse(candidate);
    if (parsed != null) return parsed;
  }
  return null;
}

String _prettifyKey(String key) {
  final clean = key.replaceAll('_', ' ').trim();
  if (clean.isEmpty) return key;
  return clean[0].toUpperCase() + clean.substring(1);
}

const Set<String> _hiddenDetailKeys = {
  'id',
  '_id',
  'sid',
  'call_sid',
  'caller_id',
  'customer_id',
  'agent_id',
  'campaign_id',
  'tenant_id',
};

class CampaignCallDetailsPageData {
  CampaignCallDetailsPageData({
    required this.rows,
    required this.total,
    required this.offset,
    required this.limit,
  });

  final List<CampaignCallRow> rows;
  final int total;
  final int offset;
  final int limit;
}

class CampaignCallDetailInfo {
  CampaignCallDetailInfo({
    required this.sid,
    required this.status,
    required this.customerNumber,
    required this.recordingAvailable,
    required this.recordingUrl,
    required this.raw,
  });

  final String sid;
  final String status;
  final String customerNumber;
  final bool recordingAvailable;
  final String recordingUrl;
  final Map<String, dynamic> raw;

  factory CampaignCallDetailInfo.fromJson(Map<String, dynamic> json) {
    final details = (json['response'] as Map<String, dynamic>?)?['call_details']
            as Map<String, dynamic>? ??
        const {};
    final recording = details['recording'] as Map<String, dynamic>? ?? const {};
    return CampaignCallDetailInfo(
      sid: details['sid']?.toString() ?? '',
      status: details['status']?.toString() ?? '',
      customerNumber: (details['customer_details'] as Map<String, dynamic>?)?['number']?.toString() ?? '',
      recordingAvailable: recording['available'] == true,
      recordingUrl: recording['url']?.toString() ?? '',
      raw: details,
    );
  }
}
