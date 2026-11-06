import asyncio, os, ssl, sys, edge_tts, edge_tts.communicate as c
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from stress import accent  # noqa: E402
c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
voice, rate, pitch, text, out = sys.argv[1:6]
asyncio.run(edge_tts.Communicate(accent(text), voice, rate=rate, pitch=pitch).save(out))
