import asyncio, os, re
import edge_tts

VOICE = "en-GB-SoniaNeural"   # the same voice as the vocabulary and irregular verbs
PAGE = "grammar/irrverpresent.html"
OUT = "grammar/audio_pres"
# words that could be read two ways get spelled the way they should sound
SAY = {"I read": "I reed"}

def slug(t):
    return re.sub(r"[^a-z0-9]+", "_", t.lower()).strip("_")

def phrases():
    src = open(PAGE, encoding="utf-8").read()
    block = src[src.index("const VERBS = ["):]
    block = block[:block.index("\n];")]
    out = []
    for base, form in re.findall(r"\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]", block):
        # always with a pronoun: "he does", "he lives", "I read" can't be misread
        out += ["I am", "you are", "he is"] if base == "be" else [f"I {base}", f"he {form}"]
    return out

async def main():
    os.makedirs(OUT, exist_ok=True)
    for text in phrases():
        out = f"{OUT}/{slug(text)}.mp3"
        if os.path.exists(out):
            continue
        await edge_tts.Communicate(SAY.get(text, text), VOICE).save(out)
        print(f"OK: {text}")
    print("Present forms done")

asyncio.run(main())
