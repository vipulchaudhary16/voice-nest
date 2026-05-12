import 'dart:ui';

import 'package:flutter/material.dart';

class ContactsAlphabetLetterCell extends StatelessWidget {
  const ContactsAlphabetLetterCell({
    super.key,
    required this.letter,
    required this.scale,
    required this.push,
    required this.isActive,
    required this.isPressed,
    required this.activeColor,
    required this.inactiveColor,
    required this.primary,
  });

  final String letter;
  final double scale;
  final double push;
  final bool isActive;
  final bool isPressed;
  final Color activeColor;
  final Color inactiveColor;
  final Color primary;

  @override
  Widget build(BuildContext context) {
    final color = isPressed ? primary : (isActive ? activeColor : inactiveColor);
    return Center(
      child: Transform.translate(
        offset: Offset(-push, 0),
        child: Transform.scale(
          scale: scale,
          child: Text(
            letter,
            style: TextStyle(
              fontSize: 10.5,
              height: 1,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.2,
              color: color,
            ),
          ),
        ),
      ),
    );
  }
}

class ContactsAlphabetPreviewBubble extends StatelessWidget {
  const ContactsAlphabetPreviewBubble({super.key, required this.letter});

  final String letter;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          width: 56,
          height: 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.10) : Colors.white.withOpacity(0.85),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isDark ? Colors.white.withOpacity(0.16) : Colors.black.withOpacity(0.08),
            ),
            boxShadow: [
              BoxShadow(
                blurRadius: 28,
                offset: const Offset(0, 10),
                color: Colors.black.withOpacity(isDark ? 0.45 : 0.12),
              ),
            ],
          ),
          child: Text(
            letter,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: scheme.primary,
              letterSpacing: 0.4,
            ),
          ),
        ),
      ),
    );
  }
}
