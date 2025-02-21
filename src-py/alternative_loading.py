from transcriber import LocalTranscriber
from formatter import LocalFormatter
import time

start_time = time.time()
transcriber = LocalTranscriber()
transcriber.load_model()
raw_transcription = transcriber.transcribe_audio("recording.flac")

transcriber.unload_model()

formatter = LocalFormatter()
formatter.load_model()
transcription = formatter.improve_transcription(raw_transcription)

print(f"Transcription: {transcription}")
print(f"Time taken: {time.time() - start_time} seconds")

# notes:
# Default time: 91 seconds (load both models upfront, cpu transcriber, gpu formatter)
# next:58 seconds (load both models upfront, auto (gpu?) transcriber, formatter 65% CPU / 35% GPU)
# 45 seconds (sequential model loading, auto transcriber, formatter 65% CPU / 35% GPU)
# explicit gpu transcriber: 39 seconds (sequential model loading, cuda transcriber, formatter 65% CPU / 35% GPU)
# del transcriber: 32 seconds (sequential, delete transcriber before loading formatter, cuda transcriber, formatter 100% GPU)
# repeat: 32 seconds
# repeat: 31 seconds
# unload transcriber 31 seconds
