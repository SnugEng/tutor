import asyncio, os, re
import edge_tts

VOICE = "en-GB-SoniaNeural"   # the same voice as the vocabulary and irregular verbs
PAGE = "grammar/irrverpresent.html"
OUT = "grammar/audio_pres"
# words that could be read two ways get spelled the way they should sound
SAY = {"I read": "I reed"}

def slug(t):
    return re.sub(r"[^a-z0-9]+", "_", t.lower()).strip("_")

# Words typed into "Какие слова переозвучить" when starting the workflow are deleted and made
# again a cleaner way: as a one-word sentence ("be.") and a touch faster, so a short word on
# its own doesn't come out drawn-out or wobbly ("biii"). Missing files are always added.
REDO = {slug(w) for w in os.environ.get("REDO", "").split(",") if w.strip()}

def phrases():
    src = open(PAGE, encoding="utf-8").read()
    block = src[src.index("const VERBS = ["):]
    block = block[:block.index("\n];")]
    out = []
    for base, form in re.findall(r"\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]", block):
        # always with a pronoun: "he does", "he lives", "I read" can't be misread
        if base == "be":
            out += ["I am", "you are", "he is", "I'm not", "he isn't", "you aren't"]
        else:
            out += [f"I {base}", f"he {form}", f"he doesn't {base}"]
    return out

async def main():
    os.makedirs(OUT, exist_ok=True)
    for text in phrases():
        out = f"{OUT}/{slug(text)}.mp3"
        redo = slug(text) in REDO
        if os.path.exists(out) and not redo:
            continue
        said = SAY.get(text, text)
        if redo:
            await edge_tts.Communicate(said + ".", VOICE, rate="+10%").save(out)
        else:
            await edge_tts.Communicate(said, VOICE).save(out)
        print(f"{'REDO' if redo else 'OK'}: {text}")
    print("Present forms done")

asyncio.run(main())
