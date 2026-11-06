import asyncio, os, ssl, subprocess, sys, edge_tts, edge_tts.communicate as c
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from stress import accent  # noqa: E402
voice, rate, pitch, text, out = sys.argv[1:6]
if voice.startswith("silero:"):  # Silero lives in the shared street-show TTS script
    sys.exit(subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "v-centre-rodiny", "tts_words.py"), *sys.argv[1:6]]).returncode)
c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
asyncio.run(edge_tts.Communicate(accent(text), voice, rate=rate, pitch=pitch).save(out))
