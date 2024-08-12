// put cards in this deck when you take them out of the main decks
notInUseDeck = [

];

natureDeck = [sereneforest, airstrike, freshair,
    herbalremedy, stampede,
    elephant, nighttime
];

poisonDeck = [poisonbottle, chemist, venomsting,
    neurotoxins, leech,
    epidemic, streetfood
];

neutralDeck = [medicalkit, shield, scavenge, amputate, gamblersconceit, slash,
    calladoctor, lumberjack, cancel, threeleafclover, throwcard,
    workoutroutine, armsrace, mergerealities
];

technicalDeck = [
    toxicbloom
]

// combine the decks we want to play with
var deck = [
    ...natureDeck,
    ...poisonDeck,
    ...neutralDeck
];


/* all cards

Nature:
    [1] sereneforest
    [1] airstrike
    [1] freshair
    [2] medicinalherb
    [2] stampede
    [3] elephant

poison:
    [1] poisonbottle
    [1] chemist

Basic:
    [1] shield
    [2] lumberjack

*/