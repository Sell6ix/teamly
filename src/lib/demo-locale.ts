import type { Locale } from "@/lib/i18n/messages";
import type { GameId, OpenParty, Player } from "@/lib/types";

/** English overlays for demo seed strings (RU remains the source in data.ts). */
export const playerEn: Record<string, { name: string; role: string; bio: string }> = {
  "p1": {"name":"Kira_Neon","role":"Duelist / Jett","bio":"Looking for a five-stack for Immortal. Calm comms, no toxicity."},
  "p2": {"name":"SovaDad","role":"Initiator","bio":"Drone and flashes ready. Dumb questions welcome."},
  "p3": {"name":"Omen_quiet","role":"Controller","bio":"Night queues, unrated OK. Memes welcome."},
  "p4": {"name":"Brim_coffee","role":"Smokes","bio":"Chat only, no mic. Smokes on call."},
  "p26": {"name":"Killjoy_lab","role":"Sentinel / Killjoy","bio":"Turret and lock ready. Want a five-stack that won’t tilt after pistols."},
  "p27": {"name":"SovaLineups","role":"Initiator / Sova","bio":"Drone lineups for every map. Can IGL if nobody else will."},
  "p5": {"name":"PudgePrime","role":"Offlane","bio":"7k MMR, hooks on timing. Need a support who talks."},
  "p6": {"name":"CrystalMaiden","role":"Pos 5 support","bio":"Learning to ward. Looking for a duo who won’t yell at mistakes."},
  "p7": {"name":"InvokerNight","role":"Mid","bio":"Night parties only. No flame — demo reviews welcome."},
  "p8": {"name":"AWP_Lisa","role":"AWPer","bio":"Premier ~18k. Need mic people, no tilt. Also play L4D2."},
  "p9": {"name":"RushB_Vanya","role":"Entry rusher","bio":"Casual calibrations and meme rushes. After work is fine."},
  "p10": {"name":"IGL_quiet","role":"Captain","bio":"Can IGL during the day. Explain strats calmly."},
  "p11": {"name":"WraithDash","role":"Scout","bio":"Diamond. Looking for a trio that doesn’t scatter across the map."},
  "p12": {"name":"LifelinePlus","role":"Support","bio":"Learning drops and rotates. Duo for pubs OK."},
  "p13": {"name":"GibbyWall","role":"Tank","bio":"Morning games before work. Communicate with pings."},
  "p14": {"name":"DemocracyDave","role":"Assault","bio":"Super Earth calls. Diff 7–8 OK, no kicks for teamkill."},
  "p15": {"name":"Eagle_1","role":"Orbital","bio":"Helldive, clean stratagems. Looking for people who won’t drop a 500kg on the squad."},
  "p16": {"name":"BugSpray","role":"Newbie","bio":"Just bought it. Show me where to throw stratagems."},
  "p17": {"name":"Karl_forever","role":"Driller","bio":"Beer, glyphids, and rocks. Hazard 4–5, no rushing."},
  "p18": {"name":"ScoutLight","role":"Scout","bio":"Speedrunning egg hunt. Need dwarves who time the elevator."},
  "p19": {"name":"GunnerMama","role":"Gunner","bio":"Happy to show a newbie where to shine and when not to dig into the void."},
  "p20": {"name":"MidOrFeed","role":"Mid / Ahri","bio":"Plat. Need a five-stack without AFK and with real dragon timers."},
  "p21": {"name":"Sup_Buttercup","role":"Support","bio":"Bot duo: no flame, ward, and ping ult timings."},
  "p22": {"name":"JungleClock","role":"Jungle","bio":"Night farm. Baron timers in chat."},
  "p23": {"name":"Meg_flashlight","role":"Survivor","bio":"Gen rush, no toxicity. Happy to teach hook saves."},
  "p24": {"name":"Huntress_darts","role":"Killer","bio":"Looking for a custom partner: build and timing reviews."},
  "p25": {"name":"Dwight_locker","role":"Survivor","bio":"I hide in lockers. Teach me when to leave."},
  "p28": {"name":"ScrapRunner","role":"Looter","bio":"We’ll hit quota without hero plays. Walkie mods OK."},
  "p29": {"name":"DoorGuy","role":"Newbie","bio":"First contract. Tell me where not to walk in the fog."},
  "p30": {"name":"ShipPilot_Anya","role":"Pilot","bio":"I stay on the ship and watch radar. Need three on the surface."},
  "p31": {"name":"EMF_Quiet","role":"Evidence","bio":"Professional difficulty, no screaming on mic. Happy to teach evidence."},
  "p32": {"name":"GhostBait","role":"Hunt bait","bio":"I hold the crucifix and watch hunts. Looking for Intermediate duo."},
  "p33": {"name":"CamVan","role":"Tech","bio":"Van cams. I’ll chat if I spot something."},
  "p34": {"name":"CoachCall","role":"Survivor","bio":"Campaign on Advanced. We don’t leave people down."},
  "p35": {"name":"TankMain","role":"Infected","bio":"Versus. Coordinate tank and smoker without toxicity."},
  "p36": {"name":"Medpack_Lena","role":"Medic","bio":"Learning saves. Normal difficulty OK, no speedrun."},
  "p60": {"name":"Lisa_campaign","role":"Survivor","bio":"Same Lisa who AWPs in CS2. Campaign with no AFK in safe rooms."},
  "p61": {"name":"Vanya_campaign","role":"Survivor","bio":"RushB Vanya from CS2. Normal after calibrations is fine."},
  "p37": {"name":"RootGun","role":"DPS / Gunslinger","bio":"Apocalypse. Looking for a boss trio, no solo aggro."},
  "p38": {"name":"HandlerPlus","role":"Tank / Handler","bio":"Guiding a newbie through the story. Veteran OK."},
  "p39": {"name":"SecretSeeker","role":"Explorer","bio":"Collecting secrets and archetypes. No story racing."},
  "p40": {"name":"Captain_Bunker","role":"Charisma / debater","bio":"I run votes without toxicity. Need eight for classic Bunker."},
  "p41": {"name":"MedicAnya","role":"Medic","bio":"First games. Explain job cards — slow pace OK."},
  "p42": {"name":"Engineer_cat","role":"Engineer","bio":"Love hard debates. No meta knowledge about other people’s cards."},
  "p43": {"name":"Don_quiet","role":"Mafia","bio":"Classic with a host. No DMing leaks."},
  "p44": {"name":"SheriffKatya","role":"Town","bio":"Learning to read the table. New town players welcome."},
  "p45": {"name":"HostMax","role":"Host","bio":"I can host the night. Need a dozen who won’t tilt after deaths."},
  "p46": {"name":"RedSus","role":"Crewmate","bio":"Voice meetings without yelling. Skins and custom maps OK."},
  "p47": {"name":"ImposterLite","role":"Impostor","bio":"Double impostor, no friends-only lobbies. Fair votes."},
  "p48": {"name":"SketchKing","role":"Artist","bio":"Meme rounds — drawing with feet allowed. Russian dictionary."},
  "p49": {"name":"Phone_Olya","role":"Guesser","bio":"First time in Gartic. Chat only, no mic."},
  "p50": {"name":"QuiplashVanya","role":"Host","bio":"I have Party Pack. Quiplash / Trivia Murder Party, no shame."},
  "p51": {"name":"FibbageFan","role":"Player","bio":"Night games from a phone. Pack newbies welcome."},
  "p52": {"name":"WordCaptain","role":"Captain","bio":"One clue for three. No spoiling the other team."},
  "p53": {"name":"OperativeLisa","role":"Operative","bio":"Learning associations. Duo vs duo OK."},
  "p54": {"name":"WordEater","role":"Explainer","bio":"Fast Alias, no foreign-language hints."},
  "p55": {"name":"Guessy","role":"Guesser","bio":"Learning to explain with gestures. Slow pace OK."},
  "p56": {"name":"Draw4_Kirill","role":"Stacker","bio":"House rules: stack +2/+4. No tilt."},
  "p57": {"name":"SkipQueen","role":"Casual","bio":"Evening games from a phone. Newbies welcome."},
  "p58": {"name":"GooseHost","role":"Host","bio":"Custom lobby. Calm votes, no toxicity."},
  "p59": {"name":"DuckDetective","role":"Duck","bio":"Learning roles. Happy to explain map tasks."},
  "p70": {"name":"Cody_coop","role":"Cody","bio":"First playthrough. Looking for a partner tonight, no speedrun."},
  "p71": {"name":"May_replay","role":"May","bio":"We’ve finished it — want a chill replay. Newbie OK."},
};

