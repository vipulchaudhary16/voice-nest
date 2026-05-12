import '../../shared/models/app_models.dart';
import 'api_client.dart';

extension ApiClientFlows on ApiClient {
  Future<List<AppFlow>> getFlows() async {
    final response = await dio.get('/flows');
    final list = response.data['data'] as List<dynamic>;
    return list.map((item) => AppFlow.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<AppFlow> createFlow(Map<String, dynamic> payload) async {
    final response = await dio.post('/flows', data: payload);
    final data = response.data['data'] as Map<String, dynamic>;
    return AppFlow.fromJson(data);
  }

  Future<AppFlow> updateFlow(String id, Map<String, dynamic> payload) async {
    final response = await dio.put('/flows/$id', data: payload);
    final data = response.data['data'] as Map<String, dynamic>;
    return AppFlow.fromJson(data);
  }

  Future<void> deleteFlow(String id) async {
    await dio.delete('/flows/$id');
  }
}
