import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/config/env_config.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/home/presentation/pages/app_shell.dart';
import 'shared/providers/app_providers.dart';
import 'shared/widgets/brand_logo.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EnvConfig.load();
  runApp(const ProviderScope(child: VoiceNestApp()));
}

class VoiceNestApp extends ConsumerWidget {
  const VoiceNestApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionState = ref.watch(sessionControllerProvider);
    return MaterialApp(
      title: 'VoiceNest Mobile',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.system,
      theme: AppTheme.light(),
      home: sessionState.when(
        loading: () => const SplashScreen(),
        error: (error, stackTrace) => const LoginPage(),
        data: (session) => session == null ? const LoginPage() : const AppShell(),
      ),
    );
  }
}

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const BrandLogo(
              center: true,
              subtitle: 'VoiceNest Mobile',
            ),
            const SizedBox(height: 20),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