export const partyEn: Record<string, { name: string; leader: string; note: string }> = {
  "demo1": {"name":"Ivan's demo party","leader":"Ivan","note":"Demo gathering to check the join link across browsers."},
  "g1": {"name":"Immo no tilt","leader":"Kira_Neon","note":"Need smoke and initiator. Voice on, no sarcasm in comms."},
  "g2": {"name":"Night casual","leader":"Omen_quiet","note":"Two games then bed. Unrated OK."},
  "g3": {"name":"7k+ party","leader":"PudgePrime","note":"Support and carry open. Post-loss review required."},
  "g4": {"name":"Learning to ward","leader":"CrystalMaiden","note":"Duo with a patient mid. ~1.5k MMR OK."},
  "g5": {"name":"Premier 18k","leader":"AWP_Lisa","note":"One seat: rifler with mic."},
  "g6": {"name":"Diamond trio","leader":"WraithDash","note":"Need IGL or support. No splits without a ping."},
  "g7": {"name":"For democracy","leader":"DemocracyDave","note":"Difficulty 7. Friendly fire forgiven once."},
  "g8": {"name":"Karl would be proud","leader":"Karl_forever","note":"Need an engineer for platforms. Beer after the mission."},
  "g9": {"name":"Timed egg hunt","leader":"ScoutLight","note":"Only if you already know the route. No voice off-topic."},
  "g10": {"name":"Plat no AFK","leader":"MidOrFeed","note":"Need jungle and top. Dragons on timer."},
  "g11": {"name":"Four-stack gen rush","leader":"Meg_flashlight","note":"No tunneling in customs. Newbies welcome."},
  "g12": {"name":"Quota without panic","leader":"ScrapRunner","note":"Need scout and pilot. Don’t leave loot at the door."},
  "g13": {"name":"First contract","leader":"DoorGuy","note":"Duo for a newbie. I’ll explain doors and quota."},
  "g14": {"name":"Evidence, no yelling","leader":"EMF_Quiet","note":"Professional. Need tech and hunt roles."},
  "g15": {"name":"Four-stack campaign","leader":"CoachCall","note":"One seat. Advanced, no AFK in saferoom."},
  "g16": {"name":"Apocalypse trio","leader":"RootGun","note":"Need tank and support. Bosses, no solo pulls."},
  "g17": {"name":"Classic eight","leader":"Captain_Bunker","note":"Need medic and engineer. Voice on, no card meta spoilers."},
  "g18": {"name":"Learning the jobs","leader":"MedicAnya","note":"We explain rules before start. Newbies welcome."},
  "g19": {"name":"Night with a host","leader":"HostMax","note":"Classic. Host is ready — filling the table."},
  "g20": {"name":"Townies learning","leader":"SheriffKatya","note":"Soft pace, review after deaths."},
  "g21": {"name":"Skins and votes","leader":"RedSus","note":"No friends-only. Custom maps OK."},
  "g22": {"name":"Meme telephone","leader":"SketchKing","note":"Russian dictionary. Draw anything."},
  "g23": {"name":"Quiplash at Vanya’s","leader":"QuiplashVanya","note":"Host has the pack. Join from your phone."},
  "g24": {"name":"Blue vs red","leader":"WordCaptain","note":"Need operatives. No spoilers."},
  "g25": {"name":"Fast words","leader":"WordEater","note":"Classic Alias. No foreign-language hints."},
  "g26": {"name":"Stacking allowed","leader":"Draw4_Kirill","note":"House rules: stack +2/+4. No tilt."},
  "g27": {"name":"Ducks, no toxicity","leader":"GooseHost","note":"Custom lobby. Calm votes."},
  "g28": {"name":"First co-op clear","leader":"Cody_coop","note":"Looking for a May tonight. No speedrun; hints OK."},
};

