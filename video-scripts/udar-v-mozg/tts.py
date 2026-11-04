import asyncio, ssl, sys, edge_tts, edge_tts.communicate as c
c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
voice, rate, pitch, text, out = sys.argv[1:6]
asyncio.run(edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(out))
