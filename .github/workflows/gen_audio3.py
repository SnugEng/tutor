import asyncio
import os
import edge_tts

VOICE = "en-GB-SoniaNeural"
OUT = "vocabulary/audio3"

WORDS = {
    "beat": "beat", "board_game": "board game", "captain": "captain",
    "challenge": "challenge", "champion": "champion", "cheat": "cheat",
    "classical_music": "classical music", "club": "club", "coach": "coach",
    "competition": "competition", "concert": "concert", "defeat": "defeat",
    "entertaining": "entertaining", "folk_music": "folk music", "group": "group",
    "gym": "gym", "have_fun": "have fun", "interest": "interest",
    "member": "member", "opponent": "opponent", "organise": "organise",
    "pleasure": "pleasure", "referee": "referee", "rhythm": "rhythm",
    "risk": "risk", "score": "score", "support": "support", "team": "team",
    "train": "train", "video_game": "video game", "carry_on": "carry on",
    "eat_out": "eat out", "give_up": "give up", "join_in": "join in",
    "send_off": "send off", "take_up": "take up", "turn_down": "turn down",
    "turn_up": "turn up", "for_a_long_time": "for a long time",
    "for_fun": "for fun", "in_the_middle_of": "in the middle of",
    "in_time_for": "in time for", "on_cd_dvd_video": "on CD DVD or video",
    "on_stage": "on stage", "action": "action", "actor": "actor",
    "athletic": "athletic", "athletics": "athletics", "childhood": "childhood",
    "children": "children", "collection": "collection", "collector": "collector",
    "entertainment": "entertainment", "heroic": "heroic", "heroine": "heroine",
    "musical": "musical", "musician": "musician", "player": "player",
    "playful": "playful", "sailing": "sailing", "sailor": "sailor",
    "sang": "sang", "singer": "singer", "singing": "singing", "song": "song",
    "sung": "sung", "a_fan_of": "a fan of", "a_game_against": "a game against",
    "a_book_by_sb_about": "a book about", "bored_with": "bored with",
    "crazy_about": "crazy about", "feel_like": "feel like", "good_at": "good at",
    "in_active": "active", "interested_in": "interested in", "keen_on": "keen on",
    "listen_to": "listen to", "popular_with": "popular with",
    "take_part_in": "take part in", "act": "act", "athlete": "athlete",
    "child": "child", "collect": "collect", "entertain": "entertain",
    "hero": "hero", "music": "music", "play": "play", "sail": "sail", "sing": "sing",
}

async def gen():
    os.makedirs(OUT, exist_ok=True)
    total = len(WORDS)
    for i, (fname, text) in enumerate(WORDS.items(), 1):
        out = f"{OUT}/{fname}.mp3"
        tts = edge_tts.Communicate(text, VOICE)
        await tts.save(out)
        print(f"[{i}/{total}] OK: {fname}")

asyncio.run(gen())