export const gameNameEn: Partial<Record<GameId, string>> = {
  bunker: "Bunker",
  mafia: "Mafia",
};

const nameRuToEn: Record<string, string> = {
  "Иван": "Ivan",
  "Кира_Neon": "Kira_Neon",
  "SovaDad": "SovaDad",
  "Omen_тихий": "Omen_quiet",
  "Brim_кофе": "Brim_coffee",
  "Killjoy_лаборатория": "Killjoy_lab",
  "SovaLineups": "SovaLineups",
  "PudgePrime": "PudgePrime",
  "CrystalMaidenка": "CrystalMaiden",
  "InvokerNight": "InvokerNight",
  "AWP_лиса": "AWP_Lisa",
  "RushB_Ваня": "RushB_Vanya",
  "IGL_тихоня": "IGL_quiet",
  "WraithDash": "WraithDash",
  "LifelinePlus": "LifelinePlus",
  "GibbyWall": "GibbyWall",
  "DemocracyDave": "DemocracyDave",
  "Eagle_1": "Eagle_1",
  "BugSpray": "BugSpray",
  "Karl_навсегда": "Karl_forever",
  "ScoutLight": "ScoutLight",
  "GunnerMama": "GunnerMama",
  "MidOrFeed_Ru": "MidOrFeed",
  "Sup_Лютик": "Sup_Buttercup",
  "JungleClock": "JungleClock",
  "Meg_фонарик": "Meg_flashlight",
  "Huntress_дартс": "Huntress_darts",
  "Dwight_шкаф": "Dwight_locker",
  "ScrapRunner": "ScrapRunner",
  "DoorGuy": "DoorGuy",
  "ShipPilot_Anya": "ShipPilot_Anya",
  "EMF_Тихо": "EMF_Quiet",
  "GhostBait": "GhostBait",
  "CamVan": "CamVan",
  "CoachCall": "CoachCall",
  "TankMain": "TankMain",
  "Medpack_Лена": "Medpack_Lena",
  "Лиса_кампания": "Lisa_campaign",
  "Ваня_кампания": "Vanya_campaign",
  "RootGun": "RootGun",
  "HandlerPlus": "HandlerPlus",
  "SecretSeeker": "SecretSeeker",
  "Капитан_Бункер": "Captain_Bunker",
  "МедикАня": "MedicAnya",
  "Инженер_кот": "Engineer_cat",
  "Дон_тихоня": "Don_quiet",
  "ШерифКатя": "SheriffKatya",
  "ВедущийМакс": "HostMax",
  "RedSus": "RedSus",
  "ImposterLite": "ImposterLite",
  "SketchKing": "SketchKing",
  "Телефон_Оля": "Phone_Olya",
  "QuiplashВаня": "QuiplashVanya",
  "FibbageFan": "FibbageFan",
  "КапитанСлов": "WordCaptain",
  "ОперативникЛиза": "OperativeLisa",
  "Словоед": "WordEater",
  "Угадайка": "Guessy",
  "Draw4_Кирилл": "Draw4_Kirill",
  "SkipQueen": "SkipQueen",
  "GooseHost": "GooseHost",
  "DuckDetective": "DuckDetective",
  "Cody_кооп": "Cody_coop",
  "May_повтор": "May_replay"
};

