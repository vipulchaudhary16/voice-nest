import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class BrandLogo extends StatelessWidget {
  const BrandLogo({
    super.key,
    this.size = 56,
    this.showName = true,
    this.nameSize,
    this.subtitle,
    this.center = false,
  });

  final double size;
  final bool showName;
  final double? nameSize;
  final String? subtitle;
  final bool center;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final crossAxis = center ? CrossAxisAlignment.center : CrossAxisAlignment.start;
    return Column(
      crossAxisAlignment: crossAxis,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: center ? MainAxisAlignment.center : MainAxisAlignment.start,
          children: [
            SvgPicture.asset(
              'assets/branding/favicon.svg',
              width: size,
              height: size,
            ),
            if (showName) ...[
              const SizedBox(width: 12),
              Text(
                'VoiceNest',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: nameSize,
                  color: scheme.onSurface,
                ),
              ),
            ],
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: theme.textTheme.bodySmall?.copyWith(
              color: scheme.onSurfaceVariant,
            ),
            textAlign: center ? TextAlign.center : TextAlign.start,
          ),
        ],
      ],
    );
  }
}
