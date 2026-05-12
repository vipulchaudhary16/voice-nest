import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

class RecordingPlayerModal extends StatefulWidget {
  const RecordingPlayerModal({
    super.key,
    required this.recordingUrl,
    required this.number,
  });

  final String recordingUrl;
  final String number;

  @override
  State<RecordingPlayerModal> createState() => _RecordingPlayerModalState();
}

class _RecordingPlayerModalState extends State<RecordingPlayerModal> {
  final AudioPlayer _player = AudioPlayer();
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      await _player.setUrl(widget.recordingUrl);
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Unable to load recording.';
        });
      }
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Call Recording', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(widget.number, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 16),
            if (_loading) const Center(child: CircularProgressIndicator()),
            if (_error != null) Text(_error!),
            if (!_loading && _error == null) ...[
              StreamBuilder<Duration?>(
                stream: _player.durationStream,
                builder: (context, durationSnapshot) {
                  final duration = durationSnapshot.data ?? Duration.zero;
                  return StreamBuilder<Duration>(
                    stream: _player.positionStream,
                    builder: (context, positionSnapshot) {
                      final position = positionSnapshot.data ?? Duration.zero;
                      final maxMs = duration.inMilliseconds <= 0 ? 1 : duration.inMilliseconds;
                      final value = position.inMilliseconds.clamp(0, maxMs).toDouble();
                      return Slider(
                        value: value,
                        min: 0,
                        max: maxMs.toDouble(),
                        onChanged: (next) => _player.seek(Duration(milliseconds: next.toInt())),
                      );
                    },
                  );
                },
              ),
              const SizedBox(height: 8),
              Center(
                child: StreamBuilder<PlayerState>(
                  stream: _player.playerStateStream,
                  builder: (context, stateSnapshot) {
                    final isPlaying = stateSnapshot.data?.playing == true;
                    return FilledButton.icon(
                      onPressed: () => isPlaying ? _player.pause() : _player.play(),
                      icon: Icon(isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded),
                      label: Text(isPlaying ? 'Pause' : 'Play'),
                    );
                  },
                ),
              ),
            ],
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
