import asyncio, os, re
import edge_tts

VOICE = "en-GB-SoniaNeural"   # the same voice as the vocabulary and irregular verbs
PAGE = "grammar/irrverpresent.html"
OUT = "grammar/audio_pres"
# Each form on its own, no pronoun ("watches", "doesn't watch"), so it fits any sentence.
# Words the voice could read the wrong way on their own are spelled the way they sound:
# read [ri:d], live [liv], lives [livz].
SAY = {"read": "reed", "live": "liv", "lives": "livs"}

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
        if base == "be":
            out += ["am", "are", "is", "am not", "isn't", "aren't"]
        else:
            out += [base, form, f"doesn't {base}"]
    return out

async def main():
    os.makedirs(OUT, exist_ok=True)
    wanted = {slug(t) + ".mp3" for t in phrases()}
    for f in os.listdir(OUT):                       # files the page no longer uses
        if f.endswith(".mp3") and f not in wanted:
            os.remove(os.path.join(OUT, f))
            print(f"removed: {f}")
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