export function localizePlayer(player: Player, locale: Locale = "ru"): Player {
  if (locale !== "en") return player;
  const en = playerEn[player.id];
  if (!en) return player;
  return { ...player, name: en.name, role: en.role, bio: en.bio };
}

export function localizeParty(party: OpenParty, locale: Locale = "ru"): OpenParty {
  if (locale !== "en") return party;
  const en = partyEn[party.id];
  if (!en) {
    return {
      ...party,
      leader: nameRuToEn[party.leader] ?? party.leader,
      members: party.members?.map((m) => nameRuToEn[m] ?? m),
      startsAt: localizeStartsAt(party.startsAt, locale),
    };
  }
  return {
    ...party,
    name: en.name,
    leader: en.leader,
    note: en.note,
    members: party.members?.map((m) => nameRuToEn[m] ?? m),
    startsAt: localizeStartsAt(party.startsAt, locale),
  };
}

export function localizeStartsAt(
  value: string | null | undefined,
  locale: Locale,
): string | null | undefined {
  if (!value || locale !== "en") return value;
  const map: Record<string, string> = {
    "сегодня 19:00": "today 19:00",
    "сегодня 21:00": "today 21:00",
    "сегодня 23:00": "today 23:00",
    "завтра вечером": "tomorrow evening",
  };
  return map[value] ?? value;
}

export function youName(locale: Locale = "ru"): string {
  return locale === "en" ? "Ivan" : "Иван";
}

/** Map default demo host nick to the active UI locale. */
export function resolveYouDisplayName(
  stored: string | null | undefined,
  locale: Locale = "ru",
): string {
  if (!stored || stored === "Иван" || stored === "Ivan") return youName(locale);
  return stored;
}
