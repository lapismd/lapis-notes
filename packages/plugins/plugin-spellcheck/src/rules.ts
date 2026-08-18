export interface SpellcheckRuleOption {
  value: string;
  label: string;
  description?: string;
}

/** Committed Harper linter catalog from harper.js getLintDescriptions(). */
export const SPELLCHECK_RULES: readonly SpellcheckRuleOption[] = [
  {
    "value": "ACoupleMore",
    "label": "ACoupleMore",
    "description": "Corrects `a couple of more` to `a couple more`."
  },
  {
    "value": "Addicting",
    "label": "Addicting",
    "description": "Replaces `addicting` with `addictive` when used as an adjective."
  },
  {
    "value": "AdjectiveDoubleDegree",
    "label": "AdjectiveDoubleDegree",
    "description": "Finds adjectives that are used as double degrees (e.g. `more prettier`)."
  },
  {
    "value": "AdjectiveOfA",
    "label": "AdjectiveOfA",
    "description": "This rule looks for sequences of words of the form `adjective of a`."
  },
  {
    "value": "AdNauseam",
    "label": "AdNauseam",
    "description": "Corrects `as nauseam` to `ad nauseam`."
  },
  {
    "value": "Ado",
    "label": "Ado",
    "description": "Corrects `adieu` to `ado`."
  },
  {
    "value": "AfterAll",
    "label": "AfterAll",
    "description": "Corrects `afterall` to `after all`."
  },
  {
    "value": "AfterAWhile",
    "label": "AfterAWhile",
    "description": "Corrects the missing article in `after while`, forming `after a while`."
  },
  {
    "value": "AfterLater",
    "label": "AfterLater",
    "description": "Checks for the word `later` following `after [a period of time]`."
  },
  {
    "value": "AheadAnd",
    "label": "AheadAnd",
    "description": "Corrects `an` to `and` after `ahead`."
  },
  {
    "value": "Albeit",
    "label": "Albeit",
    "description": "Corrects this expression to the standard `albeit`."
  },
  {
    "value": "ALittleOfPractice",
    "label": "ALittleOfPractice",
    "description": "Corrects `a little of practice` to `a little practice` or `a bit of practice`."
  },
  {
    "value": "AllHellBreakLoose",
    "label": "AllHellBreakLoose",
    "description": "Corrects forms of `all hell breaks out` to `all hell breaks loose`."
  },
  {
    "value": "AllIntentsAndPurposes",
    "label": "AllIntentsAndPurposes",
    "description": "Finds and corrects common wrong forms of the phrase 'for all intents and purposes' / 'to all intents and purposes'."
  },
  {
    "value": "AllOfASudden",
    "label": "AllOfASudden",
    "description": "Guides this expression toward the standard `all of a sudden`."
  },
  {
    "value": "AllowTo",
    "label": "AllowTo",
    "description": "Flags erroneous usage of `allow to` without a subject."
  },
  {
    "value": "AllReady",
    "label": "AllReady",
    "description": "Flags `all ready` when it precedes an adjective so the adverb `already` can take its place."
  },
  {
    "value": "AllThough",
    "label": "AllThough",
    "description": "Nobody means to write the two-word phrase `all though` when the single word `although` is intended."
  },
  {
    "value": "Alongside",
    "label": "Alongside",
    "description": "Replaces the spaced form `along side` with `alongside`."
  },
  {
    "value": "ALongTime",
    "label": "ALongTime",
    "description": "Corrects `along time` to `a long time`."
  },
  {
    "value": "AlzheimersDisease",
    "label": "AlzheimersDisease",
    "description": "Fixes the common misnomer `old-timers' disease`, ensuring the correct medical term `Alzheimer’s disease` is used."
  },
  {
    "value": "AmazonNames",
    "label": "AmazonNames",
    "description": "When referring to the various products of Amazon.com, make sure to treat them as a proper noun."
  },
  {
    "value": "AMeansToAnEnd",
    "label": "AMeansToAnEnd",
    "description": "Corrects `a mean to an end` to `a means to an end`"
  },
  {
    "value": "Americas",
    "label": "Americas",
    "description": "When referring to North, Central, and South America, make sure to treat them as a proper noun."
  },
  {
    "value": "AmInTheMorning",
    "label": "AmInTheMorning",
    "description": "Finds redundant am/pm indicators used together with time periods such as 'in the morning' or 'at night'."
  },
  {
    "value": "AmountsFor",
    "label": "AmountsFor",
    "description": "Corrects `amounts for` to either `amounts to` or `accounts for`"
  },
  {
    "value": "AnA",
    "label": "AnA",
    "description": "A rule that looks for incorrect indefinite articles. For example, `this is an mule` would be flagged as incorrect."
  },
  {
    "value": "AnalogAcousticBike",
    "label": "AnalogAcousticBike",
    "description": "Suggests more standard terms for `analog/analogue bike` and `acoustic bike`."
  },
  {
    "value": "AnAnother",
    "label": "AnAnother",
    "description": "Corrects `an another` and `a another`."
  },
  {
    "value": "AndIn",
    "label": "AndIn",
    "description": "Fixes the typo `an in` when it stands in for the conjunction `and in`, while avoiding common `in-...` noun phrases and a few attested exc…"
  },
  {
    "value": "AndSuch",
    "label": "AndSuch",
    "description": "Corrects `and the such` to `and such`."
  },
  {
    "value": "AndTheLike",
    "label": "AndTheLike",
    "description": "Corrects mistakes in `and the like` and `or the like`."
  },
  {
    "value": "AnotherAn",
    "label": "AnotherAn",
    "description": "Corrects `another an` to `another`."
  },
  {
    "value": "AnotherOnes",
    "label": "AnotherOnes",
    "description": "Corrects `another ones`."
  },
  {
    "value": "AnotherThingComing",
    "label": "AnotherThingComing",
    "description": "Though `another think coming` is the original phrase, `another thing coming` is now more common."
  },
  {
    "value": "AnotherThings",
    "label": "AnotherThings",
    "description": "Corrects `another things`."
  },
  {
    "value": "AnotherThinkComing",
    "label": "AnotherThinkComing",
    "description": "Though `another thing coming` is now more common, `another think coming` is the original phrase."
  },
  {
    "value": "Anybody",
    "label": "Anybody",
    "description": "Looks for incorrect spacing inside the closed compound `anybody`."
  },
  {
    "value": "Anyhow",
    "label": "Anyhow",
    "description": "Looks for incorrect spacing inside the closed compound `anyhow`."
  },
  {
    "value": "Anywhere",
    "label": "Anywhere",
    "description": "Looks for incorrect spacing inside the closed compound `anywhere`."
  },
  {
    "value": "AOkHyphen",
    "label": "AOkHyphen",
    "description": "Replaces the loose article-plus-abbreviation pairing with the standard hyphenated form whenever a linking verb describes readiness or app…"
  },
  {
    "value": "APart",
    "label": "APart",
    "description": "Finds and corrects common mistakes between 'a part' and 'apart'"
  },
  {
    "value": "ApartFrom",
    "label": "ApartFrom",
    "description": "Flags the misspelling `apart form` and suggests `apart from`."
  },
  {
    "value": "AppleNames",
    "label": "AppleNames",
    "description": "When referring to Apple products and services, make sure to treat them as proper nouns."
  },
  {
    "value": "ArgumentToBeMade",
    "label": "ArgumentToBeMade",
    "description": "Corrects `argument to be said` to `argument to be made`."
  },
  {
    "value": "ArriveOnWeekday",
    "label": "ArriveOnWeekday",
    "description": "Keeps schedules explicit by preferring the familiar `arrive on Friday` pattern instead of a bare weekday."
  },
  {
    "value": "ArriveTo",
    "label": "ArriveTo",
    "description": "A linter skeleton for contributors to copy into `harper_core/src/linting/` and rename."
  },
  {
    "value": "AsComparedTo",
    "label": "AsComparedTo",
    "description": "Corrects `as compare to` to `as compared to`."
  },
  {
    "value": "AsEvidentBy",
    "label": "AsEvidentBy",
    "description": "Corrects `evident by` to `evidenced by` in passive constructions where `evidence` is used as a verb."
  },
  {
    "value": "AsFarAsIKnow",
    "label": "AsFarAsIKnow",
    "description": "Expands an initialism."
  },
  {
    "value": "AsFarBackAs",
    "label": "AsFarBackAs",
    "description": "Corrects nonstandard `as early back as` to `as far back as`."
  },
  {
    "value": "AsFollows",
    "label": "AsFollows",
    "description": "Corrects the phrase `as follow`, which is sometimes produced by overcorrection. While it appeared briefly in 19th-century English, it is…"
  },
  {
    "value": "AsHow",
    "label": "AsHow",
    "description": "Corrects `as how` to `as to how`."
  },
  {
    "value": "AsIfThough",
    "label": "AsIfThough",
    "description": "Corrects redundant `as if though`."
  },
  {
    "value": "AsIsWithAnything",
    "label": "AsIsWithAnything",
    "description": "Flags the incorrect idiom blend `as is with anything` and suggests standard alternatives like `as with anything` or `as is the case with…"
  },
  {
    "value": "AsItHappens",
    "label": "AsItHappens",
    "description": "Corrects `as it so happens` to `as it happens`."
  },
  {
    "value": "AskNoPreposition",
    "label": "AskNoPreposition",
    "description": "Identifies sequences like `ask to us` or `tell to him` and recommends removing the superfluous “to”."
  },
  {
    "value": "AsLongAs",
    "label": "AsLongAs",
    "description": "Corrects `aslong as` and `as long that` to `as long as`."
  },
  {
    "value": "AsMuchAs",
    "label": "AsMuchAs",
    "description": "Corrects `as much than` to `as much as`."
  },
  {
    "value": "AsOfCurrently",
    "label": "AsOfCurrently",
    "description": "Corrects `as of currently` to `currently` or `as of now`."
  },
  {
    "value": "AsOfLately",
    "label": "AsOfLately",
    "description": "Corrects `as of lately` to `lately` or `as of late`."
  },
  {
    "value": "ASomeTime",
    "label": "ASomeTime",
    "description": "Removes the redundant/conflicting indefinite article `a` before `some` when followed by time expressions."
  },
  {
    "value": "AsOpposedTo",
    "label": "AsOpposedTo",
    "description": "Corrects `as oppose to` to `as opposed to`."
  },
  {
    "value": "AspireTo",
    "label": "AspireTo",
    "description": "Corrects `aspire for` to `aspire to`."
  },
  {
    "value": "AsSoonAsPossible",
    "label": "AsSoonAsPossible",
    "description": "Expands an initialism."
  },
  {
    "value": "AsToInterrogative",
    "label": "AsToInterrogative",
    "description": "Corrects `to` to `as to` between certain adjectives and `wh-words`."
  },
  {
    "value": "AtAllCosts",
    "label": "AtAllCosts",
    "description": "Corrects `at all cost` to `at all costs`."
  },
  {
    "value": "AtFaceValue",
    "label": "AtFaceValue",
    "description": "Corrects nonstandard variants of `at face value`."
  },
  {
    "value": "AtLeasToLeast",
    "label": "AtLeasToLeast",
    "description": "Fixes the frequent typo `at leas` when the intended expression is `at least`."
  },
  {
    "value": "AtLestToLeast",
    "label": "AtLestToLeast",
    "description": "Fixes the mistake `at lest` when the intended expression is `at least`."
  },
  {
    "value": "AtTheBestOfTimes",
    "label": "AtTheBestOfTimes",
    "description": "Corrects `in the best of times` to `at the best of times`."
  },
  {
    "value": "AtTheEndOfTheDay",
    "label": "AtTheEndOfTheDay",
    "description": "Corrects `in the end of the day` to `at the end of the day`."
  },
  {
    "value": "AtTheExpenseOf",
    "label": "AtTheExpenseOf",
    "description": "The correct idiom is `at the expense of`, with singular `expense`. But retain `expanse` if this phrase refers to a wide area."
  },
  {
    "value": "AtTheVeryLeast",
    "label": "AtTheVeryLeast",
    "description": "Corrects `in the very least` to `at the very least`."
  },
  {
    "value": "Australia",
    "label": "Australia",
    "description": "When referring to states, territories, and cities in Australia, make sure to treat them as a proper noun."
  },
  {
    "value": "AvoidAndAlso",
    "label": "AvoidAndAlso",
    "description": "Reduces redundancy by replacing `and also` with `and`."
  },
  {
    "value": "AvoidContractions",
    "label": "AvoidContractions",
    "description": "Suggests expanded forms for common contractions, such as `isn't` → `is not` and `we're` → `we are`."
  },
  {
    "value": "AvoidCurses",
    "label": "AvoidCurses",
    "description": "Flags offensive language and offers various ways to censor or replace with euphemisms."
  },
  {
    "value": "AwaitFor",
    "label": "AwaitFor",
    "description": "Suggests using either `await` or `wait for` but not both, as they express the same meaning."
  },
  {
    "value": "AwareOf",
    "label": "AwareOf",
    "description": "Corrects `aware about` to the standard `aware of`."
  },
  {
    "value": "AWaysToGo",
    "label": "AWaysToGo",
    "description": "Corrects the idiom `a ways to go` when the indefinite article is missing."
  },
  {
    "value": "AWhile",
    "label": "AWhile",
    "description": "Enforces `awhile` after verbs and `a while` everywhere else."
  },
  {
    "value": "AzureNames",
    "label": "AzureNames",
    "description": "When referring to Azure cloud services, make sure to treat them as proper nouns."
  },
  {
    "value": "BackInTheDay",
    "label": "BackInTheDay",
    "description": "This linter flags instances of the nonstandard phrase `back in the days`. The correct, more accepted form is `back in the day`"
  },
  {
    "value": "Backplane",
    "label": "Backplane",
    "description": "Looks for incorrect spacing inside the closed compound `backplane`."
  },
  {
    "value": "BadRap",
    "label": "BadRap",
    "description": "Changes `bed rap` to the proper idiom `bad rap`."
  },
  {
    "value": "BanTogether",
    "label": "BanTogether",
    "description": "Detects and corrects the common error of using `ban together` instead of the idiom `band together`, which means to unite or join forces."
  },
  {
    "value": "BareInMind",
    "label": "BareInMind",
    "description": "Ensures the phrase `bear in mind` is used correctly instead of `bare in mind`."
  },
  {
    "value": "BarelyUn",
    "label": "BarelyUn",
    "description": "Flags using `barely` with a negative adjective starting with `un-` (`barely unusable`, etc.), which is a kind of double negative."
  },
  {
    "value": "BatedBreath",
    "label": "BatedBreath",
    "description": "Changes `baited breath` to the correct `bated breath`."
  },
  {
    "value": "BeAllowed",
    "label": "BeAllowed",
    "description": "Ensures the passive form uses `be allowed` after future negatives."
  },
  {
    "value": "BeBiased",
    "label": "BeBiased",
    "description": "Detects incorrect use of 'be + verb' instead of `be + adjective`."
  },
  {
    "value": "BeckAndCall",
    "label": "BeckAndCall",
    "description": "Fixes `back and call` to `beck and call`."
  },
  {
    "value": "BeConcerned",
    "label": "BeConcerned",
    "description": "Detects incorrect use of 'be + verb' instead of `be + adjective`."
  },
  {
    "value": "BeenThere",
    "label": "BeenThere",
    "description": "Corrects the misspelling `bee there` to the proper phrase `been there`."
  },
  {
    "value": "Beforehand",
    "label": "Beforehand",
    "description": "`Beforehand` functions as a fixed adverb meaning ‘in advance’; writing it as two words or with a hyphen is nonstandard and can jar readers."
  },
  {
    "value": "BehindTheScenes",
    "label": "BehindTheScenes",
    "description": "Corrects `behind the scene` to `behind the scenes`."
  },
  {
    "value": "BePrejudiced",
    "label": "BePrejudiced",
    "description": "Detects incorrect use of 'be + verb' instead of `be + adjective`."
  },
  {
    "value": "BeRightBack",
    "label": "BeRightBack",
    "description": "Expands an initialism."
  },
  {
    "value": "BeShocked",
    "label": "BeShocked",
    "description": "Detects incorrect use of 'be + verb' instead of `be + adjective`."
  },
  {
    "value": "BesideThePoint",
    "label": "BesideThePoint",
    "description": "Corrects `besides the point` to `beside the point`."
  },
  {
    "value": "BestOfAllTime",
    "label": "BestOfAllTime",
    "description": "Checks for nonstandard `of all times` in superlatives instead of singular `time`"
  },
  {
    "value": "BestRegards",
    "label": "BestRegards",
    "description": "In valedictions, `best` expresses your highest regard—avoid the typo `beat regards`."
  },
  {
    "value": "BetterOffPhrase",
    "label": "BetterOffPhrase",
    "description": "Rewrites `better of` to `better off` in common comparative phrasing."
  },
  {
    "value": "BetterOffWith",
    "label": "BetterOffWith",
    "description": "Corrects `better of with` to `better off with`."
  },
  {
    "value": "BewareOf",
    "label": "BewareOf",
    "description": "The verb `beware` naturally pairs with `of` before the noun being warned about, so swap other prepositions for clarity."
  },
  {
    "value": "BeWorried",
    "label": "BeWorried",
    "description": "Detects incorrect use of 'be + verb' instead of `be + adjective`."
  },
  {
    "value": "BlacklistWhitelist",
    "label": "BlacklistWhitelist",
    "description": "Normalize the two-word sequence `black list`/`white list` so it matches the established compound noun or verb."
  },
  {
    "value": "BlanketStatement",
    "label": "BlanketStatement",
    "description": "Corrects common errors in the phrase `blanket statement`."
  },
  {
    "value": "BluRayHyphen",
    "label": "BluRayHyphen",
    "description": "Joins the two-word spelling of the optical disc format into the standard compound form."
  },
  {
    "value": "BoarderBorder",
    "label": "BoarderBorder",
    "description": "Flags the eggcorn `boarder` (a lodger) where `border` (an edge/boundary) is intended."
  },
  {
    "value": "Bollocks",
    "label": "Bollocks",
    "description": "Corrects `bullocks` to `bollocks` when the meaning is `nonsense`."
  },
  {
    "value": "BoringWords",
    "label": "BoringWords",
    "description": "This rule looks for particularly boring or overused words. Using varied language is an easy way to keep a reader's attention."
  },
  {
    "value": "Bought",
    "label": "Bought",
    "description": "Replaces the incorrect past-tense spelling `bough` with `bought` after subject pronouns."
  },
  {
    "value": "BrandBrandish",
    "label": "BrandBrandish",
    "description": "Looks for `brandish` wrongly used when `brand` is intended."
  },
  {
    "value": "Brutality",
    "label": "Brutality",
    "description": "Suggests the more standard and common synonym `brutality`."
  },
  {
    "value": "BuiltIn",
    "label": "BuiltIn",
    "description": "English convention treats `built-in` as a single, attributive adjective—meaning something integrated from the outset—whereas other forms…"
  },
  {
    "value": "ByAccident",
    "label": "ByAccident",
    "description": "Incorrect preposition: `by accident` is the idiomatic expression."
  },
  {
    "value": "ByOnesOwn",
    "label": "ByOnesOwn",
    "description": "Fixes incorrect phrases like `by my own` by suggesting `on my own` or `by myself`."
  },
  {
    "value": "Bypass",
    "label": "Bypass",
    "description": "Looks for incorrect spacing inside the closed compound `bypass`."
  },
  {
    "value": "ByTheBook",
    "label": "ByTheBook",
    "description": "Corrects `by the books` to `by the book`."
  },
  {
    "value": "ByTheWay",
    "label": "ByTheWay",
    "description": "Expands an initialism."
  },
  {
    "value": "CallItQuits",
    "label": "CallItQuits",
    "description": "Corrects wrong variants of the idiom 'call it quits'."
  },
  {
    "value": "CallThem",
    "label": "CallThem",
    "description": "Addresses the non-idiomatic phrases `call them as`."
  },
  {
    "value": "Canada",
    "label": "Canada",
    "description": "When referring to provinces, territories, and cities in Canada, make sure to treat them as a proper noun."
  },
  {
    "value": "CanBeSeen",
    "label": "CanBeSeen",
    "description": "Corrects `can be seem` to the proper phrase `can be seen`."
  },
  {
    "value": "Cant",
    "label": "Cant",
    "description": "Suggests correcting `cant` to `can't`."
  },
  {
    "value": "CantWay",
    "label": "CantWay",
    "description": "Corrects `way` to `wait` in high-confidence contexts such as `can't way to` and `doesn't way for`."
  },
  {
    "value": "CapitalizeOn",
    "label": "CapitalizeOn",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "CapitalizePersonalPronouns",
    "label": "CapitalizePersonalPronouns",
    "description": "Forgetting to capitalize personal pronouns, like \"I\" or \"I'm\" is one of the most common errors. This rule helps with that."
  },
  {
    "value": "CaseInPoint",
    "label": "CaseInPoint",
    "description": "Corrects `case and point` to `case in point`."
  },
  {
    "value": "CaseSensitive",
    "label": "CaseSensitive",
    "description": "Ensures `case-sensitive` is correctly hyphenated."
  },
  {
    "value": "Catch22",
    "label": "Catch22",
    "description": "Corrects mistakenly using similar-sounding words in the idiom `catch 22`."
  },
  {
    "value": "CauseItIsBecause",
    "label": "CauseItIsBecause",
    "description": "Normalizes informal `cause it is` to the standard subordinating form in explanatory clauses."
  },
  {
    "value": "CautionaryTale",
    "label": "CautionaryTale",
    "description": "Corrects confusion between `tale` (story) and `tail` (appendage) in common phrases."
  },
  {
    "value": "Chalkboard",
    "label": "Chalkboard",
    "description": "Looks for incorrect spacing inside the closed compound `chalkboard`."
  },
  {
    "value": "ChampAtTheBit",
    "label": "ChampAtTheBit",
    "description": "Corrects `chomp at the bit` to the idiom `champ at the bit`, which has an equestrian origin referring to the way an anxious horse grinds…"
  },
  {
    "value": "ChangeTack",
    "label": "ChangeTack",
    "description": "Locates errors in the idioms `to change tack` and `change of tack` to convey the correct meaning of altering one's course or strategy."
  },
  {
    "value": "ChineseCommunistParty",
    "label": "ChineseCommunistParty",
    "description": "When referring to the political party, make sure to treat them as a proper noun."
  },
  {
    "value": "ChockFull",
    "label": "ChockFull",
    "description": "Flags common soundalikes of \"chock-full\" and makes sure they're hyphenated."
  },
  {
    "value": "ClicheAccent",
    "label": "ClicheAccent",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "ClickThroughRate",
    "label": "ClickThroughRate",
    "description": "Hyphenates the verb+preposition pair when it directly precedes rate-style nouns, mirroring how these terms are commonly styled in analyti…"
  },
  {
    "value": "ClientOrServerSide",
    "label": "ClientOrServerSide",
    "description": "Corrects extraneous apostrophe in `client's side` and `server's side`."
  },
  {
    "value": "CloseTightKnit",
    "label": "CloseTightKnit",
    "description": "Corrects `close-nit` and `tight-nit` to `close-knit` and `tight-knit`."
  },
  {
    "value": "CodeInWriteIn",
    "label": "CodeInWriteIn",
    "description": "Corrects the wrong preposition `on` to `in` when referring to writing code."
  },
  {
    "value": "ColdModalTypo",
    "label": "ColdModalTypo",
    "description": "Rewrites `cold` to `could` when it appears in common subject-plus-verb modal contexts."
  },
  {
    "value": "CommaFixes",
    "label": "CommaFixes",
    "description": "Fix common comma errors such as no space after, erroneous space before, etc., Asian commas instead of English commas, etc."
  },
  {
    "value": "CommitmentTo",
    "label": "CommitmentTo",
    "description": "Corrects `commitment toward/towards` to `commitment to`."
  },
  {
    "value": "CompaniesProductsAndTrademarks",
    "label": "CompaniesProductsAndTrademarks",
    "description": "Ensure proper capitalization of companies, products, and trademarks."
  },
  {
    "value": "ComplainAsNoun",
    "label": "ComplainAsNoun",
    "description": "Corrects the use of `complain` as a noun."
  },
  {
    "value": "CompoundNouns",
    "label": "CompoundNouns",
    "description": "Detects compound nouns split by a space and suggests merging them when both parts form a valid noun."
  },
  {
    "value": "CompoundSubjectI",
    "label": "CompoundSubjectI",
    "description": "Promotes `I` in compound subjects headed by a possessive determiner."
  },
  {
    "value": "ComprisesOf",
    "label": "ComprisesOf",
    "description": "`Comprises` already contains the notion of `of`, so following it with another `of` is redundant."
  },
  {
    "value": "CompulseToCompel",
    "label": "CompulseToCompel",
    "description": "Suggests replacing the obsolete or archaic verb `compulse` with the standard `compel`."
  },
  {
    "value": "CondenseAllThe",
    "label": "CondenseAllThe",
    "description": "Suggests removing `of` in `all of the` for a more concise phrase."
  },
  {
    "value": "Confident",
    "label": "Confident",
    "description": "This linter detects instances where the noun `confidant` is incorrectly used in place of the adjective `confident`. `Confidant` refers to…"
  },
  {
    "value": "ConfirmThat",
    "label": "ConfirmThat",
    "description": "Corrects `conform` typos to `confirm`."
  },
  {
    "value": "ConstituteAs",
    "label": "ConstituteAs",
    "description": "Removes extraneous `as` after the verb `constitute`."
  },
  {
    "value": "ConvenientStore",
    "label": "ConvenientStore",
    "description": "Attempts to detect when `convenient store` is mistake for `convenience store`."
  },
  {
    "value": "Copyright",
    "label": "Copyright",
    "description": "Corrects `copywrite` to `copyright`. `Copywrite` refers to writing copy, while `copyright` is the legal right to creative works."
  },
  {
    "value": "CorrectNumberSuffix",
    "label": "CorrectNumberSuffix",
    "description": "When making quick edits, it is common for authors to change the value of a number without changing its suffix. This rule looks for these…"
  },
  {
    "value": "Countries",
    "label": "Countries",
    "description": "When referring to Countries, make sure to treat it as a proper noun."
  },
  {
    "value": "CoursingThroughVeins",
    "label": "CoursingThroughVeins",
    "description": "In English idioms, `to course` means to flow rapidly—so avoid the eggcorn `cursing through veins.`"
  },
  {
    "value": "CraveFor",
    "label": "CraveFor",
    "description": "There should be no `for` after the verb `crave`."
  },
  {
    "value": "CriteriaPhenomena",
    "label": "CriteriaPhenomena",
    "description": "The words “criteria” and “phenomena” are the plurals of “criterion” and “phenomenon”, respectively. They are often incorrectly used with…"
  },
  {
    "value": "CrossPlatform",
    "label": "CrossPlatform",
    "description": "Unlike some compound modifiers, `cross-platform` should always be hyphenated."
  },
  {
    "value": "CureFor",
    "label": "CureFor",
    "description": "Flags `cure against` and prefers the standard `cure for` pairing."
  },
  {
    "value": "CurrencyPlacement",
    "label": "CurrencyPlacement",
    "description": "The location of currency symbols varies by country. The rule looks for and corrects improper positioning."
  },
  {
    "value": "CuttingAgeEggcorn",
    "label": "CuttingAgeEggcorn",
    "description": "Corrects the eggcorn `cutting age` or `cutting-age` to `cutting-edge` or `cutting edge`."
  },
  {
    "value": "Cybersec",
    "label": "Cybersec",
    "description": "Expands the informal abbreviation `cybersec` to `cybersecurity`."
  },
  {
    "value": "Damages",
    "label": "Damages",
    "description": "Checks for plural `damages` not in the context of a court case."
  },
  {
    "value": "DampSquib",
    "label": "DampSquib",
    "description": "Corrects the eggcorn `damp squid` to `damp squib`, ensuring the intended meaning of a failed or underwhelming outcome."
  },
  {
    "value": "Dashes",
    "label": "Dashes",
    "description": "Writers often type `--` or `---` expecting their editor to convert them into proper dashes. Replace these sequences with the correct char…"
  },
  {
    "value": "DateBackFrom",
    "label": "DateBackFrom",
    "description": "Corrects the blend of `date from` and `date back to` into the nonstandard `date back from`."
  },
  {
    "value": "DayAndAge",
    "label": "DayAndAge",
    "description": "Fixes wrong variants of the idiom `in this day and age`."
  },
  {
    "value": "DayOneNames",
    "label": "DayOneNames",
    "description": "Ensure proper capitalization of Day One and Day One Premium as brand names."
  },
  {
    "value": "Deadlift",
    "label": "Deadlift",
    "description": "Looks for incorrect spacing inside the closed compound `deadlift`."
  },
  {
    "value": "DefiniteArticle",
    "label": "DefiniteArticle",
    "description": "The name of the word `the` is `definite article`."
  },
  {
    "value": "DegreesKelvin",
    "label": "DegreesKelvin",
    "description": "Corrects use of `degrees kelvin` to `kelvins`."
  },
  {
    "value": "DegreesKelvinSymbol",
    "label": "DegreesKelvinSymbol",
    "description": "Corrects use of `°K` to `K`."
  },
  {
    "value": "Desktop",
    "label": "Desktop",
    "description": "Looks for incorrect spacing inside the closed compound `desktop`."
  },
  {
    "value": "DespiteItIs",
    "label": "DespiteItIs",
    "description": "Corrects `despite` being used with the wrong form of `is`."
  },
  {
    "value": "DespiteOf",
    "label": "DespiteOf",
    "description": "Corrects the misuse of `despite of` and suggests the proper alternatives `despite` or `in spite of`."
  },
  {
    "value": "Devops",
    "label": "Devops",
    "description": "Looks for incorrect spacing inside the closed compound `devops`."
  },
  {
    "value": "Didnt",
    "label": "Didnt",
    "description": "Corrects `dint` to `didn't` after subject pronouns."
  },
  {
    "value": "DidPast",
    "label": "DidPast",
    "description": "Corrects past forms of verbs to their base form, when used together with \"did\"."
  },
  {
    "value": "DigestiveTract",
    "label": "DigestiveTract",
    "description": "Corrects `digestive track` to `digestive tract`."
  },
  {
    "value": "DiscourseMarkers",
    "label": "DiscourseMarkers",
    "description": "Flags sentences that begin with a discourse marker but omit the required following comma."
  },
  {
    "value": "Discuss",
    "label": "Discuss",
    "description": "Removes unnecessary `about` after `discuss`."
  },
  {
    "value": "DisjointPrefixes",
    "label": "DisjointPrefixes",
    "description": "Looks for words with their prefixes written with a space or hyphen between instead of joined."
  },
  {
    "value": "DoesOrDose",
    "label": "DoesOrDose",
    "description": "Tries to correct typos of `dose` to `does`."
  },
  {
    "value": "DoIAdjective",
    "label": "DoIAdjective",
    "description": "Swaps the helping verb `do` for `am` in `Do I <adjective>` questions so they use the correct linking verb."
  },
  {
    "value": "DoMistake",
    "label": "DoMistake",
    "description": "Corrects `do a mistake` to `make a mistake`."
  },
  {
    "value": "DoNotWant",
    "label": "DoNotWant",
    "description": "In English, negation still requires the complete verb form (`want`), so avoid truncating it to `wan.`"
  },
  {
    "value": "DontCan",
    "label": "DontCan",
    "description": "Corrects `don't can` to `can't` or `cannot`."
  },
  {
    "value": "DotInitialisms",
    "label": "DotInitialisms",
    "description": "Ensures common initialisms (like \"i.e.\") are properly dot-separated."
  },
  {
    "value": "DoToDueTo",
    "label": "DoToDueTo",
    "description": "Corrects the typo `do to` when it is intended to mean `due to` in causal phrases."
  },
  {
    "value": "DoubleCheckHyphen",
    "label": "DoubleCheckHyphen",
    "description": "Normalizes the common two-word form `double check` to `double-check`."
  },
  {
    "value": "DoubleClick",
    "label": "DoubleClick",
    "description": "Encourages hyphenating `double-click` and its inflections."
  },
  {
    "value": "DoubleEdgedSword",
    "label": "DoubleEdgedSword",
    "description": "Corrects variants of `double-edged sword`."
  },
  {
    "value": "DoubleModal",
    "label": "DoubleModal",
    "description": "Two modal verbs in a row are rarely grammatical; remove one of them."
  },
  {
    "value": "DoubleNegative",
    "label": "DoubleNegative",
    "description": "Replaces the determiner `no` with `any` when it follows the auxiliary `didn't/did not` plus a main verb (e.g., have, need, want, make, ta…"
  },
  {
    "value": "DueDiligence",
    "label": "DueDiligence",
    "description": "Corrects `do diligence` to `due diligence`."
  },
  {
    "value": "DuringAges",
    "label": "DuringAges",
    "description": "The idiomatic duration is 'for ages', so swap the initial preposition whenever the words refer to a general span."
  },
  {
    "value": "EachAndEveryOne",
    "label": "EachAndEveryOne",
    "description": "Corrects `each and everyone` to `each and every one`."
  },
  {
    "value": "EachOthersPossessive",
    "label": "EachOthersPossessive",
    "description": "Rewrites `each others` to `each other's` when it modifies a following noun phrase."
  },
  {
    "value": "EagleEyed",
    "label": "EagleEyed",
    "description": "Treats the phrase as a compound modifier and replaces the space with a hyphen so it reads like one idea."
  },
  {
    "value": "EasyGoingCompoundAdjective",
    "label": "EasyGoingCompoundAdjective",
    "description": "Adds a hyphen in `easy going` when it directly describes a following noun."
  },
  {
    "value": "EggYolk",
    "label": "EggYolk",
    "description": "Corrects the eggcorn `egg yoke`, replacing it with the standard culinary term `egg yolk`."
  },
  {
    "value": "EllipsisLength",
    "label": "EllipsisLength",
    "description": "Make sure you have the correct number of dots in your ellipsis."
  },
  {
    "value": "ElsePossessive",
    "label": "ElsePossessive",
    "description": "Detects missing apostrophes in phrases like `someone elses book` and suggests the correct possessive form `else’s`."
  },
  {
    "value": "EludedTo",
    "label": "EludedTo",
    "description": "Corrects `eluded to` to `alluded to` in contexts referring to indirect references."
  },
  {
    "value": "EnMasse",
    "label": "EnMasse",
    "description": "Detects variants like `on mass` or `in mass` and suggests `en masse`."
  },
  {
    "value": "EnRoute",
    "label": "EnRoute",
    "description": "Detects variants like `on route` or `in route` and suggests `en route`."
  },
  {
    "value": "EnvironmentVariable",
    "label": "EnvironmentVariable",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "EverEvery",
    "label": "EverEvery",
    "description": "Tries to correct typos of `every` instead of `ever`."
  },
  {
    "value": "EverPresent",
    "label": "EverPresent",
    "description": "Corrects the missing hyphen in `ever present` to the compound adjective `ever-present`."
  },
  {
    "value": "EverSince",
    "label": "EverSince",
    "description": "Corrects `every since` to `ever since`."
  },
  {
    "value": "Everybody",
    "label": "Everybody",
    "description": "Looks for incorrect spacing inside the closed compound `everybody`."
  },
  {
    "value": "Everyday",
    "label": "Everyday",
    "description": "This rule tries to sort out confusing the adjective `everyday` and the adverb `every day`."
  },
  {
    "value": "EveryOnceAndAgain",
    "label": "EveryOnceAndAgain",
    "description": "Corrects `every once and again` to `every once in a while` or `once again`."
  },
  {
    "value": "Everyone",
    "label": "Everyone",
    "description": "Looks for incorrect spacing inside the closed compound `everyone`."
  },
  {
    "value": "EverySingleOneOf",
    "label": "EverySingleOneOf",
    "description": "Detects missing `one` in the phrase 'every single one of'."
  },
  {
    "value": "EveryTime",
    "label": "EveryTime",
    "description": "Corrects `everytime` to `every time`."
  },
  {
    "value": "Everywhere",
    "label": "Everywhere",
    "description": "Looks for incorrect spacing inside the closed compound `everywhere`."
  },
  {
    "value": "Excellent",
    "label": "Excellent",
    "description": "Provides a stronger word choice by replacing `very good` with `excellent` for clarity and emphasis."
  },
  {
    "value": "ExceptOf",
    "label": "ExceptOf",
    "description": "Corrects `except of` to `except for` or `exception of`."
  },
  {
    "value": "ExitedExcitedContext",
    "label": "ExitedExcitedContext",
    "description": "Changes `exited` to `excited` when the sentence indicates enthusiasm or anticipation."
  },
  {
    "value": "ExpandAlgorithm",
    "label": "ExpandAlgorithm",
    "description": "Expands the abbreviation `algo` to the full word `algorithm` for clarity."
  },
  {
    "value": "ExpandAlloc",
    "label": "ExpandAlloc",
    "description": "Expands the abbreviation `alloc` to the full word `allocate` or `allocation` for clarity."
  },
  {
    "value": "ExpandArgument",
    "label": "ExpandArgument",
    "description": "Expands the abbreviation `arg` to the full word `argument` for clarity."
  },
  {
    "value": "ExpandBecause",
    "label": "ExpandBecause",
    "description": "Expands the informal abbreviation `cuz` to the full word `because` for formality."
  },
  {
    "value": "ExpandConfiguration",
    "label": "ExpandConfiguration",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "ExpandControl",
    "label": "ExpandControl",
    "description": "Expands the informal abbreviation `ctrl` to the full word `control` for clarity."
  },
  {
    "value": "ExpandCoordinate",
    "label": "ExpandCoordinate",
    "description": "Expands the abbreviation `coord` to the full word `coordinate` for clarity."
  },
  {
    "value": "ExpandDecl",
    "label": "ExpandDecl",
    "description": "Expands the abbreviation `decl` to the full word `declaration` or `declarator` for clarity."
  },
  {
    "value": "ExpandDependencies",
    "label": "ExpandDependencies",
    "description": "Expands the abbreviation `deps` to the full word `dependencies` for clarity."
  },
  {
    "value": "ExpandDereference",
    "label": "ExpandDereference",
    "description": "Expands the abbreviation `deref` to the full word `dereference` for clarity."
  },
  {
    "value": "ExpandDirectory",
    "label": "ExpandDirectory",
    "description": "Expands the abbreviation `dir` to the full word `directory` for clarity."
  },
  {
    "value": "ExpandForward",
    "label": "ExpandForward",
    "description": "Expands the abbreviation `fwd` to the full word `forward` for clarity."
  },
  {
    "value": "ExpandGovt",
    "label": "ExpandGovt",
    "description": "Expands the abbreviation `govt` or `govt.` to the full word `government` for clarity."
  },
  {
    "value": "ExpandMemoryShorthands",
    "label": "ExpandMemoryShorthands",
    "description": "Expands memory-related abbreviations (`B`, `kB`, `MB`, `GB`, `TB`, `PB`, `KiB`, `MiB`, `GiB`, `TiB`, `PiB`, etc.) to their full forms (`b…"
  },
  {
    "value": "ExpandMinimum",
    "label": "ExpandMinimum",
    "description": "Expands the abbreviation `min` to the full word `minimum` for clarity."
  },
  {
    "value": "ExpandNotification",
    "label": "ExpandNotification",
    "description": "Expands the abbreviation `notif` to the full word `notification` for clarity."
  },
  {
    "value": "ExpandParameter",
    "label": "ExpandParameter",
    "description": "Expands the abbreviation `param` to the full word `parameter` for clarity."
  },
  {
    "value": "ExpandPeople",
    "label": "ExpandPeople",
    "description": "Expands the abbreviation `ppl` to the full word `people` for clarity."
  },
  {
    "value": "ExpandPerformance",
    "label": "ExpandPerformance",
    "description": "Expands the abbreviation `perf` to the full word `performance` for clarity."
  },
  {
    "value": "ExpandPointer",
    "label": "ExpandPointer",
    "description": "Expands the abbreviation `ptr` to the full word `pointer` for clarity."
  },
  {
    "value": "ExpandPreference",
    "label": "ExpandPreference",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "ExpandPrevious",
    "label": "ExpandPrevious",
    "description": "Expands the abbreviation `prev` to the full word `previous` for clarity."
  },
  {
    "value": "ExpandStandardInputAndOutput",
    "label": "ExpandStandardInputAndOutput",
    "description": "Expands the abbreviations `stdin`, `stdout`, and `stderr` to the full words `standard input`, etc. for clarity."
  },
  {
    "value": "ExpandThough",
    "label": "ExpandThough",
    "description": "Expands the informal spelling `tho` to the standard word `though`."
  },
  {
    "value": "ExpandThrough",
    "label": "ExpandThrough",
    "description": "Expands the informal spelling `thru` to the standard word `through`."
  },
  {
    "value": "ExpandTimeShorthands",
    "label": "ExpandTimeShorthands",
    "description": "Expands time-related abbreviations (`hr`, `hrs`, `min`, `mins`, `sec`, `secs`, `ms`, `msec`, `msecs`) to their full forms (`hour`, `hours…"
  },
  {
    "value": "ExpandVulnerability",
    "label": "ExpandVulnerability",
    "description": "Expands the abbreviation `vuln` to the full word `vulnerability` for clarity."
  },
  {
    "value": "ExpandWith",
    "label": "ExpandWith",
    "description": "Expands the abbreviation `w/` to the full word `with` for clarity."
  },
  {
    "value": "ExpandWithout",
    "label": "ExpandWithout",
    "description": "Expands the abbreviation `w/o` to the full word `without` for clarity."
  },
  {
    "value": "Expat",
    "label": "Expat",
    "description": "Corrects the mistake of writing `expat` as two words."
  },
  {
    "value": "Expatriate",
    "label": "Expatriate",
    "description": "Fixes the misinterpretation of `expatriate`, ensuring the correct term is used for individuals residing abroad."
  },
  {
    "value": "ExplainLikeImFive",
    "label": "ExplainLikeImFive",
    "description": "Expands an initialism."
  },
  {
    "value": "ExplanationMark",
    "label": "ExplanationMark",
    "description": "Corrects the eggcorn `explanation mark/point` to `exclamation mark/point`."
  },
  {
    "value": "ExtendOrExtent",
    "label": "ExtendOrExtent",
    "description": "Corrects `extend` to `extent` when the context is a noun."
  },
  {
    "value": "FaceFirst",
    "label": "FaceFirst",
    "description": "Ensures `face first` is correctly hyphenated as `face-first` when used before `into`."
  },
  {
    "value": "FairBit",
    "label": "FairBit",
    "description": "Corrects malapropisms of `a fair bit`."
  },
  {
    "value": "FallBelow",
    "label": "FallBelow",
    "description": "Flags redundant usage of `below` after fall distances."
  },
  {
    "value": "FarAndFewBetween",
    "label": "FarAndFewBetween",
    "description": "Corrects `far and few between` to the standard idiom `few and far between`."
  },
  {
    "value": "FarBeIt",
    "label": "FarBeIt",
    "description": "Flags misuse of `far be it` and suggests using `from` when it is followed by `for`"
  },
  {
    "value": "FascinatedBy",
    "label": "FascinatedBy",
    "description": "Ensures the correct prepositions are used with `fascinated` (e.g., `fascinated by` or `fascinated with`)."
  },
  {
    "value": "FastPaste",
    "label": "FastPaste",
    "description": "Detects incorrect usage of `fast paste` or `fast-paste` and suggests `fast-paced` as the correct phrase."
  },
  {
    "value": "FatalOutcome",
    "label": "FatalOutcome",
    "description": "Replaces `fatal outcome` with the more direct term `death` for conciseness."
  },
  {
    "value": "FedUpWith",
    "label": "FedUpWith",
    "description": "Corrects `fed up of` to `fed up with` in dialects other than British English."
  },
  {
    "value": "FeelFell",
    "label": "FeelFell",
    "description": "Corrects some expressions using `fell` where `feel` is correct."
  },
  {
    "value": "FellowCoRedundancy",
    "label": "FellowCoRedundancy",
    "description": "Corrects redundant use of `fellow` with `co-`."
  },
  {
    "value": "FetalPosition",
    "label": "FetalPosition",
    "description": "Ensures the correct use of `fetal position`, avoiding confusion with `feeble position`, which is not a standard phrase."
  },
  {
    "value": "FewUnitsOfTimeAgo",
    "label": "FewUnitsOfTimeAgo",
    "description": "Corrects some expressions using `few` where `a few` is correct."
  },
  {
    "value": "FillerWords",
    "label": "FillerWords",
    "description": "Removes filler words."
  },
  {
    "value": "FindFine",
    "label": "FindFine",
    "description": "Fixes the common typo where writers write `find` when they mean `fine`."
  },
  {
    "value": "FindOut",
    "label": "FindOut",
    "description": "Flags `find out` when a plain `find` is the better choice."
  },
  {
    "value": "FirstAidKit",
    "label": "FirstAidKit",
    "description": "Detects when “kid” after “aid”, “starter”, “travel”, or “tool” should be “kit” (a set of supplies)."
  },
  {
    "value": "FirstPersonModifierHyphen",
    "label": "FirstPersonModifierHyphen",
    "description": "Adds a hyphen to ordinal-person modifiers when they directly describe a following noun."
  },
  {
    "value": "FishNorFowl",
    "label": "FishNorFowl",
    "description": "Corrects `neither fish nor foul` and `neither fish nor bird` to `neither fish nor fowl`."
  },
  {
    "value": "FlauntForFlout",
    "label": "FlauntForFlout",
    "description": "Corrects `flaunt` to `flout` when used with rule-like nouns."
  },
  {
    "value": "FleshOutVsFullFledged",
    "label": "FleshOutVsFullFledged",
    "description": "Corrects mixing up `flesh out` and `full fledged`."
  },
  {
    "value": "FoamAtTheMouth",
    "label": "FoamAtTheMouth",
    "description": "Corrects the idiom `foam out the mouth` to the standard `foam at the mouth`."
  },
  {
    "value": "FondOn",
    "label": "FondOn",
    "description": "Flags `fond on` and suggests `found on` or `fond of`."
  },
  {
    "value": "FootInchMinuteSecondSymbols",
    "label": "FootInchMinuteSecondSymbols",
    "description": "Corrects the use of typewriter-style apostrophes and quotes for measurements to Unicode prime and double prime symbols."
  },
  {
    "value": "FootTheBill",
    "label": "FootTheBill",
    "description": "Corrects `flip the bill` to `foot the bill`."
  },
  {
    "value": "ForALongTime",
    "label": "ForALongTime",
    "description": "Eliminates the incorrect merging in `for along time`."
  },
  {
    "value": "ForArgumentsSake",
    "label": "ForArgumentsSake",
    "description": "Corrects `for argument sake` to `for argument's sake`."
  },
  {
    "value": "ForAWhile",
    "label": "ForAWhile",
    "description": "Corrects the missing article in `for while`, forming `for a while`."
  },
  {
    "value": "ForFreeOfCharge",
    "label": "ForFreeOfCharge",
    "description": "Corrects `for free of charge` to either `for free` or `free of charge`."
  },
  {
    "value": "FormativeYears",
    "label": "FormativeYears",
    "description": "Flags the misuse of `formidable years` when `formative years` is likely intended. This rule distinguishes between the shaping of characte…"
  },
  {
    "value": "ForNoun",
    "label": "ForNoun",
    "description": "Corrects the archaic or mistaken `fro` to `for` when followed by a noun."
  },
  {
    "value": "ForTheMostPart",
    "label": "ForTheMostPart",
    "description": "Corrects `for most part` to `for the most part`."
  },
  {
    "value": "ForTheNthTime",
    "label": "ForTheNthTime",
    "description": "Corrects missing `the` for occasions like `on third time` -> `on the third time`."
  },
  {
    "value": "ForWhatItsWorth",
    "label": "ForWhatItsWorth",
    "description": "Expands an initialism."
  },
  {
    "value": "ForYourInformation",
    "label": "ForYourInformation",
    "description": "Expands an initialism."
  },
  {
    "value": "FreePredicate",
    "label": "FreePredicate",
    "description": "Helps swap in `free` when a linking verb is followed by the noun `fee`."
  },
  {
    "value": "FreeRein",
    "label": "FreeRein",
    "description": "Ensures the correct use of `free rein`, avoiding confusion with `free reign`, which incorrectly suggests authority rather than freedom of…"
  },
  {
    "value": "Freezing",
    "label": "Freezing",
    "description": "Encourages vivid writing by suggesting `freezing` instead of weaker expressions like `very cold.`"
  },
  {
    "value": "FriendOfMe",
    "label": "FriendOfMe",
    "description": "Corrects wrong pronoun usage in constructions like `a friend of me`."
  },
  {
    "value": "FromTheGetGo",
    "label": "FromTheGetGo",
    "description": "Ensures `from the get-go` is correctly hyphenated, preserving the idiom’s meaning of ‘from the very beginning’."
  },
  {
    "value": "FullToTheBrim",
    "label": "FullToTheBrim",
    "description": "Corrects the wrong preposition in the idiom `full` or `filled to the brim`."
  },
  {
    "value": "Furthermore",
    "label": "Furthermore",
    "description": "Looks for incorrect spacing inside the closed compound `furthermore`."
  },
  {
    "value": "GetRidOf",
    "label": "GetRidOf",
    "description": "Corrects common misspellings of the idiom `get rid of`."
  },
  {
    "value": "GetUsedTo",
    "label": "GetUsedTo",
    "description": "Corrects `used of` to `used to`."
  },
  {
    "value": "GildedAge",
    "label": "GildedAge",
    "description": "If referring to the period of economic prosperity, the correct term is `Gilded Age`."
  },
  {
    "value": "GoggleBrand",
    "label": "GoggleBrand",
    "description": "Replaces the misspelling `goggle` when it is paired with a well-known Google service."
  },
  {
    "value": "GoingTo",
    "label": "GoingTo",
    "description": "Corrects `gong to` to the intended phrase `going to`."
  },
  {
    "value": "GoodAt",
    "label": "GoodAt",
    "description": "Checks for `good in` used instead of `good at` to describe proficiency with a skill."
  },
  {
    "value": "GoogleNames",
    "label": "GoogleNames",
    "description": "When referring to Google products and services, make sure to treat them as proper nouns."
  },
  {
    "value": "GoSoFarAsTo",
    "label": "GoSoFarAsTo",
    "description": "Flags 'go so far to' when it should be 'go so far as to' to express going beyond expectations"
  },
  {
    "value": "GoToWar",
    "label": "GoToWar",
    "description": "Replaces `go at war` with `go to war`."
  },
  {
    "value": "GrindToAHalt",
    "label": "GrindToAHalt",
    "description": "Corrects the idiom `grind to halt` to the standard `grind to a halt`."
  },
  {
    "value": "GuineaBissau",
    "label": "GuineaBissau",
    "description": "Checks for the correct official name of the African country."
  },
  {
    "value": "HadOf",
    "label": "HadOf",
    "description": "Flags the unnecessary use of `of` after `had` and suggests the correct forms."
  },
  {
    "value": "HalfAnHour",
    "label": "HalfAnHour",
    "description": "Fixes the eggcorn `half an our` to the accepted `half an hour`."
  },
  {
    "value": "Handful",
    "label": "Handful",
    "description": "Keeps the palm-sized quantity expressed by `handful` as one word."
  },
  {
    "value": "HandfulOfMore",
    "label": "HandfulOfMore",
    "description": "A linter skeleton for contributors to copy into `harper_core/src/linting/` and rename."
  },
  {
    "value": "Haphazard",
    "label": "Haphazard",
    "description": "Corrects the eggcorn `half hazard` to `haphazard`, which properly means lacking organization or being random."
  },
  {
    "value": "HaveAHardTime",
    "label": "HaveAHardTime",
    "description": "Corrects `have hard time` to `have a hard time`."
  },
  {
    "value": "HaveNegNoAny",
    "label": "HaveNegNoAny",
    "description": "Rewrites `no` to `any` in clauses like `haven't done no X` so the sentence keeps a single clear negation."
  },
  {
    "value": "HavePassed",
    "label": "HavePassed",
    "description": "Suggests `past` for `passed` in case a verb was intended."
  },
  {
    "value": "HavePronoun",
    "label": "HavePronoun",
    "description": "Flags questions that begin with `has` followed by a pronoun that requires `have`, such as `Has we …` or `Has I …`, and suggests the corre…"
  },
  {
    "value": "HaveTakeALook",
    "label": "HaveTakeALook",
    "description": "Corrects either `have a look` or `take a look` to the other, depending on the dialect."
  },
  {
    "value": "Hazzle",
    "label": "Hazzle",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "HeartToHeard",
    "label": "HeartToHeard",
    "description": "Corrects `heart` or `herd` to `heard` in common `have ... heard of/about` questions."
  },
  {
    "value": "Hedging",
    "label": "Hedging",
    "description": "Flags hedging language (e.g. `I would argue that`, `..., so to speak`, `to a certain degree`)."
  },
  {
    "value": "HeDos",
    "label": "HeDos",
    "description": "Corrects the misspelling `dos` after `he`, `she`, or `it`."
  },
  {
    "value": "HelloGreeting",
    "label": "HelloGreeting",
    "description": "Encourages greeting someone with `hello` instead of the homophone `halo`."
  },
  {
    "value": "HelpedPast",
    "label": "HelpedPast",
    "description": "Corrects past forms of verbs to their base form, when used after \"helped\"."
  },
  {
    "value": "Henceforth",
    "label": "Henceforth",
    "description": "Looks for incorrect spacing inside the closed compound `henceforth`."
  },
  {
    "value": "Hereby",
    "label": "Hereby",
    "description": "`Here by` in some contexts should be `hereby`"
  },
  {
    "value": "HiddenIn",
    "label": "HiddenIn",
    "description": "Corrects `hidden into` to `hidden in`."
  },
  {
    "value": "HitTheNailOnTheHead",
    "label": "HitTheNailOnTheHead",
    "description": "Corrects the eggcorn `hit the nail in the head` to the standard `hit the nail on the head`."
  },
  {
    "value": "Holidays",
    "label": "Holidays",
    "description": "When referring to holidays, make sure to treat them as a proper noun."
  },
  {
    "value": "HolyWar",
    "label": "HolyWar",
    "description": "Corrects misspellings of `holy war`."
  },
  {
    "value": "HomeInOn",
    "label": "HomeInOn",
    "description": "Corrects `hone in on` to `home in on`."
  },
  {
    "value": "HopHope",
    "label": "HopHope",
    "description": "Handles common errors involving `hop` and `hope`. Ensures `hop` is used correctly in phrases like `hop on a bus` while correcting mistake…"
  },
  {
    "value": "HowDoesCompared",
    "label": "HowDoesCompared",
    "description": "Corrects `how do/does/did X compared/compares to Y` to use `compare`."
  },
  {
    "value": "However",
    "label": "However",
    "description": "Looks for incorrect spacing inside the closed compound `however`."
  },
  {
    "value": "HowItLooksLike",
    "label": "HowItLooksLike",
    "description": "Corrects `how ... looks like` to `how ... looks` or `what ... looks like`."
  },
  {
    "value": "HowMach",
    "label": "HowMach",
    "description": "Swaps `how mach` or `how match` with the correct quantifier `how much`."
  },
  {
    "value": "HowTo",
    "label": "HowTo",
    "description": "Detects the omission of `to` in constructions like `how clone / how install` and suggests `how to …`."
  },
  {
    "value": "HumanBeings",
    "label": "HumanBeings",
    "description": "Eliminates the incorrect possessive/plural usage like `human's beings` or `humans beings`."
  },
  {
    "value": "HumanLife",
    "label": "HumanLife",
    "description": "Changes `human live` to `human life`."
  },
  {
    "value": "HungerPang",
    "label": "HungerPang",
    "description": "Corrects `hunger pain` to `hunger pang`."
  },
  {
    "value": "HyphenateNumberDay",
    "label": "HyphenateNumberDay",
    "description": "Ensures a hyphen is used in `X-day` when it is part of a compound adjective, such as `4-day work week`."
  },
  {
    "value": "IAm",
    "label": "IAm",
    "description": "Fixes the incorrect spacing in `I a m` to properly form `I am`."
  },
  {
    "value": "IAmAgreement",
    "label": "IAmAgreement",
    "description": "Corrects `I are` to `I am`."
  },
  {
    "value": "IDo",
    "label": "IDo",
    "description": "Corrects `I does` to `I do`."
  },
  {
    "value": "IDontKnow",
    "label": "IDontKnow",
    "description": "Expands an initialism."
  },
  {
    "value": "IfIRecallCorrectly",
    "label": "IfIRecallCorrectly",
    "description": "Expands an initialism."
  },
  {
    "value": "IfIUnderstandCorrectly",
    "label": "IfIUnderstandCorrectly",
    "description": "Expands an initialism."
  },
  {
    "value": "IfWouldve",
    "label": "IfWouldve",
    "description": "Corrects `if I would've done` etc. to `if I had done` etc."
  },
  {
    "value": "IfYouKnowYouKnow",
    "label": "IfYouKnowYouKnow",
    "description": "Expands an initialism."
  },
  {
    "value": "ImitateFrom",
    "label": "ImitateFrom",
    "description": "After `imitate ...`, idiomatic phrasing points to the inspiration with `of` instead of `from`."
  },
  {
    "value": "Impressed",
    "label": "Impressed",
    "description": "Corrects `impressed of` to `impressed by` or `impressed with`."
  },
  {
    "value": "InADifferentDirection",
    "label": "InADifferentDirection",
    "description": "Detects the incorrect use of the preposition `into` when describing a change in path, strategy, or orientation. A direction is abstract,…"
  },
  {
    "value": "InAHurry",
    "label": "InAHurry",
    "description": "Corrects `in hurry` to `in a hurry`."
  },
  {
    "value": "InAnyWay",
    "label": "InAnyWay",
    "description": "Corrects ungrammatical `in anyway` to `in any way`."
  },
  {
    "value": "InAWhile",
    "label": "InAWhile",
    "description": "Corrects the missing article in `in while`, forming `in a while`."
  },
  {
    "value": "InCaseYouMissedIt",
    "label": "InCaseYouMissedIt",
    "description": "Expands an initialism."
  },
  {
    "value": "IncidentReport",
    "label": "IncidentReport",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "IncludingButNotLimitedToPunctuation",
    "label": "IncludingButNotLimitedToPunctuation",
    "description": "Adds the conventional commas around `including, but not limited to,` when used parenthetically."
  },
  {
    "value": "InDemandInDepth",
    "label": "InDemandInDepth",
    "description": "Checks for `in-demand` and `in-depth` used as adjectives but not hyphenated."
  },
  {
    "value": "InDetail",
    "label": "InDetail",
    "description": "Corrects unidiomatic plural `in details` to `in detail`."
  },
  {
    "value": "InDueCourse",
    "label": "InDueCourse",
    "description": "Corrects `do` to `due` in the eggcorn `in do course`."
  },
  {
    "value": "InFavourOfDoing",
    "label": "InFavourOfDoing",
    "description": "Corrects missing `of` in `in favor/favour of doing`, etc."
  },
  {
    "value": "InflectedVerbAfterTo",
    "label": "InflectedVerbAfterTo",
    "description": "This rule looks for `to verb` where `verb` is not in the infinitive form."
  },
  {
    "value": "InflectionPoint",
    "label": "InflectionPoint",
    "description": "Corrects `infliction point` to `inflection point`."
  },
  {
    "value": "InHindsight",
    "label": "InHindsight",
    "description": "Corrects incorrect variants of `in hindsight` to the standard phrase."
  },
  {
    "value": "Initiatively",
    "label": "Initiatively",
    "description": "Corrects nonstandard `initiatively`."
  },
  {
    "value": "InLieuOf",
    "label": "InLieuOf",
    "description": "Corrects the misspelling `in lue of` to `in lieu of`."
  },
  {
    "value": "InMyHumbleOpinion",
    "label": "InMyHumbleOpinion",
    "description": "Expands an initialism."
  },
  {
    "value": "InMyOpinion",
    "label": "InMyOpinion",
    "description": "Expands an initialism."
  },
  {
    "value": "InNeedOf",
    "label": "InNeedOf",
    "description": "Corrects `in need for` to `in need of`."
  },
  {
    "value": "InOfItself",
    "label": "InOfItself",
    "description": "Corrects nonstandard `in of itself` to standard `in itself` or `in and of itself`."
  },
  {
    "value": "InOnTheCards",
    "label": "InOnTheCards",
    "description": "Corrects either `in the cards` or `on the cards` to the other, depending on the dialect."
  },
  {
    "value": "InRealLife",
    "label": "InRealLife",
    "description": "Expands an initialism."
  },
  {
    "value": "InRetaliationTo",
    "label": "InRetaliationTo",
    "description": "Corrects `in retaliation to` to `in retaliation for` or `in response to`."
  },
  {
    "value": "Insensitive",
    "label": "Insensitive",
    "description": "Suggests the more standard and common synonym `insensitive`."
  },
  {
    "value": "Insofar",
    "label": "Insofar",
    "description": "Looks for incorrect spacing inside the closed compound `insofar`."
  },
  {
    "value": "InspiredBy",
    "label": "InspiredBy",
    "description": "Corrects `inspired from` to `inspired by`, as `by` is the standard preposition for indicating the source of inspiration."
  },
  {
    "value": "Instead",
    "label": "Instead",
    "description": "Looks for incorrect spacing inside the closed compound `instead`."
  },
  {
    "value": "InsteadOf",
    "label": "InsteadOf",
    "description": "Corrects the archaic or mistaken separation `in stead of` to `instead of` in everyday usage."
  },
  {
    "value": "InStock",
    "label": "InStock",
    "description": "Corrects `on stock` to `in stock`."
  },
  {
    "value": "Insurmountable",
    "label": "Insurmountable",
    "description": "Suggests the more standard and common synonym `insurmountable`."
  },
  {
    "value": "Intact",
    "label": "Intact",
    "description": "Looks for incorrect spacing inside the closed compound `intact`."
  },
  {
    "value": "InterestedIn",
    "label": "InterestedIn",
    "description": "Ensures the correct preposition is used with the word `interested` (e.g. `interested in`)."
  },
  {
    "value": "InThe",
    "label": "InThe",
    "description": "Detects and corrects a spacing error where `in the` is mistakenly written as `int he`. Proper spacing is essential for readability and gr…"
  },
  {
    "value": "InThisThatRegard",
    "label": "InThisThatRegard",
    "description": "Corrects `in this/that regards` to `in this/that regard`."
  },
  {
    "value": "InTimeFromNow",
    "label": "InTimeFromNow",
    "description": "Checks for redundant use of `in` before [period of time] together with `from now` after it."
  },
  {
    "value": "IntroCueCommaBeforeThanks",
    "label": "IntroCueCommaBeforeThanks",
    "description": "Normalizes the common refusal phrase by inserting the missing comma."
  },
  {
    "value": "InvestIn",
    "label": "InvestIn",
    "description": "`Invest` is traditionally followed by 'in,' not `into.`"
  },
  {
    "value": "IsBeenAuxSequence",
    "label": "IsBeenAuxSequence",
    "description": "Rewrites `is been` to a standard perfect-passive form."
  },
  {
    "value": "IsKnownFor",
    "label": "IsKnownFor",
    "description": "Typo: `known` is the correct past participle."
  },
  {
    "value": "ItCan",
    "label": "ItCan",
    "description": "Corrects the misspelling `It cam` to the proper phrase `It can`."
  },
  {
    "value": "ItLooksLikeThat",
    "label": "ItLooksLikeThat",
    "description": "Corrects `it looks like that` to just `it looks like`."
  },
  {
    "value": "ItsContraction",
    "label": "ItsContraction",
    "description": "Detects places where the possessive `its` should be the contraction `it's`, including before verbs/clauses and before proper nouns after…"
  },
  {
    "value": "Itself",
    "label": "Itself",
    "description": "Looks for incorrect spacing inside the closed compound `itself`."
  },
  {
    "value": "ItsPossessive",
    "label": "ItsPossessive",
    "description": "In English, possessive pronouns never take an apostrophe. Use `its` to show ownership (e.g. “its texture”) and avoid confusing it with `i…"
  },
  {
    "value": "ItTimeAuxiliary",
    "label": "ItTimeAuxiliary",
    "description": "Fixes missing auxiliary usage in `it time to/for ...` patterns by inserting the contraction form."
  },
  {
    "value": "IveGotTo",
    "label": "IveGotTo",
    "description": "Corrects the slip `I've go to` to the idiomatic `I've got to`."
  },
  {
    "value": "JawDropping",
    "label": "JawDropping",
    "description": "Corrects `jar-dropping` to `jaw-dropping`, ensuring the intended meaning of something that causes amazement."
  },
  {
    "value": "JealousOf",
    "label": "JealousOf",
    "description": "Encourages the standard preposition after `jealous`."
  },
  {
    "value": "JetpackNames",
    "label": "JetpackNames",
    "description": "Ensure proper capitalization of Jetpack-related terms."
  },
  {
    "value": "JohnsHopkins",
    "label": "JohnsHopkins",
    "description": "Recommends the proper spelling `Johns Hopkins`."
  },
  {
    "value": "JumpTheGun",
    "label": "JumpTheGun",
    "description": "Detects incorrect usage of the `jump the gun` idiom."
  },
  {
    "value": "JustDeserts",
    "label": "JustDeserts",
    "description": "Ensures `just deserts` is used correctly, preserving its meaning of receiving an appropriate outcome for one's actions."
  },
  {
    "value": "Keystroke",
    "label": "Keystroke",
    "description": "Looks for incorrect spacing inside the closed compound `keystroke`."
  },
  {
    "value": "Keystrokes",
    "label": "Keystrokes",
    "description": "Looks for incorrect spacing inside the closed compound `keystrokes`."
  },
  {
    "value": "KindOf",
    "label": "KindOf",
    "description": "Corrects `kinda of` to `kind of`."
  },
  {
    "value": "KindRegards",
    "label": "KindRegards",
    "description": "Changes `kid regards` to `kind regards`."
  },
  {
    "value": "KindSortOf",
    "label": "KindSortOf",
    "description": "Flags `kind if` or `sort off` that stand before qualifiers so the filler `of` stays intact."
  },
  {
    "value": "KnowNothingVerb",
    "label": "KnowNothingVerb",
    "description": "Fixes `no` to `know` in common `subject + no nothing` constructions."
  },
  {
    "value": "Koreas",
    "label": "Koreas",
    "description": "When referring to the nations, make sure to treat them as a proper noun."
  },
  {
    "value": "Laos",
    "label": "Laos",
    "description": "When referring to provinces and cities in Laos, make sure to treat them as a proper noun."
  },
  {
    "value": "Laptop",
    "label": "Laptop",
    "description": "Looks for incorrect spacing inside the closed compound `laptop`."
  },
  {
    "value": "LastButNotLeast",
    "label": "LastButNotLeast",
    "description": "Corrects common errors in the phrase `last but not least`."
  },
  {
    "value": "LastDitch",
    "label": "LastDitch",
    "description": "Corrects wrong variations of the idiomatic adjective `last-ditch`."
  },
  {
    "value": "LastNight",
    "label": "LastNight",
    "description": "Flags `yesterday night` and suggests the standard phrasing `last night`."
  },
  {
    "value": "LaughOfAt",
    "label": "LaughOfAt",
    "description": "Warns when `laugh` takes `of` before a person or pronoun and nudges writers toward the conventional `at`."
  },
  {
    "value": "LayoutVerb",
    "label": "LayoutVerb",
    "description": "Flags nonstandard verb forms of `layout` (like `layouted` and `layouting`) and suggests the standard English verb forms (`laid out` and `…"
  },
  {
    "value": "LeadRiseTo",
    "label": "LeadRiseTo",
    "description": "Corrects `leads rise to` to `gives rise to`."
  },
  {
    "value": "LeaveToFor",
    "label": "LeaveToFor",
    "description": "When describing travel plans that include a destination and a time frame, prefer `leave for a destination` instead of `leave to a destina…"
  },
  {
    "value": "LeavingInDroves",
    "label": "LeavingInDroves",
    "description": "Corrects `leaving in drones` to `leaving in droves`."
  },
  {
    "value": "LeftRightHand",
    "label": "LeftRightHand",
    "description": "Ensures `left hand` and `right hand` are hyphenated when used as adjectives before a noun, such as in `left-hand side` or `right-hand cor…"
  },
  {
    "value": "LessWorse",
    "label": "LessWorse",
    "description": "Suggests alternatives to `less/least worse/worst` for more standard, clearer comparisons."
  },
  {
    "value": "LetAlone",
    "label": "LetAlone",
    "description": "Changes `let along` to `let alone`."
  },
  {
    "value": "LetMeKnow",
    "label": "LetMeKnow",
    "description": "Expands an initialism."
  },
  {
    "value": "LetsConfusion",
    "label": "LetsConfusion",
    "description": "It's often hard to determine where the subject should go with the word `let`. This rule attempts to find common errors with redundancy an…"
  },
  {
    "value": "LetToDo",
    "label": "LetToDo",
    "description": "Corrects extraneous `to` after `let`."
  },
  {
    "value": "LevelOfDetails",
    "label": "LevelOfDetails",
    "description": "Corrects `level of details` to `level of detail` or `levels of detail`."
  },
  {
    "value": "LikeAsIf",
    "label": "LikeAsIf",
    "description": "Corrects redundant `like as if` to `like` or `as if`."
  },
  {
    "value": "LikelyHood",
    "label": "LikelyHood",
    "description": "Treat the split tokens as one compound word (`likelihood`) whenever the adjective `likely` precedes `hood`."
  },
  {
    "value": "LikeThePlague",
    "label": "LikeThePlague",
    "description": "Corrects `like a plague` to `like the plague`."
  },
  {
    "value": "LikeTheresNoTomorrow",
    "label": "LikeTheresNoTomorrow",
    "description": "Corrects `like no tomorrow` to `like there's no tomorrow`."
  },
  {
    "value": "Likewise",
    "label": "Likewise",
    "description": "Looks for incorrect spacing inside the closed compound `likewise`."
  },
  {
    "value": "LinesOfCode",
    "label": "LinesOfCode",
    "description": "Corrects pluralizing the wrong noun in `lines of code`."
  },
  {
    "value": "LinkedList",
    "label": "LinkedList",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "LitotesDirectPositive",
    "label": "LitotesDirectPositive",
    "description": "Offers direct-positive alternatives when double negatives might feel heavy."
  },
  {
    "value": "LittleKnown",
    "label": "LittleKnown",
    "description": "A linter skeleton for contributors to copy into `harper_core/src/linting/` and rename."
  },
  {
    "value": "LongSentences",
    "label": "LongSentences",
    "description": "This rule looks for run-on sentences, which can make your work harder to grok."
  },
  {
    "value": "LongTimeAgo",
    "label": "LongTimeAgo",
    "description": "Corrects the missing article `a` in the phrase `long time ago`."
  },
  {
    "value": "LookDownOnesNose",
    "label": "LookDownOnesNose",
    "description": "Corrects `look one's nose down` to `look down one's nose`"
  },
  {
    "value": "LookForwardTo",
    "label": "LookForwardTo",
    "description": "Corrects `look forward for` to `look forward to`."
  },
  {
    "value": "LookingForwardTo",
    "label": "LookingForwardTo",
    "description": "This rule identifies instances where the phrase `looking forward to` is followed by a base form verb instead of the required gerund (verb…"
  },
  {
    "value": "LookInto",
    "label": "LookInto",
    "description": "Merges the split preposition when a look-verb is followed by a clause that starts with a question word."
  },
  {
    "value": "LooksLikes",
    "label": "LooksLikes",
    "description": "This rule turns `looks likes`, `looked likes`, and `looking likes` into the idiomatic `look ... like`."
  },
  {
    "value": "LowHangingFruit",
    "label": "LowHangingFruit",
    "description": "Corrects nonstandard variants of `low-hanging fruit`."
  },
  {
    "value": "MakeDoWith",
    "label": "MakeDoWith",
    "description": "Corrects `make due` to `make do` when followed by `with`."
  },
  {
    "value": "MakeItSeem",
    "label": "MakeItSeem",
    "description": "Corrects `make it seems` to `make it seem`."
  },
  {
    "value": "MakeSense",
    "label": "MakeSense",
    "description": "Corrects `make senses` to `make sense`."
  },
  {
    "value": "MakeupCompoundNoun",
    "label": "MakeupCompoundNoun",
    "description": "Finds determiner-led noun phrases where the split spelling appears and closes it."
  },
  {
    "value": "Malaysia",
    "label": "Malaysia",
    "description": "When referring to the states of Malaysia and their capitals, make sure to treat them as a proper noun."
  },
  {
    "value": "ManagerialReins",
    "label": "ManagerialReins",
    "description": "Corrects the eggcorn `managerial reigns` to the idiomatic `managerial reins`."
  },
  {
    "value": "MassExodus",
    "label": "MassExodus",
    "description": "Corrects the eggcorn `max exodues` to the idiomatic `mass exodus`."
  },
  {
    "value": "MassNouns",
    "label": "MassNouns",
    "description": "Detects mass nouns used as countable nouns."
  },
  {
    "value": "MayOfPronoun",
    "label": "MayOfPronoun",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "MeansALotTo",
    "label": "MeansALotTo",
    "description": "Corrects wrong variants of `means a lot for [someone]` to `means a lot to [someone]`."
  },
  {
    "value": "Meanwhile",
    "label": "Meanwhile",
    "description": "Looks for incorrect spacing inside the closed compound `meanwhile`."
  },
  {
    "value": "MercedesBenzHyphen",
    "label": "MercedesBenzHyphen",
    "description": "Connect the separate words `Mercedes` and `Benz` whenever they appear together so the brand stays consistent with its official styling."
  },
  {
    "value": "MergeWords",
    "label": "MergeWords",
    "description": "Accidentally inserting a space inside a word is common. This rule looks for valid words that are split by whitespace."
  },
  {
    "value": "MetaNames",
    "label": "MetaNames",
    "description": "When referring to Meta products and services, make sure to treat them as proper nouns."
  },
  {
    "value": "MicrosoftNames",
    "label": "MicrosoftNames",
    "description": "When referring to Microsoft products and services, make sure to treat them as proper nouns."
  },
  {
    "value": "Middleware",
    "label": "Middleware",
    "description": "Looks for incorrect spacing inside the closed compound `middleware`."
  },
  {
    "value": "MissingDeterminer",
    "label": "MissingDeterminer",
    "description": "Detects likely missing determiners in common request phrases and offers to insert one where necessary."
  },
  {
    "value": "MissingPreposition",
    "label": "MissingPreposition",
    "description": "Locates potentially missing prepositions."
  },
  {
    "value": "MissingTo",
    "label": "MissingTo",
    "description": "Flags verbs and adjectives like `need`, `want`, or `ready` that are missing `to` before an infinitive."
  },
  {
    "value": "Misspell",
    "label": "Misspell",
    "description": "Ensures `misspell` and its inflected forms are written as a single word."
  },
  {
    "value": "Misunderstand",
    "label": "Misunderstand",
    "description": "Looks for incorrect spacing inside the closed compound `misunderstand`."
  },
  {
    "value": "Misunderstood",
    "label": "Misunderstood",
    "description": "Looks for incorrect spacing inside the closed compound `misunderstood`."
  },
  {
    "value": "Misuse",
    "label": "Misuse",
    "description": "Looks for incorrect spacing inside the closed compound `misuse`."
  },
  {
    "value": "Misused",
    "label": "Misused",
    "description": "Looks for incorrect spacing inside the closed compound `misused`."
  },
  {
    "value": "MixedBag",
    "label": "MixedBag",
    "description": "Corrects the eggcorn `mixed bad` to `mixed bag`."
  },
  {
    "value": "ModalBeAdjective",
    "label": "ModalBeAdjective",
    "description": "Looks for `be` missing between a modal verb and adjective."
  },
  {
    "value": "ModalOf",
    "label": "ModalOf",
    "description": "Detects `of` mistakenly used with `would`, `could`, `should`, etc."
  },
  {
    "value": "ModalSeem",
    "label": "ModalSeem",
    "description": "Detects modal verbs followed by `seen` before adjectives and suggests `seem` or `be`."
  },
  {
    "value": "Months",
    "label": "Months",
    "description": "Detects months written with a lowercase first letter."
  },
  {
    "value": "Monumentous",
    "label": "Monumentous",
    "description": "Advises using `momentous` or `monumental` instead of `monumentous` for serious usage."
  },
  {
    "value": "MootPoint",
    "label": "MootPoint",
    "description": "Corrects `mute` to `moot` in the phrase `moot point`."
  },
  {
    "value": "MoreAdjective",
    "label": "MoreAdjective",
    "description": "Looks for comparative adjective constructions with `more` than could use inflected forms."
  },
  {
    "value": "MoreBetter",
    "label": "MoreBetter",
    "description": "Finds redundant paring of `more` or `most` with adjectives already in the comparative or superlative form."
  },
  {
    "value": "MoreThanMeetsTheEye",
    "label": "MoreThanMeetsTheEye",
    "description": "Corrects nonstandard and less idiomatic variants of `more than meets the eye`."
  },
  {
    "value": "MoreThatLikely",
    "label": "MoreThatLikely",
    "description": "Corrects the common typo `more that likely` to `more than likely`."
  },
  {
    "value": "MostNumber",
    "label": "MostNumber",
    "description": "Corrects `most number` and `most amount`"
  },
  {
    "value": "MostOfTheTimes",
    "label": "MostOfTheTimes",
    "description": "Corrects `a lot of the times` and `most of the times` to use singular `time`."
  },
  {
    "value": "Multicore",
    "label": "Multicore",
    "description": "Looks for incorrect spacing inside the closed compound `multicore`."
  },
  {
    "value": "Multimedia",
    "label": "Multimedia",
    "description": "Looks for incorrect spacing inside the closed compound `multimedia`."
  },
  {
    "value": "MultipleFrequencyAdverbs",
    "label": "MultipleFrequencyAdverbs",
    "description": "Looks for adjacent adverbs of frequency, which will be either redundant or contradictory."
  },
  {
    "value": "MultipleSequentialPronouns",
    "label": "MultipleSequentialPronouns",
    "description": "When editing work to change point of view (i.e. first-person or third-person) it is common to add pronouns while neglecting to remove old…"
  },
  {
    "value": "Multithreading",
    "label": "Multithreading",
    "description": "Looks for incorrect spacing inside the closed compound `multithreading`."
  },
  {
    "value": "MyHouse",
    "label": "MyHouse",
    "description": "Fixes the typo `mu house` to `my house`."
  },
  {
    "value": "Myself",
    "label": "Myself",
    "description": "Looks for incorrect spacing inside the closed compound `myself`."
  },
  {
    "value": "NailOnTheHead",
    "label": "NailOnTheHead",
    "description": "Replaces hat/had/hit/hid in the idiom `nail on the head` with `head`."
  },
  {
    "value": "NakedEye",
    "label": "NakedEye",
    "description": "Corrects the wrong preposition used instead of `to`, `with`, or `by` the naked eye."
  },
  {
    "value": "NationalCapitals",
    "label": "NationalCapitals",
    "description": "When referring to national capitals, make sure to treat it as a proper noun."
  },
  {
    "value": "NeedHelp",
    "label": "NeedHelp",
    "description": "Changes `ned help` to the correct `need help`."
  },
  {
    "value": "NeedToNoun",
    "label": "NeedToNoun",
    "description": "Flags `need to` when it is immediately followed by a noun, which usually means the infinitive verb is missing."
  },
  {
    "value": "NeitherHereNorThere",
    "label": "NeitherHereNorThere",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "NerveRacking",
    "label": "NerveRacking",
    "description": "Corrects common misspellings and missing hyphen in `nerve-racking`."
  },
  {
    "value": "NervousWreck",
    "label": "NervousWreck",
    "description": "Suggests using `nervous wreck` when referring to a person's emotional state."
  },
  {
    "value": "NeverMind",
    "label": "NeverMind",
    "description": "Expands an initialism."
  },
  {
    "value": "NobelPeacePrize",
    "label": "NobelPeacePrize",
    "description": "Corrects the frequent typos that swap the Nobel/Peace/Prize spelling when people mention the prize."
  },
  {
    "value": "Nobody",
    "label": "Nobody",
    "description": "Looks for incorrect spacing inside the closed compound `nobody`."
  },
  {
    "value": "NoFrenchSpaces",
    "label": "NoFrenchSpaces",
    "description": "Stops users from accidentally inserting French spaces."
  },
  {
    "value": "NoHarmNoFoul",
    "label": "NoHarmNoFoul",
    "description": "Corrects nonstandard variants of the idiom `no harm, no foul`."
  },
  {
    "value": "NoLonger",
    "label": "NoLonger",
    "description": "Corrects `not longer` when it should be `no longer`."
  },
  {
    "value": "NoLongerPronoun",
    "label": "NoLongerPronoun",
    "description": "Detects incorrect word order where `no longer` incorrectly precedes a subject pronoun."
  },
  {
    "value": "NoMatchFor",
    "label": "NoMatchFor",
    "description": "No match for"
  },
  {
    "value": "NominalWants",
    "label": "NominalWants",
    "description": "Ensures you use the correct `want` / `wants` after a nominal."
  },
  {
    "value": "Nonetheless",
    "label": "Nonetheless",
    "description": "Looks for incorrect spacing inside the closed compound `nonetheless`."
  },
  {
    "value": "NoOxfordComma",
    "label": "NoOxfordComma",
    "description": "The Oxford comma is one of the more controversial rules in common use today. Enabling this lint checks that there is no comma before `and…"
  },
  {
    "value": "NorModalPronoun",
    "label": "NorModalPronoun",
    "description": "Corrects the order of the pronoun and modal verb after `nor`."
  },
  {
    "value": "NotablePlaces",
    "label": "NotablePlaces",
    "description": "Ensure proper capitalization of notable places that are significant regional centers, travel destinations, or have international importance."
  },
  {
    "value": "NotBeAfterNot",
    "label": "NotBeAfterNot",
    "description": "Removes the redundant linking verb that sneaks in between `not` and the predicate after a conjugated `be`."
  },
  {
    "value": "Nothing",
    "label": "Nothing",
    "description": "Looks for incorrect spacing inside the closed compound `nothing`."
  },
  {
    "value": "NotIn",
    "label": "NotIn",
    "description": "Replaces `no in` with `not in`."
  },
  {
    "value": "NotLongAfter",
    "label": "NotLongAfter",
    "description": "A collection of linters that can be run as one."
  },
  {
    "value": "NotOnly",
    "label": "NotOnly",
    "description": "Corrects `no only` to `not only` before forms of `to be`."
  },
  {
    "value": "NotOnlyInversion",
    "label": "NotOnlyInversion",
    "description": "Corrects `not only it is` to `not only is it`"
  },
  {
    "value": "NotTo",
    "label": "NotTo",
    "description": "Corrects `no to` to `not to`, ensuring proper negation."
  },
  {
    "value": "Notwithstanding",
    "label": "Notwithstanding",
    "description": "Looks for incorrect spacing inside the closed compound `notwithstanding`."
  },
  {
    "value": "NounVerbConfusion",
    "label": "NounVerbConfusion",
    "description": "Handles common confusions between related nouns and verbs (e.g., 'advice/advise', 'breath/breathe')"
  },
  {
    "value": "Nowadays",
    "label": "Nowadays",
    "description": "Corrects common misspellings of `nowadays`."
  },
  {
    "value": "Nowhere",
    "label": "Nowhere",
    "description": "Looks for incorrect spacing inside the closed compound `nowhere`."
  },
  {
    "value": "NowKnownAs",
    "label": "NowKnownAs",
    "description": "Corrects `now know as` to `now known as` for proper grammar."
  },
  {
    "value": "NowWay",
    "label": "NowWay",
    "description": "Corrects `now way` to `no way` in high-confidence contexts while avoiding comparative contexts like `now way too`."
  },
  {
    "value": "NumberSuffixCapitalization",
    "label": "NumberSuffixCapitalization",
    "description": "You should never capitalize number suffixes."
  },
  {
    "value": "NumericRangeEnDash",
    "label": "NumericRangeEnDash",
    "description": "Replaces hyphens and em dashes with en dashes in isolated numeric ranges such as `12–14`."
  },
  {
    "value": "ObsessPreposition",
    "label": "ObsessPreposition",
    "description": "Ensures valid prepositions are used with `obsess`"
  },
  {
    "value": "OceansAndSeas",
    "label": "OceansAndSeas",
    "description": "When referring to the world's oceans and seas, ensure they are treated as proper nouns."
  },
  {
    "value": "OfCourse",
    "label": "OfCourse",
    "description": "Corrects common mistaken forms of `of course`, including `of curse`, `off course`, and `ofcourse`, while ignoring valid phrases like `kin…"
  },
  {
    "value": "OffTheCuff",
    "label": "OffTheCuff",
    "description": "Ensures `off-the-cuff` is correctly hyphenated."
  },
  {
    "value": "OhMyGod",
    "label": "OhMyGod",
    "description": "Expands an initialism."
  },
  {
    "value": "OkToOkay",
    "label": "OkToOkay",
    "description": "Corrects `ok` to `okay`."
  },
  {
    "value": "OldestInTheBook",
    "label": "OldestInTheBook",
    "description": "Detects the idiom `oldest X in the books`, which should use singular `book`."
  },
  {
    "value": "OldWivesTale",
    "label": "OldWivesTale",
    "description": "Corrects `old wise tale` to `old wives' tale`, preserving the phrase’s meaning as an unfounded traditional belief."
  },
  {
    "value": "OnceInAWhile",
    "label": "OnceInAWhile",
    "description": "Corrects two common malapropisms of `once in a while`."
  },
  {
    "value": "OnceOrTwice",
    "label": "OnceOrTwice",
    "description": "Detects the mistaken phrase `once a twice` and suggests `once or twice`."
  },
  {
    "value": "OneAndTheSame",
    "label": "OneAndTheSame",
    "description": "This linter flags instances of the nonstandard phrase `one in the same`. The correct, more accepted form is `one and the same`"
  },
  {
    "value": "OneFellSwoop",
    "label": "OneFellSwoop",
    "description": "Corrects `one foul swoop` to `one fell swoop`, preserving the phrase’s original meaning of sudden and complete action."
  },
  {
    "value": "OneHanded",
    "label": "OneHanded",
    "description": "Treat 'one handed' and 'two handed' as single adjectives before nouns so the measurement stays attached to 'handed'."
  },
  {
    "value": "OneOfTheSingular",
    "label": "OneOfTheSingular",
    "description": "Corrects 'one of the [singular]' to 'one of the [plural]'"
  },
  {
    "value": "OnesOwnAccord",
    "label": "OnesOwnAccord",
    "description": "Detects incorrect usage of `on one's own accord` and suggests `of one's own accord`."
  },
  {
    "value": "OnesSelf",
    "label": "OnesSelf",
    "description": "Corrects the generic reflexive pronoun `one's self` to `oneself`."
  },
  {
    "value": "OnFirstGlance",
    "label": "OnFirstGlance",
    "description": "The standard idiom starts with `at` for quick appraisals, so swap the preposition to keep the phrase idiomatic."
  },
  {
    "value": "OnFloor",
    "label": "OnFloor",
    "description": "This rule identifies incorrect uses of the prepositions `in` or `at` when referring to locations inside a building and recommends using `…"
  },
  {
    "value": "OnSecondThought",
    "label": "OnSecondThought",
    "description": "Replaces the nonstandard `on second though` with the common idiom `on second thought` to indicate reconsideration."
  },
  {
    "value": "OnTheSpurOfTheMoment",
    "label": "OnTheSpurOfTheMoment",
    "description": "Ensures the correct use of `on the spur of the moment`, avoiding nonstandard variations."
  },
  {
    "value": "OnTopOf",
    "label": "OnTopOf",
    "description": "Corrects `ontop of` and `in top of` to `on top of`."
  },
  {
    "value": "OpenCompounds",
    "label": "OpenCompounds",
    "description": "Corrects compound words that should be written as two words."
  },
  {
    "value": "OpenTheLight",
    "label": "OpenTheLight",
    "description": "Corrects using `open` instead of `turn on` or `switch on`"
  },
  {
    "value": "OperatingSystem",
    "label": "OperatingSystem",
    "description": "Ensures `operating system` is used correctly instead of `operative system`."
  },
  {
    "value": "OrthographicConsistency",
    "label": "OrthographicConsistency",
    "description": "Ensures word casing matches the dictionary's canonical orthography."
  },
  {
    "value": "OughtToBe",
    "label": "OughtToBe",
    "description": "Detects the mistaken `out to be` and suggests `ought to be`, while ignoring legitimate phrasal-verb uses such as `turn out to be` and `ma…"
  },
  {
    "value": "OutOfDate",
    "label": "OutOfDate",
    "description": "Ensures that the phrase `out of date` is written with a hyphen as `out-of-date` when used as a compound adjective."
  },
  {
    "value": "OutOfSync",
    "label": "OutOfSync",
    "description": "Corrects `out of sink` to `out of sync` or `out of synch`."
  },
  {
    "value": "OutOfTheWindow",
    "label": "OutOfTheWindow",
    "description": "A linter for the idiom `out (of) the window`."
  },
  {
    "value": "Overall",
    "label": "Overall",
    "description": "Looks for incorrect spacing inside the closed compound `overall`."
  },
  {
    "value": "Overclocking",
    "label": "Overclocking",
    "description": "Looks for incorrect spacing inside the closed compound `overclocking`."
  },
  {
    "value": "Overload",
    "label": "Overload",
    "description": "Looks for incorrect spacing inside the closed compound `overload`."
  },
  {
    "value": "Overnight",
    "label": "Overnight",
    "description": "Looks for incorrect spacing inside the closed compound `overnight`."
  },
  {
    "value": "OverPlus",
    "label": "OverPlus",
    "description": "Detected redundant use of `over` and `plus` used together to bracket a number."
  },
  {
    "value": "OvertimeCompoundNoun",
    "label": "OvertimeCompoundNoun",
    "description": "Finds job-hours contexts where the split form appears and joins it into the standard compound."
  },
  {
    "value": "OxfordComma",
    "label": "OxfordComma",
    "description": "The Oxford comma is one of the more controversial rules in common use today. Enabling this lint checks that there is a comma before `and`…"
  },
  {
    "value": "Oxymorons",
    "label": "Oxymorons",
    "description": "Flags oxymoronic phrases (e.g. `amateur expert`, `increasingly less`, etc.)."
  },
  {
    "value": "PaleByComparison",
    "label": "PaleByComparison",
    "description": "A linter skeleton for contributors to copy into `harper_core/src/linting/` and rename."
  },
  {
    "value": "PartsOfSpeech",
    "label": "PartsOfSpeech",
    "description": "Corrects pluralizing the wrong noun in `part of speech`."
  },
  {
    "value": "PassersBy",
    "label": "PassersBy",
    "description": "Corrects `passerbys` and `passer-bys` to `passersby` or `passers-by`."
  },
  {
    "value": "PassionateAbout",
    "label": "PassionateAbout",
    "description": "Corrects `passtionate of` to `passionate about`."
  },
  {
    "value": "PasswordProtectedHyphen",
    "label": "PasswordProtectedHyphen",
    "description": "Keeps the compound adjective together before nouns like folders, files, or web pages so the dependency between them is clear."
  },
  {
    "value": "Payed",
    "label": "Payed",
    "description": "Corrects `payed` to `paid` and `overpayed` to `overpaid`."
  },
  {
    "value": "PayForPrice",
    "label": "PayForPrice",
    "description": "Corrects extraneous `for` when used of charges, fees, prices, etc."
  },
  {
    "value": "PeaceOfMind",
    "label": "PeaceOfMind",
    "description": "Corrects `piece of mind` to `peace of mind`."
  },
  {
    "value": "PedalToTheMetal",
    "label": "PedalToTheMetal",
    "description": "Corrects the eggcorn `pedal to the medal` to the standard idiom `pedal to the metal`, meaning to accelerate at full speed."
  },
  {
    "value": "PeekBehindTheCurtain",
    "label": "PeekBehindTheCurtain",
    "description": "Corrects `peak behind the curtain` to `peek behind the curtain`."
  },
  {
    "value": "PerSe",
    "label": "PerSe",
    "description": "Corrects common misspellings of `per se`."
  },
  {
    "value": "PhrasalVerbAsCompoundNoun",
    "label": "PhrasalVerbAsCompoundNoun",
    "description": "This rule looks for phrasal verbs written as compound nouns."
  },
  {
    "value": "Piggyback",
    "label": "Piggyback",
    "description": "Corrects the eggcorn `piggy bag` to `piggyback`, which is the proper term for riding on someone’s back or using an existing system."
  },
  {
    "value": "PiqueInterest",
    "label": "PiqueInterest",
    "description": "Detects incorrect usage of `peak` or `peek` when the intended word is `pique`, as in the phrase `you've peaked my interest`."
  },
  {
    "value": "PleaseTakeALook",
    "label": "PleaseTakeALook",
    "description": "Expands an initialism."
  },
  {
    "value": "PleasRequestVerb",
    "label": "PleasRequestVerb",
    "description": "Fixes the typo `pleas` when it appears as a request cue before common action verbs."
  },
  {
    "value": "PluralDecades",
    "label": "PluralDecades",
    "description": "Flags plural decades erroneously using an apostrophe before the `s`"
  },
  {
    "value": "PluralWrongWordOfPhrase",
    "label": "PluralWrongWordOfPhrase",
    "description": "Corrects noun phrases that pluralize the last noun instead of the main noun."
  },
  {
    "value": "PocketCastsNames",
    "label": "PocketCastsNames",
    "description": "Ensure proper capitalization of Pocket Casts and Pocket Casts Plus as brand names."
  },
  {
    "value": "PointsOfView",
    "label": "PointsOfView",
    "description": "Corrects pluralizing the wrong noun in `point of view`."
  },
  {
    "value": "PortAuPrince",
    "label": "PortAuPrince",
    "description": "Checks for the correct official name of the capital of Haiti."
  },
  {
    "value": "PortoNovo",
    "label": "PortoNovo",
    "description": "Checks for the correct official name of the capital of Benin."
  },
  {
    "value": "PossessiveNoun",
    "label": "PossessiveNoun",
    "description": "Use an apostrophe and `s` to form a noun’s possessive."
  },
  {
    "value": "PossessiveYour",
    "label": "PossessiveYour",
    "description": "The possessive form of `you` is more likely before nouns."
  },
  {
    "value": "PostItNoteHyphen",
    "label": "PostItNoteHyphen",
    "description": "Standardizes the sticky-note product phrase by joining the first two words."
  },
  {
    "value": "Postpone",
    "label": "Postpone",
    "description": "Looks for incorrect spacing inside the closed compound `postpone`."
  },
  {
    "value": "PrayingMantis",
    "label": "PrayingMantis",
    "description": "Corrects `preying mantis` to `praying mantis`, ensuring accurate reference to the insect’s characteristic pose."
  },
  {
    "value": "PrincipleToPrincipalRoleNoun",
    "label": "PrincipleToPrincipalRoleNoun",
    "description": "Fixes `principle` to `principal` when it appears as an adjective before common role, goal, and priority nouns (for example, `my principle…"
  },
  {
    "value": "ProgressiveNeedsBe",
    "label": "ProgressiveNeedsBe",
    "description": "Detects the ungrammatical patterns `<pronoun> have …ing` (e.g., `I have …ing`) and `<pronoun>'ve …ing` (e.g., `I've …ing`) and suggests e…"
  },
  {
    "value": "PronounAre",
    "label": "PronounAre",
    "description": "Spots the letter `r` used in place of `are` or `you're` after plural first- or second-person pronouns."
  },
  {
    "value": "PronounContraction",
    "label": "PronounContraction",
    "description": "Choosing when to contract pronouns is a challenging art. This rule looks for faults."
  },
  {
    "value": "PronounInflectionBe",
    "label": "PronounInflectionBe",
    "description": "Checks subject–verb agreement for the verb `be`. Third-person singular pronouns (`he`, `she`, `it`) require the singular form `is`, while…"
  },
  {
    "value": "PronounKnew",
    "label": "PronounKnew",
    "description": "Detects when “new” following a pronoun (optionally with an adverb) is a typo for the past tense “knew.”"
  },
  {
    "value": "PronounVerbAgreement",
    "label": "PronounVerbAgreement",
    "description": "Ensures pronouns agree with their verbs."
  },
  {
    "value": "Proofread",
    "label": "Proofread",
    "description": "Looks for incorrect spacing inside the closed compound `proofread`."
  },
  {
    "value": "ProperNouns",
    "label": "ProperNouns",
    "description": "Ensure proper capitalization of proper nouns."
  },
  {
    "value": "QuantifierNeedsOf",
    "label": "QuantifierNeedsOf",
    "description": "Detects missing `of` after the quantifier “a couple” when it precedes a plural noun"
  },
  {
    "value": "QuantifierNumeralConflict",
    "label": "QuantifierNumeralConflict",
    "description": "Detects quantifier-numeral conflicts"
  },
  {
    "value": "QuiteMany",
    "label": "QuiteMany",
    "description": "Corrects `quite many` to `quite a few`, which is the more natural and idiomatic phrase in standard English. `Quite many` is considered no…"
  },
  {
    "value": "QuiteQuiet",
    "label": "QuiteQuiet",
    "description": "Helps distinguish between ‘quiet’ (making ‘little noise’) and ‘quite’ (meaning ‘rather’)."
  },
  {
    "value": "QuoteSpacing",
    "label": "QuoteSpacing",
    "description": "Checks that quotation marks are preceded or succeeded by whitespace."
  },
  {
    "value": "RainbowColoredHyphen",
    "label": "RainbowColoredHyphen",
    "description": "When rainbow-colored or cream-colored describe a noun, replace the space between the color words with a hyphen to keep the modifier cohes…"
  },
  {
    "value": "RallyToReally",
    "label": "RallyToReally",
    "description": "Catches the typo where `rally` sneaks into `be + ...ing` constructions, including common contractions."
  },
  {
    "value": "RapidFire",
    "label": "RapidFire",
    "description": "Checks to ensure writers hyphenate `rapid-fire`."
  },
  {
    "value": "ReadsAndWrites",
    "label": "ReadsAndWrites",
    "description": "Corrects inconsistent noun or verb forms when `read` and `write` are paired."
  },
  {
    "value": "Really",
    "label": "Really",
    "description": "Expands an initialism."
  },
  {
    "value": "RealTrouper",
    "label": "RealTrouper",
    "description": "Ensures the correct use of `real trouper`, distinguishing it from `trooper`, which refers to a soldier or police officer."
  },
  {
    "value": "ReasonForDoing",
    "label": "ReasonForDoing",
    "description": "Corrects `reason of doing` to `reason for doing` etc."
  },
  {
    "value": "RedundantAcronyms",
    "label": "RedundantAcronyms",
    "description": "Identifies redundant acronyms where the last word repeats the last letter's meaning (e.g., `ATM machine` → `ATM` or `automated teller mac…"
  },
  {
    "value": "RedundantAdditiveAdverbs",
    "label": "RedundantAdditiveAdverbs",
    "description": "Detects redundant additive adverbs."
  },
  {
    "value": "RedundantFirsts",
    "label": "RedundantFirsts",
    "description": "Looks for redundant use of `first` with verbs that already imply order."
  },
  {
    "value": "RedundantIIRC",
    "label": "RedundantIIRC",
    "description": "Flags redundant use of 'if' or 'correctly' with `IIRC`, since `IIRC` already stands for 'if I recall correctly'."
  },
  {
    "value": "RedundantPretty",
    "label": "RedundantPretty",
    "description": "`Pretty` is redundant when modifying `decent`. Use `decent` alone."
  },
  {
    "value": "RedundantProgressiveComparative",
    "label": "RedundantProgressiveComparative",
    "description": "Detects redundant comparatives like `increasingly more` and `increasingly less`."
  },
  {
    "value": "RedundantSelf",
    "label": "RedundantSelf",
    "description": "Detects redundant use of `self-` prefixes with reflexive pronouns (e.g., `self-host it themselves`)."
  },
  {
    "value": "RedundantSuperlatives",
    "label": "RedundantSuperlatives",
    "description": "Simplifies redundant double positives like `most optimal` to the base form."
  },
  {
    "value": "RedundantThat",
    "label": "RedundantThat",
    "description": "There is rarely a situation where `that that` cannot be condensed into a single token."
  },
  {
    "value": "Regardless",
    "label": "Regardless",
    "description": "Looks for incorrect spacing inside the closed compound `regardless`."
  },
  {
    "value": "RegimenRegiment",
    "label": "RegimenRegiment",
    "description": "Corrects mistaken use of `regiment` (military unit) when `regimen` (routine) was intended."
  },
  {
    "value": "Regionalisms",
    "label": "Regionalisms",
    "description": "Regionalisms"
  },
  {
    "value": "RegularIrregulars",
    "label": "RegularIrregulars",
    "description": "Replaces wrong regular inflections of words with their correct irregular forms."
  },
  {
    "value": "RelayOnForRely",
    "label": "RelayOnForRely",
    "description": "Corrects the frequent typo where `relay` is used in place of `rely` in the phrase `relay on`."
  },
  {
    "value": "RepeatedWords",
    "label": "RepeatedWords",
    "description": "This rule looks for repetitions of words that are not homographs."
  },
  {
    "value": "Respond",
    "label": "Respond",
    "description": "Flags uses of the noun `response` where the verb `respond` is needed after an auxiliary."
  },
  {
    "value": "ResponsibilityFor",
    "label": "ResponsibilityFor",
    "description": "Corrects `take/assume/claim responsibility of` to `take/assume/claim responsibility for`."
  },
  {
    "value": "RifeWith",
    "label": "RifeWith",
    "description": "Corrects `ripe with` to `rife with`, preserving the phrase’s meaning of being filled with something, often undesirable."
  },
  {
    "value": "RightClick",
    "label": "RightClick",
    "description": "Hyphenates right-click style mouse commands."
  },
  {
    "value": "RiseTheQuestion",
    "label": "RiseTheQuestion",
    "description": "Corrects `rise the question` to `raise the question`."
  },
  {
    "value": "RiseTheRanks",
    "label": "RiseTheRanks",
    "description": "Corrects the nonstandard phrase `rise the ranks` to the standard `rise through the ranks` or `rise from the ranks`"
  },
  {
    "value": "RoadMap",
    "label": "RoadMap",
    "description": "Detects when `roadmap` is used instead of `road map`, prompting the correct spacing."
  },
  {
    "value": "RollerSkated",
    "label": "RollerSkated",
    "description": "Encourages hyphenating the past tense of `roller-skate`."
  },
  {
    "value": "RulesOfThumb",
    "label": "RulesOfThumb",
    "description": "Corrects pluralizing the wrong noun in `rule of thumb`."
  },
  {
    "value": "RunIntoProblemsOrTrouble",
    "label": "RunIntoProblemsOrTrouble",
    "description": "Corrects `running into` `problems` or `trouble` with wrong article, singular, or plural forms."
  },
  {
    "value": "SafeToSave",
    "label": "SafeToSave",
    "description": "Detects `safe` (adjective) when `save` (verb) is intended after modal verbs like `could` or `should`."
  },
  {
    "value": "SameAs",
    "label": "SameAs",
    "description": "Corrects the incorrect phrase `same then` to the standard `same as`."
  },
  {
    "value": "SaveToSafe",
    "label": "SaveToSafe",
    "description": "Corrects `save to <verb>` to `safe to <verb>` after a form of `be`."
  },
  {
    "value": "ScantilyClad",
    "label": "ScantilyClad",
    "description": "Fixes `scandally clad` to `scantily clad`, ensuring clarity in describing minimal attire."
  },
  {
    "value": "ScapeGoat",
    "label": "ScapeGoat",
    "description": "Corrects `scape goat` to `scapegoat`, which is the proper term for a person blamed for others' failures."
  },
  {
    "value": "SeamToSeem",
    "label": "SeamToSeem",
    "description": "Corrects `seam` to `seem` when used as a verb meaning `to appear` or `to give the impression`."
  },
  {
    "value": "SendAnEmailTo",
    "label": "SendAnEmailTo",
    "description": "Replaces the verbose phrase `send an email to` with the concise verb `email`."
  },
  {
    "value": "SentenceCapitalization",
    "label": "SentenceCapitalization",
    "description": "The opening word of a sentence should almost always be capitalized."
  },
  {
    "value": "ShootOneselfInTheFoot",
    "label": "ShootOneselfInTheFoot",
    "description": "Corrects nonstandard variants of 'shoot oneself in the foot'."
  },
  {
    "value": "Shortcoming",
    "label": "Shortcoming",
    "description": "Looks for incorrect spacing inside the closed compound `shortcoming`."
  },
  {
    "value": "Shortcomings",
    "label": "Shortcomings",
    "description": "Looks for incorrect spacing inside the closed compound `shortcomings`."
  },
  {
    "value": "ShutdownVerb",
    "label": "ShutdownVerb",
    "description": "Keeps `shutdown` as a noun when it stands alone but swaps it for the phrasal verb `shut down` whenever an auxiliary precedes it."
  },
  {
    "value": "SideTangent",
    "label": "SideTangent",
    "description": "Corrects redundant `side tangent` and `side tangents` to more concise alternatives."
  },
  {
    "value": "SimilarLike",
    "label": "SimilarLike",
    "description": "The adjective 'similar' pairs with the preposition 'to', so never follow it with 'like'."
  },
  {
    "value": "SimpleGrammatical",
    "label": "SimpleGrammatical",
    "description": "Corrects `simply grammatical` to `simple grammatical` for proper adjective usage."
  },
  {
    "value": "SimplePastToPastParticiple",
    "label": "SimplePastToPastParticiple",
    "description": "Corrects simple past tense verbs to past participle after auxiliary verbs like \"have\" or \"be\"."
  },
  {
    "value": "SinceDuration",
    "label": "SinceDuration",
    "description": "Detects the use of 'since' with a duration instead of a point in time."
  },
  {
    "value": "SingleBe",
    "label": "SingleBe",
    "description": "Removes adjacent duplicate inflections of `be`, including contracted forms followed by another `be` verb."
  },
  {
    "value": "SneakedSnuck",
    "label": "SneakedSnuck",
    "description": "Enforces `sneaked` v `snuck` preferences."
  },
  {
    "value": "SneakingSuspicion",
    "label": "SneakingSuspicion",
    "description": "Changes `sneaky suspicion` to `sneaking suspicion`."
  },
  {
    "value": "SneakPeekPreview",
    "label": "SneakPeekPreview",
    "description": "Corrects the common phrase-level confusion where `peak` is used instead of `peek` after `sneak`."
  },
  {
    "value": "Somebody",
    "label": "Somebody",
    "description": "Looks for incorrect spacing inside the closed compound `somebody`."
  },
  {
    "value": "SomebodyElses",
    "label": "SomebodyElses",
    "description": "Corrects `somebody else's` when the `'s` is in the wrong place."
  },
  {
    "value": "Somehow",
    "label": "Somehow",
    "description": "Looks for incorrect spacing inside the closed compound `somehow`."
  },
  {
    "value": "SomeOfThe",
    "label": "SomeOfThe",
    "description": "Quantity words such as `some` normally take `of` before a definite article. Including `of` signals that you mean a subset of a larger set…"
  },
  {
    "value": "Someone",
    "label": "Someone",
    "description": "Looks for incorrect spacing inside the closed compound `someone`."
  },
  {
    "value": "SomethingIs",
    "label": "SomethingIs",
    "description": "Flags forms like `somethings` before progressive verbs and suggests using `something's` or `something is`."
  },
  {
    "value": "SomewhatSomething",
    "label": "SomewhatSomething",
    "description": "Flags the phrase `somewhat of a` in favor of `something of a`, which can be considered more traditional."
  },
  {
    "value": "Somewhere",
    "label": "Somewhere",
    "description": "Looks for incorrect spacing inside the closed compound `somewhere`."
  },
  {
    "value": "SomeWithoutArticle",
    "label": "SomeWithoutArticle",
    "description": "Detects the redundant article in front of `some` and suggests more natural phrasing."
  },
  {
    "value": "SoonerOrLater",
    "label": "SoonerOrLater",
    "description": "Fixes the improper phrase `sooner than later` by suggesting standard alternatives."
  },
  {
    "value": "SoonToBe",
    "label": "SoonToBe",
    "description": "Hyphenates `soon-to-be` when it appears before a noun."
  },
  {
    "value": "SoughtAfter",
    "label": "SoughtAfter",
    "description": "Correct `sort after` to `sought after`"
  },
  {
    "value": "Spaces",
    "label": "Spaces",
    "description": "Words should be separated by at most one space."
  },
  {
    "value": "SpecialAttention",
    "label": "SpecialAttention",
    "description": "Changes `spacial attention` to `special attention`."
  },
  {
    "value": "SpellCheck",
    "label": "SpellCheck",
    "description": "Looks and provides corrections for misspelled words."
  },
  {
    "value": "SpelledNumbers",
    "label": "SpelledNumbers",
    "description": "Most style guides recommend that you spell out numbers less than ten."
  },
  {
    "value": "SpinalChord",
    "label": "SpinalChord",
    "description": "The words `spinal`, `vocal`, `umbilical`, and `electrical` are followed by `cord`, so replace accidental `chord`/`chords`."
  },
  {
    "value": "SplitWords",
    "label": "SplitWords",
    "description": "Finds missing spaces in improper compound words."
  },
  {
    "value": "Starving",
    "label": "Starving",
    "description": "Encourages vivid writing by suggesting `starving` instead of weaker expressions like `very hungry.`"
  },
  {
    "value": "StateOfTheArt",
    "label": "StateOfTheArt",
    "description": "Detects incorrect usage of `state of art` and suggests `state of the art` as the correct phrase."
  },
  {
    "value": "StatuteOfLimitations",
    "label": "StatuteOfLimitations",
    "description": "Corrects `statue of limitations` to `statute of limitations`."
  },
  {
    "value": "StrikeChord",
    "label": "StrikeChord",
    "description": "The phrase about resonating with someone is spelled with a chord, not a cord, so fix the typo and keep the idiom intact."
  },
  {
    "value": "SubjectPronoun",
    "label": "SubjectPronoun",
    "description": "Fixes sentences that start with `me and X` by putting the proper noun first and using `I`."
  },
  {
    "value": "SubjunctiveWasToWere",
    "label": "SubjunctiveWasToWere",
    "description": "Ensures proper use of the subjunctive mood in counterfactual conditional statements starting with `if only` or `I wish`."
  },
  {
    "value": "SufficeItToSay",
    "label": "SufficeItToSay",
    "description": "Corrects `suffice to say` to `suffice it to say`."
  },
  {
    "value": "SupposedTo",
    "label": "SupposedTo",
    "description": "Fixes `suppose to` to the correct `supposed to`."
  },
  {
    "value": "TakeALookTo",
    "label": "TakeALookTo",
    "description": "Corrects `take a look to`/`have a look to` to correctly use `at`."
  },
  {
    "value": "TakeItPersonally",
    "label": "TakeItPersonally",
    "description": "Corrects `take it personal` to `take it personally`."
  },
  {
    "value": "TakeMedicine",
    "label": "TakeMedicine",
    "description": "Encourages pairing medicine-related nouns with verbs like `take` or `swallow` instead of `eat`."
  },
  {
    "value": "TalkToYouLater",
    "label": "TalkToYouLater",
    "description": "Expands an initialism."
  },
  {
    "value": "ThanksALot",
    "label": "ThanksALot",
    "description": "Corrects the missing article in `thanks lot`, forming `thanks a lot`."
  },
  {
    "value": "ThatChallenged",
    "label": "ThatChallenged",
    "description": "Corrects `the challenged` to `that challenged` for proper relative clause usage."
  },
  {
    "value": "ThatThan",
    "label": "ThatThan",
    "description": "Corrects the typo `that` to `than` in comparisons."
  },
  {
    "value": "ThatThis",
    "label": "ThatThis",
    "description": "Fixes `the this` to the correct phrase `that this`."
  },
  {
    "value": "ThatWhich",
    "label": "ThatWhich",
    "description": "Repeating the word \"that\" is often redundant. The phrase `that which` is easier to read."
  },
  {
    "value": "The",
    "label": "The",
    "description": "Fixes especially common misspellings of the word `the`"
  },
  {
    "value": "TheAnother",
    "label": "TheAnother",
    "description": "Corrects `the another`."
  },
  {
    "value": "TheDifferenceBetween",
    "label": "TheDifferenceBetween",
    "description": "Corrects `the different(s) between to `the difference between`."
  },
  {
    "value": "TheEntiretyOf",
    "label": "TheEntiretyOf",
    "description": "Corrects `the entire of` to `the entirety of`."
  },
  {
    "value": "TheHowWhy",
    "label": "TheHowWhy",
    "description": "Removes the extra `the` from expressions like `the how`, skipping `how to` and `who's who`."
  },
  {
    "value": "TheirToThere",
    "label": "TheirToThere",
    "description": "Corrects `their` when the intended meaning is `there`."
  },
  {
    "value": "TheirToTheyre",
    "label": "TheirToTheyre",
    "description": "Corrects `their` when the intended meaning is `they're`."
  },
  {
    "value": "TheLastDays",
    "label": "TheLastDays",
    "description": "Corrects `in the last days` to `in the last few days` and related errors."
  },
  {
    "value": "TheMy",
    "label": "TheMy",
    "description": "Flags the definite article used together with a possessive."
  },
  {
    "value": "ThenThan",
    "label": "ThenThan",
    "description": "Corrects mixing up `then` and `than`."
  },
  {
    "value": "ThePointFor",
    "label": "ThePointFor",
    "description": "Corrects `the point for` to `the point of`"
  },
  {
    "value": "TheProperNounPossessive",
    "label": "TheProperNounPossessive",
    "description": "Checks for redundant `the` before possessive proper noun such as `The London's population`."
  },
  {
    "value": "There",
    "label": "There",
    "description": "Looks for incorrect spacing inside the closed compound `there`."
  },
  {
    "value": "ThereAfterCompound",
    "label": "ThereAfterCompound",
    "description": "Normalizes split `there after` to the closed form in adverbial contexts."
  },
  {
    "value": "Therefore",
    "label": "Therefore",
    "description": "Looks for incorrect spacing inside the closed compound `therefore`."
  },
  {
    "value": "ThereIsAgreement",
    "label": "ThereIsAgreement",
    "description": "Checks for `is there` and its variants agreeing with singular vs plural subjects"
  },
  {
    "value": "ThereMissingIsClause",
    "label": "ThereMissingIsClause",
    "description": "Inserts `is` in common subordinate clauses like `if there a ...` where the copula is omitted."
  },
  {
    "value": "ThereOwn",
    "label": "ThereOwn",
    "description": "Corrects `there own`, `they're own`, and `theyre own` to `their own`."
  },
  {
    "value": "Theres",
    "label": "Theres",
    "description": "Replaces the mistaken possessive `their's` before a determiner with the contraction `there's`."
  },
  {
    "value": "ThereToTheir",
    "label": "ThereToTheir",
    "description": "Corrects `there` when the intended meaning is `their`."
  },
  {
    "value": "Thereupon",
    "label": "Thereupon",
    "description": "Looks for incorrect spacing inside the closed compound `thereupon`."
  },
  {
    "value": "ThesesThese",
    "label": "ThesesThese",
    "description": "Corrects the common misspelling of `these` as `theses`."
  },
  {
    "value": "TheTheToThatThe",
    "label": "TheTheToThatThe",
    "description": "Corrects `the the` to `that the` or to a single `the`."
  },
  {
    "value": "TheWhetherWeather",
    "label": "TheWhetherWeather",
    "description": "Fixes the common mix-up where `whether` is used after `the` when the weather noun is intended."
  },
  {
    "value": "TheyreConfusions",
    "label": "TheyreConfusions",
    "description": "Detects apostrophe and locative edge cases that are awkward to model with standard contraction checks."
  },
  {
    "value": "TheyreToTheir",
    "label": "TheyreToTheir",
    "description": "Corrects `they're` when the intended meaning is `their`."
  },
  {
    "value": "TheyToThem",
    "label": "TheyToThem",
    "description": "Converts `they` to `them` whenever the pronoun serves as an object after common prepositions or actions that take direct objects."
  },
  {
    "value": "ThieveNoun",
    "label": "ThieveNoun",
    "description": "Fixes accidental `thieve` in noun phrases where singular `thief` is intended."
  },
  {
    "value": "ThingThink",
    "label": "ThingThink",
    "description": "Corrects the typo `thing` when it should be `think`."
  },
  {
    "value": "ThinkKnowOff",
    "label": "ThinkKnowOff",
    "description": "Fixes the common preposition mix-up after verbs like `know` and `think` in phrases such as `know off` and `thought off` when a following…"
  },
  {
    "value": "ThisTypeOfThing",
    "label": "ThisTypeOfThing",
    "description": "Checks that the parts of `this/these type(s) of thing(s)` agree in grammatical number"
  },
  {
    "value": "ThoughThought",
    "label": "ThoughThought",
    "description": "Corrects `though` when it's a typo for `thought`."
  },
  {
    "value": "ThoughtProcess",
    "label": "ThoughtProcess",
    "description": "Changes `though process` to `thought process`."
  },
  {
    "value": "ThreatenVerb",
    "label": "ThreatenVerb",
    "description": "Normalize `threat` to `threaten` when it is used after modals (or their contractions) because the noun form is being mistaken for a verb."
  },
  {
    "value": "ThriveOn",
    "label": "ThriveOn",
    "description": "Corrects `thrive off` and `thrive off of` to `thrive on`."
  },
  {
    "value": "ThrowAway",
    "label": "ThrowAway",
    "description": "Finds the typo `through away` and suggests `throw away` or `threw away` instead."
  },
  {
    "value": "ThrowBabyWithBathwater",
    "label": "ThrowBabyWithBathwater",
    "description": "Corrects wrong or nonstandard variants of the idiom 'to throw the baby out with the bathwater'"
  },
  {
    "value": "ThrowRubbish",
    "label": "ThrowRubbish",
    "description": "Checks for throwing rubbish rather than throwing it away."
  },
  {
    "value": "TickingTimeClock",
    "label": "TickingTimeClock",
    "description": "Corrects `ticking time clock` to `ticking time bomb` for idiomatic urgency or `ticking clock` otherwise."
  },
  {
    "value": "TillDate",
    "label": "TillDate",
    "description": "Corrects the Indian English `till date` to `to date` when Indian English is not the selected dialect."
  },
  {
    "value": "ToAdverb",
    "label": "ToAdverb",
    "description": "Flags duplicated `to` around certain adverbs (e.g. `to never to`) and offers fixes that keep only one `to`."
  },
  {
    "value": "ToBackOut",
    "label": "ToBackOut",
    "description": "Treats `to backout` as a mistyped infinitive and prefers the two-word verb."
  },
  {
    "value": "ToBeHonest",
    "label": "ToBeHonest",
    "description": "Expands an initialism."
  },
  {
    "value": "ToDoHyphen",
    "label": "ToDoHyphen",
    "description": "Ensures `to-do` is correctly hyphenated."
  },
  {
    "value": "ToGreatLengths",
    "label": "ToGreatLengths",
    "description": "Corrects `through great lengths` to `to great lengths`."
  },
  {
    "value": "ToLoseTooLoose",
    "label": "ToLoseTooLoose",
    "description": "Corrects mixing up `to` with `too` and `lose` with `loose`."
  },
  {
    "value": "TomorrowPossessiveModifier",
    "label": "TomorrowPossessiveModifier",
    "description": "Flags `tomorrows` in attributive contexts and suggests the possessive form instead."
  },
  {
    "value": "TongueInCheek",
    "label": "TongueInCheek",
    "description": "Corrects the idiom when `and` replaces the needed preposition."
  },
  {
    "value": "TooTo",
    "label": "TooTo",
    "description": "Corrects `too` used instead of `to`."
  },
  {
    "value": "ToSomeDegree",
    "label": "ToSomeDegree",
    "description": "Corrects `in some degree` to `to some degree`, meaning to a certain extent."
  },
  {
    "value": "ToTheMannerBorn",
    "label": "ToTheMannerBorn",
    "description": "Corrects `to the manor born` to `to the manner born`, ensuring the intended meaning of being naturally suited to a way of life."
  },
  {
    "value": "ToTo",
    "label": "ToTo",
    "description": "Corrects `to to` to `to do` and `to-to` to `to-do`, as they may be typos."
  },
  {
    "value": "ToTooIdioms",
    "label": "ToTooIdioms",
    "description": "Corrects `to` used instead of `too`."
  },
  {
    "value": "ToTwoToo",
    "label": "ToTwoToo",
    "description": "Corrects homophone confusion between `to` and `too`."
  },
  {
    "value": "Touristic",
    "label": "Touristic",
    "description": "Suggests replacing the uncommon word `touristic` with `tourist`, `tourism`, and/or `touristy`."
  },
  {
    "value": "Towards",
    "label": "Towards",
    "description": "Removes redundant `to` before `towards`."
  },
  {
    "value": "ToWorryAbout",
    "label": "ToWorryAbout",
    "description": "Fixes incorrect use of `to worried about`."
  },
  {
    "value": "TransposedSpace",
    "label": "TransposedSpace",
    "description": "Looks for a space one character too early or too late between words."
  },
  {
    "value": "TrialAndError",
    "label": "TrialAndError",
    "description": "Corrects `trail` to `trial` in `trial and error`."
  },
  {
    "value": "TrueToWord",
    "label": "TrueToWord",
    "description": "Normalizes phrasing around `true to <possessive>` so it follows the conventional `true to one's word`."
  },
  {
    "value": "TruthToTheFact",
    "label": "TruthToTheFact",
    "description": "Flags the redundant phrase `truth to the fact`."
  },
  {
    "value": "TryOnesHandAt",
    "label": "TryOnesHandAt",
    "description": "Corrects `try one's hands at` to `try one's hand at`."
  },
  {
    "value": "TryOnesLuck",
    "label": "TryOnesLuck",
    "description": "Corrects `try out one’s luck` to `try one’s luck`"
  },
  {
    "value": "TuffEnough",
    "label": "TuffEnough",
    "description": "The adjective `tough` pairs with words like `enough` or `like`, so correct the common typo `tuff` in those constructions."
  },
  {
    "value": "TumblrNames",
    "label": "TumblrNames",
    "description": "Ensure proper capitalization of Tumblr-related terms."
  },
  {
    "value": "TurnItOff",
    "label": "TurnItOff",
    "description": "Fixes the mistake in the phrase `turn it off`."
  },
  {
    "value": "UnclosedQuotes",
    "label": "UnclosedQuotes",
    "description": "Quotation marks should always be closed. Unpaired quotation marks are a hallmark of sloppy work."
  },
  {
    "value": "Underclock",
    "label": "Underclock",
    "description": "Looks for incorrect spacing inside the closed compound `underclock`."
  },
  {
    "value": "UnitedOrganizations",
    "label": "UnitedOrganizations",
    "description": "When referring to national or international organizations, make sure to treat them as a proper noun."
  },
  {
    "value": "Unless",
    "label": "Unless",
    "description": "Corrects `unless if`."
  },
  {
    "value": "UpdatePlaceNames",
    "label": "UpdatePlaceNames",
    "description": "This rule looks for deprecated place names and offers to update them."
  },
  {
    "value": "Upset",
    "label": "Upset",
    "description": "Looks for incorrect spacing inside the closed compound `upset`."
  },
  {
    "value": "Upward",
    "label": "Upward",
    "description": "Looks for incorrect spacing inside the closed compound `upward`."
  },
  {
    "value": "UseEllipsisCharacter",
    "label": "UseEllipsisCharacter",
    "description": "Replaces three-period ellipses with the single Unicode ellipsis character."
  },
  {
    "value": "UseTitleCase",
    "label": "UseTitleCase",
    "description": "Prompts you to use title case in relevant headings."
  },
  {
    "value": "UseToUsedTo",
    "label": "UseToUsedTo",
    "description": "Corrects `use to` to `used to` when meaning accustomed to (after forms of `be` or `get`)."
  },
  {
    "value": "USUniversities",
    "label": "USUniversities",
    "description": "Ensure proper capitalization of major universities in the United States."
  },
  {
    "value": "VerbToAdjective",
    "label": "VerbToAdjective",
    "description": "Looks for article-led gerund noun phrases like `a fully accounting of`, where an adjective is more likely than an adverb."
  },
  {
    "value": "VerseAsVerb",
    "label": "VerseAsVerb",
    "description": "Corrects the nonstandard use of `verse` as a verb (from `versus`) to standard alternatives."
  },
  {
    "value": "VeryKnown",
    "label": "VeryKnown",
    "description": "`very well-known` (or `well-known`) is the standard way to describe something widely recognized, so we flag the uncommon `very known` wor…"
  },
  {
    "value": "VeryLess",
    "label": "VeryLess",
    "description": "Corrects `very less`."
  },
  {
    "value": "VeryUnique",
    "label": "VeryUnique",
    "description": "Flags phrases like `very unique`, `pretty unique`, etc., and suggests using `unique` alone or a more precise adjective such as `special`,…"
  },
  {
    "value": "ViceVersa",
    "label": "ViceVersa",
    "description": "Recommends writing ‘vice versa’ without hyphens."
  },
  {
    "value": "ViciousCircle",
    "label": "ViciousCircle",
    "description": "Corrects and standardizes common errors and variants of `vicious/virtuous circle`."
  },
  {
    "value": "ViciousCircleOrCycle",
    "label": "ViciousCircleOrCycle",
    "description": "Corrects common errors in `vicious/virtuous circle/cycle`."
  },
  {
    "value": "ViciousCycle",
    "label": "ViciousCycle",
    "description": "Corrects and standardizes common errors and variants of `vicious/virtuous cycle`."
  },
  {
    "value": "WantBe",
    "label": "WantBe",
    "description": "Detects incorrect usage of `want be` and suggests `won't be` or `want to be` based on context."
  },
  {
    "value": "WasAloud",
    "label": "WasAloud",
    "description": "Ensures `was aloud` and `were aloud` are corrected to `was allowed` or `were allowed` when referring to permission."
  },
  {
    "value": "WasComprisedOf",
    "label": "WasComprisedOf",
    "description": "Rewrites the fixed phrase `was comprised of` to a more widely accepted form."
  },
  {
    "value": "WaveFunction",
    "label": "WaveFunction",
    "description": "Identifies the mistake of merging `wave` and `function` into one word. In quantum mechanics, a `wave function` (written as two words) des…"
  },
  {
    "value": "WayTooAdjective",
    "label": "WayTooAdjective",
    "description": "Replaces the preposition `to` with the adverb `too` after `way` when followed by an adjective (e.g. `way too fast`)"
  },
  {
    "value": "WebScraping",
    "label": "WebScraping",
    "description": "Corrects `scrapping` the web to `scraping`."
  },
  {
    "value": "WellBeing",
    "label": "WellBeing",
    "description": "Ensures `well-being` is correctly hyphenated."
  },
  {
    "value": "WellEducated",
    "label": "WellEducated",
    "description": "Replaces `good-educated` with the accepted compound `well-educated`."
  },
  {
    "value": "WellKept",
    "label": "WellKept",
    "description": "Flags `highly-kept` and recommends `well-kept` as an alternative."
  },
  {
    "value": "WereWhere",
    "label": "WereWhere",
    "description": "Detects mixing up `were` and `where`."
  },
  {
    "value": "Whereas",
    "label": "Whereas",
    "description": "The Whereas rule is designed to identify instances where the phrase `where as` is used in text and suggests replacing it with the single…"
  },
  {
    "value": "Whereupon",
    "label": "Whereupon",
    "description": "Looks for incorrect spacing inside the closed compound `whereupon`."
  },
  {
    "value": "WhetYourAppetite",
    "label": "WhetYourAppetite",
    "description": "Ensures `whet your appetite` is used correctly, distinguishing it from the incorrect `wet` variation."
  },
  {
    "value": "WholeEntire",
    "label": "WholeEntire",
    "description": "Corrects the redundancy in `whole entire` to `whole` or `entire`."
  },
  {
    "value": "WhomSubjectOfVerb",
    "label": "WhomSubjectOfVerb",
    "description": "Detects whom and its variants used as the subject of a verb instead of who."
  },
  {
    "value": "WidelyAccepted",
    "label": "WidelyAccepted",
    "description": "Flags `wide accepted`, `wide acceptable`, or `wide used` and recommends switching `wide` to the adverb `widely`."
  },
  {
    "value": "Widespread",
    "label": "Widespread",
    "description": "Looks for incorrect spacing inside the closed compound `widespread`."
  },
  {
    "value": "WillContain",
    "label": "WillContain",
    "description": "Incorrect verb form: `will` should be followed by the base form `contain`."
  },
  {
    "value": "WillNonLemma",
    "label": "WillNonLemma",
    "description": "Flags wrong verb forms after `will` or `shall`"
  },
  {
    "value": "WinPrize",
    "label": "WinPrize",
    "description": "Catches the mix-up between `price`/`prise` and `prize` after the verb `win`."
  },
  {
    "value": "WishCould",
    "label": "WishCould",
    "description": "Checks for `can` being used after `wish` when it should be `could`."
  },
  {
    "value": "Without",
    "label": "Without",
    "description": "Looks for incorrect spacing inside the closed compound `without`."
  },
  {
    "value": "WithoutOut",
    "label": "WithoutOut",
    "description": "When writers accidentally type `without out`, Harper can collapse the two words back into the single preposition."
  },
  {
    "value": "WokVerbTypo",
    "label": "WokVerbTypo",
    "description": "Flags likely typo cases where `wok` appears where the verb `work` is expected."
  },
  {
    "value": "WordPressDotcom",
    "label": "WordPressDotcom",
    "description": "Ensures correct capitalization of WordPress.com. This rule verifies that the official stylization of WordPress.com is used when referring…"
  },
  {
    "value": "Worldwide",
    "label": "Worldwide",
    "description": "Looks for incorrect spacing inside the closed compound `worldwide`."
  },
  {
    "value": "WorseOrWorst",
    "label": "WorseOrWorst",
    "description": "Corrects `worse` and `worst` used in contexts where the other belongs."
  },
  {
    "value": "WorstCaseScenario",
    "label": "WorstCaseScenario",
    "description": "Corrects `worst-case scenario` when the hyphen is missing or `worse` is used instead of `worst`."
  },
  {
    "value": "WorthToDo",
    "label": "WorthToDo",
    "description": "Corrects `worth to` + a verb to `worth` + the gerund of the verb."
  },
  {
    "value": "Worthwhile",
    "label": "Worthwhile",
    "description": "Looks for incorrect spacing inside the closed compound `worthwhile`."
  },
  {
    "value": "WouldNeverHave",
    "label": "WouldNeverHave",
    "description": "Corrects `would/could have never` to `never would/could have`."
  },
  {
    "value": "WreakHavoc",
    "label": "WreakHavoc",
    "description": "Corrects the eggcorn `wreck havoc` to `wreak havoc`, which is the proper term for causing chaos or destruction."
  },
  {
    "value": "WrongApostrophe",
    "label": "WrongApostrophe",
    "description": "Corrects semicolons, acute accents, and backticks typed instead of apostrophes."
  },
  {
    "value": "WroteToRote",
    "label": "WroteToRote",
    "description": "Corrects `by wrote` to `by rote`."
  },
  {
    "value": "WroughtIron",
    "label": "WroughtIron",
    "description": "`Wrought iron` is low-carbon, malleable iron used for decorative work; variants like `rod iron` or `rot iron` are phonetic misspellings t…"
  },
  {
    "value": "YeaToYeah",
    "label": "YeaToYeah",
    "description": "Corrects `yea` to `yeah`."
  },
  {
    "value": "YehToYeah",
    "label": "YehToYeah",
    "description": "Corrects `yeh` to `yeah`."
  },
  {
    "value": "YourOutClauseAgreement",
    "label": "YourOutClauseAgreement",
    "description": "Corrects `your` when it appears where a subject-plus-verb contraction is intended before `out` and a following preposition."
  },
  {
    "value": "YourPredicateAdjective",
    "label": "YourPredicateAdjective",
    "description": "Catches cases where a predicate adjective follows `your`, `yr`, `ur`, or `ya` and suggests the proper contraction so the sentence states…"
  },
  {
    "value": "Yourself",
    "label": "Yourself",
    "description": "Looks for incorrect spacing inside the closed compound `yourself`, while skipping hyphenated `self-...` compounds."
  }
];

export function spellcheckRuleOptions(): SpellcheckRuleOption[] {
  return SPELLCHECK_RULES.map((rule) => ({ ...rule }));
}
