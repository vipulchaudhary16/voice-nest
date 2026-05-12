import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../shared/models/app_models.dart';
import '../network/api_client.dart';

class SessionController extends StateNotifier<AsyncValue<Session?>> {
  SessionController({
    required ApiClient apiClient,
    required FlutterSecureStorage storage,
  })  : _apiClient = apiClient,
        _storage = storage,
        super(const AsyncValue.loading()) {
    _restoreSession();
  }

  static const tokenKey = 'session_token';
  static const idKey = 'session_id';
  static const nameKey = 'session_name';
  static const emailKey = 'session_email';
  static const roleKey = 'session_role';
  static const tenantKey = 'session_tenant';
  static const tenantNameKey = 'session_tenant_name';

  final ApiClient _apiClient;
  final FlutterSecureStorage _storage;

  Future<void> _restoreSession() async {
    final token = await _storage.read(key: tokenKey);
    if (token == null) {
      state = const AsyncValue.data(null);
      return;
    }
    state = AsyncValue.data(
      Session(
        token: token,
        id: await _storage.read(key: idKey) ?? '',
        name: await _storage.read(key: nameKey) ?? '',
        email: await _storage.read(key: emailKey) ?? '',
        role: await _storage.read(key: roleKey) ?? '',
        tenantId: await _storage.read(key: tenantKey) ?? '',
        tenantName: await _storage.read(key: tenantNameKey),
      ),
    );
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final session = await _apiClient.login(email, password);
      await Future.wait([
        _storage.write(key: tokenKey, value: session.token),
        _storage.write(key: idKey, value: session.id),
        _storage.write(key: nameKey, value: session.name),
        _storage.write(key: emailKey, value: session.email),
        _storage.write(key: roleKey, value: session.role),
        _storage.write(key: tenantKey, value: session.tenantId),
        if (session.tenantName != null)
          _storage.write(key: tenantNameKey, value: session.tenantName)
        else
          _storage.delete(key: tenantNameKey),
      ]);
      return session;
    });
  }

  Future<void> logout() async {
    await Future.wait([
      _storage.delete(key: tokenKey),
      _storage.delete(key: idKey),
      _storage.delete(key: nameKey),
      _storage.delete(key: emailKey),
      _storage.delete(key: roleKey),
      _storage.delete(key: tenantKey),
      _storage.delete(key: tenantNameKey),
    ]);
    state = const AsyncValue.data(null);
  }

  Future<String?> token() => _storage.read(key: tokenKey);
}
