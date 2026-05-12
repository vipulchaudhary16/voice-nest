import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvConfig {
  EnvConfig._();

  static const String _envNameDefine = String.fromEnvironment(
    'ENV',
    defaultValue: 'development',
  );

  static String get envName => _envNameDefine;

  static String get envFileName {
    switch (_envNameDefine) {
      case 'production':
      case 'prod':
        return '.env.prod';
      case 'staging':
      case 'stage':
        return '.env.staging';
      case 'development':
      case 'dev':
      default:
        return '.env.development';
    }
  }

  static Future<void> load() async {
    await dotenv.load(fileName: envFileName);
  }

  static String get apiBaseUrl => dotenv.env['API_BASE_URL'] ?? 'http://localhost:8080/api';
}
