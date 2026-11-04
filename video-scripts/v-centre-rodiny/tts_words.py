# edge-tts with word timings: python3 tts_words.py voice rate pitch text out.mp3  -> also writes out.words.json
import asyncio, json, ssl, sys
import edge_tts, edge_tts.communicate as c

c._SSL_CTX = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")  # agent proxy CA
voice, rate, pitch, text, out = sys.argv[1:6]


async def main():
    words = []
    com = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    with open(out, "wb") as f:
        async for ch in com.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]])
    if not words:
        raise SystemExit("no audio")
    json.dump(words, open(out[:-4] + ".words.json", "w"), ensure_ascii=False)


asyncio.run(main())
