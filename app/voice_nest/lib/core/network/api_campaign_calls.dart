import '../../features/campaigns/domain/campaign_detail_models.dart';
import 'api_client.dart';

extension ApiClientCampaignCalls on ApiClient {
  Future<CampaignCallDetailsPageData> getCampaignCallDetails(
    String id, {
    int offset = 0,
    int limit = 20,
  }) async {
    final response = await dio.get(
      '/campaigns/$id/call-details',
      queryParameters: {'offset': offset, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? const {};
    final responseRows = (data['response'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .where((item) => item['status']?.toString() == 'success')
        .map((item) => item['data'])
        .whereType<Map<String, dynamic>>()
        .map(CampaignCallRow.fromJson)
        .toList();
    final metadata = data['metadata'] as Map<String, dynamic>? ?? const {};
    return CampaignCallDetailsPageData(
      rows: responseRows,
      total: (metadata['total'] as num?)?.toInt() ?? responseRows.length,
      offset: (metadata['offset'] as num?)?.toInt() ?? offset,
      limit: (metadata['limit'] as num?)?.toInt() ?? limit,
    );
  }

  Future<CampaignCallDetailInfo> getCallDetailsBySid(String callSid) async {
    final response = await dio.get('/campaigns/calls/$callSid');
    final data = response.data['data'] as Map<String, dynamic>? ?? const {};
    return CampaignCallDetailInfo.fromJson(data);
  }
}
